# Stage 1: Build the React Frontend
FROM node:22-alpine AS build-stage
WORKDIR /frontend

# Install packages
COPY ./frontend/package*.json ./
RUN npm install

# Copy and build (This creates a /frontend/build or /frontend/dist folder)
COPY ./frontend/ .
RUN npm run build




# Stage 2: Python Backend
FROM python:3.12-alpine AS requirements-stage
WORKDIR /app

# Do not compile files to __pycache__
ENV PYTHONDONTWRITEBYTECODE=1

# Set path of Docker host so the scanner can access it
ENV DOCKER_HOST=unix:///var/run/docker.sock

# Tell Python it runs inside a container
ENV AM_I_IN_A_DOCKER_CONTAINER=yes

# Install Python requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python scripts
COPY ./backend .

# Copy compiled frontend /frontend/dist/ from stage 1 to /backend/static
COPY --from=build-stage /frontend/dist /app/static

# Expose port 5000 to allow external access to the web server
EXPOSE 5000

# Command to run the Python script
CMD ["python", "-u", "main.py"]
