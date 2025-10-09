import { Outlet } from "react-router";
import "./style.css"

function SpecialPage() {
    return (
        <main className="special-page">
            <Outlet />
        </main>
    );
};


export default SpecialPage;