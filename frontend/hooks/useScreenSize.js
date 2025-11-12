import { useState, useEffect } from 'react';

const SCREEN_SIZES = {
    "small": 0,     // 0 - 600px
    "medium": 601,  // 601 - 992px
    "large": 993    // 993px - max
};

/**
 * Custom hook to track screen size and provide comparison utilities.
 * @returns {{
 * screenSize: "small" | "medium" | "large",
 * isLargerThan: (breakpoint: "small" | "medium" | "large") => boolean,
 * isSmallerThan: (breakpoint: "small" | "medium" | "large") => boolean,
 * isAtLeast: (breakpoint: "small" | "medium" | "large") => boolean,
 * }}
 */
const useScreenSize = () => {
    const [screenSize, setScreenSize] = useState('small');

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if(width >= SCREEN_SIZES.large) {
                setScreenSize('large');
            } else if(width >= SCREEN_SIZES.medium) {
                setScreenSize('medium');
            } else {
                setScreenSize('small');
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isLargerThan = (breakpoint) => {
        const breakpointSize = SCREEN_SIZES[breakpoint];
        if(!breakpointSize) return false;
        return window.innerWidth > breakpointSize;
    };

    const isSmallerThan = (breakpoint) => {
        const breakpointSize = SCREEN_SIZES[breakpoint];
        if(!breakpointSize) return false;
        return window.innerWidth < breakpointSize;
    };
    
    const isAtLeast = (breakpoint) => {
        const breakpointSize = SCREEN_SIZES[breakpoint];
        if(!breakpointSize) return false;
        return window.innerWidth >= breakpointSize;
    };

    const isAtMost = (breakpoint) => {
        const breakpointSize = SCREEN_SIZES[breakpoint];
        if(!breakpointSize) return false;
        return window.innerWidth <= breakpointSize;
    };

    // --- Return Values ---
    return { 
        screenSize,
        isLargerThan, 
        isSmallerThan,
        isAtLeast,
        isAtMost
    };
};

export default useScreenSize;