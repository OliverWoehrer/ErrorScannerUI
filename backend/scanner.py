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
    The data structure of the SimilarityMatcher needs to be filled (load_items) before it can be
    used. Each comparison gives a similarity score between 0...1
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
        jaccard = SimilarityMatcher.weighted_jaccard(vecA, vecB)
        contain = SimilarityMatcher.containment(vecA, vecB)
        return self.alpha * jaccard + (1 - self.alpha) * contain
    
    """
    Static Methods
    """

    @staticmethod
    def weight_token(token: str) -> float:
        """
        Tells the weight of the given token. Tokens that are natural human words are most likely
        skeleton tokens and therefore considered more important. They get the weight 1.0. Tokens
        that are longer than 15 characters (likely no natural word), include numbers or include
        special characters are considered highly variable tokens. They get the weight 0.1. Other
        tokens, that do not fall into either of these two categories, get a weight of 0.5.
        :param token: Token to find the weight for
        :type token: str
        :return: Weight of the given token. Skeleton tokens get 1.0. Variable tokens get 0.1.
        :rtype: float
        """
        # Simple heuristic: skeleton words get 1.0, variable tokens get 0.1
        if token.isalpha() and len(token) <= 15:
            return 1.0 # very likely a natural word
        if len(token) > 15 or any(c.isdigit() for c in token) or "/" in token or "\\" in token:
            return 0.1 # very likely an ID, path, etc.
        return 0.5 # unsure, return half weight as fallback

    @staticmethod
    def vectorize(text: str) -> dict[str, float]:
        """
        Takes the given text and splits it into tokens. Each token gets a weight between 0 and 1.
        More important tokens have a higher weight. A token is essentially a word or a section
        of the text, separated by whitespaces. A file path ("/my/file/path") is considered a
        single token. An ID with letters and numbers ("AB123CD") is considered one token. An e-mail
        address is considered one token.

        :param text: Text to vectorize
        :type text: str
        :return: Dictionary of tokens mapped to their weight.
        :rtype: Dictionary of strings mapped to float weights (0...1)
        """
        TOKEN_REGEX = re.compile(r"[A-Za-z0-9_/.\-@:]+")
        tokens = TOKEN_REGEX.findall(text)
        vec = {}
        for token in tokens:
            token = token.lower()
            vec[token] = SimilarityMatcher.weight_token(token)
        return vec

    @staticmethod
    def weighted_jaccard(vecA: dict[str, float], vecB: dict[str, float]) -> float:
        """
        The standard Jaccard index usually measures the size of the intersection divided by the
        size of the union. In a weighted version, we aren't just counting tokens; we are summing
        their importance.
        The Numerator (Intersection): sum(min(weightA, weightB)). This calculates the shared "mass"
        between the two strings. If a word exists in both, it contributes its weight. If it only
        exists in one, it contributes 0.
        The Denominator (Union): sum(max(weightA, weightB)). This represents the total "mass"
        covered by both strings combined.

        :param vecA: vectorized text A
        :type text: Dictionary of strings mapped to float weights (0...1)
        :param vecA: vectorized text B
        :type text: Dictionary of strings mapped to float weights (0...1)
        :return: weighted jaccard similarity between 0...1
        :rtype: float
        """
        keys = set(vecA) | set(vecB) # join both sets of weighted tokens
        num = sum(min(vecA.get(k, 0), vecB.get(k, 0)) for k in keys)
        den = sum(max(vecA.get(k, 0), vecB.get(k, 0)) for k in keys)
        return num / den if den > 0 else 0.0

    @staticmethod
    def containment(vecA: dict[str, float], vecB: dict[str, float]) -> float:
        """
        Tells if text B contains the important parts of text A, regardless of how much variable
        noise there is in B.

        param vecA: vectorized text A
        :type text: Dictionary of strings mapped to float weights (0...1)
        :param vecA: vectorized text B
        :type text: Dictionary of strings mapped to float weights (0...1)
        :return: containment score between 0...1
        :rtype: float
        """
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
        host = os.getenv("DOCKER_HOST")
        if not host:
            raise RuntimeWarning(f"Environment variable 'DOCKER_HOST' is not set. Make sure it points to your Docker daemon. If you are using Docker Desktop for example: 'unix:///home/<user>/.docker/desktop/docker.sock'.")
        try:
            self.client = docker.from_env()
        except docker.errors.DockerException:
            host = os.getenv("DOCKER_HOST")
            raise RuntimeError(f"Could not initialize the docker client. Make sure the Docker daemon is running.") from None
        
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
                since_time = last_scanned.get(container.name)
                log_items = self._get_log_items(container, since=since_time)
                if not log_items:
                    continue # no logs, skip to the next container

                                
                # Check Which Item to Log and Record:
                print(f"Scanning {len(log_items)} item from {container.name}")
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

    def _find_docker_containers(self, network_name: str = None) -> set[docker.models.containers.Container]:
        try: # get containers connected to this network
            network = self.client.networks.get(network_name)
            return set(network.containers) # set of Docker containers
        except docker.errors.NotFound:
            print(f"Network {network_name} not found.")
            return set()
        except docker.errors.APIError as e:
            print(f"Error accessing network {network_name}. {e}.")
            return set()

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
        # Blacklist This Docker Container:
        # Add this container to the blacklist, to prevent the scanner from reading its own log messages.
        container = None # object of this container
        is_inside_container = os.getenv("AM_I_IN_A_DOCKER_CONTAINER")
        if is_inside_container: # running inside a container
            try: # find hostname (=first 12 characters of this Docker container ID)
                file = open("/etc/hostname", "r")
                hostname = file.read().strip()
                container = self.client.containers.get(hostname)
                blacklist.append(container.name) # add container to blacklist
            except FileNotFoundError:
                raise RuntimeError("Failed to find hostname of this Docker container.") from None
            except docker.errors.NotFound:
                raise RuntimeError(f"Could not find container '{hostname}'") from None
            finally:
                file.close()
        
        # [INFO]
        # Each network has multiple containers connected to it. We call this a 'club' of
        # containers. Multiple clubs make our 'community'. The community is all possibly relevant
        # containers. One container can be part of multiple clubs (i.e. multiple networks). The
        # watchlist is all containers from the community filtered through white- and blacklist.

        # Find Docker Community:
        community = set()
        if network_name: # use the given network
            # Find Containers for Given Network:
            club = self._find_docker_containers(network_name)
            community = club
        elif container: # no network name but running inside a container
            # Find Networks For This Container:
            network_settings = container.attrs['NetworkSettings']['Networks']
            network_names = network_settings.keys()
            for network_name in network_names:
                club = self._find_docker_containers(network_name) # each network has its club of containers
                community = community | set(club) # add containers from this network to our community
        else: # no network name and not running inside a container
            # Consider All Containers As a Fallback:
            all_containers = self.client.containers
            assert isinstance(all_containers, docker.models.containers.ContainerCollection)
            community = set(all_containers.list()) # all running containers are our community now

        # Build Watchlist:
        watchlist = set() # set of all containers to watch (no duplicates)
        for container in community: # filter for white- and blacklist
            if not whitelist: # no whitelist, consider all containers in the community
                watchlist.add(container)
            if container.name in whitelist:
                watchlist.add(container)
            if container.name in blacklist:
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

        # Assert Type:
        if not since: # use posix timestamp 0 as fallback
            since = datetime.fromtimestamp(0, timezone.utc)
        assert isinstance(since, datetime) and since.timestamp() >= 0, "Given timestamp has to be positive."

        # Fetch Logs as String:
        try:
            start = since.timestamp() or None # timestamp with microseconds as decimal digits
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
            assert timestamp, f"Expected parsable timestamp from Docker log: \"{original_line}\"."
            if timestamp == since:
                continue # skip this log, it was previously parsed
            assert timestamp > since, f"Expected {timestamp} > {since} from line \"{original_line}\""
            
            # Clean Remaining Line:
            try: # remove remaining timestamps with dateutil parser
                if False: # set to True to auto-remove timestamps from message string
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
        latest_timestamp = datetime.fromtimestamp(0, timezone.utc) # holds timestamp of latest log item, init with zero
        for item in enumerate(items):
            latest_timestamp = max(item.timestamp, latest_timestamp)
            if self.stop_event.is_set():
                break

            best_match = None
            best_score = 0.0

            # 1. check if log message was already recorded previously
            should_be_logged = item.category in self.categories_to_log
            should_be_recorded = item.category in self.categories_to_record
            if should_be_recorded or should_be_logged:
                # calculate the match once (if needed by either logic branch)
                candidates = records_data.candidates(item)
                if candidates:
                    matcher = SimilarityMatcher(alpha=0.5)
                    matcher.load_items(candidates)
                    best_match, best_score = matcher.find_match(item)

            # 2. record this item
            if should_be_recorded:
                # [INFO]
                # At this point we want to record the item. We check if the same log message was
                # previously recorded. If it was recorded, we update the timestamp of the matching
                # record. If it was not recorded, we automatically add it to the records.
                if best_match and best_score > self.similarity_threshold: # check if its a good match (high similarity score)
                    if item.timestamp > best_match.timestamp: # check if item is actually newer then existing record
                        best_match.timestamp = item.timestamp
                        records_data.update(best_match)
                else: # no candidates or poor match, add as a brand new record
                    best_match = records_data.add(item)
                    best_match = item # capture the new record so we can link it in the log step if needed
                    best_score = 1.0 # it is a perfect match for itself

            # 3. log this item
            if should_be_logged:
                # [INFO]
                # At this point we check if the same log message was previously recorded. If it was
                # recorded, we mark it as "recorded" by storing the ID of the matching record as
                # the solution. This allows us to link the log item to the matching record item. If
                # it was not recorded, we automatically add it to the logs database.
                if best_match and best_score > self.similarity_threshold: # check if there is a matching record
                    item.solution = best_match.id # link the matching record via ID
                
                logs_data.add(item)

        return latest_timestamp


scanner = Scanner()

if __name__ == "__main__":
    signal.signal(signal.SIGINT, scanner.stop) # signal from keyboard interrupt, e.g. CTRL+C
    scanner.run()
    print("Good bye!")