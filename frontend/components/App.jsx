// React Components:
import { useEffect, useRef } from "react";
import { BrowserRouter, useLocation, useNavigate } from "react-router"
import { LogsPage, RecordsPage, SettingsPage } from "./Pages.jsx";

// Material Components:
import 'mdui/components/icon.js';
import 'mdui/components/navigation-bar.js';
import 'mdui/components/navigation-bar.js';
import 'mdui/components/navigation-bar-item.js';
import 'mdui/components/navigation-rail.js';
import 'mdui/components/navigation-rail-item.js';

// Assets and Styles:
import useScreenSize from '../hooks/useScreenSize.js';

const ROUTES = {
    home: "/",
    logs: "/logs",
    records: "/records",
    settings: "/settings",
};

/**
 * Navigation component handles navigation between pages
 * @returns React JSX element
 */
function Navigation() {
    // Handle Tabs and Search Params:
    const location = useLocation();
    function getValueByRoute(routes, route) {
        return Object.keys(routes).find(key => routes[key] === route);
    }
    const selectedValue = getValueByRoute(ROUTES, location.pathname);
    const lastPaths = useRef({ logs: ROUTES.logs, records: ROUTES.records, settings: ROUTES.settings });
    useEffect(() => {
        const currentPath = location.pathname;
        const currentSearch = location.search; // This includes the ?id=1234
        if(currentPath.startsWith(ROUTES.logs)) {
            lastPaths.current.logs = currentPath + currentSearch;
        } else if(currentPath.startsWith(ROUTES.records)) {
            lastPaths.current.records = currentPath + currentSearch;
        } else if(currentPath.startsWith(ROUTES.settings)) {
            lastPaths.current.settings = currentPath + currentSearch;
        }
    }, [location]);

    // Navigation:
    const navigate = useNavigate();
    function handleNavigate(tabName) {
        const targetFullUrl = lastPaths.current[tabName];
        if(location.pathname + location.search === targetFullUrl) return; // don't navigate to the same page
        navigate(targetFullUrl); 
    };

    // Redirect Homepage:
    useEffect(() => {
        if(location.pathname === ROUTES.home) { // redirect home path "/" to "/logs"
            navigate(ROUTES.logs, { replace:true })
        }
    }, []);

    // Responsive Design Based On Screen Size:
    const { isAtLeast } = useScreenSize();
    const isBiggerScreen = isAtLeast('medium');
    if(isBiggerScreen) { // return navigation rail on the side of the screen
        return (
            <mdui-navigation-rail value={selectedValue}>
                <mdui-navigation-rail-item onClick={() => handleNavigate("logs")} value="logs" icon="featured_play_list--outlined" active-icon="featured_play_list">
                    Logs
                </mdui-navigation-rail-item>
                <mdui-navigation-rail-item onClick={() => handleNavigate("records")} value="records" icon="fact_check--outlined" active-icon="fact_check">
                    Records
                </mdui-navigation-rail-item>
                <mdui-navigation-rail-item onClick={() => handleNavigate("settings")} value="settings" icon="settings--outlined" active-icon="settings">
                    Settings
                </mdui-navigation-rail-item>
            </mdui-navigation-rail>
        );
    } else { // return navigation bar on the bottom of the screen
        return (
            <mdui-navigation-bar value={selectedValue}>
                <mdui-navigation-bar-item onClick={() => handleNavigate("logs")} value="logs" icon="featured_play_list--outlined" active-icon="featured_play_list">
                    Logs
                </mdui-navigation-bar-item>
                <mdui-navigation-bar-item onClick={() => handleNavigate("records")} value="records" icon="fact_check--outlined" active-icon="fact_check">
                    Records
                </mdui-navigation-bar-item>
                <mdui-navigation-bar-item onClick={() => handleNavigate("settings")} value="settings" icon="settings--outlined" active-icon="settings">
                    Settings
                </mdui-navigation-bar-item>
            </mdui-navigation-bar>
        );
    }
}

/**
 * Updates visibility of main page components
 * @param {String} path path the wrapped page shell be displayed on
 * @param {ReactElement} children content to display at the given path
 * @returns React JSX element
 */
function PageWrapper({ path, children }) {
    const location = useLocation();
    const isMatch = location.pathname === path;

    return (
        <main style={{height:"100%"}} hidden={!isMatch}>
            {children}
        </main>
    );
};

/**
 * Main component
 * @returns React JSX element
 */
function App() {
    return(
        <BrowserRouter> {/* <-- wrapped inside a router component to enable access to location paths */}
            <nav>
                <Navigation />
            </nav>
            <PageWrapper path={ROUTES.logs}>
                <LogsPage />
            </PageWrapper>
            <PageWrapper path={ROUTES.records}>
                <RecordsPage />
            </PageWrapper>
            <PageWrapper path={ROUTES.settings}>
                <SettingsPage />
            </PageWrapper>
        </BrowserRouter>
    );
}

export default App;