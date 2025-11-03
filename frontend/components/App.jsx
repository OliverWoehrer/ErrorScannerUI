// React Components:
import { useEffect } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation, useNavigate } from "react-router"
import { LogsPage, RecordsPage, SettingsPage } from "./Pages";

// Material Components:
import 'mdui/components/icon.js';
import 'mdui/components/navigation-bar.js';
import 'mdui/components/navigation-bar.js';
import 'mdui/components/navigation-bar-item.js';
import 'mdui/components/navigation-rail.js';
import 'mdui/components/navigation-rail-item.js';

// Assets and Styles:
import { ROUTES } from "../assets/routes";
import useScreenSize from '../assets/useScreenSize';

const { home, logs, records, settings } = ROUTES;

/**
 * Navigation component handles navigation between pages
 * @returns React JSX element
 */
function Navigation() {
    // Redirect Pages:
    useEffect(() => {
        if(currentRoute === home) { // redirect home path "/" to "/logs"
            navigate(logs, { replace:true })
        }
    }, []);

    // Get Current Path:
    const location = useLocation();
    const currentRoute = location.pathname;
    function getValueByRoute(routes, route) {
        return Object.keys(routes).find(key => routes[key] === route);
    }
    const selectedValue = getValueByRoute(ROUTES, currentRoute);
        
    // Navigate Paths:
    const navigate = useNavigate();
    function handleNavigate(path) {
        if(currentRoute === path) { return; } // dont navigate to the same page
        
        navigate({
            pathname: path, // e.g., /settings
            search: '',     // Explicitly sets the query string to empty
        }); 
    };

    // Responsive Design Based On Screen Size:
    const { isAtLeast } = useScreenSize();
    const isBiggerScreen = isAtLeast('medium');
    if(isBiggerScreen) { // return navigation rail on the side of the screen
        return (
            <mdui-navigation-rail value={selectedValue}>
                <mdui-navigation-rail-item onClick={() => handleNavigate(ROUTES.logs)} value="logs" icon="featured_play_list--outlined" active-icon="featured_play_list">
                    Logs
                </mdui-navigation-rail-item>
                <mdui-navigation-rail-item onClick={() => handleNavigate(ROUTES.records)} value="records" icon="folder--outlined" active-icon="folder">
                    Records
                </mdui-navigation-rail-item>
                <mdui-navigation-rail-item onClick={() => handleNavigate(ROUTES.settings)} value="settings" icon="settings--outlined" active-icon="settings">
                    Settings
                </mdui-navigation-rail-item>
            </mdui-navigation-rail>
        );
    } else { // return navigation bar on the bottom of the screen
        return (
            <mdui-navigation-bar value={selectedValue}>
                <mdui-navigation-bar-item onClick={() => handleNavigate(ROUTES.logs)} value="logs" icon="featured_play_list--outlined" active-icon="featured_play_list">
                    Logs
                </mdui-navigation-bar-item>
                <mdui-navigation-bar-item onClick={() => handleNavigate(ROUTES.records)} value="records" icon="folder--outlined" active-icon="folder">
                    Records
                </mdui-navigation-bar-item>
                <mdui-navigation-bar-item onClick={() => handleNavigate(ROUTES.settings)} value="settings" icon="settings--outlined" active-icon="settings">
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
    const currentRoute = location.pathname;

    return (
        <main style={{height:"100%"}} hidden={currentRoute !== path}>
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
        <>
            <nav>
                <Navigation />
            </nav>
            <PageWrapper path={logs}>
                <LogsPage />
            </PageWrapper>
            <PageWrapper path={records}>
                <RecordsPage />
            </PageWrapper>
            <PageWrapper path={settings}>
                <SettingsPage />
            </PageWrapper>
        </>
    );
}

export default App;