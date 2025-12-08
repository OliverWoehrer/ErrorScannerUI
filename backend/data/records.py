from abc import ABC, abstractmethod
from .data_item import DataItem
from datetime import datetime
import json
from pathlib import Path
import threading

class RecordsCollection(ABC):
    @abstractmethod
    def load():
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
    def find(self, item: DataItem) -> tuple[str,float]:
        """
        Tries to find a record in this collection that is similar to the given item. It looks for
        similarities in the properties of items and returns the ID of the best match along with its
        similarity score.
        A similarity score of 0.0 means no record shares properties with the given item. The
        returned ID is undefined. A similarity score of 1.0 means a perfect match was found.
        
        :param item: Item to find a matching record
        :type item: DataItem
        :return: Tuple of the best match along with its corresponding similarity score
        :rtype: tuple[DataItem,float]
        """
        pass

    @abstractmethod
    def replace(self, id: str, item: DataItem) -> str:
        """
        Looks for the item with the given ID and updates all its properties using the values from
        the given item.
        
        :param id: ID of the item to update
        :type id: str
        :param item: Item with new updates values
        :type item: DataItem
        :return: True on success, false otherwise
        :rtype: bool
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
        self._filename = Path(__file__).parent / filename
        self._lock = threading.Lock() # mutex semaphore
        self._records = {}
        # [INFO]
        # The '_records' dictionary structures the record items based on their source and category.
        # It follows the hierachy Source --> Category --> IDs. Here is an example:
        #   "Source1": {
        #       "critical": {
        #           "A35BCD": {...},
        #           "98D881": {...},
        #       },
        #       "error": {
        #           "38F6C3": {...}
        #       },
        #       ...
        #   },
        #   "Source2": {
        #       "critical": {
        #           "BC442D": {...},
        #           "883982": {...},
        #       },
        #       "error": {
        #           "9ABDFC": {...}
        #       },
        #       ...
        #   }

    def load(self):
        try:
            self._lock.acquire()
            file = open(self._filename, mode="r")
            try:
                self._records = json.load(file, object_hook=DataItem.parse)
            except TypeError as e:
                print(f"Could not parse JSON. {e}")
                self._records = {} # empty dict
        except FileNotFoundError as e:
            file = open(self._filename, mode="w") # create new file
            self._records = {} # empty dict
            json.dump(self._records, file)
        except Exception as e:
            raise RuntimeError(f"Failed to read JSON. {e}")
        finally: # clean up
            file.close()
            self._lock.release()

    def clear(self) -> str:
        self._records = {}
        self.flush()

    def add(self, item: DataItem) -> str:
        source_records = self._records.setdefault(item.source, {})
        category_records = source_records.setdefault(item.category, {})
        if item.id in category_records:
            return f"Record with ID {item.id} already present ({category_records[item.id]})"
        category_records[item.id] = item
        return None

    def get_items(self) -> list[DataItem]:
        items = []
        # Iterate All Record Items:
        for source_records in self._records.values():
            for category_records in source_records.values():
                for record_item in category_records.values():
                    items.append(record_item)
        return items

    def find(self, item: DataItem) -> tuple[DataItem,float]:
        source_records = self._records.get(item.source, {})
        if not source_records:
            return None, 0.0 # no record from the same source
        category_records = source_records.get(item.category, {})
        if not category_records:
            return None, 0.0 # no record with the same category
        
        best_score = 0.0
        best_match = None
        for record_item in category_records.values():
            score = item.similarity_score(record_item)
            if score > best_score:
                best_score = score
                best_match = record_item
            if best_score == 1.0:
                break # found perfect match, skip rest of loop
        return best_match, best_score

    def replace(self, id: str, item: DataItem) -> str:
        # Iterate All Record Items:
        for source, source_records in self._records.items():
            for category, category_records in source_records.items():
                for record_id, record_item in category_records.items():
                    if id == record_id: # check ID
                        self.remove(record_item)
                        self.add(item)

    def remove(self, item: DataItem) -> str:
        source_records = self._records.get(item.source, {})
        if not source_records:
            return None # could not remove, no record from the same source
        category_records = source_records.get(item.category, {})
        if not category_records:
            return None # could not remove, no record with the same category
        if item.id not in category_records:
            return None # could not remove, no matching ID found
        del category_records[item.id]
        return None

    def flush(self) -> str:
        try:
            self._lock.acquire()
            file = open(self._filename, mode="w")
            try:
                json.dump(self._records, file, indent=4, default=DataItem.serialize)
            except json.JSONDecodeError as e:
                raise RuntimeError(f"Could not serialize JSON. {e}")
            except TypeError as e:
                raise RuntimeError(f"Could not serialize JSON. {e}")
        except FileNotFoundError as e:
            file = open(self._filename, mode="w") # create new file
        except Exception as e:
            raise RuntimeError(f"Failed to write JSON. {e}")
        finally: # clean up
            file.close()
            self._lock.release()
