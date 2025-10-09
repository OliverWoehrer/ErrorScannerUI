// Material Components:
import 'mdui/components/top-app-bar.js';
import 'mdui/components/top-app-bar-title.js';

function TopBar({ title, closeFunction, children }) {
    return (
        <mdui-top-app-bar>
            { closeFunction && (<mdui-button-icon icon="clear" onClick={closeFunction}></mdui-button-icon>) }
            { title && (<mdui-top-app-bar-title>{title}</mdui-top-app-bar-title>) }
            {children}
        </mdui-top-app-bar>
    );
}

export default TopBar;