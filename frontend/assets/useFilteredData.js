import { useState, useEffect, useMemo, useCallback } from 'react';

import { LogRecordItem } from "./LogRecordItem.js";





/**
 * Custom Hook to handle data fetching, state management, and filtering.
 * @param {String} urlPath path to fetch from
 */
export const useFilteredData = (urlPath) => {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadTrigger, setReloadTrigger] = useState(0);
    const [filters, setFilters] = useState({
        categories: [],
        searchQuery: '',
        startDatetime: null,
        endDatetime: null,
    });

    async function fetchItems() {
        // Enable Loading Animation:
        setIsLoading(true);

        try {
            // Fetch Items:
            const response = await fetch(urlPath);
            if(!response.ok) {
                throw new Error(`Failed to fetch items [${response.status} ${response.statusText}]`);
                // TODO: use reference from snackbar
            }
            const reader = response.body.getReader()// decode bytes to text chungs
            setItems([]); // clear current items after successful request

            // Read Incoming Stream:
            let buffer = ''; // byte buffer to accumulate chunks
            while(true) {
                const { done, value } = await reader.read();
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
                        setItems(prevItems => [...prevItems, item])
                    } catch(e) {
                        console.warn(`Error parsing JSON "${trimmed}": ${e}`);
                    }
                }
                if(done) { break; }
            }
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
    // Shared Memos:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            console.assert(item instanceof LogRecordItem, "'item' has to be of type 'LogRecordItem'");

            // Check Category:
            if(!filters.categories.includes(item.category)) {
                return false;
            }

            // Check Text Search Query:
            if(!item.search(filters.searchQuery)) {
                return false;
            }

            // Check Datetime Range:
            const start = filters.startDatetime.getTime();
            const end = filters.endDatetime.getTime();
            const current = item.timestamp;
            if(!(start <= current) && (current <= end)) {
                return false;
            }

            return true;
        });
    }, [items, filters]);


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Shared Callbacks:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * The referenced function updates the filter at the given key with the given value 
     */
    const updateFilter = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        // setSelectedItem(null); // Clear selection when filters change
    }, []);

    /**
     * Updates the state variable which triggers a reload of items (new fetch)
     */
    const reloadItems = useCallback(() => {
        setReloadTrigger(prev => prev + 1);
    }, []);


    return {
        isLoading,
        filters,
        items,
        filteredItems,
        updateFilter,
        reloadItems
    };
};