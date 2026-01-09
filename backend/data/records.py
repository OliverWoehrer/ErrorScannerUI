from __future__ import annotations
from abc import ABC, abstractmethod
from data import DataItem, Base, DataItemEntity
import json
from pathlib import Path
import portalocker
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import sessionmaker

class RecordsCollection(ABC):
    @abstractmethod
    def add(self, item: DataItem):
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
    def update(self, item: DataItem):
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
    def remove(self, id: str):
        """
        Removes the item with the same ID as the given item from this collection
        
        :param item: Item to remove
        :type item: DataItem
        :return: True on success or if no matching ID was found, False otherwise 
        :rtype: bool
        """
        pass

    @abstractmethod
    def clear(self):
        """
        Clear the entire data structure
        
        :return: Error message in case of an error. Otherwise this is 'None'
        :rtype: str
        """
        pass

    @abstractmethod
    def replace_storage(self, file_storage):
        """
        Replaces the entire database with the given file storage
        
        :param file_storage: Description
        :type file_storage: werkzeug.datastructures.file_storage.FileStorage
        """
        pass



class RecordsFile(RecordsCollection):
    def __init__(self, filename):
        assert isinstance(filename, str), "Given filename has to be of type 'str'"
        self.filename = Path(__file__).parent / filename

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

    def replace_storage(self, file_storage):
        lock_obj = portalocker.Lock(self.filename, mode='r', flags=portalocker.LOCK_EX) # locker for file mutex
        try:
            lock_obj.acquire() # acquire mutex access through locker
            file_storage.save(str(self.filename))
        except portalocker.LockException as e:
            raise RuntimeError(f"Failed to acquire lock for replacing {self.filename}. {e}")
        except Exception as e:
            raise RuntimeError(f"Failed to replace storage file. {e}")
        finally: # clean up
            lock_obj.release() # close file and release the lock

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



class RecordsSQL(RecordsCollection):
    """
    Implements the interface RecordsCollection to work with records data. It uses DataItemEntity,
    which is a model for SQLAlchemy ORM. By default uses SQLite in the local project directory (app.db).
    To move to server DB, just change the `db_url` you pass to __init__.
    SQLAlchemy URL. Examples:
    - "sqlite:///records.db"
    - "mysql+pymysql://user:pwd@host:3306/dbname"
    """

    def __init__(self, db_url: str | None = None, echo: bool = False, filename: str = "records.db"):
        """
        :param db_url: SQLAlchemy URL.
        :param echo: If True, SQLAlchemy logs SQL statements (debugging).
        :param filename: Used only when db_url is None for the SQLite file name.
        """
        if db_url is None:
            db_path = Path(__file__).parent / filename
            db_url = f"sqlite:///{db_path}"
            self.filename = db_path

        self.engine = create_engine(db_url, future=True, echo=echo)

        # SQLite pragmas (WAL, synchronous NORMAL, foreign_keys ON)
        if db_url.startswith("sqlite:///"):
            try:
                conn = self.engine.connect()
                conn.execute(text("PRAGMA journal_mode=DELETE;"))
                conn.execute(text("PRAGMA synchronous=NORMAL;"))
                conn.execute(text("PRAGMA foreign_keys=ON;"))
            finally:
                if conn:
                    conn.close()

        # Create the schema if not present
        try:
            Base.metadata.create_all(self.engine)
        except SQLAlchemyError as e:
            raise RuntimeError(f"Failed to create schema. {e}")

        # Session factory
        self.SessionLocal = sessionmaker(bind=self.engine, expire_on_commit=False, future=True)

    def add(self, item: DataItem):
        """
        Add the given item. Returns None on success, raises RuntimeError on failure.
        """
        try:
            entity = DataItemEntity.from_data_item(item)
            session = self.SessionLocal()
            session.add(entity)
            session.commit()
        except IntegrityError as e:
            # primary key conflict (duplicate id)
            if session:
                try:
                    session.rollback()
                except Exception:
                    pass
            raise RuntimeError(f"Item with ID {item.id} already exists. {e}")
        except SQLAlchemyError as e:
            if session:
                try:
                    session.rollback()
                except Exception:
                    pass
            raise RuntimeError(f"Failed to insert item {item.id}. {e}")
        finally: # cleanup
            if session:
                session.close()

    def get_items(self) -> list[DataItem]:
        try:
            session = self.SessionLocal()
            rows = session.query(DataItemEntity).all()
            return [row.to_data_item() for row in rows]
        except SQLAlchemyError as e:
            raise RuntimeError(f"Failed to read items. {e}") from e
        finally: # cleanup
            if session:
                session.close()

    def candidates(self, item: DataItem) -> list[DataItem]:
        try:
            session = self.SessionLocal()
            query_object = session.query(DataItemEntity)
            query_filter = query_object.filter(DataItemEntity.source == item.source, DataItemEntity.category == item.category)
            entities = query_filter.all()
            return [entity.to_data_item() for entity in entities]
        except SQLAlchemyError as e:
            raise RuntimeError(f"Failed to fetch candidates. {e}")
        finally: # cleanup
            if session:
                session.close()

    def update(self, item: DataItem):
        try:
            session = self.SessionLocal()
            entity = session.get(DataItemEntity, item.id)
            if entity is None:
                raise RuntimeError(f"No item found with ID {item.id}.")

            # Update fields
            entity.timestamp = item.timestamp
            entity.category = item.category
            entity.source = item.source
            entity.message = item.message or ""
            entity.solution = item.solution
            entity.searchkey = item.searchkey or ""

            session.commit()
        except SQLAlchemyError as e:
            if session:
                session.rollback()
            raise RuntimeError(f"Failed to update item {item.id}. {e}")
        finally: # cleanup
            if session:
                session.close()

    def remove(self, id: str):
        session = None
        try:
            session = self.SessionLocal()
            entity = session.get(DataItemEntity, id)
            if entity is None:
                raise RuntimeError(f"No item found with ID {id}.")
            session.delete(entity)
            session.commit()
        except SQLAlchemyError as e:
            if session:
                try:
                    session.rollback()
                except Exception:
                    pass
            raise RuntimeError(f"Failed to remove item {id}. {e}")
        finally:
            if session:
                session.close()

    def clear(self):
        session = None
        try:
            session = self.SessionLocal()
            session.query(DataItemEntity).delete()
            session.commit()
        except SQLAlchemyError as e:
            if session:
                try:
                    session.rollback()
                except Exception:
                    pass
            raise RuntimeError(f"Failed to clear records. {e}")
        finally:
            if session:
                session.close()

    def replace_storage(self, file_storage):
        try:
            self.engine.dispose() # close all active connections in the pool
            file_storage.save(str(self.filename)) # overwrite the .db file
            
            # 3. Optional: Re-run pragmas or schema check 
            # (The engine will automatically reconnect on the next query)
        except Exception as e:
            raise RuntimeError(f"Failed to replace SQL storage. {e}")

    """
    Private Methods
    """

    
