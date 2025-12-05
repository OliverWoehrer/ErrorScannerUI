from datetime import datetime
from difflib import SequenceMatcher
import json
import os
from pathlib import Path
import re
import threading
import time
from typing import Generator

class LogsRecordsItem:
    def __init__(self, timestamp: datetime = None, category: str = None, source : str = None, message: str = None, solution: str = None, searchkey: str = None, id: str = None):
        assert (not timestamp) or isinstance(timestamp, datetime), "'timestamp' has to by of time 'datetime'"
        self.timestamp = timestamp or datetime.now() # use current date as fallback
        self.category = category or "debug"
        self.source = source or ""
        self.message = message or ""
        self.solution = solution
        self.searchkey = searchkey or ""
        if id:
            self.id = id
        else: # use unsigned hash in HEX as ID if non given
            signed_hash = hash((self.timestamp,self.category,self.source,self.message,self.searchkey))
            masked = signed_hash & 0xFFFFFFFFFFFFFFFF # 64 bit mask
            self.id = f"{masked:016X}"

    def similarity_score(self, other) -> float:
        """
        Log items are considered similar if they are similar but not necessariliy the same. First
        they need to share their category and source. After that, the searchkey(s) are checked, if
        available. If no searchkeys are available, we compare how similar both messages are. If the
        similarity ratio is above the threshold, the messages are considered to be euqal.
        
        The searchkey was added by the human user and can be used to reliable search for in the
        'other' object's message. If a part of the 'other' message matched the searchkey of 'self'
        or vice versa, they are considered euqal. Assuming they have the same category and source!
    
        We need to compare the message text of 'self' with the message text of 'other', by aligning
        tokens using SequenceMatcher to find the longest static blocks (the skeleton). Any log
        message has static template blocks that are the same everytime and variable blocks that
        change with each error (e.g. timestamps, error message about user input, length of data).
        If the ratio of static tokens to total tokens is hight enough, the logs are considered
        euqal.
        """
        if not isinstance(other, LogsRecordsItem):
            return NotImplemented
        
        # Check Category and Source:
        if self.category != other.category:
            return 0.0
        if self.source != other.source:
            return 0.0
        
        # Check For Perfect Matching Messages:
        if self.message == other.message:
            return 1.0

        # Check With Searchkey:
        if self.searchkey:
            return self.searchkey in other.message # check is searchkey is part of other message
        if other.searchkey: # implement symmetry behavior
            return other.searchkey in self.message # check is searchkey is part of self message

        # Extract Tokens from Message Text:
        tokens1 = self._tokenize()
        tokens2 = other._tokenize()

        # Calculate Similarity Ratio:
        matcher = SequenceMatcher(None, tokens1, tokens2) 
        ratio = matcher.ratio() # gives the best measure of similarity

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
        
        return ratio

    def _tokenize(self) -> list[str]:
        """
        Splits the log message into tokens (words, numbers, and key punctuation) while preserving
        the order. This regex splits by any sequence of non-word/non-digit/non-space characters OR
        by spaces, but keeps the non-word/non-digit/non-space characters as tokens. It ensures that
        ':', '/', and '.' are separate tokens, which improves alignment.
        """
        return [token for token in re.split(r"(\s+)|([^\w\s]+)", self.message) if token and token.strip()]        
    
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
    
    def __str__(self):
        dictionary = str(self.__dict__) # export to dict and convert to string
        return f"#ID {self.id} \"{self.message[:100]}...\""

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
        self._filename = Path(__file__).parent / filename
        self._lock = threading.Lock() # mutex semaphore
        self._linecount = self._count_lines()
        self._max_linecount = 0

    def set_max_linecount(self, count: int):
        self._max_linecount = count

    def load_items(self) -> list[LogsRecordsItem]:
        lines = self._read_lines()
        items = []
        for line in lines:
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
                id = data.get("id", None)
                item = LogsRecordsItem(timestamp=timestamp, category=category, source=source, message=message, solution=solution, searchkey=searchkey, id=id)
                items.append(item)
        return items

    def store_items(self, items: list[LogsRecordsItem], append: bool = False):
        lines = []
        try: # stringify log record items
            for item in items:
                dumped = json.dumps(item, default=LogsRecordsItem.serialize)
                lines.append(dumped+"\n")
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Could not serialize JSON: {e}")
        except TypeError as e:
            raise RuntimeError(f"Could not serialize JSON: {e}")
        
        if len(items) > self._max_linecount and self._max_linecount > 0:
            print(f"Will not store more then {self._max_linecount} lines")
            lines = lines[-self._max_linecount:] # use at most the last '_max_linecount' items
        if append:
            self._append_lines(lines)
        else:
            self._write_lines(lines)

    def stream_lines(self) -> Generator[str,None,None]:
        yield from self._yield_lines()

    def stream_bytes(self) -> Generator[bytes,None,None]:
        yield from self._yield_bytes()

    def overwrite(self, file_storage):
        try:
            self._lock.acquire()
            file_storage.save(self._filename)
        except Exception as e:
            raise RuntimeError(f"Failed to overwrite {self._filename}.")
        finally:
            self._lock.release()

    """
    Private Methods
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

    def _yield_lines(self):
        try:
            self._lock.acquire()
            file = open(self._filename, mode="r")
            for line in file:
                try:
                    yield line + "\n"
                except TypeError as e:
                    print(f"Could not parse {line}. {e}.")
                    continue # skip this line
        except Exception as e:
            raise RuntimeError(f"Failed to yield lines: {e}")
        finally:
            file.close()
            self._lock.release()

    def _yield_bytes(self):
        try:
            self._lock.acquire()
            file = open(self._filename, mode="rb")
            for line in file:
                yield line
        except Exception as e:
            raise RuntimeError(f"Failed to yield bytes: {e}")
        finally:
            file.close()
            self._lock.release()

    def _write_lines(self, lines: list[str]):
        assert self._max_linecount == 0 or len(lines) <= self._max_linecount, f"Cannot write more then {self._max_linecount} lines"
        try:
            self._lock.acquire()
            file = open(self._filename, mode="w")
            file.writelines(lines)
            file.flush()
            self._linecount = len(lines)
        except Exception as e:
            raise RuntimeError(f"Failed to write lines: {e}")
        finally:
            file.close()
            self._lock.release()

    def _append_lines(self, lines: list[str]):
        assert self._max_linecount == 0 or len(lines) <= self._max_linecount, f"Cannot append more then {self._max_linecount} lines"
        predicted_linecount = self._linecount + len(lines)
        if predicted_linecount > self._max_linecount and self._max_linecount > 0: # file would be full, trim oldest logs
            temp_filename = str(self._filename) + ".temp"
            lines_to_remove = predicted_linecount - int(self._max_linecount*0.9) # trimmed file should be 90% full
            try: # open original file
                self._lock.acquire()
                file = open(self._filename, mode="r")
                for _ in range(lines_to_remove): # skip the first 'lines_to_remove' lines (the oldest one)
                    self._linecount -= 1
                    next(file, None) # iterate file object
                try: # open temporary file
                    temp = open(temp_filename, mode="w")
                    for line in file: # write remaining lines to temp file
                        temp.write(line)
                    for line in lines: # write new lines to temp file
                        self._linecount += 1
                        temp.write(line)
                    #TODO:self._linecount += len(lines)
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
                self._linecount += len(lines)
            except Exception as e:
                raise RuntimeError(f"Failed to append lines: {e}")
            finally:
                file.close()
                self._lock.release()
        
        # Check Linecount:
        expected_linecount = self._linecount
        actual_linecount = self._count_lines()
        assert expected_linecount == actual_linecount, f"Unexpected linecount {actual_linecount}. Expected {expected_linecount}."
        
    def _trim_lines(self, count: int) -> int:
        temp_filename = self._filename + ".temp"
        new_linecount = 0
        try: # open original file
            self._lock.acquire()
            file = open(self._filename, mode="r")
            for _ in range(count): # skip the firt 'count' lines (the oldest one)
                next(file, None) # iterate file object
            try: # open temporary file
                temp = open(temp_filename, mode="w")
                for line in file: # write remaining lines to temp file
                    new_linecount += 1
                    temp.write(line)
            except Exception as e:
                raise RuntimeError(f"Could not copy files to temporary file. {e}")
            finally:
                temp.close()
        except FileNotFoundError as e:
            raise RuntimeError(f"Could not trim {count} lines")
        else: # on success, replace original file with temporary file
            os.replace(temp_filename, self._filename)
            return new_linecount
        finally:
            file.close()
            self._lock.release()

    def _count_lines(self) -> int:
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
