# Use an official Python runtime as a parent image
FROM python:3.14.0b3-alpine3.21

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY log_generator.py /app/

# Command to run the Python script
CMD ["python","-u","log_generator.py"]
