from abc import ABC, abstractmethod
from collections import deque
from .data_item import DataItem
from datetime import datetime
import json
import os
from pathlib import Path
import portalocker
import time

class LogsCollection(ABC):
    @abstractmethod
    def load(self):
        """
        Load log items into memory
        """
        pass

    @abstractmethod
    def clear(self) -> str:
        """
        Clear the entire data structure
        
        :return: Error message in case of an error. Otherwise this is 'None'
        :rtype: str
        """
        pass

    @abstractmethod
    def add(self, item: DataItem) -> str:
        """
        Add the given item to this collection. This only updates the cached data. To confirm any
        changes you need to call 'flush()'
        
        :param item: Data item to add to this collection
        :type item: DataItem
        :return: Hold any error message in case of an error. Otherwise it is 'None'
        :rtype: str
        """
        pass

    @abstractmethod
    def get_last(self, num: int) -> list[DataItem]:
        """
        Loads the last 'num' data items from this collection
        
        :param num: Number of items to return
        :type num: int
        :return: List of data items
        :rtype: list[DataItem]
        """
        pass

    @abstractmethod
    def get_between(self, start: datetime, end: datetime) -> list[DataItem]:
        """
        Returns all log items between the given start and end date. Log items with the same date
        as start or end are NOT included.
        
        :param start: start datetime of the interval
        :type start: datetime
        :param end: end datetime of the interval
        :type end: datetime
        :return: List of data items with a timestamp in the interval
        :rtype: list[DataItem]
        """
        pass

    @abstractmethod
    def set_max_log_count(self, size: int):
        """
        Set the maximum cache size. If the size is set to zero, no limit is enforced and the
        collection uses as much space as need.
        
        :param size: Number of items to cache
        :type size: int
        """
        pass

    @abstractmethod
    def flush(self) -> str:
        """
        Write updated log items from memory to database
        """
        pass

