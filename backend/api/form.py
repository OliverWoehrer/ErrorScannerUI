"""
This module implements the functions to handle routes of /form
"""
from datetime import datetime, timedelta
from flask import Blueprint, Response, request
import json
import os
import random
import time

"""
Blueprint Endpoints
"""
# Register Blueprint Hierarchy:
form = Blueprint("form", __name__, url_prefix="/form")

@form.route("")
def index():
    return f"This is the default endpoint for '/form'", 200

@form.route("/disk-usage", methods=["GET","POST"])
def docker_interface():
    return "this is '/docker-interface'", 200