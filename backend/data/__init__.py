"""
This module implements functions to read and write data files in here
"""
import json
from typing import List, Dict, Any, Optional
from collections import deque # Import deque for efficient log tailing

from .config import ConfigHandler
from .logsrecords import LogsRecordsHandler
from .logsrecords import LogsRecordsItem

config_data = ConfigHandler("config.json")
logs_data = LogsRecordsHandler("logs.jsonl")
logs_data.store_items([]) # clear previous logs
records_data = LogsRecordsHandler("records.jsonl")
