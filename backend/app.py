"""
This module implements the functions to handle main routes of "/".
"""
from flask import Flask, render_template
from api import api


# Initalize Flask App:
app = Flask(__name__, template_folder="./templates", static_folder="./static")
app.secret_key = "t0ps3cr3t"

# Register Blueprint Hierarchy:
app.register_blueprint(api, url_prefix="/api")


@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.errorhandler(Exception)
def error(e: Exception):
    return e.description, e.code


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
