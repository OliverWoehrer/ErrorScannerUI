from data import DataItem, config_data, logs_data, records_data
from dateutil import parser
from datetime import datetime, timedelta, timezone
import docker
import docker.models
import docker.models.containers
import os
import re
import signal
from threading import Event
import time
import warnings

warnings.filterwarnings("error") # handle warning from libraries as exceptions

class SimilarityMatcher:
    """
    This implements a data structure to efficiently match and compare a collection of DataItem. It
    uses a weighted Jaccard matrix to compare two strings. The parameter alpha helps to balance
    between string length and similar junks of words.
    The data structur of the SimilarityMatcher needs to be filled (load_items) before it can be
    used. Each comparision gives a similarity score between 0...1
    """
    def __init__(self, alpha: float = 0.5):
        """
        The alpha parameter changes how much short static words in a message template are weighted
        versus long variable sections between.
        alpha high (0.9) penalizes extra junk, good for strict matches.
        alpha low (0.1) ignores extra junk, good for skeleton-only matches.
        
        :param self: Description
        :param alpha: Description
        :type alpha: float
        """
        self.alpha = alpha
        self.items =[]

    def load_items(self, items: list[DataItem]):
        """
        Loads the given items into the matchers datastructure. The given items are searched by the
        algorithm to find the best match.
        
        :param items: Items to search through
        :type items: list[DataItem]
        """
        self.items = items

    def find_match(self, item: DataItem) -> tuple[DataItem,float]:
        """
        Tries to find the best match for the given item in the loaded items. It computes the
        similarity of the given item and already loaded items and returns the item with the
        best similarity score along with the score. The similarity score is between 0.0 and 1.0.
        The higher the score the more similar the text are. If the score is 0.0 the texts do not
        match at all. If the score is 1.0 the texts are a perfect match and are equal.
        
        :param item: Item to find a match for
        :type item: DataItem
        :return: Tuple of the item with the highest similarity score and the score itself
        :rtype: tuple[DataItem,float]
        """
        best_match = None
        best_score = 0.0
        for candidate in self.items:
            # Check Category and Source:
            if item.source != candidate.source:
                continue
            if item.category != candidate.category:
                continue

            # Check For Perfect Matching Messages:
            if item.message == candidate.message:
                best_score = 1.00
                best_match = candidate
                break

            # Check With Match Pattern:
            if candidate.matchpattern:
                matches = re.findall(candidate.matchpattern, item.message)
                if matches: # check for any matches
                    best_score = 0.99
                    best_match = candidate
                    break

            # Calculate Similarity Score:
            score = self.score(item.message, candidate.message)
            if score > best_score:
                best_match = candidate
                best_score = score
        return best_match, best_score

    def score(self, msgA: str, msgB: str) -> float:
        """
        alpha high (0.9) penalizes extra junk, good for strict matches.
        alpha low (0.1) ignores extra junk, good for skeleton-only matches.
        """
        vecA, vecB = SimilarityMatcher.vectorize(msgA), SimilarityMatcher.vectorize(msgB)
        wj = SimilarityMatcher.weighted_jaccard(vecA, vecB)
        cont = SimilarityMatcher.containment(vecA, vecB)
        return self.alpha * wj + (1 - self.alpha) * cont
    
    """
    Static Methods
    """

    @staticmethod
    def weight_token(token: str) -> float:
        # Simple heuristic: skeleton words get 1.0, variable tokens get 0.1
        if token.isalpha() and len(token) <= 15:
            return 1.0
        if len(token) > 15 or any(c.isdigit() for c in token) or "/" in token or "\\" in token:
            return 0.1
        return 0.5

    @staticmethod
    def vectorize(text: str) -> dict[str, float]:
        TOKEN_REGEX = re.compile(r"[A-Za-z0-9_/.\-@:]+")
        tokens = TOKEN_REGEX.findall(text)
        vec = {}
        for token in tokens:
            token = token.lower()
            vec[token] = SimilarityMatcher.weight_token(token)
        return vec

    @staticmethod
    def weighted_jaccard(vecA: dict[str, float], vecB: dict[str, float]) -> float:
        keys = set(vecA) | set(vecB)
        num = sum(min(vecA.get(k, 0), vecB.get(k, 0)) for k in keys)
        den = sum(max(vecA.get(k, 0), vecB.get(k, 0)) for k in keys)
        return num / den if den > 0 else 0.0

    @staticmethod
    def containment(vecA: dict[str, float], vecB: dict[str, float]) -> float:
        num = sum(min(vecA.get(k, 0), vecB.get(k, 0)) for k in vecA)
        den = sum(vecA.values())
        return num / den if den > 0 else 0.0



