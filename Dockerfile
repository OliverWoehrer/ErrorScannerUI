# Use an official Python runtime as a parent image
# FROM python:3.9-slim-buster
FROM python:3.14.0b3-alpine3.21

# Set Environment Variables:
ENV DOCKER_HOST=unix:///var/run/docker.sock

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY ./backend .
COPY requirements.txt requirements.txt

# Install any needed Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Expose port 5000 to allow external access to the web server
EXPOSE 5000

# Command to run the Python script
CMD ["python","-u","main.py"]
