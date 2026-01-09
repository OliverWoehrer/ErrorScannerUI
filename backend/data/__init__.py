"""
This module implements functions to read and write data files in here
"""
from .utils import DataItem, Base, DataItemEntity
from .config import ConfigHandler
from .logs import LogsCollection, LogsSQL
from .records import RecordsCollection, RecordsSQL


def init_config_data() -> ConfigHandler:
    return ConfigHandler("config.json")

def init_logs_data() -> LogsCollection:
    return LogsSQL(filename="logs.db")
    return LogsFile("logs.jsonl")

def init_records_data() -> RecordsCollection:
    return RecordsSQL(filename="records.db")
    return RecordsFile("records.jsonl")

config_data = init_config_data()
logs_data = init_logs_data()
records_data = init_records_data()