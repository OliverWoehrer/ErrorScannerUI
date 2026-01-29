from __future__ import annotations
from abc import ABC, abstractmethod
from data import DataItem, Base, DataItemEntity
from datetime import datetime
import json
import os
from pathlib import Path
import portalocker
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import sessionmaker
import time


class LogsCollection(ABC):
    @abstractmethod
    def add(self, item: DataItem):
        """
        Add the new given item to this collection.
        
        :param item: Data item to add to this collection
        :type item: DataItem
        """
        pass

    @abstractmethod
    def get_last(self, count: int) -> list[DataItem]:
        """
        Fetches the last 'count' data items from this collection
        
        :param count: Number of items to return
        :type count: int
        :return: List of data items
        :rtype: list[DataItem]
        """
        pass

    @abstractmethod
    def get_between(self, start: datetime, end: datetime) -> list[DataItem]:
        """
        Returns all log items between the given start and end date. Log items with the same date
        as start or end are NOT included. Return items with start < timestamp < end (exclusive).
        
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
        Set the maximum number of logs items to keep. If the size is set to zero, no limit is enforced and the
        collection uses as much space as available.
        
        :param size: Number of items to cache
        :type size: int
        """
        pass

    @abstractmethod
    def clear(self):
        """
        Clear the entire data structure
        """
        pass