class Scanner():
    """
    This implements the scanner process. It periodically reads log messages from docker containers
    and stores them into the logs data storage.   It uses the SimilarityMatcher to check if any new
    log messages are part of the already known records. Records are log messages that where
    previously saved (typically error messages), ideally with a description on how to solve the
    problem. This helps to see if any new errors occurred or find solutions to known errors. 
    """
    def __init__(self):
        # Initialize Properties:
        self.stop_event = Event()

        # Initialize Docker Client:
        host = os.environ.get("DOCKER_HOST")
        if not host:
            raise RuntimeWarning(f"Environment variable 'DOCKER_HOST' is not set. Make sure it points to your Docker daemon. If you are using Docker Desktop for example: 'unix:///home/<user>/.docker/desktop/docker.sock'.")
        try:
            docker.from_env()
        except docker.errors.DockerException:
            host = os.environ.get("DOCKER_HOST")
            raise RuntimeError(f"Could not initialize the docker client! Here are things to check:\r\n" \
                f"> Make sure the Docker daemon is running.\r\n" \
                f"> Make sure the environment variable 'DOCKER_HOST' points to your Docker daemon.\r\n" \
                f"  current variable: DOCKER_HOST = '{host}'") from None
        
        # Initialize Data Collections:
        logs_data.clear() # clear previous logs

    def stop(self, signum, frame):
        print(f"Stop scanner.")
        self.stop_event.set()

    def run(self):
        # Register Signal Handler:
        signal.signal(signal.SIGTERM, self.stop) # signal from OS
        
        # Read Filter Lists:
        whitelist = config_data.docker_interface_whitelist()
        blacklist = config_data.docker_interface_blacklist()
        shared_items = set(whitelist) & set(blacklist) # union of both sets
        if shared_items: # same items in whitelist and blacklists not allowed
            error_message = "Whitelist and Blacklist share items, which is bad practice:"
            for item in shared_items:
                error_message += f", {item}"
            raise RuntimeError(error_message)
        
        # Build Watchlist:
        network_name = config_data.docker_interface_network()
        watchlist = self._build_watchlist(network_name, whitelist, blacklist)

        # Infinite Loop:
        last_scanned = {} # store timestamp when each container was last scanned
        while not self.stop_event.is_set():
            # Initialize Iteration:
            self.categories_to_log = config_data.scanner_logging() # list of categories to store to the log file
            self.categories_to_record = config_data.scanner_recording() # list of categories to auto-record if the log message was not already recorded
            self.similarity_threshold = config_data.scanner_threshold() # similarity threshold if no match pattern is available

            for container in watchlist:
                # Read New Logs:
                since_time = last_scanned.get(container.name, datetime.min.replace(tzinfo=timezone.utc)) # use posix timestamp 0 as fallback
                log_items = self._get_log_items(container, since=since_time)
                if not log_items:
                    continue # no logs, skip to the next container

                                
                # Check Which Item to Log and Record:
                print(f"Scanning {len(log_items)} item from {container.name}:")
                start = time.time()
                latest_timestamp = self._scan_log_items(items=log_items)
                stop = time.time()
                print(f"Scanned {len(log_items)} in {stop-start:.6f} sec ({(stop-start)/len(log_items):.6f} sec/item)")

                # Update Last Scanned Timestamp (use timestamp of the *last* log entry)
                last_scanned[container.name] = latest_timestamp

            # Write Items to Database:
            max_log_count = config_data.disk_usage_max_logs()
            logs_data.set_max_log_count(max_log_count)

            # Wait Before Next Iteration:
            interval = config_data.scanner_interval()
            try:
                self.stop_event.wait(interval) # wait until the stop event is set, but at most 'interval' seconds
            except KeyboardInterrupt as e:
                pass

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
            finally: # cleanup host file
                file.close()
        
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
        print(f"Watchlist: {"" if watchlist else "empty"}")
        for container in watchlist:
            print(f"- {container.name}")

        return watchlist

    def _get_log_items(self, container: docker.models.containers.Container, since: datetime) -> list[DataItem]:
        """
        Get logs from a container since the given timestamp. If no timestamp is given, all logs
        are returned.

        Args:
            container: container object to read from
            since: A datetime object indicating the start time for the logs. If None, retrieves all logs.

        Returns:
            A list of log lines (strings). Returns an empty list on error.
        """
        # [INFO]
        # Log with timestamp 'since' was already fetched in previous iteration. So we increment
        # timestamp 'since' by one microsecond to not fetch it again. The method logs() only seems
        # to consider nanosecond resolution if the 'since' parameter is passed as float in seconds

        # Fetch Logs as String:
        try:
            start = since.timestamp() if since.timestamp() else 0.0001 # smallest possible timestamp
            logs_text = container.logs(stream=False, timestamps=True, since=start).decode("utf-8")
            lines = logs_text.splitlines()
        except Exception as e:
            print(f"Error retrieving logs for {container.name}: {e}")
            return []
        
        # Parse Text to Logs:
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
            original_line = line
            match = re.search(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z(\d{2}:\d{2})?\s?", line)
            if match: # found Nano timestamp: nanosecond part needs to be cleaned to microseconds
                dirty_string = match.group(0)
                parts = dirty_string.split('.')
                microsecond_part = parts[1][:6] # trim nanoseconds to 6 digits
                cleaned_string = f"{parts[0]}.{microsecond_part}Z"
                timestamp = parser.isoparse(cleaned_string)#.astimezone(ZoneInfo("Europe/Vienna"))
                line = line.replace(dirty_string, "") # remove timestamp generated by Docker
            assert timestamp, "Expected parsable timestamp from Docker log: {original_line}."
            if timestamp == since:
                continue # skip this log, it was previously parsed
            assert timestamp > since, f"Expected timestamp bigger then {since}: {original_line}"
            
            # Clean Remaining Line:
            try: # remove remaining timestamps with dateutil parser
                if True: # set to False to stop auto-parsing timestamps
                    # parse with fuzzy tokens return format = (datetime_obj, unused_tokens)
                    # datetime_obj: datetime object parsed
                    # unused_tokens: tokens not used for parsing
                    datetime_obj, unused_tokens = parser.parse(line, fuzzy_with_tokens=True) # try to extract date
                    line = "".join(unused_tokens).strip() # only use tokens without datetime
            except parser.ParserError as e:
                pass # ignore, unable to parse
            except RuntimeWarning as e:
                pass # continue without removing datetime string
            except Exception as e:
                print(f"Failed to automatically remove datetime string from '{line}'")

            # [INFO]
            # Some log messages spread over multiple line (e.g. stack traces). They originally get
            # extracted as separate logs. We now merge them under the assumption their timestamps are
            # within the threshold.

            # Merge Multiline Log Messages:
            TIME_THRESHOLD = timedelta(microseconds=200)
            if logs and (timestamp - logs[-1].timestamp) < TIME_THRESHOLD:
                logs[-1].message += "\n" + line # append to existing log message
                logs[-1].timestamp = timestamp # use timestamp of new line
                continue # skip the rest, no parsing needed

            # Parse Log:
            parsed_category = None
            tags = config_data.scanner_tags()
            for category,tag in tags.items():
                if tag in line:
                   parsed_category = category
                   line = line.replace(tag, "") # remove tag from log message
                   break # stop looking for other category tags
            item = DataItem(timestamp=timestamp, category=parsed_category, source=container.name, message=line)
            logs.append(item)
        
        return logs

    def _scan_log_items(self, items: list[DataItem]) -> datetime:
        BAR_WIDTH = 50
        total_length = len(items)
        latest_timestamp = datetime.min.replace(tzinfo=timezone.utc) # will hold the timestamp of the latest log item
        for idx,item in enumerate(items):
            progress = ((idx+1)/total_length) * BAR_WIDTH
            print(f"\r[{ f"{'':=<{progress}}"    }{   f"{'': <{BAR_WIDTH-progress}}"     }]", end="", flush=True)
            latest_timestamp = max(item.timestamp, latest_timestamp)
            if self.stop_event.is_set():
                break

            # 1. check if its category should be logged
            if item.category in self.categories_to_log:
                logs_data.add(item) # store this item to logs collection
            elif item.category not in self.categories_to_record:
                continue # skip, do not further process this item
            
            # [INFO]
            # At this point we need to record log_item. Check if the same log was already
            # recorded. If it was recorded previously, update its timestamp. If it was not
            # recorded previously, we automatically add it to the records.

            # 2 check if log message was already recorded previously
            # 2.1 check if there are candidates (possibly similar items)
            candidates = records_data.candidates(item)
            if not candidates:
                records_data.add(item) # add item as new record
                continue # skip rest of loop
            
            # 2.2 find best candidate
            matcher = SimilarityMatcher(alpha=0.5)
            matcher.load_items(candidates)
            best_match, best_score = matcher.find_match(item)

            # 3. update records
            if best_score > self.similarity_threshold:
                if item.timestamp > best_match.timestamp: # check if item is actually newer then existing record
                    best_match.timestamp = item.timestamp
                    records_data.update(best_match)
            else:
                records_data.add(item)

        print(f"\r\n", end="", flush=True) # add final linebreak
        return latest_timestamp


scanner = Scanner()

if __name__ == "__main__":
    signal.signal(signal.SIGINT, scanner.stop) # signal from keyboard interrupt, e.g. CTRL+C
    scanner.run()
    print("Good bye!")