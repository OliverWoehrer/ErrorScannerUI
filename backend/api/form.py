"""
This module implements the functions to handle routes of /form
"""
# System Imports:
from data import config_data, records_data, DataItem
from datetime import datetime
from flask import Blueprint, Response, request
import json
from werkzeug.exceptions import NotImplemented, BadRequest, UnprocessableEntity, BadGateway

# Register Blueprint Hierarchy:
form = Blueprint("form", __name__, url_prefix="/form")

@form.route("")
def index():
    return f"This is the default endpoint for '/form'", 200

@form.route("/new-record", methods=["POST"])
def new_record():
    # Parse Request Body:
    body = request.data.decode("utf-8")
    try:
        payload = json.loads(body)
    except TypeError as e:
        raise UnprocessableEntity(f"Failed to parse request body {body}.")

    # Parse Required Params:
    if "date" not in payload:
        raise BadRequest("Missing parameter 'date'.")
    category = payload.get("category",None)
    if category is None:
        raise BadRequest("Missing parameter 'category'.")
    if category not in ["critical","error","warning","info","debug"]:
        raise BadRequest(f"Unknown value for field 'category' ({payload['category']}).")
    source = payload.get("source",None)
    if source is None:
        raise BadRequest("Missing parameter 'source'.")
    
    # Optional Params:
    searchkey = payload.get("searchkey","")
    message = payload.get("message","")
    solution = payload.get("solution",None)

    # Parse Timestamp:
    timestamp = None
    try:
        date = payload["date"]
        timestamp = datetime.strptime(date, "%Y-%m-%dT%H:%M:%S.%fZ") # format YYYY-MM-DDThh:mm:ss.ssssssZ
    except ValueError as e:
        raise UnprocessableEntity(f"Could not parse timestamp {date}. {e}")
    
    # Add to Database:
    item = DataItem(timestamp,category,source,message,solution,searchkey)
    try:
        records_data.add(item)
    except Exception as e:
        raise BadGateway(f"Failed to add item. {e}")
    
    # Return Item in Response:
    return Response(response=json.dumps(item, default=DataItem.serialize), status=200, mimetype="application/json")

@form.route("/edit-record", methods=["POST"])
def edit_record():
    # Parse Request Body:
    body = request.data.decode("utf-8")
    try:
        payload = json.loads(body)
    except TypeError as e:
        raise UnprocessableEntity(f"Failed to parse request body {body}.")

    # Parse Required Params:
    if "date" not in payload:
        raise BadRequest("Missing parameter 'date'.")
    if "time" not in payload:
        raise BadRequest("Missing parameter 'time'.")
    category = payload.get("category",None)
    if category is None:
        raise BadRequest("Missing parameter 'category'.")
    if category not in ["critical","error","warning","info","debug"]:
        raise BadRequest(f"Unknown value for field 'category' ({payload['category']}).")
    source = payload.get("source",None)
    if source is None:
        raise BadRequest("Missing parameter 'source'.")
    id = payload.get("id",None)
    if id is None:
        raise BadRequest("Missing parameter 'id'.")
    
    # Optional Params:
    searchkey = payload.get("searchkey","")
    message = payload.get("message","")
    solution = payload.get("solution",None)

    # Parse Timestamp:
    timestamp = None
    try:
        date = payload["date"]
        timestamp = datetime.strptime(date, "%Y-%m-%dT%H:%M:%S.%fZ") # format YYYY-MM-DDThh:mm:ss.ssssssZ
    except ValueError as e:
        raise UnprocessableEntity(f"Could not parse timestamp {date}. {e}")
    
    # Update Database:
    item = DataItem(timestamp,category,source,message,solution,searchkey,id)
    try:
        records_data.update(item)
    except Exception as e:
        raise BadGateway(f"Failed to update item {id}. {e}")
    
    # Return Item in Response:
    return Response(response=json.dumps(item, default=DataItem.serialize), status=200, mimetype="application/json")

@form.route("/delete-record", methods=["POST"])
def delete_record():
    # Parse Request Body:
    body = request.data.decode("utf-8")
    payload = None
    try:
        payload = json.loads(body)
    except TypeError as e:
        raise UnprocessableEntity(f"Failed to parse request body {body}.")

    # Parse Required Params:
    id = payload.get("id",None)
    if id is None:
        raise BadRequest("Missing parameter 'id'.")

    # Remove From Database:
    try:
        records_data.remove(id)
    except Exception as e:
        raise BadGateway(f"Failed to remove item {id}. {e}")
    return "OK", 200