class LogsFile(LogsCollection):
    def __init__(self, filename: str):
        assert isinstance(filename, str), "Given filename has to be of type 'str'"
        self.filename = Path(__file__).parent / filename
        self.logcount = 0
        self.max_logcount = 0

    def add(self, item: DataItem) -> str:
        predicted_logcount = self.logcount + 1
        if 0 < self.max_logcount and self.max_logcount < predicted_logcount:
            print(f"Cannot store more then {self.max_logcount} items. Trimming logs file.")
            lines_to_remove = predicted_logcount - int(self.max_logcount*0.9) # trimmed file should be 90% full
            self._trim_lines(lines_to_remove)
        self.items.append(item)
        self.logcount += 1
    
    def get_last(self, count: int = 0) -> list[DataItem]:
        items: list[DataItem] = []
        lines = self._read_lines()
        for line in lines:
            item = self._line_to_item(line)
            items.append(item)
        return items[-count:] # slice last 'count' number of items
    
    def get_between(self, start: datetime, stop: datetime) -> list[DataItem]:
        items: list[DataItem] = []
        lines = self._read_lines()
        for line in lines:
            item = self._line_to_item(line)
            if item.timestamp <= start or stop <= item.timestamp:
                continue # skip, timestamp not inside interval
            items.append(item)
        return items
    
    def set_max_log_count(self, size: int):
        self.max_logcount = size
    
    def clear(self) -> str:
        self._write_lines([])

    """
    Private Methods:
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

    def _trim_lines(self, count: int):
        # copy all but the first 'count' lines into a temporary files
        # delete the original file and rename the temporary file
        temp_filename = str(self.filename) + ".temp"
        lock_obj = portalocker.Lock(self.filename, mode='r', flags=portalocker.LOCK_EX) # locker for file mutex
        try: # open original file
            file = lock_obj.acquire() # open file through locker
            for _ in range(count): # skip the first 'count' lines
                next(file, None) # iterate file object
            try: # open temporary file
                self.logcount = 0
                temp = open(temp_filename, mode="w")
                for line in file: # write remaining lines to temp file
                    temp.write(line)
                    self.logcount += 1
            except Exception as e:
                raise RuntimeError(f"Could not copy files to temporary file. {e}")
            finally:
                temp.flush()
                temp.close()
        except Exception as e:
            raise RuntimeError(f"Failed to trim lines in {self.filename}. {e}")
        except portalocker.LockException as e:
            RuntimeError(f"Failed to acquire lock while reading {self.filename}. {e}")
        else: # on success, replace original file with temporary file
            file.close() # close early
            time.sleep(0.1) # wait until file is closed
            os.replace(temp_filename, self.filename)
        finally: # cleanup original file
            lock_obj.release() # close file and release the lock




class LogsSQL(LogsCollection, ABC):
    """
    SQLAlchemy ORM-backed LogsCollection.

    Defaults to a SQLite DB file 'logs.db' next to this module.
    Change `db_url` to migrate to Postgres/MySQL with minimal code changes.
    """

    def __init__(self, db_url: str | None = None, echo: bool = False, filename: str = "logs.db"):
        if db_url is None:
            db_path = Path(__file__).parent / filename
            db_url = f"sqlite:///{db_path}"
            self.filename = db_path

        self.engine = create_engine(db_url, future=True, echo=echo)

        # Optional: tune SQLite behavior (see notes below)
        if db_url.startswith("sqlite:///"):
            conn = None
            try:
                conn = self.engine.connect()
                conn.execute(text("PRAGMA journal_mode=DELETE;"))
                conn.execute(text("PRAGMA synchronous=NORMAL;"))
                conn.execute(text("PRAGMA foreign_keys=ON;"))
            finally:
                if conn is not None:
                    conn.close()

        # Create tables if they don't exist
        try:
            Base.metadata.create_all(self.engine)
        except SQLAlchemyError as e:
            raise RuntimeError(f"Failed to create schema. {e}") from None

        self.SessionLocal = sessionmaker(bind=self.engine, expire_on_commit=False, future=True)

        # Retention configuration (0 => no limit)
        self.max_logcount: int = 0

    def add(self, item: DataItem):
        session = None
        try:
            session = self.SessionLocal()

            # Retention: only if a limit is configured
            if self.max_logcount > 0:
                current = session.query(DataItemEntity).count()
                predicted = current + 1
                if predicted > self.max_logcount:
                    # Trim so that the table ends up ~90% full
                    to_remove = predicted - int(self.max_logcount * 0.9)
                    if to_remove > 0:
                        # Delete the oldest 'to_remove' rows by timestamp
                        queriedEntities = session.query(DataItemEntity.id)
                        orderedEntities = queriedEntities.order_by(DataItemEntity.timestamp.asc())
                        trimmedEntities = orderedEntities.limit(to_remove)
                        oldest_ids = [entity.id for entity in trimmedEntities]
                        if oldest_ids:
                            queriedEntities = session.query(DataItemEntity)
                            filteredEntities = queriedEntities.filter(DataItemEntity.id.in_(oldest_ids))
                            filteredEntities.delete(synchronize_session=False)

            # Insert the new item
            entity = DataItemEntity.from_data_item(item)
            session.add(entity)
            session.commit()
        except IntegrityError as e:
            if session is not None:
                try:
                    session.rollback()
                except Exception:
                    pass
            raise RuntimeError(f"Item with ID {item.id} already exists. {e}") from None
        except SQLAlchemyError as e:
            if session is not None:
                try:
                    session.rollback()
                except Exception:
                    pass
            raise RuntimeError(f"Failed to insert log item {item.id}. {e}") from None
        finally:
            if session is not None:
                session.close()

    def get_last(self, count: int = 0) -> list[DataItem]:
        if count < 0:
            return []

        try: # fetch latest N in DESC order, then reverse to return ascending
            session = self.SessionLocal()
            queriedEntities = session.query(DataItemEntity)
            orderedEntities = queriedEntities.order_by(DataItemEntity.timestamp.desc())
            trimmedEntities = orderedEntities.limit(count)
            rows_desc = trimmedEntities.all()
            rows_asc = list(reversed(rows_desc))
            return [row.to_data_item() for row in rows_asc]
        except SQLAlchemyError as e:
            raise RuntimeError(f"Failed to read last {count} log items. {e}") from None
        finally:
            if session is not None:
                session.close()

    def get_between(self, start: datetime, end: datetime) -> list[DataItem]:
        session = None
        try:
            session = self.SessionLocal()
            queriedEntities = session.query(DataItemEntity)
            filteredEntities = queriedEntities.filter(start < DataItemEntity.timestamp, DataItemEntity.timestamp < end)
            orderedEntities = filteredEntities.order_by(DataItemEntity.timestamp.asc())
            rows = orderedEntities.all()
            return [row.to_data_item() for row in rows]
        except SQLAlchemyError as e:
            raise RuntimeError(f"Failed to read logs between {start} and {end}. {e}") from None
        finally:
            if session is not None:
                session.close()

    def set_max_log_count(self, size: int):
        self.max_logcount = int(size or 0)

    def clear(self):
        try:
            session = self.SessionLocal()
            session.query(DataItemEntity).delete()
            session.commit()
        except SQLAlchemyError as e:
            if session is not None:
                try:
                    session.rollback()
                except Exception:
                    pass
            raise RuntimeError(f"Failed to clear logs. {e}") from None
        finally:
            if session is not None:
                session.close()