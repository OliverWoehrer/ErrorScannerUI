// React Imports:
import { useState, useEffect, useMemo, useCallback } from 'react';
import { LogRecordItem } from "./LogRecordItem.js";

// Material Components:
import { snackbar } from 'mdui/functions/snackbar.js';

/**
 * Custom Hook to handle data fetching.
 * @param {String} urlPath path to fetch from
 */
export const useFetchData = (urlPath) => {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadTrigger, setReloadTrigger] = useState(0);

    async function fetchItems() {
        // Enable Loading Animation:
        setIsLoading(true);

        try {
            // Fetch Items:
            const response = await fetch(urlPath);
            if(!response.ok) {
                snackbar({
                    message: `Failed to fetch items [${response.status} ${response.statusText}]`,
                    closeable:true
                });
                return;
            }
            const reader = response.body.getReader()// decode bytes to text chungs
            setItems([]); // clear current items after successful request

            // Read Incoming Stream:
            let buffer = ''; // byte buffer to accumulate chunks
            while(true) {
                // const { done, value } = await reader.read();
                let { value, done } = await Promise.race([
                    reader.read(),
                    new Promise((_, reject) => setTimeout(reject, 10000, new Error("Timeout: Did not receive any data.")))
                ]); // timeout of the response breaks
                buffer += new TextDecoder().decode(value);
                let newlineIndex;
                while((newlineIndex = buffer.indexOf('\n')) !== -1) {
                    const line = buffer.substring(0, newlineIndex);
                    buffer = buffer.substring(newlineIndex + 1); // advance buffer past the line (including the newline character)
                    let trimmed = line.trim() // remove whitespaces
                    if(!trimmed) { continue; } // skip loop on empty line 
                    try {
                        const jsonObject = JSON.parse(trimmed);
                        const item = new LogRecordItem(jsonObject);
                        setItems(prevItems => [...prevItems, item]);
                    } catch(e) {
                        console.warn(`Error parsing JSON "${trimmed}": ${e}`);
                    }
                }
                if(done) { break; }
            }
        } catch(error) {
            snackbar({
                message: `${error} Failed fetch items.`,
                closeable:true
            });
        } finally {
            // Disable Loading Animation:
            setIsLoading(false);
        }
    }

    /**
     * Fetches items from the given path. The response has to be in JSON Lines format so they can
     * be parsed dynamically
     */
    const fetchItemsWrapper = useCallback(() => {
        fetchItems();
    }, [urlPath]);

    useEffect(() => {
        fetchItemsWrapper();
    }, [fetchItemsWrapper, reloadTrigger]);

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Shared Callbacks:
    ///////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Updates the state variable which triggers a reload of items (new fetch)
     */
    const reloadItems = useCallback(() => {
        setReloadTrigger(prev => prev + 1);
    }, []);


    return {
        isLoading,
        items,
        reloadItems
    };
};