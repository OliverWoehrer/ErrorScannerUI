// React Components:

// Material Components:

// Local Import:
import "./style.css"
import useScreenSize from '../../hooks/useScreenSize.js';
import { useEffect } from "react";

function Feed({ children }) {
    // Layout Conditionals
    const { isAtMost } = useScreenSize();
    const isSmallScreen = isAtMost('small'); // bottom navigation for small screens (< 601px)

    return (
        <div className="feed-layout">
            {children}
            {isSmallScreen && (<div style={{height:"70px"}}></div>)}
        </div>
    );
}

export default Feed;