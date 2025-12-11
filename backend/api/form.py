"""
This module implements the functions to handle routes of /form
"""
# System Imports:
from data import config_data
from flask import Blueprint, Response, request
import json
from werkzeug.exceptions import NotImplemented

# Register Blueprint Hierarchy:
form = Blueprint("form", __name__, url_prefix="/form")

@form.route("")
def index():
    return f"This is the default endpoint for '/form'", 200

@form.route("/new-record", methods=["POST"])
def new_record():
    body = request.data.decode("utf-8")
    payload = json.loads(body)
    # TODO: parse body and append to "records.json"
    raise NotImplemented(f"Endpoint not yet implemented.")
    return "OK", 200

@form.route("/edit-record", methods=["POST"])
def edit_record():
    body = request.data.decode("utf-8")
    payload = json.loads(body)
    # TODO: parse body, find in "records.json" and edit
    raise NotImplemented(f"Endpoint not yet implemented.")
    return "OK", 200

@form.route("/delete-record", methods=["POST"])
def delete_record():
    body = request.data.decode("utf-8")
    payload = json.loads(body)
    # TODO: parse body, find in "records.json" and edit
    raise NotImplemented(f"Endpoint not yet implemented.")
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
