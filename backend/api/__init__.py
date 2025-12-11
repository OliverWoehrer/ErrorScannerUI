"""
This module implements the functions to handle routes of /api
"""
from .form import form
from .file import file
from data import logs_data, records_data, DataItem
from datetime import datetime, timedelta
from flask import Blueprint, Response, request, current_app
import json
from pathlib import Path
import random
import time
import traceback
from werkzeug.exceptions import HTTPException, NotImplemented, UnprocessableEntity



"""
Helper Functions
"""
def my_traceback(exception: Exception) -> str:
    """
    Formats a traceback to only include frames whose file paths are within the specified project root directory.
    """
    PROJECT_ROOT = Path(__file__).parent.parent
    IGNORE_DIRS = [".venv"]

    # Extract Frame List:
    exception_traceback = exception.__traceback__
    frame_list = traceback.extract_tb(exception_traceback) # get entire frame list

    # Iterate Through Each Frame:
    filtered_frames = []
    for frame in frame_list:
        full_path = Path(frame.filename)
        try:
            relative_path = full_path.relative_to(PROJECT_ROOT)
        except ValueError:
            continue # skip if path is not under PROJECT_ROOT
        relative_path_str = str(relative_path)
        is_ignored = False
        for ignored_dir in IGNORE_DIRS:
            if relative_path_str.startswith(ignored_dir):
                is_ignored = True
                break
        if not is_ignored:
            filtered_frames.append(frame) # only append if under PROJECT_ROOT but not in IGNORE_DIRS

    # Return Formated Stracktrace:
    if filtered_frames:
        header = "Traceback:"
        content = "".join(traceback.format_list(filtered_frames))
        return f"{header}\r\n{content}"
    else:
        return "No application-specific traceback frames found"

def parse_items(items: list[DataItem]):
    for item in items:
        try:
            dumped = json.dumps(item, default=DataItem.serialize)
            json_line = dumped + "\r\n"
            yield json_line.encode('utf-8') # yield the string (Flask sends this chunk immediately)
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Could not serialize JSON. {e}")
        except TypeError as e:
            raise RuntimeError(f"Could not serialize JSON. {e}")

def generate_logs(num_items: int = 20, with_solution: bool = False):
    """
    A generator that yields JSON Line strings with a delay.
    """
    START_DATE = datetime(2025, 10, 25)
    END_DATE = datetime(2025, 10, 31)
    TIME_RANGE_SECONDS = int((END_DATE - START_DATE).total_seconds())

    for idx in range(0, num_items):
        random_offset = random.randint(0, TIME_RANGE_SECONDS*1000)
        log_item = {
            "id": str(idx),
            "timestamp": (START_DATE + timedelta(milliseconds=random_offset)).isoformat(),
            "category": random.choice(["critical","error","warning","info","debug"]),
            "source": random.choice(["Thirsty-Wombat","Jumpy-Giraffe","Sleepy-Koala"]),
            "message": random.choice(["User 'alice' attempted to access restricted resource /admin/settings.", "Database connection pool initialized successfully with 10 connections.", "Failed to serialize response object for container 'zealous-pony': null value found in required field 'name'.", "Starting garbage collection cycle. Memory usage before: 128MB.", "System wide disk space usage exceeded 95%. Automated cleanup initiated.", "Mounted disk with 128MB."]),
            "solution": random.choice(["Just pray at this point", "Try to restart the container", None]) if with_solution else None
        }
        json_line = json.dumps(log_item) + "\r\n"        
        yield json_line.encode('utf-8') # yield the string (Flask sends this chunk immediately)
        time.sleep(1/num_items)



"""
Blueprint Endpoints
"""
# Register Blueprint Hierarchy:
api = Blueprint("api", __name__, url_prefix="/api")
api.register_blueprint(file, url_prefix="/file")
api.register_blueprint(form, url_prefix="/form")

@api.route("", methods=["GET"])
def index():
    timestamp = datetime.now()
    return f"Hello World at {timestamp}", 200

@api.route("/logs", methods=["GET"])
def logs():
    # Parse Query Params:
    start = None
    stop = None
    start_param = request.args.get("start")
    if start_param:
        try:
            start = datetime.strptime(start_param, "%d.%m.%Y %H:%M:%S.%f") # format DD.MM.YYYY hh:mm:ss.ssssss
        except ValueError as e:
            raise UnprocessableEntity(f"Could not parse timestamp {start_param}. {e}")
    stop_param = request.args.get("stop")
    if stop_param:
        try:
            stop = datetime.strptime(stop_param, "%d.%m.%Y %H:%M:%S.%f") # format DD.MM.YYYY hh:mm:ss.ssssss
        except ValueError as e:
            raise UnprocessableEntity(f"Could not parse timestamp {stop_param}. {e}")
    
    # Fetch Logs:
    items = []
    if start_param and stop_param:
        items = logs_data.get_between(start,stop)
    else:
        items = logs_data.get_last(5000)

    return Response(parse_items(items), mimetype="application/json-lines")

@api.route("/records", methods=["GET"])
def records():
    

    # return Response(generate_logs(), mimetype="application/json-lines")
    return Response(parse_items(), mimetype="application/json-lines")

@api.errorhandler(Exception)
def error(e: Exception):
    if isinstance(e, HTTPException): # display HTTP errors
        msg = f"{e.code} {e.name}: {e.description}\r\n{my_traceback(e)}"
        current_app.logger.error(msg)
        return e.description, e.code
    else: # do not return message about unknown errors
        msg = f"{e}\r\n{my_traceback(e)}"
        current_app.logger.error(msg)
        return "Unhandled Error", 500