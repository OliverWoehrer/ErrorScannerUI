from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, Index
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from typing import Optional

# -----------------------------------------
# Data Item
# -----------------------------------------
class DataItem:
    def __init__(self, timestamp: datetime = None, category: str = None, source : str = None, message: str = None, solution: str = None, matchpattern: str = None, id: str = None):
        assert (not timestamp) or isinstance(timestamp, datetime), "'timestamp' has to by of time 'datetime'"
        self.timestamp = timestamp or datetime.now() # use current date as fallback
        self.category = category or "critical"
        self.source = source or ""
        self.message = message or ""
        self.solution = solution
        self.matchpattern = matchpattern or ""
        if id:
            self.id = id
        else: # use unsigned hash in HEX as ID if non given
            signed_hash = hash((self.timestamp,self.category,self.source,self.message,self.matchpattern))
            masked = signed_hash & 0xFFFFFFFFFFFFFFFF # 64 bit mask
            self.id = f"{masked:016X}"   
    
    def __str__(self):
        dictionary = str(self.__dict__) # export to dict and convert to string
        return f"#ID {self.id} \"{self.message[:100]}...\""

    @staticmethod
    def serialize(obj) -> dict:
        """
        Converts the given object into a python dictionary, which can be easily converted into a
        JSON string.
        
        :param obj: Object to be converted to dictionary. Has to be of type DataItem
        :return: Properties of the given DataItem as a dictionary
        :rtype: dict
        """
        if not obj:
            raise TypeError(f"Could not serialize item is 'None'.")
        if not isinstance(obj, DataItem):
            raise TypeError(f"Item has to be of type 'DataItem'.")
        try:
            serialized = dict(obj.__dict__) # shallow copy to dict
            assert isinstance(obj.timestamp, datetime), "Property 'timestamp' has to be of type 'datetime'"
            serialized["timestamp"] = obj.timestamp.strftime("%Y-%m-%dT%H:%M:%S.%fZ") # format YYYY-MM-DDThh:mm:ss.ssssssZ
            return serialized # replaced 'null' values of non-default types
        except Exception as e:
            raise TypeError(f"Could not serialize item {obj.id}: {e}.")

    @staticmethod
    def parse(input: dict):
        """
        Convert the given dictionary into a DataItem object. Its properties are used to build a new
        object, which is returned. In case properties are missing or cannot be parsed, a TypeError
        is raised.
        
        :param input: Dictionary with properties of DataItem
        :type input: dict
        :return: Newly parsed DataItem
        :rtype: DataItem
        """
        if not input:
            raise TypeError("Could not parse 'None'")

        # Parse Mandatory Properties:
        if "timestamp" not in input:
            raise TypeError(f"Could not parse 'timestamp' from {input}.")
        timestamp = None
        try: 
            timestamp = datetime.fromisoformat(input["timestamp"]) # parse timestamp
        except ValueError as e:
            raise TypeError(f"Invalid timestamp string '{input['timestamp']}'. {e}")
        if "category" not in input:
            raise TypeError(f"Could not parse 'category' from {input}.")
        category = input["category"]
        if "source" not in input:
            raise TypeError(f"Could not parse 'source' from {input}.")
        source = input["source"]
        if "id" not in input:
            raise TypeError(f"Could not parse 'id' from {input}.")
        id = input["id"]

        # Try to Parse Optional Properties:
        message = input.get("message",None)
        solution = input.get("solution",None)
        matchpattern = input.get("matchpattern",None)
        
        # Create New Data Item:
        return DataItem(timestamp,category,source,message,solution,matchpattern,id)



# -----------------------------------------
# SQLAlchemy base & ORM entity
# -----------------------------------------
class Base(DeclarativeBase):
    pass

class DataItemEntity(Base):
    id: Mapped[str] = mapped_column(String(32), primary_key=True)  # 16-char uppercase hex string
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False, default="critical")
    source: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    message: Mapped[str] = mapped_column(Text, nullable=False, default="")
    solution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    matchpattern: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default="")

    __tablename__ = "records"
    __table_args__ = ( Index("ix_records_source_category", "source", "category"), ) # 1-item tuple

    def to_data_item(self) -> DataItem:
        if self.timestamp.tzinfo is None:
            self.timestamp = self.timestamp.replace(tzinfo=timezone.utc)
        return DataItem(self.timestamp, self.category, self.source, self.message, self.solution, self.matchpattern, self.id)

    @staticmethod
    def from_data_item(item: DataItem) -> DataItemEntity:
        return DataItemEntity(id=item.id, timestamp=item.timestamp, category=item.category, source=item.source, message=item.message or "", solution=item.solution, matchpattern=item.matchpattern or "")