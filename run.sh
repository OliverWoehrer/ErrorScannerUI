#!/bin/bash

cleanup() {
    echo -e "Shutting down."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Register Signal Handler
# [INFO] signal number 2 = SIGINT
trap cleanup 2

# 1. Start Backend
echo "Starting Backend."
cd "$(dirname "$0")/backend" || exit
. .venv/bin/activate
export DOCKER_HOST=unix:///home/oliver/.docker/desktop/docker.sock
python main.py &
BACKEND_PID=$!

# 2. Start Frontend
echo "Starting Frontend."
cd ../frontend || exit
npm run dev &
FRONTEND_PID=$!

echo "Services running. Press Ctrl+C to stop."

# Keep the script alive so the trap stays active
wait