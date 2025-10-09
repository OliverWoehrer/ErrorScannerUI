// React Components:

// Material Components:

// Local Import:
import "./style.css"


function SupportingPane({ children, supporting }) {
    return (
        <div className="supporting-pane-layout">
            <main>
                {children}
            </main>
        </div>
    );
}

export default SupportingPane;