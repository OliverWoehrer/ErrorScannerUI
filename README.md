# Error Scanning UI
This application monitors the log messages of Docker containers, categorizing them into severity levels (e.g., error, warning) and matching them against a database of known issues. It is designed to run as a Docker container within your network to provide real-time visibility into container health.

Core Components:
- **Frontend**: A responsive React-based SPA (Single Page Application) for viewing logs, managing records, and tweaking configurations.
- **Backend Server**: A Flask-based API that serves the UI and manages data access between the scanner and the user.
- **Docker Scanner**: A background process that hooks into the Docker daemon to fetch, parse, and categorize logs in real-time.





## Getting Started
To get the application running, you need to build the image and connect it to your host's Docker daemon so it can "see" other containers.




### Installation & Build
This project is supposed to run as a Docker container and scan log messages within the same Docker network. You need to build the Docker image first.
1. Install Docker Desktop for your operating system from the [official website](https://www.docker.com/products/docker-desktop/).
2. Get the project files and clone the repository.
    ```
    git clone <repository-url> <your-project-name>
    cd <your-project-name>
    ```
3. Build the docker image named `error-scanner`. This can take a couple of minutes. If you already have a working Docker container you just need to include it into your existing Docker network and it will automatically scan all logs.
    ```
    docker build --tag error-scanner .
    ```




### Deployment (Docker Compose)
Before this Docker container can read logs of other Docker containers, a little bit of configuration is needed. The scanner inside the container uses a UNIX socket to connect to the Docker daemon outside the container. In our case this is Docker Desktop.
- First we need to tell the scanner inside the container were to find this socket, by setting the environment variable `DOCKER_HOST`.
- Second we need to bridge that path from inside the container to the outside path of the host machine. The path on the host machine points to the Docker Desktop daemon and depends on your operating system.

| Host OS | Host Path | Container Path |
| --- | --- | --- |
| Linux | /var/run/docker.sock | /var/run/docker.sock |
| MacOS | /var/run/docker.sock | /var/run/docker.sock |
| Windows | //./pipe/docker_engine | /var/run/docker.sock |

> Here you can find an example for a [compose file](./readme/compose.yml) and how to integrate your newly build image into your existing docker compose!





## Usage Overview
Once running, access the UI at `http://localhost:5000/`.
- **Logs**: View real-time parsed logs from your watchlist. Logs are ephemeral and are cleared when the scanner restarts.
- **Records**: Permanent storage for critical errors. You can attach "Solutions" (Markdown) or Regex "Matching Patterns" to records to help the system identify them automatically in the future.
- **Settings**: Configure which containers to watch (Whitelist/Blacklist), adjust log tags (e.g., change `[ERROR]` to something else), and manage disk usage limits.





## Project Structure
```
project/
    backend/          # Flask API, Docker Scanner, and Data Handlers
    frontend/         # React Source, Hooks, and Web Components
    readme/           # Documentation assets and diagrams
    Dockerfile        # Multi-stage build for the application
```
- **For Backend Developers**: See [backend/README.md](./backend/README.md) for details on the **Similarity Matcher**, SQLAlchemy implementation, and the `scanner.py` logic.
- **For Frontend Developers**: See [frontend/README.md](./frontend/README.md) for details on the **Vite build process**, custom hooks, and Material Design M3 implementation.



##  Development Pipeline
In case you want to make changes to the project and run it locally, you need to install build tools. Follow these instruction about [frontend development tools](./frontend/README.md#installation-of-development-tools) and [backend development tools](./backend/README.md#installation-of-development-tools).






###  Running the Application
After successful installation, you can run the application on your machine. The entire development stack is made of four components: *Docker Desktop daemon*, *Docker scanner*, *Flask backend server* and the *Vite frontend development server*. The frontend server is just so you do not have to recompile the entire frontend for every change, but instead it handles live-updates in real-time.

![Development Technology Stack](./readme/devstack.svg "Development Technology Stack")

The scanner and flask server can run independently of each other. So you do not need to start both of them. They just share access to the database and the config file. The file `main.py` is mainly for the final deployment inside the Docker container. It starts both components in their own sub-process in parallel. It is recommended to start them separately manually during development. Keep in mind, for a fully functional application you need to start all components.

> In case you use **VSCode** for development here are some [launch configurations](./readme/launch.json). Place that file into the `.vscode` folder of your project. This allows you to debug directly in VSCode. Remember to adjust the `DOCKER_HOST` variable.



#### Docker Desktop
Start Docker Desktop and maybe start a Docker compose of any project, just so any containers are running.



#### Docker Scanner
The Docker scanner needs to connect to the Docker Desktop daemon. It uses the environment variable `DOCKER_HOST` to know were to connect. Set the variable to point to the Docker daemon on your machine. The path depends on the operating system of your machine. Afterwards start the python module.
```
./backend/> source .venv/bin/activate
(.venv) ./backend/>
(.venv) ./backend/> export DOCKER_HOST=unix:///home/<username>/.docker/desktop/docker.sock
(.venv) ./backend/> python scanner.py
```



#### Flask Backend Server
The backend server usually has two tasks: Serve the home page for the frontend UI and provide API endpoints for the UI. During development only the API endpoints are used an are available on `localhost:5000/` for testing. The UI is hosted by the development server.
```
./backend/> source .venv/bin/activate
(.venv) ./backend/>
(.venv) ./backend/> python app.py
```



#### Vite Frontend Development Server
The frontend server is just so you do not have to recompile the entire frontend for every change, but instead it handles live-updates on the spot. Instead of connecting to the Flask backend server to see the UI, the frontend is hosted by the Vite development server on `localhost:5173/`. In case you make changes, they get reflected in real-time without any reloads. All traffic to the API endpoints, gets redirected to the actual backend on `localhost:5000/`.
```
./frontend/> npm run dev
```
