from abc import ABC, abstractmethod
from .data_item import DataItem
from datetime import datetime
import json
from pathlib import Path
import portalocker

class RecordsCollection(ABC):
    @abstractmethod
    def load(self) -> str:
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
        :return: True on success, false otherwise
        :rtype: bool
        """
        pass

    @abstractmethod
    def get_items(self) -> list[DataItem]:
        """
        Return a list of all records
        
        :return: List of all records
        :rtype: list[DataItem]
        """
        pass

    @abstractmethod
    def candidates(self, item: DataItem) -> list[DataItem]:
        """
        Tries to find a record in this collection that is similar to the given item. It looks for
        records that share the source and category. These are possible candidates and worth to
        further check.
        
        :param item: Item to find candidates for
        :type item: DataItem
        :return: List of candidates that are possibly similar 
        :rtype: list[DataItem]
        """
        pass

    @abstractmethod
    def update(self, item: DataItem) -> str:
        """
        Updates the item with the same ID with the given item. It uses the ID of the given item
        to find the exsiting item and replaces it. This is helpfull if multiple properties
        changed and this data structure needs to be resorted.
        
        :param item: New item with the same ID as the old one
        :type item: DataItem
        :return: Error message on failure, 'None' on success
        :rtype: str
        """
        pass

    @abstractmethod
    def remove(self, item: DataItem) -> str:
        """
        Removes the item with the same ID as the given item from this collection
        
        :param item: Item to remove
        :type item: DataItem
        :return: True on success or if no matching ID was found, False otherwise 
        :rtype: bool
        """
        pass

    @abstractmethod
    def flush(self) -> str:
        """
        Write updated log items from memory to database
        """
        pass

class RecordsFile(RecordsCollection):
    def __init__(self, filename):
        assert isinstance(filename, str), "Given filename has to be of type 'str'"
        self.filename = Path(__file__).parent / filename
        self.records: dict[str, DataItem] = {} # maps IDs to items
        self.buckets: dict[tuple[str, str], dict[str, DataItem]] = {} # sorts items by source and category
    
    def load(self) -> str:
        lines = self._read_lines()
        for line in lines:
            try:
                item = json.loads(line, object_hook=DataItem.parse)
            except TypeError as e:
                print(f"Could not parse {line}. {e}.")
                continue # skip this line
            except json.decoder.JSONDecodeError as e:
                print(f"Could not parse {line}. {e}.")
                continue # skip this line
            else:
                self.add(item)
        return None

    def clear(self) -> str:
        self._write_lines([])
        self.records = {}
        self.buckets = {}
        return None

    def add(self, item: DataItem) -> str:
        if item.id in self.records:
            return f"Item with ID {item.id} already in collection"
        self.records[item.id] = item
        bucket = self._get_bucket(item)
        bucket[item.id] = item
        return None

    def get_items(self) -> list[DataItem]:
        return self.records.values()

    def candidates(self, item: DataItem) -> list[DataItem]:
        bucket = self._get_bucket(item)
        return bucket.values()

    def update(self, item: DataItem) -> str:
        old_item = self.records.get(item.id)
        if not old_item:
            return f"No item found with ID {item.id}."
        result = self.remove(old_item)
        if result:
            return f"Failed to remove old item {old_item.id}. {result}"
        result = self.add(item)
        if result:
            return f"Failed to add new item {item.id}. {result}"

    def remove(self, item: DataItem) -> str:
        # Remove From ID Map:
        if item.id not in self.records:
            return f"No item found with ID {item.id}."
        self.records.pop(item.id)

        # Remove From Bucket:
        bucket = self._get_bucket(item)
        assert item.id in bucket, f"Expected #{item.id} to be in bucket [{item.source}/{item.category}]."
        if item.id not in bucket:
            return f"No item found with ID {item.id}."
        bucket.pop(item.id)

        # Return None on Success:
        return None
        
    def flush(self) -> str:
        lines = []
        try: # stringify log record items
            for record in self.records.values():
                dumped = json.dumps(record, default=DataItem.serialize)
                lines.append(dumped+"\n")
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Could not serialize JSON: {e}")
        except TypeError as e:
            raise RuntimeError(f"Could not serialize JSON: {e}")
        else:
            self._write_lines(lines)

    """
    Private Methods
    """

    def _get_bucket(self, item: DataItem) -> list[DataItem]:
        key = (item.source,item.category)
        return self.buckets.setdefault(key, {}) # create empty dict as fallback

    def _read_lines(self) -> list[str]:
        lock_obj = portalocker.Lock(self.filename, mode='r', flags=portalocker.LOCK_EX) # locker for file mutex
        try:
            file = lock_obj.acquire() # open file through locker
            return file.readlines()
        except FileNotFoundError as e:
            file = open(self.filename, mode="w") # create new file
            return [] # empty list
        except portalocker.LockException as e:
            RuntimeError(f"Failed to acquire lock while reading {self.filename}. {e}")
        except Exception as e:
            raise RuntimeError(f"Failed to read lines. {e}")
        finally: # clean up
            lock_obj.release() # close file and release the lock

    def _write_lines(self, lines: list[str]):
        lock_obj = portalocker.Lock(self.filename, mode='w', flags=portalocker.LOCK_EX) # locker for file mutex
        try:
            file = lock_obj.acquire() # open file through locker
            file.writelines(lines)
            file.flush()
        except portalocker.LockException as e:
            RuntimeError(f"Failed to acquire lock while writing {self.filename}. {e}")
        except Exception as e:
            raise RuntimeError(f"Failed to write lines. {e}")
        finally:
            lock_obj.release() # close file and release the lock
