"""
This module implements functions to read and write data files in here
"""
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
from collections import deque # Import deque for efficient log tailing


class JSONFileHandler:
    def __init__(self, filename: str):
        assert filename != None, f"Invalid filename given ({filename})"
        self.filename = filename

    def _load_config(self) -> dict:
        """
        Read the JSON file and load its content before returning it
        
        Returns:
            config (dict): json dictionary object
        """
        config = None
        try:
            file = open(self.filename, mode="r")
            config = json.load(file)
        except FileNotFoundError as e: # create new file
            file = open(self.filename, mode="w")
            json.dump({}, file, indent=4) # write empty json
        finally:
            file.close()
        return config

    def _store_config(self, configuration: dict):
        """
        Write the given config to the configuration file
        
        Parameters:
            config (dict): json dictionary object
        """
        with open(self.filename, mode="w") as file:
            json.dump(configuration, file ,indent=4)

class TXTFileHandler:
    def __init__(self, filename: str):
        assert filename != None, f"Invalid filename given ({filename})"
        self.filename = filename

    def _load_text(self) -> str:
        """
        Read the text file and load its content before returning it
        
        Returns:
            text (str): string
        """
        text = None
        try:
            file = open(self.filename, mode="r")
            text = file.read()
        except FileNotFoundError as e: # create new file
            file = open(self.filename, mode="w")
            text = ""
        finally:
            file.close()
        return text

    def _store_text(self, text: str):
        """
        Write the given text to the text file
        
        Parameters:
            text (str): string
        """
        with open(self.filename, mode="w") as file:
            file.write(text)

class SettingsHandler(JSONFileHandler):
    def __init__(self, filename: str = "settings.json"):
        parent_path = Path(__file__).parent
        filepath = parent_path / filename
        super().__init__(filepath)
        whitelist_path = parent_path / "Whitelist.txt"
        self.whitelist = TXTFileHandler(whitelist_path)
        blacklist_path = parent_path / "Blacklist.txt"
        self.blacklist = TXTFileHandler(blacklist_path)

    # --- Docker Interface ---
    def docker_interface(self, settings: dict | None = None) -> dict | None:
        config = self._load_config()
        if settings is not None:
            config["docker_interface"] = settings
            self._store_config(config)
            return None
        return config.get("docker_interface", {})
    def docker_interface_network(self, network: str | None = None) -> str | None:
        docker_interface = self.docker_interface()
        if network is not None: # parameter given: setter method
            docker_interface["network"] = network
            self.docker_interface(docker_interface)
            return None
        return docker_interface.get("network", "")
    def docker_interface_whitelist(self, text: str | None = None) -> str | None:
        if text is not None: # parameter given: setter method
            self.whitelist._store_text(text)
            return None
        return self.whitelist._load_text()
    def docker_interface_blacklist(self, text: str | None = None) -> str | None:
        if text is not None: # parameter given: setter method
            self.blacklist._store_text(text)
            return None
        return self.blacklist._load_text()


    # --- Scanner ---
    def scanner(self, settings: dict | None = None) -> dict | None:
        config = self._load_config()
        if settings is not None:
            config["scanner"] = settings
            self._store_config(config)
            return None
        return config.get("scanner", {})
    def scanner_interval(self, interval: int | None = None) -> int | None:
        scanner = self.scanner()
        if interval is not None:
            scanner["interval"] = interval
            self.scanner(scanner)
            return None
        return scanner.get("interval", 15000)
    def scanner_tags(self, tags: dict | None = None) -> dict | None:
        scanner = self.scanner()
        if tags is not None:
            scanner["tags"] = tags
            self.scanner(scanner)
            return None
        return scanner.get("tags", {})
    def scanner_tags_critical(self, tag_text: str | None = None) -> str | None:
        tags = self.scanner_tags()
        if tag_text is not None:
            tags["critical"] = tag_text
            self.scanner_tags(tags)
            return None
        return tags.get("critical", "")
    def scanner_tags_error(self, tag_text: str | None = None) -> str | None:
        tags = self.scanner_tags()
        if tag_text is not None:
            tags["error"] = tag_text
            self.scanner_tags(tags)
            return None
        return tags.get("error", "")
    def scanner_tags_warning(self, tag_text: str | None = None) -> str | None:
        tags = self.scanner_tags()
        if tag_text is not None:
            tags["warning"] = tag_text
            self.scanner_tags(tags)
            return None
        return tags.get("warning", "")
    def scanner_tags_info(self, tag_text: str | None = None) -> str | None:
        tags = self.scanner_tags()
        if tag_text is not None:
            tags["info"] = tag_text
            self.scanner_tags(tags)
            return None
        return tags.get("info", "")
    def scanner_tags_debug(self, tag_text: str | None = None) -> str | None:
        tags = self.scanner_tags()
        if tag_text is not None:
            tags["debug"] = tag_text
            self.scanner_tags(tags)
            return None
        return tags.get("debug", "")
    def scanner_logging(self, logging_list: list | None = None) -> list | None:
        scanner = self.scanner()
        if logging_list is not None:
            scanner["logging"] = logging_list
            self.scanner(scanner)
            return None
        return scanner.get("logging", [])
    def scanner_recording(self, recording_list: list | None = None) -> list | None:
        scanner = self.scanner()
        if recording_list is not None:
            scanner["recording"] = recording_list
            self.scanner(scanner)
            return None
        return scanner.get("recording", [])

    
    # --- Disk Usage ---
    def disk_usage(self, settings: dict | None = None) -> dict | None:
        config = self._load_config()
        if settings is not None:
            config["disk_usage"] = settings
            self._store_config(config)
            return None
        return config.get("disk_usage", {})
    def disk_usage_max_logs(self, num: int | None = None) -> int | None:
        disk_usage = self.disk_usage()
        if num is not None:
            assert isinstance(num, int) and num >= 0, f"Given number has to be positiv integer. It is {num}."
            disk_usage["max_logs"] = num
            self.disk_usage(disk_usage)
            return None
        return disk_usage.get("max_logs", 1000) 

    
    # --- Database ---
    def database(self, settings: dict | None = None) -> dict | None:
        config = self._load_config()
        if settings is not None:
            config["database"] = settings 
            self._store_config(config)
            return None
        return config.get("database", {})
    def database_host(self, host: str | None = None) -> str | None:
        database = self.database()
        if host is not None:
            database["host"] = host
            self.database(database)
            return None
        return database.get("host", "localhost")
    def database_port(self, port: str | None = None) -> str | None:
        """Getter/Setter for 'database.port' (kept as string per config)."""
        database = self.database()
        if port is not None:
            database["port"] = port
            self.database(database)
            return None
        return database.get("port", "")
    def database_path(self, path: str | None = None) -> str | None:
        """Getter/Setter for 'database.path'."""
        database = self.database()
        if path is not None:
            database["path"] = path
            self.database(database)
            return None
        return database.get("path", "/")
    def database_key(self, key: str | None = None) -> str | None:
        database = self.database()
        if key is not None:
            database["key"] = key
            self.database(database)
            return None
        return database.get("key", "")
        




























