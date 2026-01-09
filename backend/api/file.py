"""
This module implements the functions to handle routes of /file
"""
# System Imports:
from data import config_data, records_data
from flask import Blueprint, request, redirect, send_file
from pathlib import Path
from werkzeug.exceptions import BadRequest, NotImplemented, UnprocessableEntity, InternalServerError
from werkzeug.utils import secure_filename

# Register Blueprint Hierarchy:
file = Blueprint("file", __name__, url_prefix="/file")

@file.route("")
def index():
    return f"Hello '/file'", 200

@file.route("/records", methods=["GET","POST"])
def records():
    records_filename = records_data.filename
    if records_filename is None:
        raise InternalServerError("Records data has no filename")
    EXTENSION = records_filename.suffix # ".jsonl" or ".db"
    if request.method == "GET":
        return send_file(records_filename, as_attachment=True)

    if request.method == "POST":
        # Validate File Upload:
        upload_file_storage = request.files.get("file_upload") # get file object
        if not upload_file_storage:
            raise BadRequest("Missing records file.")
        
        uploaded_path = Path(upload_file_storage.filename)
        if str(uploaded_path)  == '.': # empty file upload
            raise UnprocessableEntity("No selected records file.")
        if uploaded_path.suffix.lower() != EXTENSION:
            raise BadRequest(f"Unexpected file extension. Expected '{EXTENSION}' but got '{Path(filename).suffix}'")
    
        # Save File:
        filename = secure_filename(str(uploaded_path)) # convert to ASCII friendly format
        try:
            records_data.replace_storage(upload_file_storage)
        except Exception as e:
            raise InternalServerError(f"Could not save uploaded file. {e}")

    return redirect(request.referrer)

@file.route("/config", methods=["GET","POST"])
def config():
    config_filename = config_data.filename
    if config_filename is None:
        raise InternalServerError("Config data has no filename")
    EXTENSION = ".json"
    if request.method == "GET":
        return send_file(config_filename, as_attachment=True)

    if request.method == "POST":
        # Validate File Upload:
        upload_file_storage = request.files.get("file_upload") # get file object
        if not upload_file_storage:
            raise BadRequest("Missing config file.")
        
        uploaded_path = Path(upload_file_storage.filename)
        if str(uploaded_path)  == '.': # empty file upload
            raise UnprocessableEntity("No selected config file.")
        if uploaded_path.suffix.lower() != EXTENSION:
            raise BadRequest(f"Unexpected file extension. Expected '{EXTENSION}' but got '{Path(filename).suffix}'")
    
        # Save File:
        filename = secure_filename(str(uploaded_path)) # convert to ASCII friendly format
        try:
            config_filename.replace_storage(upload_file_storage)
        except Exception as e:
            raise InternalServerError(f"Could not save uploaded file. {e}")

    return redirect(request.referrer)
