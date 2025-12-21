# Error Scanning UI
This is a python application that reads logs of Docker containers and scans them for potential (known) error messages.

## Project Structure
```
project/
|-- api/ [REST API endpoints]
|   |-- __init__.py
|   |-- endpoints.py
|
|-- frontend/ [React implementation]
|   |-- 
|
|-- static/ [static pages]
|   |-- assets/
|   |-- css/
|   |-- js/
|
|-- templates/ [Jinja Templates]
│   |-- index.html
|   |-- help.html
|
|-- README.md
|-- Blacklist.txt [list of Docker containers to ignore]
|-- Whitelist.txt [list of Docker containers to consider]
|-- app.py [Flask UI server]
|-- scanner.py [Docker Error Scanner]
|-- main.py [starting point of this application]
|-- requirements.txt
```


## Quick Start Guide
### Setup Instructions
1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd flask-app
   ```
2. **Create a virtual environment**:
   ```
   python -m venv venv
   ```
3. **Activate the virtual environment**:
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```
     source venv/bin/activate
     ```
4. **Install the required packages**:
   ```
   pip install -r requirements.txt
   ```

###  Running the Application
To run the application, use the following command:
```
cd path/to/project
python main.py
```

### Usage
Once the application is running, you can access it in your web browser at `http://127.0.0.1:5000/`. The main page will be served from the `index.html` template.


## Milestones
1. Mit Tool die Docker logs von anderen Containern auslesen
Zuerst einmal versuchen mit der Container ID die logs zu lesen, dann über den Container Namen und final, wenn möglich, automatisches erkennen von Containern im selben Netzwerk und optionale Namensfilter (blacklist/whitelist).

2. Ein GUI bauen mit dem man die logs anzeigen und Einstellung machen kann
   - 4 screens:
      1. logs anzeigen (gefiltert)
      2. exisitierende Lösungen anzeigen (+manuelle Erros und Lösungen hochladen)
      3. Einstellungen machen
   - Filter listen ändern

3. Eine bestehende Bugliste einlesen und die gefunden Error logs mit ihr vergleichen sowie am GUI anzeigen
   - Bugliste einlesen (File Format JSON definieren: name, description, searchkey, message)
   - logs die nicht im JSON sind hinzufügen falls critical oder error (enable auto record in settings)
   - Schnittstelle definieren manuell: Upload und Download
Hier gäbe es mehrere Möglichkeiten zum Vergleich mit der Bugliste. Direktes string matching, keyword matching, Matching dictionary, Embeddings. Man kann entweder alles einmal Versuchen und schauen was am besten funktioniert oder wenn es so weit ist nochmal reden was genau gemacht wird

4. Automatisch synchronisieren und benachrichtigen
Möglich wären Email, git push oder ähnliches.
   - Schnittstelle automatischer fetch von Datenbank
   - kein GIT push oder pull
   - Dokumentation

## TODO:
- [x] Anzeigen der Details mit Markdown format (solution)
- [x] Logs nach Zeit range filtern
- [x] Settings für die datenbank: URL, PORT, Key, etc.
- [x] TimePicker: fix broken time on record form (edit record)
- [x] implement maximum disk usage (value from settings)
- [x] implement file exchange (parse every item on input, with proper error messages)
- [x] implement disabled state for pickers
- [x] implement record forms
   - [x] send item ID with item forms (hidden)
   - [x] implement delete-item form
- [x] implement the pickers as react components
- [x] replace picker components in Filters.jsx
- [x] maybe implement the pages in the same file to share code?
- [x] datetime string not removed from actual log message
- [x] Inconsistencies with category filter on initialization
- [x] DatePicker: add rendering of selected date in neighboring months
- [x] fix broken backend API for settings
- [ ] update list + item when they were edited
- [ ] implement SQLite file with SQLAlchemy
- [ ] use Markdown string to test md styles
- [ ] write documention (README with Usuability, and high-level code structure)