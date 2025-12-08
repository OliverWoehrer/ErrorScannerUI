from abc import ABC, abstractmethod
from collections import deque
from .data_item import DataItem
from datetime import datetime
import json
import os
from pathlib import Path
import threading
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
    def max_log_count(self, size: int):
        """
        Set the maximum cache size. If the size is set to zero, no limit is enforced and the
        collection uses as much space as need.
        
        :param size: Number of items to cache
        :type size: int
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
    def flush(self) -> str:
        """
        Write updated log items from memory to database
        """
        pass

class LogsFile(LogsCollection):
    def __init__(self, filename: str):
        assert isinstance(filename, str), "Given filename has to be of type 'str'"
        self._filename = Path(__file__).parent / filename
        self._lock = threading.Lock() # mutex semaphore
        self._logcount = self._count_lines()
        self._max_logcount = 0
        self._items = deque([])

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
                self._items.append(item)

    def clear(self) -> str:
        try:
            self._lock.acquire()
            file = open(self._filename, mode="w")
            self._logcount = 0
            self._items = []
        except Exception as e:
            raise RuntimeError(f"Failed to clear file. {e}")
        finally:
            file.close()
            self._lock.release()

    def max_log_count(self, size: int):
        self._max_logcount = size

    def add(self, item: DataItem) -> str:
        if 0 < self._max_logcount and self._max_logcount < len(self._items):
            print(f"Will not store more then {self._max_logcount} items")
            self._items.popleft() # remove first item to use at most the last '_max_logcount' items
        self._items.append(item)
        return None
    
    def get_last(self, count: int = None) -> list[DataItem]:
        if count:
            return self._items[-count:] # slice last 'count' number of items
        return self._items
    
    def get_between(self, start: datetime, end: datetime) -> list[DataItem]:
        result = []
        for item in self._items:
            if item.timestamp <= start or end <= item.timestamp < end:
                continue # skip, timestamp not inside interval
            result.append(item)
        return result
    
    def flush(self) -> str:
        lines = []
        try: # stringify items
            for item in self._items:
                dumped = json.dumps(item, default=DataItem.serialize)
                lines.append(dumped+"\n")
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Could not serialize JSON. {e}")
        except TypeError as e:
            raise RuntimeError(f"Could not serialize JSON. {e}")
        
        if 0 <  self._max_logcount and self._max_logcount < len(self._items):
            print(f"Will not store more then {self._max_logcount} items")
            lines = lines[-self._max_logcount:] # use at most the last '_max_logcount' items
        self._append_lines(lines)
        self._items = []
        return None
    
    """
    Private Methods:
    """

    def _read_lines(self) -> list[str]:
        try:
            self._lock.acquire()
            file = open(self._filename, mode="r")
            return file.readlines()
        except FileNotFoundError as e:
            file = open(self._filename, mode="w") # create new file
            return [] # empty list
        except Exception as e:
            raise RuntimeError(f"Failed to read lines: {e}")
        finally: # clean up
            file.close()
            self._lock.release()

    def _append_lines(self, lines: list[str]):
        assert self._max_logcount == 0 or len(lines) <= self._max_logcount, f"Cannot append more then {self._max_logcount} lines"
        predicted_logcount = self._logcount + len(lines)
        if 0 < self._max_logcount and self._max_logcount < predicted_logcount: # file would be full, trim oldest logs
            lines_to_remove = predicted_logcount - int(self._max_logcount*0.9) # trimmed file should be 90% full
            temp_filename = str(self._filename) + ".temp"
            try: # open original file
                self._lock.acquire()
                file = open(self._filename, mode="r")
                for _ in range(lines_to_remove): # skip the first 'lines_to_remove' lines (the oldest one)
                    self._logcount -= 1
                    next(file, None) # iterate file object
                try: # open temporary file
                    temp = open(temp_filename, mode="w")
                    for line in file: # write remaining lines to temp file
                        temp.write(line)
                    for line in lines: # write new lines to temp file
                        self._logcount += 1
                        temp.write(line)
                except Exception as e:
                    raise RuntimeError(f"Could not copy files to temporary file. {e}")
                finally:
                    temp.flush()
                    temp.close()
            except Exception as e:
                raise RuntimeError(f"Failed to append lines: {e}")
            else: # on success, replace original file with temporary file
                file.close() # close early
                time.sleep(0.1) # wait until file is closed
                os.replace(temp_filename, self._filename)
            finally: # cleanup original file
                file.close()
                self._lock.release()
        else: # file will not be full, just append
            try: # append to original file 
                self._lock.acquire()
                file = open(self._filename, mode="a")
                file.writelines(lines) # no need to trim file, just append
                file.flush()
                self._logcount += len(lines)
            except Exception as e:
                raise RuntimeError(f"Failed to append lines: {e}")
            finally:
                file.close()
                self._lock.release()
        
        # Check Linecount:
        expected_logcount = self._logcount
        actual_logcount = self._count_lines()
        assert expected_logcount == actual_logcount, f"Unexpected linecount {actual_logcount}. Expected {expected_logcount}."
    
    def _trim_lines(self, count: int):
        temp_filename = str(self._filename) + ".temp"
        try: # open original file
            self._lock.acquire()
            file = open(self._filename, mode="r")
            for _ in range(count): # skip the first 'count' lines (the oldest ones)
                self._logcount -= 1
                next(file, None) # iterate file object
            try: # open temporary file
                temp = open(temp_filename, mode="w")
                for line in file: # write remaining lines to temp file
                    temp.write(line)
            except Exception as e:
                raise RuntimeError(f"Could not copy lines to temporary file. {e}")
            finally:
                temp.flush()
                temp.close()
        except Exception as e:
            raise RuntimeError(f"Failed to trim lines. {e}")
        else: # on success, replace original file with temporary file
            file.close() # close early
            time.sleep(0.1) # wait until file is closed
            os.replace(temp_filename, self._filename)
        finally: # cleanup original file
            file.close()
            self._lock.release()

    def _count_lines(self) -> int:
        time.sleep(0.1) # wait until file is closed
        try:
            self._lock.acquire()
            file = open(self._filename, mode="r")
            return sum(1 for _ in file)
        except FileNotFoundError as e:
            file = open(self._filename, mode="w") # create new file
            return 0
        finally:
            file.close()
            self._lock.release()
