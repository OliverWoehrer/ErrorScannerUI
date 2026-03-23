# Error Scanning UI
This is an application that reads log messages of Docker containers and categorizes them (error, warning, etc.). The application scans logs for potential (known) error messages and compares them to an existing database. It is supposed to run as an Docker container and be part of a Docker network to scan log messages inside that network.

![Error Scanner Dataflow](/readme/dataflow.svg "Error Scanner Dataflow")

The entire project is three main components:
- Frontend: A React UI (`index.jsx`) that implements three user pages. For production its files get built into a bundle of `.js` files to become part of the backend.
- Backend: A Python based system made of two components.
    - Docker Scanner (`scanner.py`): This python module periodically fetches log messages from the Docker containers, sorts them by category and stores them into a local database. It compares incoming log messages with existing, previously recorded messages from another database.
    - Flask Web Server (`app.py`): The Flask application serves the frontend and provides an API with endpoints for the frontend.





## Getting Started
This project is supposed to run as a Docker container and scan log messages within the same Docker network. You need to build the Docker image first. Before this Docker container can read logs of other Docker containers, a little bit of configuration is needed.
1. Install Docker Desktop for your operating system from the [official website](https://www.docker.com/products/docker-desktop/).
2. Get the project files and clone the repository.
    ```
    git clone <repository-url> <your-project-name>
    cd <your-project-name>
    ```
3. Build the docker image named `error-scanner`. This can take a couple of minutes. If you already have a working Docker container you just need to include it into your existing Docker network and it will automatically scan all logs.
    ```
    /your-project-name/> docker build --tag error-scanner .
    ```
4. Include the container into your Docker compose file. The scanner inside the container uses a UNIX socket to connect to the Docker daemon that runs the container. In our case this is Docker Desktop.
    - First we need to tell the scanner inside the container were to find this socket, by setting the environment variable `DOCKER_HOST`.
    - Second we need to bridge that path from inside the container to the path of the host machine. The path on the host machine points to the Docker Desktop daemon. The path on the host machine depends on the operating system.
        | Host OS | Host Path | Container Path |
        | --- | --- | --- |
        | Linux | /var/run/docker.sock | /var/run/docker.sock |
        | MacOS | /var/run/docker.sock | /var/run/docker.sock |
        | Windows | //./pipe/docker_engine | /var/run/docker.sock | 
    > Here you can find an example for [compose file](./readme/compose.yml)!
5. The Docker container can also run independently and not be part of a Docker network. If that is the case, it scans all Docker containers on the host system. You can filter them using the Whitelist and Blacklist via the UI. Simply run the image you created earlier.
    ```
    docker run
        --publish 5000:5000
        --volume /var/run/docker.sock:/var/run/docker.sock
        --env DOCKER_HOST=unix:///var/run/docker.sock
        --name error-scanner error-scanner
    ```





## Usage
Once your Docker container is running, within a Docker compose or not, you can open your browser and visit `http://localhost:5000/`. It has three pages: *Logs*, *Records* and *Settings*. The application scans containers currently running. The user can filter containers by adding their name or ID to the Whitelist or Blacklist using the *Settings* page. The first two pages list logs and records. By clicking any list item, the user can see more details and make changes to this item using the buttons at the bottom. 




### Logs and Records
Every **log** is defined based on the container that generated it, their timestamp and the category. In total there are five categories: critical, error, warning, info and debug. The category is parsed based on a tag in the message string (e.g. ">> ERROR"). Users can change the tag for each category on the *Settings* page. If the message string does not include any tag, it is categorized as "critical". The user can enable, which category of messages are actually logged and which ones are ignored.

**Records** are log messages that were previously recorded. It is possible to store a solution within each record. A solution is a simple markdown string. A record can be recorded in three different ways:
1. The users adds a new record manually, clicking the button "Add new record" on the *Records* page.
2. The users records an existing log manually, using the button "Add to records" at the bottom of log details.
3. The user enabled auto-recording for a category (e.g. error). This means any time a log has this category, it gets automatically recorded. Auto-recording also works for categories that are disabled for logging. This is the default way to record messages.

**Auto-Recording**: For each new log item, the system checks if a matching record already exists. If a match is found, the system simply updates the existing record’s timestamp instead of creating a duplicate. For a log to match an existing record, they must share the same container, the same category, and similar message strings.

Since automated string similarity is not always perfect, you can use a **matching pattern** to ensure reliable matching. A matching pattern is a regular expression (Regex) to identify a record based on its message string. This helps the system to check if a matching record already exists. Should be as strict as possible to prevent false positive matches. If the system finds a matching string within a new log, it is automatically a match to that record.
> Useful sources for Python Regex:
> - Good overview on quantifiers and sets: [w3schools.com/python_regex](https://www.w3schools.com/python/python_regex.asp)
> - Online tester (remember to select "Python" flavor): [regex101.com](https://regex101.com/)
> - Official documentation: [docs.python.org/regex](https://docs.python.org/3/howto/regex.html)




### Settings
The user can change the configuration and data. Here is a quick overview on what each setting does and its impact.



#### Docker Interface
Set a **network name** the scanner should listen at. The container does not have to be part of that network. If no network name is set, the scanner sniffs all containers in its current network. If the container is not part of a network and no network name is set, the scanner sniffs all containers currently running on the system (this is not recommended). The additional **whitelist** and **blacklist** allows to filter containers. If no container is in the whitelist, all running containers are scanned. Changes are only effective after a restart of the scanner (i.e. the container).



#### Log Scanner
Change configuration of the scanner. Set the **tag** strings, which are used to categorize new log messages. Logging and auto-recording can be enabled/disabled for each category independently. If **logging** is enabled, logs of this category are saved and displayed on the *Logs* page. If **recording** is enabled, logs are automatically checked against existing records, no matter if logging is enabled or not. These changes are effective on the next loop iteration (approx. 5 seconds).



#### Disk Usage
Set the maximum number of logs to keep. This helps to reduced disk usage. In case new logs come in, the oldest ones are removed. This only effects logs and not records! Records are never deleted, except by the user.



#### Database
Set parameters for a remote database connection. This is currently not in use. Changes have to be made in the code directly!



#### File Exchange
Download and Upload the records database file (if the system uses local database). Download and upload the configuration file. This can be useful to transfer configurations from one container to another.





## Development
The project uses `Node.js` with `React v19` for the frontend and `Python3` for the backend. These instructions are only to help with the installation and running the application on your machine. The technical details are described in the sub-folders `README.md` or in the code directly.




### Installation
In case you want to make changes to the project and run it locally, you need to install build tools.
1. Install `Node.js` ([Node.js download page](https://nodejs.org/en/download)) and `Python3` ([Python download page](https://www.python.org/downloads/)). Follow the instructions on the official websites.
2. Get the project files and clone the repository.
    ```
    git clone <repository-url> <your-project-name>
    cd <your-project-name>
    ```
3. Start by creating the Python environment for the backend. It is recommended to use a Python virtual environment to install the packages. This creates a (hidden) folder named `.venv`.
    ```
    ./> cd backend
    ./backend/> python -m venv .venv
    ```
4. Activate the virtual environment.
    ```
    ./backend/> source .venv/bin/activate
    (.venv) ./backend/>
    ```
5. Install the required Python packages within the virtual environment.
   ```
   (.venv) ./backend/> pip install -r requirements.txt
   ```
6. Install the required Node packages for the frontend from `package.json`. This can take a couple of minutes.
    ```
    ./> cd frontend
    ./frontend/> npm install
    ```
7. If you need to manually deploy the project (not recommended), you can compile the frontend. Simply run `npm run build`. It compiles all files used by the UI into a folder `/frontend/dist`. Copy all files in this folder into `/backend/static/`, where the server can find it.




###  Running the Application
After successful installation, you can run the application on your machine. The entire development stack is made of four components: Docker Desktop daemon, Docker scanner, Flask backend server and the Vite frontend development server. The frontend server is just so you do not have to recompile the entire frontend for every change, but instead it handles live-updates in real-time.

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
(.venv) ./backend/> export DOCKER_HOST=unix:///home/oliver/.docker/desktop/docker.sock
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








### Project Structure
```
project/
    backend/
        api/                REST API endpoints
        data/               data files and data access objects
        templates/          static served pages
        app.py              entry point for backend server
        main.py
        scanner.py          entry point for scanner
        requirements.txt
    frontend/
        assets/             custom web components and styles
        components/         React components
        hooks/              custom hooks (shared between components)
        public/             static files (icons, logo, etc.)
        index.html          base file, used during development
        index.jsx           main entry for React
        package.json        required NodeJS packages
        vite.config.js      configuration for dev and build task
    readme/                 attachments for documentation
    Dockerfile              build application image
```
