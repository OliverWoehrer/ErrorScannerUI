import docker
import re
from dateutil import parser
import json
from datetime import datetime, timedelta
import time
import os
import threading
import docker.models
import docker.models.containers

def find_errors_warnings(logs):
    """Finds error and warning messages in logs.

    Args:
        logs: A list of log lines (strings).

    Returns:
        A list of dictionaries, where each dictionary represents an error or
        warning and contains the following keys:
            - type: "error" or "warning"
            - message: The log line containing the error or warning.
            - timestamp: A datetime object, or None if no timestamp was found.
    """
    error_regex = re.compile(r'(error|exception|critical|fail|err)', re.IGNORECASE)
    warning_regex = re.compile(r'(warning|warn)', re.IGNORECASE)
    results = []
    for line in logs:
        timestamp = None
        try:
            timestamp = parser.parse(line, fuzzy=True)  # Try to extract date.
        except ValueError:
            pass  # If no date, continue.

        error_match = error_regex.search(line)
        warning_match = warning_regex.search(line)

        if error_match:
            results.append({"type": "error", "message": line, "timestamp": timestamp})
        elif warning_match:
            results.append({"type": "warning", "message": line, "timestamp": timestamp})
    return results

def compare_to_known_bugs(findings, known_bugs):
    """Compares findings to known bugs.

    Args:
        findings: A list of dictionaries, as returned by find_errors_warnings().
        known_bugs: A list of dictionaries, where each dictionary represents a
                    known bug and contains the following keys:
                        - id: A unique identifier for the bug (e.g., "BUG-001").
                        - pattern: A regular expression pattern to match the bug
                                   in log messages.

    Returns:
        A list of dictionaries, where each dictionary represents a matched bug
        and contains the following keys:
            - bug_id: The ID of the matched bug.
            - finding: The finding (a dictionary) that matched the bug.
    """
    matched_bugs = []
    for finding in findings:
        for bug in known_bugs:
            if re.search(bug["pattern"], finding["message"], re.IGNORECASE):
                matched_bugs.append({"bug_id": bug["id"], "finding": finding})
    return matched_bugs



