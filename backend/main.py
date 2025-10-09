import json
import argparse
from scanner import scanner
from app import app


CONFIG_FILE = "files/config.json"

if __name__ == "__main__":
    # Parse Input Argument:
    parser = argparse.ArgumentParser(description="Error Scanner")
    parser.add_argument("--network", type=str, help="Name of the Docker network to listen to")
    args = parser.parse_args()
    network = args.network
    
    # Read Configuration:
    config = None
    try:
        file = open(CONFIG_FILE, mode="r")
        config = json.load(file)
    except FileNotFoundError as e:
        config = {}
    finally:
        file.close()

    # Start Scanner In The Background:
    scanner.run(interval=config.get("interval"), network_name=network)

    # Start App at Desired Port:
    app.run(host="0.0.0.0", port=config.get("port",5000), debug=True)