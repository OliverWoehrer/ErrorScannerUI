"""
This module implements the functions to handle routes of /api
"""
from datetime import datetime, timedelta
from flask import Blueprint, Response, request
import json
import os
import random
import time
import traceback



"""
Helper Functions
"""
def my_traceback(exception: Exception) -> str:
    """
    Formats a traceback to only include frames whose file paths are within the specified project root directory.
    """
    PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

    # Extract Frame List:
    exception_traceback = exception.__traceback__
    frame_list = traceback.extract_tb(exception_traceback) # get entire frame list

    # Iterate Through Each Frame:
    filtered_frames = []
    for frame in frame_list:
        if frame.filename.startswith(PROJECT_ROOT):
            filtered_frames.append(frame)

    # Return Formated Stracktrace:
    if filtered_frames:
        header = "Traceback:"
        content = "".join(traceback.format_list(filtered_frames))
        return f"{header}\r\n{content}"
    else:
        return "No application-specific traceback frames found"

def generate_logs(num_items=20, with_solution=False):
    """
    A generator that yields JSON Line strings with a delay.
    """
    START_DATE = datetime(2025, 10, 25)
    END_DATE = datetime(2025, 10, 31)
    TIME_RANGE_SECONDS = int((END_DATE - START_DATE).total_seconds())

    for idx in range(0, num_items):
        random_offset = random.randint(0, TIME_RANGE_SECONDS)
        log_item = {
            "id": str(idx),
            "timestamp": (START_DATE + timedelta(seconds=random_offset)).isoformat(),
            "category": random.choice(["Critical","Error","Warning","Info","Debug"]),
            "source": random.choice(["Thirsty-Wombat","Jumpy-Giraffe","Sleepy-Koala"]),
            "message": random.choice(["User 'alice' attempted to access restricted resource /admin/settings.", "Database connection pool initialized successfully with 10 connections.", "Failed to serialize response object for container 'zealous-pony': null value found in required field 'name'.", "Starting garbage collection cycle. Memory usage before: 128MB.", "System wide disk space usage exceeded 95%. Automated cleanup initiated.", "Mounted disk with 128MB."]),
            "solution": random.choice(["Just pray at this point", "Try to restart the container", None]) if with_solution else None
        }
        json_line = json.dumps(log_item) + "\r\n"        
        yield json_line.encode('utf-8') # yield the string (Flask sends this chunk immediately)
        time.sleep(3/num_items)
    
    yield '\n' # send final LF character



"""
Blueprint Endpoints
"""
# Register Blueprint Hierarchy:
api = Blueprint("api", __name__, url_prefix="/api")

@api.route("", methods=["GET"])
def index():
    timestamp = datetime.now()
    return f"Hello World at {timestamp}", 200

@api.route("/logs", methods=["GET"])
def logs():
    num_param = request.args.get("num")
    if num_param is None:
        num_param = 40
    return Response(generate_logs(num_items=num_param), mimetype="application/json-lines")

@api.route("/records", methods=["GET"])
def records():
    num_param = request.args.get("num")
    if num_param is None:
        num_param = 40
    return Response(generate_logs(num_items=num_param, with_solution=True), mimetype="application/json-lines")

@api.errorhandler(Exception)
def error(e: Exception):
    return f"{e}\r\n\r\n{my_traceback(e)}", 500