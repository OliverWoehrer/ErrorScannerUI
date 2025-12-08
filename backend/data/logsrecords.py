from datetime import datetime
from difflib import SequenceMatcher
import json
import os
from pathlib import Path
import re
import threading
import time
from typing import Generator
from .data_item import DataItem

class LogsRecordsHandler:
    def __init__(self, filename: str):
        assert isinstance(filename, str), "Given filename has to be of type 'str'"
        self._filename = Path(__file__).parent / filename
        self._lock = threading.Lock() # mutex semaphore
        self._linecount = self._count_lines()
        self._max_linecount = 0

    def set_max_linecount(self, count: int):
        self._max_linecount = count

    def load_items(self) -> list[DataItem]:
        lines = self._read_lines()
        items = []
        for line in lines:
            try:
                data = json.loads(line, object_hook=DataItem.parse)
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
                item = DataItem(timestamp=timestamp, category=category, source=source, message=message, solution=solution, searchkey=searchkey, id=id)
                items.append(item)
        return items

    def store_items(self, items: list[DataItem], append: bool = False):
        lines = []
        try: # stringify log record items
            for item in items:
                dumped = json.dumps(item, default=DataItem.serialize)
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
