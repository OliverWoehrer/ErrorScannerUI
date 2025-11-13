// React Imports:
import { useState, useEffect, useMemo, useCallback } from 'react';
import { LogRecordItem } from "../assets/LogRecordItem.js";

// Material Components:
import { snackbar } from 'mdui/functions/snackbar.js';

function printMessage(msg, delay = 0) {
    snackbar({
        message: msg,
        autoCloseDelay: delay,
        closeable: true
    });
}

/**
 * Custom hok to fetch data from the given endpoint. Returns the data and loading state.
 * @param {string} endpoint The URL to fetch data from.
 * @returns {{isLoading: boolean, data: Array | null, refetchData: function}}
 */
export function useFetchData(endpoint) {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    async function fetchData() {
        try {
            setIsLoading(true); // enable loading animation
            const response = await fetch(endpoint, { method: "GET" });
            if(!response.ok) {
                const text = await response.text();
                printMessage(`Failed to fetch data: [${response.status} ${response.statusText}] ${text}`);
                return;
            }
            const parsed = await response.json();
            setData(parsed);
        } catch(error) {
            if(error instanceof SyntaxError) {
                printMessage(`Failed to parse response from ${endpoint}: ${error}`);
            } else {
                printMessage(`Failed to fetch data from ${endpoint}: ${error}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Fetch new data if endpoint changes
     */
    useEffect(() => {
        fetchData();
    }, [endpoint]);

    /**
     * Callback function to fetch data manually
     */
    const reloadData = useCallback(() => {
        fetchData();
    }, []);

    return { isLoading, data, reloadData };
}

/**
 * Custom hook to fetch data from the given endpoint as a continously updating stream
 * @param {String} endpoint path to fetch from
 * @returns {{isLoading: boolean, data: Array | null, refetchData: function}}
 */
export function useFetchDataStream(endpoint) {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    async function fetchData() {
        try {
            setIsLoading(true); // enable loading animation
            
            // Fetch Data:
            const response = await fetch(endpoint);
            if(!response.ok) {
                const text = await response.text();
                printMessage(`Failed to fetch data [${response.status} ${response.statusText}] ${text}`);
                return;
            }
            const reader = response.body.getReader()// decode bytes to text chungs
            setData([]); // clear current data after successful request

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
                        setData(prevData => [...prevData, item]);
                    } catch(e) {
                        console.warn(`Error parsing JSON "${trimmed}": ${e}`);
                    }
                }
                if(done) { break; }
            }
        } catch(error) {
            printMessage(`${error} Failed fetch data.`);
        } finally {
            // Disable Loading Animation:
            setIsLoading(false);
        }
    }

    /**
     * Fetch new data if endpoint changes
     */
    useEffect(() => {
        fetchData();
    }, [endpoint]);

    /**
     * Callback function to fetch data manually
     */
    const reloadData = useCallback(() => {
        fetchData();
    }, []);

    return { isLoading, data, reloadData };
};