# Define the structure for a single log message
LogMessage = Dict[str, Any]

def write_logs(filename: str, logs: List[LogMessage]) -> None:
    """
    Writes a batch of log messages to a JSON Lines (JSONL) file.

    Each log dictionary is serialized to JSON and written as a new line.
    This uses 'a' (append) mode, making the write operation fast and
    independent of the file size (which solves the scalability issue).

    Args:
        filename: The path to the JSONL file.
        logs: A list of log dictionaries to be written (your batch).
    """
    try:
        # Open the file in append mode ('a')
        with open(filename, 'a', encoding='utf-8') as f:
            for log in logs:
                # 1. Serialize the dictionary to a JSON string
                json_line = json.dumps(log)
                # 2. Write the string, followed by a newline.
                f.write(json_line + '\n')
        print(f"Successfully wrote {len(logs)} logs to {filename} (appended).")
    except IOError as e:
        print(f"Error writing to file {filename}: {e}")
    except TypeError as e:
        print(f"Error serializing log data (check for un-serializable objects): {e}")

def read_logs(filename: str, num_lines: Optional[int] = None) -> List[LogMessage]:
    """
    Reads log messages from a JSON Lines (JSONL) file.

    If num_lines is provided, only the last N lines are read (tailing).
    This is done efficiently using deque to avoid loading the entire file
    into memory if it's very large.

    Args:
        filename: The path to the JSONL file.
        num_lines: Optional integer specifying the maximum number of lines
                   to read from the end of the file. If None or 0, all
                   lines are read.

    Returns:
        A list of log dictionaries read from the file.
    """
    logs: List[LogMessage] = []
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            
            # Determine which lines to process
            if num_lines is not None and num_lines > 0:
                # Use deque to efficiently read only the last N lines.
                # This iterates through the whole file but only stores the
                # last N lines in memory.
                file_lines = deque(f, maxlen=num_lines)
            else:
                # Read all lines
                file_lines = f.readlines()
            
            # Iterate and parse the selected lines
            for line in file_lines:
                # Strip leading/trailing whitespace (like the newline character)
                stripped_line = line.strip()
                if stripped_line:
                    try:
                        # Parse the JSON string back into a dictionary
                        log_entry = json.loads(stripped_line)
                        logs.append(log_entry)
                    except json.JSONDecodeError as e:
                        # Handle case where a line is not valid JSON
                        print(f"Skipping corrupted line in {filename}: {e} (Content snippet: '{stripped_line[:50]}...')")
                        continue
                        
    except FileNotFoundError:
        print(f"The file {filename} does not exist. Returning empty list.")
    except IOError as e:
        print(f"Error reading file {filename}: {e}")

    return logs