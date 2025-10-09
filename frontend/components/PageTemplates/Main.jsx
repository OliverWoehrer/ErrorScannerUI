// React Components:
import { Outlet } from "react-router";
import Navigation from "../Navigation";

// Assets and Styles:
import "./style.css"

function MainTemplate() {
    return (
        <>
            <nav>
                <Navigation />
            </nav>
            <main style={{height:'100%'}}>
                <Outlet />
            </main>
        </>
    );
};


export default MainTemplate;