@form.route("/docker-interface", methods=["GET","POST"])
def docker_interface():
    if request.method == "GET":
        whitelist = config_data.docker_interface_whitelist()
        whitestring = "\n".join(whitelist)
        blacklist = config_data.docker_interface_blacklist()
        blackstring = "\n".join(blacklist)
        data = {
            "network": config_data.docker_interface_network(),
            "whitelist": whitestring,
            "blacklist": blackstring,
        }
        response = json.dumps(data)
        return response

    if request.method == "POST":
        body = request.data.decode("utf-8")
        payload = json.loads(body)

        if "network" in payload:
            config_data.docker_interface_network(payload["network"])
        if "whitelist" in payload:
            whitestring = payload["whitelist"]
            whitelist = [line.strip() for line in whitestring.splitlines()]
            config_data.docker_interface_whitelist(whitelist)
        if "blacklist" in payload:
            blackstring = payload["blacklist"]
            blacklist = [line.strip() for line in blackstring.splitlines()]
            config_data.docker_interface_blacklist(blacklist)

        return "OK", 200

@form.route("/scanner", methods=["GET","POST"])
def scanner():
    if request.method == "GET":
        logging_list = config_data.scanner_logging()
        recording_list = config_data.scanner_recording()
        data = {
            "interval": config_data.scanner_interval(),
            "tags_critical": config_data.scanner_tags_critical(),
            "tags_error": config_data.scanner_tags_error(),
            "tags_warning": config_data.scanner_tags_warning(),
            "tags_info": config_data.scanner_tags_info(),
            "tags_debug": config_data.scanner_tags_debug(),
            "logging_critical": "critical" in logging_list,
            "logging_error": "error" in logging_list,
            "logging_warning": "warning" in logging_list,
            "logging_info": "info" in logging_list,
            "logging_debug": "debug" in logging_list,
            "recording_critical": "critical" in recording_list,
            "recording_error": "error" in recording_list,
            "recording_warning": "warning" in recording_list,
            "recording_info": "info" in recording_list,
            "recording_debug": "debug" in recording_list,
        }
        response = json.dumps(data)
        return response
    
    if request.method == "POST":
        body = request.data.decode("utf-8")
        payload = json.loads(body)

        if "interval" in payload:
            config_data.scanner_interval(payload["interval"])
        if "tags" in payload and isinstance(payload["tags"], dict):
            tags = payload["tags"]
            if "critical" in tags:
                config_data.scanner_tags_critical(tags["critical"])
            if "error" in tags:
                config_data.scanner_tags_error(tags["error"])
            if "warning" in tags:
                config_data.scanner_tags_warning(tags["warning"])
            if "info" in tags:
                config_data.scanner_tags_info(tags["info"])
            if "debug" in tags:
                config_data.scanner_tags_debug(tags["debug"])
        logging_list = []
        recording_list = []
        for key in payload.keys():
            if key.startswith("logging_"):
                category = key.replace("logging_", "")
                logging_list.append(category) # add string to logging list
            if key.startswith("recording_"):
                category = key.replace("recording_", "")
                recording_list.append(category) # add string to recording list
        config_data.scanner_logging(logging_list)
        config_data.scanner_recording(recording_list)

        return "OK", 200

@form.route("/disk-usage", methods=["GET","POST"])
def disk_usage():
    if request.method == "GET":
        disk_usage = config_data.disk_usage()
        response = json.dumps(disk_usage) # convert to valid json string
        return response

    if request.method == "POST":
        # Parse Request Body:
        body = request.data.decode("utf-8")
        payload = json.loads(body)
        
        # Check JSON Fields:
        if "max_logs" in payload:
            value = payload["max_logs"]
            config_data.disk_usage_max_logs(int(value))
        
        return "OK", 200

@form.route("/database", methods=["GET","POST"])
def database():
    if request.method == "GET":
        database_settings = config_data.database()
        response = json.dumps(database_settings)
        return response

    if request.method == "POST":
        body = request.data.decode("utf-8")
        payload = json.loads(body)

        if "host" in payload:
            config_data.database_host(payload["host"])
        if "port" in payload:
            config_data.database_port(payload["port"])
        if "path" in payload:
            config_data.database_path(payload["path"])
        if "key" in payload:
            config_data.database_key(payload["key"])

        return "OK", 200
