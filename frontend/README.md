# Frontend Architecture
The frontend is a responsive web application built with **React 19** and **Vite**. It works on any screen size and its design follows the principles of Material Design M3 ([see more details](https://m3.material.io/)).





## User Interface & Features
The application is a **Single Page Application (SPA)**. While it appears to have multiple pages, it is a single HTML file that dynamically updates its content based on the URL path.






### Logging
The first page shows **logs** from Docker containers on the [watchlist](./../backend/README.md#watchlist). Every log item is defined based on the container that generated it, their timestamp and the category. The category is parsed based on a pre-defined sub-string in the message (e.g. "[ERROR]"). Users can change the sub-strings in the settings. If the message does not contain any tag, it is categorized as "critical".

Users can enable, which category of messages are actually logged and which ones are ignored. This helps to reduce disk usage. These settings are independent from the Auto-Recording feature.

![Screenshot Logs Page](./../readme/screenshot-logs.png  "Screenshot Logs Page")




### Records
Records are items that were permanently added to storage. See the [backend documentation](./../backend/README.md#3-records-recordspy) for more details. A record can be recorded in three different ways:
1. The users adds a new record manually, clicking the button "Add new record" on the *Records* page.
2. The users records an existing log manually, using the button "Add to records" at the bottom of log details.
3. The user enabled [auto-recording](./../backend/README.md#similarity-matcher-auto-recording) for a category (e.g. error). This means any time a log has this category, it gets automatically recorded. Auto-recording also works for categories that are disabled for logging.

Since automated string similarity is not always perfect, the user can use a **matching pattern** to ensure reliable matching. A matching pattern is a regular expression (Regex) to identify a record based on its message. This helps the system to check if a matching record already exists. If the system finds a matching string within a new log, it is automatically a match to that record.

![Screenshot Logs Page](./../readme/screenshot-records.png  "Screenshot Records Page")




### Filters
Users can narrow down items using multi-word keyword searches, timestamp ranges, and category toggles. Enter multiple **key words** separated by spaces to search for particular records. The result has to contain all(!) key words at least once. The following attributes are considered: ID, name of the container, match pattern, solution string and the message string. 




### Settings & Configuration
The Settings page manages the application's behavior:
- **Docker Interface**: Defines the "Docker Community" via network auto-detection or manual overrides. The community is the pool of relevant containers within the same docker network.
- **Watchlist**: Uses **Whitelists** and **Blacklists** to filter specific containers for scanning. See [watchlist section](./../backend/README.md.md#watchlist) for more details.
- **Disk Usage**: Sets limits on the local SQLite log database to prevent uncontrolled growth.
- **Database**: Allows configuration of remote database URLs (e.g., PostgreSQL) for permanent record storage.





## Technical Implementation




### Project Structure
- **`/assets`**: Contains global CSS and custom native JavaScript web components (like the Time Pickers).
- **`/components`**: Houses the React component library, including the main `App.jsx` and specialized views for data items.
- **`/hooks`**: Custom React hooks used to share logic between components.
- **`/public`**: Static assets like the logo and favicon that are not processed by the compiler.




### React Components `/components`
This folder contains all React components. Each file implements multiple components. The `App.jsx` file implements the main component `App` that is rendered by the `index.jsx`.

![Relations of UI Components](./../readme/ui-structure.svg "Relations of UI Components")


#### App
Implements the top layer of the components. It sets the basic structure of the navigation bar and handles hiding/showing content based on the current URL path: Single Page Application (=SPA).


#### Filters
The filter component implements the visuals and functionality to filter a list of items based on their properties and the user input. It takes a list of items and a callback function as properties. The callback function `onFiltered()` is called with the filtered list of items.


#### Forms
The UI uses standard HTML forms (`<form>`) to send data to the backend. In general there are two data types to send to the server: readable text (`json`) and files (raw bytes). Each type requires a different encoding in the request. There are two form components to use: `TextForm` for text based data and `FileForm` for file data.


#### Item Views
The frontend lets the user work on data items (logs or records). Depending on the window the user is currently viewing, items are displayed differently. These different displays are called *Views* and are bundled in this file.

Views do not have any complex logic, apart from simple conditional renderings. They just create a JSX element (=view) of the given item.

Some views take callback functions to create bidirectional data flow. They are called when the user performs an action.


#### Pages
Pages are by far the most complex components. They act as a merging layer between the page layout and the functional logic. They use a composition of functional components and pass them into dedicated page layout components.

Pages are the main components when it comes to structure of the frontend. Most of the conditional and responsive styling happens in these components. The actual logic and functionality is implemented in the lower level components.


#### Pickers
This application mainly works with timestamps and time-based data. Pickers are custom input elements for date and time. They let the user pick a date and time via a visual and intuitive interface.

The React components essentially act as wrapper for the custom web components implemented in `/frontend/assets`.




### Design Conventions
- **Boolean Properties**: Prefixed with `is` (e.g., `isLoading`).
- **Callback Functions**: Prefixed with `on` (e.g., `onFiltered`) to ensure clear bidirectional data flow.
    ```
    <ExampleComponent
        isLoading={loading}
        onFiltered={filteredItems => handleUpdate(filteredItems)}
    />
    ```





## Installation of Development Tools
In case you want to make changes to the project and run it locally, you need to install build tools.
1. Install `Node.js` ([Node.js download page](https://nodejs.org/en/download)) and `Python3` ([Python download page](https://www.python.org/downloads/)). Follow the instructions on the official websites.
2. Install the required Node packages for the frontend from `package.json`. This can take a couple of minutes.
    ```
    ./> cd frontend
    ./frontend/> npm install
    ```
3. If you need to manually deploy the project (not recommended), you can compile the frontend. Simply run `npm run build`. It compiles all files used by the UI into a folder `/frontend/dist`. Copy all files in this folder into `/backend/static/`, where the server can find it.
