// React Components:
import { createRoot } from "react-dom/client"
import { setColorScheme } from 'mdui/functions/setColorScheme.js';
import App from "./components/App";

// Libraries:
import 'mdui/components/icon.js'; // MDUI Component Library
import 'mdui/mdui.css';
import 'material-icons/iconfont/material-icons.css'; // Google Material Icons
import 'material-icons/iconfont/outlined.css';
import "@fontsource/ubuntu/400.css"; // Google Font "Ubuntu"
import "@fontsource/ubuntu/700.css";

// Local Assets and Styles:
import "./assets/styles.css"

// Set Color Theme of MDUI:
setColorScheme("#006699"); // use TU Wien primary color

// Render Main Component:
const rootContainer = document.getElementById("root");
const root = createRoot(rootContainer);
root.render(
    <App />
);