class Scanner():
    def __init__(self, bugs: str = "bugs.json", whitelist: str = "Whitelist.txt", blacklist: str = "Blacklist.txt"):
        # Initialize Properties:
        self.bugs_filename = bugs
        self.whitelist_filename = whitelist
        self.blacklist_filename = blacklist
        self.loop = True

        # Initialize Docker Client:
        host = os.environ.get("DOCKER_HOST")
        if not host:
            raise RuntimeWarning(f"Environment variable 'DOCKER_HOST' is not set. Make sure it points to your Docker daemon. If you are using Docker Desktop for example: 'unix:///home/<user>/.docker/desktop/docker.sock'.")
        try:
            docker.from_env()
        except docker.errors.DockerException:
            host = os.environ.get("DOCKER_HOST")
            raise RuntimeError(f"Could not initialize the docker client!\r\n" \
                f"Check the environment variable 'DOCKER_HOST' points to your Docker daemon.\r\n" \
                f"DOCKER_HOST = '{host}'")

    @staticmethod
    def _load_list(filename: str) -> set[str]:
        """
        Reads the given file and returns a set containing every line, with no duplicates

        Args:
            filename (str): path of the file to read

        Returns:
            set: set of lines without duplicates, empty if the file was not found
        """
        try:
            file = open(filename, 'r')
            return {line.strip() for line in file if line.strip()}
        except FileNotFoundError:
            return set() # empty set

    @staticmethod
    def _get_container_logs(container: docker.models.containers.Container, since: datetime = None) -> list[str]:
        """
        Retrieves logs from a container, optionally since a specific time. Get logs since the last 
        seen timestamp, or all logs if no timestamp yet.

        Args:
            container: container object to read from
            since: A datetime object indicating the start time for the logs. If None, retrieves all logs.

        Returns:
            A list of log lines (strings). Returns an empty list on error.
        """
        try:
            logs = container.logs(stream=False, timestamps=True, since=since).decode('utf-8')
            return logs.splitlines()
        except docker.errors.APIError as e:
            print(f"Error retrieving logs for {container.id}: {e}")
            return []
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return []

    @staticmethod
    def _extract_logs(lines: list[str]) -> dict[(str, datetime),(str, str),(str, str)]:
        """
        Tries to parse the given list of logs. If now timestamp could be parsed, the line is  skipped.
        Multiline logs (like stacktraces) are treated as individual logs

        Args:
            lines: list of log messages

        Returns:
            list of parse logs
        """
        logs = []
        for line in lines:
            # Parse Timestamp:
            # [INFO]
            # Docker can automatically prepend timestamps to log messages. These timestamps follow
            # the 'RFC3339 Nano' format (YYYY-MM-DDTHH:MM:SS.NNNNNNNNNZHH:MM), which cannot be
            # parse by the dateutil.parser below. In this case we have to adjust the string so the
            # parser can convert it. Because this format of timestamp at the start of the log message
            # is likely generated by Docker and not part of the actual log message, it is removed.
            timestamp = None

            # Look For RFC3339 Nano Timestamp (generated by Docker):
            match = re.search(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z(\d{2}:\d{2})?\s?", line)
            if match:
                # nanosecond part needs to be trimmed to microseconds
                dirty_string = match.group(0)
                parts = dirty_string.split('.')
                microsecond_part = parts[1][:6]
                cleaned_string = f"{parts[0]}.{microsecond_part}Z"
                timestamp = parser.isoparse(cleaned_string)
                old_line = line
                line = line.replace(dirty_string, "") # remove timestamp generated by Docker
            else:
                try:
                    timestamp = parser.parse(line, fuzzy=True)  # try to extract date
                except Exception as e:
                    continue # skip, unable to parse
            
            # Merge Multiline Log Messages:
            # [INFO]
            # Some log messages spread over multiple line (e.g. stack traces). They originally get
            # extracted as separate logs. We now merge them under the assumption their timestamps are
            # within the threshold.
            TIME_THRESHOLD = timedelta(microseconds=80)
            if logs and (timestamp - logs[-1]["timestamp"]) < TIME_THRESHOLD:
                logs[-1]["message"] += "\n" + line # append to existing log message
            else:
                log = {"timestamp": timestamp, "type": "unknown", "message": line}
                logs.append(log)
            
        return logs

    def main(self, interval: int = 60, network_name: str = None):
        """
        Runs a loop to read logs from the Docker containers on the watchlist. The watchlist is a list 
        of Docker containers to read from (names or IDs). The watchlist can be filtered with 
        the help of a whitelist and a blacklist. If the whitelist ist empty, all containers are 
        automatically added to the watchlist. Containers on the blacklist are removed from the 
        watchlist.
        If a network name is given, only containers inside that network are considered for the 
        watchlist. Filtering lists apply to containers inside the network. If no network name is given 
        all containers on the system are considered. 

        Args:
            interval (int): scanning interval in seconds (typical 60 sec)
            bugs_file (str): filename of a list of known bugs
            network_name (str): name of a Docker network to scan
        """
        # Type Checking:
        assert isinstance(interval, int)
        assert isinstance(network_name, str) or network_name is None 

        # Read Filter Lists:
        whitelist = self._load_list(self.whitelist_filename)
        blacklist = self._load_list(self.blacklist_filename)
        shared_items = whitelist & blacklist
        if shared_items: # share items between whitelist and blacklists is bad practive
            error_message = "Whitelist and Blacklist share items, which is bad practice:"
            for item in shared_items:
                error_message = f"\r\n{item}"
            raise RuntimeError(error_message) # inform user about which filter items are shared
        
        # Initalize Docker Client:
        try:
            client = docker.from_env()
        except docker.errors.DockerException:
            print(f"Could not connect to docker daemon!")
            return
        
        # Find Docker Network(s):
        network_names = set()
        if network_name: # network is given, only use this network
            network_names.add(network_name)
        else: # no network given, use all networks this containers is part of
            try: # find different file
                file = open("/etc/hostname", "r")
                container_id = file.read().strip()
            except FileNotFoundError:
                print("Not running inside a Docker container or could not get container ID. Scanning all networks...\r\nTo prevent this pass a network name.")
            else: # find networks for this container ID
                try:
                    container = client.containers.get(container_id)
                except docker.errors.NotFound:
                    print(f"Could not find container '{container_id}'")
                else:
                    network_settings = container.attrs['NetworkSettings']['Networks']
                    print(f"Container '{container.name}' is connected to the following networks:")
                    for network_name in network_settings.keys():
                        print(f"- {network_name}")
                        network_names.add(network_name)
            
        # Access Docker Network(s):
        universe = set() # set of all container collections known to use
        if network_names:
            try:
                for network_name in network_names:
                    network = client.networks.get(network_name)
                    galaxy = network.containers # each network has its galaxy of containers
                    universe = universe | set(galaxy) # add containers from this network to our universe
            except docker.errors.NotFound:
                print(f"Error: Network {network_name} not found.")
                return
            except docker.errors.APIError as e:
                print(f"Error accessing network {network_name}: {e}.")
                return
        else: # no networks found, consider all containers as a fallback
            all_containers = client.containers
            assert isinstance(all_containers, docker.models.containers.ContainerCollection)
            universe = set(all_containers.list()) # all running containers are our universe now

        # Build Watchlist:
        # [INFO] Containers can be part of multiple galaxies as they are part of multiple networks.
        watchlist = set() # list of all containers to watch (actually a set so no duplicates)
        for container in universe: # filter for white- and blacklist
            if not whitelist: # no whitelist, consider all containers in the universe
                watchlist.add(container)
            if container.name in whitelist or container.id in whitelist:
                watchlist.add(container)
            if container.name in blacklist or container.id in blacklist:
                watchlist.discard(container)
        
        # Display Watchlist:
        print("Watchlist:")
        for container in watchlist:
            print(f"- {container.name} [{container.id}]")

        if False:
            try:
                with open(BUGS_FILE, 'r') as f:
                    known_bugs = json.load(f)
            except FileNotFoundError:
                print(f"Error: Known bugs file '{known_bugs_file}' not found. Exiting.")
                return
            except json.JSONDecodeError:
                print(f"Error: Invalid JSON in known bugs file '{known_bugs_file}'. Exiting.")
                return
            except Exception as e:
                print(f"An unexpected error occurred: {e}. Exiting.")
                return

        last_scanned = {} # store timestamp when each container was last scanned
        while self.loop:
            # Initialize Iteration:
            all_findings = {}  # Reset findings for each iteration
            container_ids = [container.id for container in watchlist] # get IDs of containers in same network

            #TODO: maybe update watchlist every iteration to keep track of (non-)running containers

            for container in watchlist:
                # Read New Logs:
                since_time = last_scanned.get(container.id, None)
                lines = self._get_container_logs(container, since=since_time)
                if not lines:
                    continue # no logs, skip to the next container

                # Extract Log Messages:
                logs = self._extract_logs(lines)

                # Update Last Scanned Timestamp (use timestamp of the *last* log entry)
                if logs:
                    last_entry_timestamp = logs[-1]['timestamp']
                    if last_entry_timestamp: # Only update if not None
                        last_scanned[container.id] = last_entry_timestamp
                    #TODO: print(json.dumps(logs, indent=4, default=str))  # Print results as JSON.

            # Wait Before Next Iteration:
            try:
                time.sleep(interval)
            except KeyboardInterrupt:
                print("Bye!")
                return

    def run(self, interval: int, network_name: str):
        """
        Starts a thread in the background that runs the main loop.

        Args:
            interval (int): scanning interval in seconds (typical 60 sec)
            network_name (str): name of a Docker network to scan
        """
        # Sanity Check (Set Default Arguments):
        args = {}
        if isinstance(interval, int):
            args["interval"] = interval
        if isinstance(network_name, str):
            args["network_name"] = network_name
        
        # Start Main Loop:
        self.loop = True
        thread = threading.Thread(target=self.main, kwargs=args)
        thread.start()

    def stop(self):
        self.loop = False

scanner = Scanner(bugs="files/bugs.json", whitelist="files/Whitelist.txt", blacklist="files/Blacklist.txt")

if __name__ == "__main__":
    # Global Configuration:
    NETWORK_NAME = "lognet"  # Replace with your network name
    INTERVAL = 15  # Check every 60 seconds (adjust as needed)
    try:
        scanner.main(interval=INTERVAL, network_name=NETWORK_NAME)
    except KeyboardInterrupt:
        print("Bye!")
    except InterruptedError:
        print("Terminated!")
    else:
        print("Shutdown!")