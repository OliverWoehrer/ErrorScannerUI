// React Components:
import { useNavigate } from "react-router";

// Assets and Styles:
import { ROUTES } from "./../../assets/routes"

// Material Components:
import 'mdui/components/button.js';
import 'mdui/components/button-icon.js';
import 'mdui/components/icon.js';

function Error() {
    return(
        <div>
            <h1>Error!</h1>
            <mdui-button href={ROUTES.home}>
                <mdui-icon name="arrow_back" slot="icon"></mdui-icon> Back to Home
            </mdui-button>
        </div>
    );
}

export default Error;