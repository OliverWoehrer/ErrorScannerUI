// React Components:
import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { createRoot } from "react-dom/client"
import { MainTemplate, SpecialTemplate } from "./components/PageTemplates"
import { LogsPage, RecordsPage, SettingsPage, ErrorPage } from "./components/Pages"
import { ROUTES } from "./assets/routes"

// Material Components:
import 'mdui/mdui.css';


import 'mdui/components/navigation-rail.js';
import 'mdui/components/navigation-rail-item.js';
import 'mdui/components/top-app-bar.js';
import 'mdui/components/top-app-bar-title.js';

// Assets and Styles:
import "./styles/style.css"

// Define Main Component:
const { home, logs, records, settings, error } = ROUTES;
function App() {
    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route element={<MainTemplate />}>
                        <Route path={home} element={<Navigate to={logs} replace />} />
                        <Route path={logs} element={<LogsPage />} />
                        <Route path={records} element={<RecordsPage />} />
                        <Route path={settings} element={<SettingsPage />} />
                    </Route>
                    <Route element={<SpecialTemplate />}>
                        <Route path={error} element={<ErrorPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </>
    );
}

// Render Main Component:
const rootContainer = document.getElementById("root");
const root = createRoot(rootContainer);
root.render(<App />);