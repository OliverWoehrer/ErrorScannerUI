// React Components:
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import { setColorScheme } from 'mdui/functions/setColorScheme.js';
import App from "./components/App";

// Global Assets and Styles:
import 'mdui/components/icon.js';
import 'mdui/mdui.css';
import "./assets/styles.css"

// Set Color Theme of MDUI:
setColorScheme("#006699"); // use TU Wien primary color

// Render Main Component:
const rootContainer = document.getElementById("root");
const root = createRoot(rootContainer);
root.render(
    <BrowserRouter> {/* <-- wrapped inside a router component to enable access to location paths */}
        <App />
    </BrowserRouter>
);