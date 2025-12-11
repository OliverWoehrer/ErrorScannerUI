import json
from pathlib import Path
import portalocker

class ConfigHandler:
    def __init__(self, filename: str = "config.json"):
        assert isinstance(filename, str), "Given filename has to be of type 'str'"
        self.filename = Path(__file__).parent / filename


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
    def docker_interface_whitelist(self, whitelist: list[str] | None = None) -> list[str] | None:
        docker_interface = self.docker_interface()
        if whitelist:
            docker_interface["whitelist"] = whitelist
            self.docker_interface(docker_interface)
            return None
        return docker_interface.get("whitelist", [])
    def docker_interface_blacklist(self, blacklist: str | None = None) -> str | None:
        docker_interface = self.docker_interface()
        if blacklist:
            docker_interface["blacklist"] = blacklist
            self.docker_interface(docker_interface)
            return None
        return docker_interface.get("blacklist", [])


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
        return scanner.get("interval", 5)
    def scanner_threshold(self, threshold: float | None = None) -> float | None:
        scanner = self.scanner()
        if threshold is not None:
            scanner["threshold"] = threshold
            self.scanner(scanner)
            return None
        return scanner.get("threshold", 0.85)
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
    def scanner_logging(self, logging_list: list[str] | None = None) -> list[str] | None:
        scanner = self.scanner()
        if logging_list is not None:
            scanner["logging"] = logging_list
            self.scanner(scanner)
            return None
        return scanner.get("logging", ["debug"])
    def scanner_recording(self, recording_list: list[str] | None = None) -> list[str] | None:
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
        return disk_usage.get("max_logs", 0) 

    
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
    
    """
    Private Methods:
    """

    def _load_config(self) -> dict:
        lock_obj = portalocker.Lock(self.filename, mode='r', timeout=5, flags=portalocker.LOCK_EX) # locker for file mutex
        try:
            file = lock_obj.acquire() # open file through locker
            return json.load(file)
        except FileNotFoundError:
            return {} # return empty json
        except json.decoder.JSONDecodeError as e:
            text = file.read()
            if text: # check file content
                print(f"Could not parse JSON ({text}): {e}")
            return {} # return empty json
        except portalocker.LockException as e:
            RuntimeError(f"Failed to acquire lock while reading {self.filename}. {e}")
        finally:
            lock_obj.release() # close file and release the lock

    def _store_config(self, configuration: dict) -> None:
        # Create Locker For File Mutex:
        lock_obj = portalocker.Lock(self.filename, mode='w', timeout=5, flags=portalocker.LOCK_EX)
        try:
            file = lock_obj.acquire() # open file through locker
            json.dump(configuration, file ,indent=4)
        except portalocker.LockException as e:
            RuntimeError(f"Failed to acquire lock while writing {self.filename}. {e}")
        except PermissionError as e:
            print(f"Could not store configuration in {self.filename}. {e}")
        finally:
            lock_obj.release() # close file and release the lock
