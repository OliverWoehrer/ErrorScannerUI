from datetime import datetime
from difflib import SequenceMatcher
import json
from pathlib import Path
import re
import threading
from typing import Callable

class LogsRecordsItem:
    def __init__(self, timestamp: datetime = None, category: str = None, source : str = None, message: str = None, solution: str = None, searchkey: str = None):
        assert (not timestamp) or isinstance(timestamp, datetime), "'timestamp' has to by of time 'datetime'"
        self.timestamp = timestamp or datetime.now() # use current date as fallback
        self.category = category or "info"
        self.source = source or ""
        self.message = message or ""
        self.solution = solution
        self.searchkey = searchkey or ""
        signed_hash = hash((self.timestamp,self.category,self.source,self.message,self.searchkey))
        masked = signed_hash & 0xFFFFFFFFFFFFFFFF # 64 bit mask
        self.id = f"{masked:016X}" # use unsigned hash in HEX as ID

    def __eq__(self, other, threshold: float = 0.7):
        """
        Compares the message text of this with the given other log item by aligning tokens using
        SequenceMatcher to find the longest static blocks (the skeleton).
        Any log message has static template blocks that are the same everytime and variable blocks
        that change with each error (e.g. timestamps, error message about user input, length of
        data).
        
        If the ratio of static tokens to total tokens is hight enough, the logs are considered
        euqal.
        """
        if not isinstance(other, LogsRecordsItem):
            return NotImplemented
        
        # [INFO]
        # In a list comparision (e.g. if item in items), 'self' is the item already stored in the
        # list and 'other' is the target item. The searchkey was added by the human user and can be
        # used to reliable search for in the other object's message. If no searchkey is present, we
        # compute how similar both messages are. If the similarity ratio is above the threshold,
        # the messages are considered to be euqal.
        if self.searchkey:
            is_part = self.searchkey in other.message # check is searchkey is part of other message
            return is_part and (self.category == other.category) and (self.source == other.source)
        if other.searchkey: # implement symmetry behavior
            is_part = other.searchkey in self.message # check is searchkey is part of self message
            return is_part and (self.category == other.category) and (self.source == other.source)

        # Extract Tokens from Message Text:
        tokens1 = self._tokenize()
        tokens2 = other._tokenize()

        # Calculate Similarity Ratio:
        matcher = SequenceMatcher(None, tokens1, tokens2) 
        ratio = matcher.ratio() # gives the best measure of similarity
        is_similar = ratio > threshold # match is considered good

        if False: # debug
            # [INFO]
            # SequenceMatcher
            # Opcode format: (tag, start1, stop1, start2, stop2)
            # tag: 'equal', 'replace', 'insert', 'delete'
            # start1:stop2 are indices in tokens1, start2:stop2 are indices in tokens2
            PLACEHOLDER = "PLACEHOLDER"
            skeleton_tokens = []
            for tag, start1, stop1, start2, stop2 in matcher.get_opcodes():
                if tag == "equal": # static matching block, use tokens from the first log
                    skeleton_tokens.extend(tokens1[start1:stop1])
                elif tag in ('replace', 'insert', 'delete'): # variable block, add the placeholder
                    if not skeleton_tokens or skeleton_tokens[-1] != PLACEHOLDER:
                        skeleton_tokens.append(PLACEHOLDER)
                # Note: 'insert' and 'delete' would mean the logs have different numbers
                # of tokens, but they still represent a variable section in the skeleton.
            skeleton_string = " ".join(skeleton_tokens).strip() # reconstruct skeleton template
            print(f"Skeleton: {skeleton_string}\r\n")

        # Check if Important Properties are Equal:
        # TODO: check is searchkey is needed, added it to equality condition
        return is_similar and (self.category == other.category) and (self.source == other.source)
    
    # [INFO]
    # The methods __eq__ and __hash__ have to follow the Hash-Equality-Contract: If two objects are
    # considered equal (__eq__ returns True), they have to produce the same hash (same return value
    # for __hash__).
    # Two LogsRecordsItem objects are equal, if the most important properties (category, source and
    # searchkey) are equal and if their log messages are similar (but not nessecarily equal). Two
    # equal objects (__eq__ is True) have different hashes, if we consider the message for the
    # computation of their hash, because their messages are only similar but not equal. This
    # means messages cannot be use for the hash, because two equal objects would NOT produce the
    # same hash!
    # If we do not use the message in __hash__, but only category, source and searchkey, the hash
    # function is very weak because many items share these properties. The savest way to solve this
    # problem is to make LogsRecordsItem not hashable. This means it cannot be used in hash-based
    # data structures (dict or set). It can still be used in list comparisons, which is enough for
    # this usecase.
    __hash__ = None 
    
    def __str__(self):
        dictionary = str(self.__dict__) # export to dict and convert to string
        return f"[#ID {self.id}] | {self.source} {self.category} {self.message[:60]}"
    
    def _tokenize(self) -> list[str]:
        """
        Splits the log message into tokens (words, numbers, and key punctuation) while preserving
        the order. This regex splits by any sequence of non-word/non-digit/non-space characters OR
        by spaces, but keeps the non-word/non-digit/non-space characters as tokens. It ensures that
        ':', '/', and '.' are separate tokens, which improves alignment.
        """
        return [token for token in re.split(r"(\s+)|([^\w\s]+)", self.message) if token and token.strip()]
    
    @staticmethod
    def serialize(obj) -> dict:
        if not obj:
            raise TypeError(f"Could not serialize item is 'None'.")
        if not isinstance(obj, LogsRecordsItem):
            raise TypeError(f"Item has to be of type 'LogsRecordsItem'.")
        try:
            serialized = dict(obj.__dict__) # shallow copy to dict
            assert isinstance(obj.timestamp, datetime), "Property 'timestamp' has to be of type 'datetime'"
            serialized["timestamp"] = obj.timestamp.strftime("%Y-%m-%dT%H:%M:%S.%f") # format YYYY-MM-DDThh:mm:ss.ssssss
            return serialized # replaced 'null' values of non-default types
        except Exception as e:
            raise TypeError(f"Could not serialize item {obj.id}: {e}.")

    @staticmethod
    def parse(input: dict) -> dict:
        if not input:
            raise TypeError("Could not parse 'None'")
        datetime_string = input.get("timestamp", None)
        if not datetime_string:
            return input # no timestamp, no parsing needed, return as is
        try:
            input["timestamp"] = datetime.fromisoformat(datetime_string)
            return input
        except ValueError as e:
            raise TypeError(f"Invalid timestamp string '{datetime_string}': {e}")