class LogsFile(LogsCollection):
    def __init__(self, filename: str):
        assert isinstance(filename, str), "Given filename has to be of type 'str'"
        self.filename = Path(__file__).parent / filename
        self.logcount = self._count_lines()
        self.max_logcount = 0
        self.items = deque([])

    def load(self):
        lines = self._read_lines()
        for line in lines:
            try:
                data = json.loads(line, object_hook=DataItem.parse)
            except TypeError as e:
                print(f"Could not parse {line}. {e}")
                continue # skip this line
            else:
                timestamp = data.get("timestamp",None)
                category = data.get("category",None)
                source = data.get("source",None)
                message = data.get("message",None)
                solution = data.get("solution",None)
                searchkey = data.get("searchkey",None)
                id = data.get("id", None)
                item = DataItem(timestamp=timestamp, category=category, source=source, message=message, solution=solution, searchkey=searchkey, id=id)
                self.items.append(item)

    def clear(self) -> str:
        try:
            self._lock.acquire()
            file = open(self.filename, mode="w")
            self.logcount = 0
            self.items = []
        except Exception as e:
            raise RuntimeError(f"Failed to clear file. {e}")
        finally:
            file.close()
            self._lock.release()

    def add(self, item: DataItem) -> str:
        if 0 < self.max_logcount and self.max_logcount < len(self.items):
            print(f"Will not store more then {self.max_logcount} items")
            self.items.popleft() # remove first item to use at most the last '_max_logcount' items
        self.items.append(item)
        return None
    
    def get_last(self, count: int = None) -> list[DataItem]:
        if count:
            return self.items[-count:] # slice last 'count' number of items
        return self.items
    
    def get_between(self, start: datetime, end: datetime) -> list[DataItem]:
        result = []
        for item in self.items:
            if item.timestamp <= start or end <= item.timestamp < end:
                continue # skip, timestamp not inside interval
            result.append(item)
        return result
    
    def set_max_log_count(self, size: int):
        self.max_logcount = size
    
    def flush(self) -> str:
        lines = []
        try: # stringify items
            for item in self.items:
                dumped = json.dumps(item, default=DataItem.serialize)
                lines.append(dumped+"\n")
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Could not serialize JSON. {e}")
        except TypeError as e:
            raise RuntimeError(f"Could not serialize JSON. {e}")
        
        if 0 <  self.max_logcount and self.max_logcount < len(self.items):
            print(f"Will not store more then {self.max_logcount} items")
            lines = lines[-self.max_logcount:] # use at most the last '_max_logcount' items
        self._append_lines(lines)
        self.items = []
        return None
    
    """
    Private Methods:
    """

    def _read_lines(self) -> list[str]:
        # Create Locker For File Mutex:
        lock_obj = portalocker.Lock(self.filename, mode='r', timeout=5, flags=portalocker.LOCK_EX)
        try:
            file = lock_obj.acquire() # open file through locker
            return file.readlines()
        except FileNotFoundError as e:
            file = open(self.filename, mode="w") # create new file
            return [] # empty list
        except portalocker.LockException as e:
            RuntimeError(f"Failed to acquire lock while reading {self.filename}. {e}")
        except Exception as e:
            raise RuntimeError(f"Failed to read lines from {self.filename}. {e}")
        finally: # clean up
            lock_obj.release() # close file and release the lock

    def _append_lines(self, lines: list[str]):
        assert self.max_logcount == 0 or len(lines) <= self.max_logcount, f"Cannot append more then {self.max_logcount} lines"
        predicted_logcount = self.logcount + len(lines)
        if 0 < self.max_logcount and self.max_logcount < predicted_logcount: # file would be full, trim oldest logs
            lines_to_remove = predicted_logcount - int(self.max_logcount*0.9) # trimmed file should be 90% full
            temp_filename = str(self.filename) + ".temp"
            lock_obj = portalocker.Lock(self.filename, mode='r', timeout=5, flags=portalocker.LOCK_EX) # locker for file mutex
            try: # open original file
                file = lock_obj.acquire() # open file through locker
                for _ in range(lines_to_remove): # skip the first 'lines_to_remove' lines (the oldest one)
                    self.logcount -= 1
                    next(file, None) # iterate file object
                try: # open temporary file
                    temp = open(temp_filename, mode="w")
                    for line in file: # write remaining lines to temp file
                        temp.write(line)
                    for line in lines: # write new lines to temp file
                        self.logcount += 1
                        temp.write(line)
                except Exception as e:
                    raise RuntimeError(f"Could not copy files to temporary file. {e}")
                finally:
                    temp.flush()
                    temp.close()
            except Exception as e:
                raise RuntimeError(f"Failed to append lines to {self.filename}. {e}")
            except portalocker.LockException as e:
                RuntimeError(f"Failed to acquire lock while reading {self.filename}. {e}")
            else: # on success, replace original file with temporary file
                file.close() # close early
                time.sleep(0.1) # wait until file is closed
                os.replace(temp_filename, self.filename)
            finally: # cleanup original file
                lock_obj.release() # close file and release the lock
        else: # file will not be full, just append
            lock_obj = portalocker.Lock(self.filename, mode='r', timeout=5, flags=portalocker.LOCK_EX) # locker for file mutex
            try: # append to original file 
                file = lock_obj.acquire() # open file through locker
                file.writelines(lines) # no need to trim file, just append
                file.flush()
                self.logcount += len(lines)
            except Exception as e:
                raise RuntimeError(f"Failed to append lines: {e}")
            finally:
                lock_obj.release() # close file and release the lock
        
        # Check Linecount:
        expected_logcount = self.logcount
        actual_logcount = self._count_lines()
        assert expected_logcount == actual_logcount, f"Unexpected linecount {actual_logcount}. Expected {expected_logcount}."

    def _count_lines(self) -> int:
        lock_obj = portalocker.Lock(self.filename, mode='a', timeout=5, flags=portalocker.LOCK_EX) # locker for file mutex
        try:
            file = lock_obj.acquire() # open file through locker
            return sum(1 for _ in file)
        except FileNotFoundError as e:
            file = open(self.filename, mode="w") # create new file
            return 0
        except portalocker.LockException as e:
            RuntimeError(f"Failed to acquire lock while reading {self.filename}. {e}")
        finally:
            lock_obj.release() # close file and release the lock
