// React Components:
import { useLocation, useNavigate } from "react-router"

// Assets and Styles:
import { ROUTES } from "../assets/routes"
import useScreenSize from './../assets/useScreenSize';

// Material Components:
import 'mdui/components/navigation-bar.js';
import 'mdui/components/navigation-bar-item.js';
import 'mdui/components/navigation-rail.js';
import 'mdui/components/navigation-rail-item.js';

function Navigation() {
    const navigate = useNavigate();

    const location = useLocation();
    function getValueByRoute(routes, route) {
        return Object.keys(routes).find(key => routes[key] === route);
    }
    const currentRoute = location.pathname;
    const selectedValue = getValueByRoute(ROUTES, currentRoute);

    const { isAtLeast } = useScreenSize();
    const isBiggerScreen = isAtLeast('medium');

    if(isBiggerScreen) { // return navigation rail on the side of the screen
        return (
            <>
                <mdui-navigation-rail value={selectedValue}>
                    <mdui-navigation-rail-item onClick={() => navigate(ROUTES.logs)} value="logs" icon="featured_play_list--outlined" active-icon="featured_play_list">
                        Logs
                    </mdui-navigation-rail-item>
                    <mdui-navigation-rail-item onClick={() => navigate(ROUTES.records)} value="records" icon="folder--outlined" active-icon="folder">
                        Records
                    </mdui-navigation-rail-item>
                    <mdui-navigation-rail-item onClick={() => navigate(ROUTES.settings)} value="settings" icon="settings--outlined" active-icon="settings">
                        Settings
                    </mdui-navigation-rail-item>
                </mdui-navigation-rail>
            </>
        );
    } else { // return navigation bar on the bottom of the screen
        return (
            <>
                <mdui-navigation-bar value={selectedValue}>
                    <mdui-navigation-bar-item onClick={() => navigate(ROUTES.logs)} value="logs" icon="featured_play_list--outlined" active-icon="featured_play_list">
                        Logs
                    </mdui-navigation-bar-item>
                    <mdui-navigation-bar-item onClick={() => navigate(ROUTES.records)} value="records" icon="folder--outlined" active-icon="folder">
                        Records
                    </mdui-navigation-bar-item>
                    <mdui-navigation-bar-item onClick={() => navigate(ROUTES.settings)} value="settings" icon="settings--outlined" active-icon="settings">
                        Settings
                    </mdui-navigation-bar-item>
                </mdui-navigation-bar>
            </>
        );
    }
}

export default Navigation;