class LogsRecordsHandler:
    def __init__(self, filename: str):
        assert isinstance(filename, str), "Given filename has to be of type 'str'"
        self.filename = Path(__file__).parent / filename
        self._lock = threading.Lock() # mutex semaphore

    def load_items(self) -> list[LogsRecordsItem]:
        try:
            self._lock.acquire()
            file = open(self.filename, mode="r")
            items = []
            for line in iter(file.readlines()):
                try:
                    data = json.loads(line, object_hook=LogsRecordsItem.parse)
                except TypeError as e:
                    print(f"Could not parse {line}. {e}.")
                    continue # skip this line
                else:
                    timestamp = data.get("timestamp",None)
                    category = data.get("category",None)
                    source = data.get("source",None)
                    message = data.get("message",None)
                    solution = data.get("solution",None)
                    searchkey = data.get("searchkey",None)
                    item = LogsRecordsItem(timestamp=timestamp, category=category, source=source, message=message, solution=solution, searchkey=searchkey)
                    items.append(item)
            return items
        except FileNotFoundError as e:
            file = open(self.filename, mode="w") # create new file
            return [] # empty list
        finally: # clean up
            file.close()
            self._lock.release()

    def store_items(self, items: list[LogsRecordsItem], append: bool = False):
        lines = []
        try:
            for item in items:
                dumped = json.dumps(item, default=LogsRecordsItem.serialize)
                lines.append(dumped+"\n")
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Could not serialize JSON: {e}")
        except TypeError as e:
            raise RuntimeError(f"Could not serialize JSON: {e}")
        
        try:
            self._lock.acquire()
            file = open(self.filename, mode=("a" if append else "w"))
            file.writelines(lines)
            file.flush()
        except FileNotFoundError as e:
            file = open(self.filename, mode="w") # create new file
            file.writelines(lines)
            file.flush()
        except Exception as e:
            raise RuntimeError(f"Failed to write items: {e}")
        finally:
            file.close()
            self._lock.release()
    
    def stream_lines(self):
        try:
            self._lock.acquire()
            file = open(self.filename, mode="r")
            for line in file:
                try:
                    yield line + "\n"
                except TypeError as e:
                    print(f"Could not parse {line}. {e}.")
                    continue # skip this line
        except FileNotFoundError as e:
            file = open(self.filename, mode="w") # create new file
        finally:
            file.close()
            self._lock.release()

    def parse_lines(self, parse_function: Callable[[str],None]):
        assert isinstance(parse_function, Callable), "parse function has to by of type 'Callable'"
        try:
            self._lock.acquire()
            file = open(self.filename, mode="r")
            for line in iter(file.readlines()):
                parse_function(line)
        except FileNotFoundError as e:
            file = open(self.filename, mode="w") # create new file
        finally:
            file.close()
            self._lock.release()
