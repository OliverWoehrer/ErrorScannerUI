"""
This module implements the functions to handle routes of /api
"""
from flask import Blueprint
from datetime import datetime

# Register Blueprint Hierarchy:
api = Blueprint("api", __name__, url_prefix="/api")

@api.route("/", methods=["GET"])
def index():
    timestamp = datetime.now()
    return f"Hello World at {timestamp}", 200

@api.errorhandler(Exception)
def error(e: Exception):
    # be transparent and return internal server error
    return e.description, e.code