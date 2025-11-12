import { useState, useEffect } from 'react';

const SCREEN_SIZES = {
    small: { min:0, max:600 },
    medium: { min:601, max:992 },
    large: { min:993, max:Infinity}
};

/**
 * Custom hook to track screen size and provide comparison utilities.
 * @returns {{
 * screenSize: "small" | "medium" | "large",
 * isLargerThan: (breakpoint: "small" | "medium" | "large") => boolean,
 * isSmallerThan: (breakpoint: "small" | "medium" | "large") => boolean,
 * isAtLeast: (breakpoint: "small" | "medium" | "large") => boolean,
 * isAtMost: (breakpoint: "small" | "medium" | "large") => boolean
 * }}
 */
const useScreenSize = () => {
    const [screenSize, setScreenSize] = useState('small');

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if(width >= SCREEN_SIZES.large.min) {
                setScreenSize('large');
            } else if(width >= SCREEN_SIZES.medium.min) {
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
        const breakpointSize = SCREEN_SIZES[breakpoint].max;
        if(!breakpointSize) return false;
        return window.innerWidth > breakpointSize;
    };

    const isSmallerThan = (breakpoint) => {
        const breakpointSize = SCREEN_SIZES[breakpoint].min;
        if(!breakpointSize) return false;
        return window.innerWidth < breakpointSize;
    };
    
    const isAtLeast = (breakpoint) => {
        const breakpointSize = SCREEN_SIZES[breakpoint].min;
        if(!breakpointSize) return false;
        return window.innerWidth >= breakpointSize;
    };

    const isAtMost = (breakpoint) => {
        const breakpointSize = SCREEN_SIZES[breakpoint].max;
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