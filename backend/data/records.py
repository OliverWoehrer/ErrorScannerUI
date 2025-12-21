from abc import ABC, abstractmethod
from .data_item import DataItem
from datetime import datetime
import json
from pathlib import Path
import portalocker

class RecordsCollection(ABC):
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
    def remove(self, id: str) -> str:
        """
        Removes the item with the same ID as the given item from this collection
        
        :param item: Item to remove
        :type item: DataItem
        :return: True on success or if no matching ID was found, False otherwise 
        :rtype: bool
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

class RecordsFile(RecordsCollection):
    def __init__(self, filename):
        assert isinstance(filename, str), "Given filename has to be of type 'str'"
        self.filename = Path(__file__).parent / filename
        self.records: dict[str, DataItem] = {} # maps IDs to items
        self.buckets: dict[tuple[str, str], dict[str, DataItem]] = {} # sorts items by source and category

    def add(self, item: DataItem):
        line = None
        try:
            line = self._item_to_line(item)
        except RuntimeError as e:
            raise RuntimeError(f"Failed to stringify item {item.id}. {e}")
        try:
            self._append_lines([line])
        except RuntimeError as e:
            raise RuntimeError(f"Failed to update data file. {e}")

    def get_items(self) -> list[DataItem]:
        lines = []
        try:
            lines = self._read_lines()
        except RuntimeError as e:
            raise RuntimeError(f"Failed to read lines from data file. {e}")
        items = []
        for line in lines:
            try:
                item = self._line_to_item(line)
            except RuntimeError as e:
                raise RuntimeError(f"Failed to parse item from string \"{line}\". {e}")
            else:
                items.append(item)
        return items

    def candidates(self, item: DataItem) -> list[DataItem]:
        records = []
        try:
            records = self.get_items()
        except RuntimeError as e:
            raise RuntimeError(f"Failed to fetch items from data file. {e}")
        candidates = []
        for record in records:
            if record.source == item.source and record.category == item.category:
                candidates.append(record)
        return candidates

    def update(self, item: DataItem) -> str:
        # Stringify Item:
        new_line = None
        try:
            new_line = self._item_to_line(item)
        except RuntimeError as e:
            raise RuntimeError(f"Failed to stringify item {item.id}. {e}")
        
        # Fetch Lines:
        lines = []
        try:
            lines = self._read_lines()
        except RuntimeError as e:
            raise RuntimeError(f"Failed to read lines from data file. {e}")

        # Update Line:
        updated = False
        for line in lines:
            if item.id not in line:
                continue
            lines.remove(line) # remove old item
            lines.append(new_line) # add new item to the end
            updated = True
            break
        if not updated:
            raise RuntimeError(f"No item found with ID {item.id}")
        
        # Confirm Changes:
        try:
            self._write_lines(lines)
        except RuntimeError as e:
            raise RuntimeError(f"Failed to confirm changes to data file. {e}")

    def remove(self, id: str) -> str:
        # Fetch Lines:
        lines = []
        try:
            lines = self._read_lines()
        except RuntimeError as e:
            raise RuntimeError(f"Failed to read lines from data file. {e}")

        # Remove Line:
        removed = False
        for line in lines:
            if id not in line:
                continue
            lines.remove(line) # remove old item
            removed = True
            break
        if not removed:
            raise RuntimeError(f"No item found with ID {id}")
        
        # Confirm Changes:
        try:
            self._write_lines(lines)
        except RuntimeError as e:
            raise RuntimeError(f"Failed to confirm changes to data file. {e}")

    def clear(self):
        self._write_lines([])

    """
    Private Methods
    """

    def _line_to_item(self, line: str) -> DataItem:
        try:
            return json.loads(line, object_hook=DataItem.parse)
        except TypeError as e:
            RuntimeError(f"Could not parse \"{line}\". {e}.")
        except json.decoder.JSONDecodeError as e:
            RuntimeError(f"Could not parse \"{line}\". {e}.")
    
    def _item_to_line(self, item: DataItem) -> str:
        try:
            dumped = json.dumps(item, default=DataItem.serialize)
            return dumped+"\n" # add new line
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Could not serialize item. {e}")
        except TypeError as e:
            raise RuntimeError(f"Could not serialize item. {e}")

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

    def _append_lines(self, lines: list[str]):
        lock_obj = portalocker.Lock(self.filename, mode='a', flags=portalocker.LOCK_EX) # locker for file mutex
        try:
            file = lock_obj.acquire() # open file through locker
            file.writelines(lines)
            file.flush()
        except portalocker.LockException as e:
            RuntimeError(f"Failed to acquire lock while appending {self.filename}. {e}")
        except Exception as e:
            raise RuntimeError(f"Failed to append lines. {e}")
        finally:
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
