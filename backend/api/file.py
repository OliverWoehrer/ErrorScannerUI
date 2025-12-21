"""
This module implements the functions to handle routes of /file
"""
# System Imports:
from data import records_data
from flask import Blueprint, Response, request, redirect, send_file
import json
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
    NAME = "records"
    EXTENSION = "jsonl"
    FILENAME = NAME+"."+EXTENSION
    if request.method == "GET":
        filepath = Path(__file__).parent.parent / "data" / FILENAME
        file = open(filepath, mode="rb")
        if file is None:
            raise InternalServerError("Failed to open file")
        return send_file(filepath, as_attachment=True)

    if request.method == "POST":
        # Parse File Upload:
        input_file_storage = request.files.get("file_upload")
        if input_file_storage is None:
            raise BadRequest("Missing records file.")
        filename = input_file_storage.filename
        if filename == '':
            raise UnprocessableEntity("No selected records file.")
        if filename.rsplit('.', 1)[1].lower() != EXTENSION:
            raise BadRequest(f"Unexpected file extension. Expected '{EXTENSION}' but got '{filename}'")
    
        # Save File:
        filename = secure_filename(filename) # convert to ASCII friendly format
        try:
            records_data.overwrite(input_file_storage)
        except Exception as e:
            raise InternalServerError(f"Could not save uploaded file. {e}")

    # Read Firmware Version From Database:
    return redirect(request.referrer)