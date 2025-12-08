"""
This module implements functions to read and write data files in here
"""
from .data_item import DataItem

from .config import ConfigHandler
from .logsrecords import LogsRecordsHandler
from .logs import LogsFile
from .records import RecordsFile

config_data = ConfigHandler("config.json")
logs_data = LogsFile("logs.jsonl")
records_data = RecordsFile("records.json")
records_data.load()