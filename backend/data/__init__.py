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
    # Build Connection URL:
    url = "" # format: {protocol}://{user}:{password}@{host}:{port}/{path}
    protocol = config_data.database_protocol()
    if protocol:
        url += f"{protocol}://"
    user = config_data.database_user()
    if user:
        url += f"{user}"
        password = config_data.database_pwd()
        if password:
            url += f":{password}"
        url += "@"
    host = config_data.database_host()
    if host:
        url += f"{host}"
        port = config_data.database_port()
        if port:
            url += f":{port}"
    path = config_data.database_path()
    if path:
        url += f"/{path}"

    # [INFO]
    # The URL for the remote database has to follow the format:
    # {protocol}://{user}:{password}@{host}:{port}/{path}
    # The protocol depends on the database used, e.g. "mysql+pymysql" or "postgresql". For more
    # details see https://docs.sqlalchemy.org/en/13/core/engines.html

    # Initialize Database Client:
    if url: # use url to connect to remote database
        return RecordsSQL(db_url=url)
    else: # use local file as fallback
        return RecordsSQL(filename="records.db")
        return LogsFile("records.jsonl")

config_data = init_config_data()
logs_data = init_logs_data()
records_data = init_records_data()