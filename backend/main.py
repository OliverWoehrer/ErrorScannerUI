from app import app
import argparse
from multiprocessing import Process
from scanner import scanner
import signal

def run_scanner():
    scanner.run()

def run_server():
    app.run(host="0.0.0.0", port=5000, debug=False)

docker_scanner = Process(target=run_scanner)
flask_server = Process(target=run_server)

def stop(sig, frame):
    print("Stopping Program ...")
    docker_scanner.terminate()
    flask_server.terminate()

signal.signal(signal.SIGTERM, stop)
signal.signal(signal.SIGINT, stop)
    
if __name__ == "__main__":
    # Parse Input Argument:
    parser = argparse.ArgumentParser(description="Error Scanner")
    parser.add_argument("--network", type=str, help="Name of the Docker network to listen to")
    args = parser.parse_args()
    network = args.network

    # Start Background Processes:
    docker_scanner.start() # start logs scanner
    flask_server.start() # start flask server

    # Blocking Wait on Background Processes:
    docker_scanner.join()
    flask_server.join()
    print("Good bye!")
