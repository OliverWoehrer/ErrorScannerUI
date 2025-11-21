from data import LogsRecordsItem, config_data, logs_data, records_data
from dateutil import parser
from datetime import datetime, timedelta, timezone
import docker
import docker.models
import docker.models.containers
from itertools import product
from multiprocessing import Process
import os
import re
import signal
from threading import Event
import warnings
from zoneinfo import ZoneInfo

warnings.filterwarnings("error") # handle warning from libraries as exceptions

class Scanner():
    def __init__(self):
        # Initialize Properties:
        self.logs = logs_data
        self.records = records_data
        self.config = config_data
        self.stop_event = Event()
        signal.signal(signal.SIGTERM, self.stop)
        signal.signal(signal.SIGINT, self.stop)

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

    def stop(self, segnum, frame):
        print(f"Stopping scanner...")
        self.stop_event.set()

    def run(self):
        # Read Filter Lists:
        whitestring = self.config.docker_interface_whitelist()
        whitelist = set([line.strip() for line in whitestring.splitlines()])
        blackstring = self.config.docker_interface_blacklist()
        blacklist = set([line.strip() for line in blackstring.splitlines()])
        shared_items = whitelist & blacklist # union of both sets
        if shared_items: # same items in whitelist and blacklists not allowed
            error_message = "Whitelist and Blacklist share items, which is bad practice:"
            for item in shared_items:
                error_message = f"\r\n{item}"
            raise RuntimeError(error_message)
        
        # Build Watchlist:
        network_name = self.config.docker_interface_network()
        watchlist = self._build_watchlist(network_name, whitelist, blacklist)

        last_scanned = {} # store timestamp when each container was last scanned
        prev_logged_items = []
        while not self.stop_event.is_set():
            # Initialize Iteration:
            new_logged_items = []  # list of new log items from all containers in the watchlist
            all_recorded_items = self.records.load_items() # list of all previously recorded log items
            categories_to_log = self.config.scanner_logging() # list of categories to store to the log file
            categories_to_record = self.config.scanner_recording() # list of categories to auto-record if the log message was not already recorded
            
            #TODO: remove after debug
            current_recorded_items_count = len(all_recorded_items)
            updated_records_count = 0
            
            for container in watchlist:
                # Read New Logs:
                since_time = last_scanned.get(container.name, None) # use posix timestamp 0 as fallback
                log_items = self._get_log_items(container, since=since_time)
                if not log_items:
                    continue # no logs, skip to the next container
                
                # Check Which Log to Store and Record:
                lastest_timestamp = datetime.fromtimestamp(0, tz=timezone.utc) # will hold the timestamp of the latest log item
                for log_item in log_items:
                    lastest_timestamp = max(log_item.timestamp, lastest_timestamp)

                    # check if its category should be logged
                    if log_item.category in categories_to_log:
                        new_logged_items.append(log_item) # store this item to logs file
                    elif log_item.category not in categories_to_record:
                        continue # skip, do not further process this item
                    
                    # check if log message was already recorded previously
                    previously_recorded = False # tells if the log message is already known and was recorded
                    for record_item in all_recorded_items:
                        if log_item == record_item: # check if the log message was already recorded
                            record_item.timestamp = log_item.timestamp # update timestamp (last seen datetime)
                            previously_recorded = True
                            updated_records_count += 1
                            break # skip rest of loop, matching record already found
                        
                    # if not already recorded, check if the category should be auto-recorded
                    if not previously_recorded:
                        if log_item.category in categories_to_record:
                            all_recorded_items.append(log_item)
                
                # Update Last Scanned Timestamp (use timestamp of the *last* log entry)
                last_scanned[container.name] = lastest_timestamp
                
            for prev_log,new_log in product(prev_logged_items, new_logged_items):
                assert prev_log.id != new_log.id, "No duplicates expected: {new_log.id}"
            print(f"New Logs: {len(new_logged_items):>5} | Updated Records: {updated_records_count:>5} | New Records: {(len(all_recorded_items)-current_recorded_items_count):>5}\r\n")
            prev_logged_items = new_logged_items # TODO: remove after debug

            # Write String of Items to File:
            self.logs.store_items(new_logged_items, append=True)
            self.records.store_items(all_recorded_items, append=False)

            # Wait Before Next Iteration:
            interval = self.config.scanner_interval()
            self.stop_event.wait(interval) # wait until the stop event is set, but at most 'interval' seconds


    """
    Private Methods
    """

    def _build_watchlist(self, network_name: str, whitelist: list[str], blacklist: list[str]) -> set[docker.models.containers.Container]:
        """
        The watchlist is a list of Docker containers (names or IDs) to read from. The watchlist
        can be filtered with  the help of a whitelist and a blacklist. If the whitelist is empty,
        all containers are automatically added to the watchlist. Containers on the blacklist are
        not part of the watchlist.
        If a network name is given, only containers inside that network are considered for the
        watchlist. Without a network name we use network(s) this container is part of. If no
        networks can be found, all containers on the entire system are considered.
        """
        # Initalize Docker Client:
        try:
            client = docker.from_env()
        except docker.errors.DockerException:
            print(f"Could not connect to docker daemon!")
            return set()
        
        # Find Docker Network(s):
        network_names = set()
        if network_name: # use the given network
            network_names.add(network_name)
        else: # no network given, use all networks this containers is part of
            try: # find id of this Docker container
                file = open("/etc/hostname", "r")
                container_id = file.read().strip()
            except FileNotFoundError:
                print("Not running inside a Docker container or could not get container ID. Scanning all networks...\r\nTo prevent this pass a network name.")
            else:
                try: # find networks for this container id
                    container = client.containers.get(container_id)
                except docker.errors.NotFound:
                    print(f"Could not find container '{container_id}'")
                else:
                    network_settings = container.attrs['NetworkSettings']['Networks']
                    print(f"Container '{container.name}' is connected to the following network:")
                    for network_name in network_settings.keys():
                        print(f"- {network_name}")
                        network_names.add(network_name)
        
        # [INFO]
        # Each network has multiple containers connected to it. We call this the 'galaxy' of
        # this network. Multiple galaxies make our universe. The universe is all possibly relevant
        # containers. One container can be part of multiple networks (i.e. multiple galaxies). The
        # watchlist is all containers from the universe filtered through white- and blacklist.

        # Access Docker Network(s):
        universe = set() # set of all containers part of our networks
        for network_name in network_names:
            try: # get containers connected to this network
                network = client.networks.get(network_name)
                galaxy = network.containers # each network has its galaxy of containers
                universe = universe | set(galaxy) # add containers from this network to our universe
            except docker.errors.NotFound:
                print(f"Network {network_name} not found, skipping.")
            except docker.errors.APIError as e:
                print(f"Error accessing network {network_name}: {e}.")
        if not universe: # no networks found, consider all containers as a fallback
            all_containers = client.containers
            assert isinstance(all_containers, docker.models.containers.ContainerCollection)
            universe = set(all_containers.list()) # all running containers are our universe now

        # Build Watchlist:
        watchlist = set() # set of all containers to watch (no duplicates)
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
            print(f"- {container.name}")

        return watchlist

    def _get_log_items(self, container: docker.models.containers.Container, since: datetime = None) -> list[LogsRecordsItem]:
        """
        Get logs from a container since the given timestamp. If no timestamp is given, all logs
        are returned.

        Args:
            container: container object to read from
            since: A datetime object indicating the start time for the logs. If None, retrieves all logs.

        Returns:
            A list of log lines (strings). Returns an empty list on error.
        """
        # Increment Starting Timestamp:
        # [INFO]
        # Log with timestamp 'since' was already fetched in previous iteration. So we increment
        # timestamp 'since' by one nanosecond to not fetch it again. The method logs() only seems
        # to consider nanaosecond resolution if the 'since' parameter is passed as float in
        # nanoseconds
        print(f"╔{container.name:═^45}╗")
        print(f"║ Scanning since {since}")
        
        # Fetch Logs as String:
        try:
            logs_text = container.logs(stream=False, timestamps=True, since=since).decode("utf-8")
            lines = logs_text.splitlines()
        except Exception as e:
            print(f"Error retrieving logs for {container.name}: {e}")
            return []

        # Parse Text to Logs:
        min_ts = datetime.now(timezone.utc)
        max_ts = datetime.fromtimestamp(0, tz=timezone.utc) # TODO: removve after debug
        logs = []
        for line in lines:
            # [INFO]
            # Docker can automatically prepend timestamps to log messages (timestamps=True). These
            # timestamps follow the 'RFC3339 Nano' format (YYYY-MM-DDTHH:MM:SS.NNNNNNNNNZHH:MM),
            # which cannot be parse by the dateutil.parser. In this case we have to adjust the
            # string so the parser can convert it. This format of timestamp at the start
            # of the log message is removed not part of the actual log message.
            
            # Look For RFC3339 Nano Timestamp (generated by Docker):
            timestamp = None
            match = re.search(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z(\d{2}:\d{2})?\s?", line)
            if match: # found Nano timestamp: nanosecond part needs to be cleaned to microseconds
                dirty_string = match.group(0)
                parts = dirty_string.split('.')
                microsecond_part = parts[1][:6] # trim nanaseconds to 6 digits
                cleaned_string = f"{parts[0]}.{microsecond_part}Z"
                timestamp = parser.isoparse(cleaned_string)#.astimezone(ZoneInfo("Europe/Vienna"))
                # timestamp = aware_timestamp.replace(tzinfo=None)
                original_line = line
                line = line.replace(dirty_string, "") # remove timestamp generated by Docker
            if since and timestamp and timestamp <= since:
                continue # skip items before 'since', this happens for single logs when they appear a few microseconds before 'since'

            # Clean Remaining Message:
            try: # remove remaining timestamps with dateutil parser
                # fuzzy tokens return format = (datetime_obj, unused_tokens)
                # datetime_obj: datetime object parsed
                # unused_tokens: tokens not used for parsing 
                datetime_obj, unused_tokens = parser.parse(line, fuzzy_with_tokens=True) # try to extract date
                line = "".join(unused_tokens).strip() # only use tokens without datetime
            except parser.ParserError as e:
                continue # skip, unable to parse
            except RuntimeWarning as e:
                pass # continue without removing datetime string
            except Exception as e:
                print(f"Failed to automatically remove datetime string from '{line}'")
            
            # [INFO]
            # Some log messages spread over multiple line (e.g. stack traces). They originally get
            # extracted as separate logs. We now merge them under the assumption their timestamps are
            # within the threshold.

            # Merge Multiline Log Messages:
            TIME_THRESHOLD = timedelta(microseconds=80)
            if logs and (timestamp - logs[-1].timestamp) < TIME_THRESHOLD:
                last_log = logs[-1]
                last_log.message += "\n" + line # append to existing log message
                continue # skip the rest, no parsing needed
            
            # Parse Log:
            parsed_category = None
            tags = self.config.scanner_tags()
            for category,tag in tags.items():
                if tag in line:
                   parsed_category = category
                   line = line.replace(tag, "") # remove tag from log message
                   break # stop looking for other category tags
            item = LogsRecordsItem(timestamp=timestamp, category=parsed_category, source=container.name, message=line)
            logs.append(item)
            min_ts = min(timestamp, min_ts)
            max_ts = max(timestamp, max_ts) #TODO: remove after debug
            if since and timestamp and timestamp <= since:
                print("Expected earliest timestamp {timestamp} to be bigger then {since}")
                # raise RuntimeError("Expected earliest timestamp {timestamp} to be bigger then {since}")

        print(f"║ {len(logs)} new items")
        if logs:
            print(f"║ min = {min_ts}") # TODO: remove after debug
            print(f"║ max = {max_ts}")
        print(f"╚{"":═^45}╝")
        return logs

scanner = Scanner()

if __name__ == "__main__":
    scanner.run()
    print("Scanner stopped.")