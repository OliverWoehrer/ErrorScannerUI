from app import app
import os
from multiprocessing import Process
from scanner import scanner
import signal

def stop(signum, frame):
    print("Terminating application...")
    docker_scanner.terminate()
    flask_server.terminate()

if __name__ == "__main__":
    # Create Child Processes:
    docker_scanner = Process(target=scanner.run)
    flask_server = Process(target=app.run, kwargs={"host":"0.0.0.0", "port":5000, "debug":False})

    # Start Children:
    docker_scanner.start()
    flask_server.start()

    # Register Signal Handlers:
    signal.signal(signal.SIGTERM, stop) # signal from OS or Docker
    signal.signal(signal.SIGINT, stop) # signal from keyboard interrupt, e.g. CTRL+C

    # Blocking Wait on Children:
    docker_scanner.join()
    flask_server.join()
    print("Good bye!")
