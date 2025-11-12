// React Components:
import { useEffect, useState, useRef, useMemo } from 'react';
import HorizontalRow from './HorizontalRow.jsx';

// Material Components:
import 'mdui/components/button.js';
import 'mdui/components/button-icon.js';
import 'mdui/components/card.js';
import 'mdui/components/chip.js';
import 'mdui/components/list.js';
import 'mdui/components/range-slider.js';
import 'mdui/components/text-field.js';
import 'mdui/components/tooltip.js';

// Local Imports:
import { toDateString, toTimeString } from '../assets/scripts.js'
import { LogRecordItem } from "../assets/LogRecordItem.js";
import "../assets/DatePicker.js"
import "../assets/TimePicker.js"

function ItemFilters({items, updateFilteredItems}) {
    const [filters, setFilters] = useState({
        categories: [],
        searchQuery: '',
        startDatetime: new Date(0),
        endDatetime: new Date(),
    });

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Helper Functions:
    ///////////////////////////////////////////////////////////////////////////////////////////////

    function openDialog(reference) {
        if(reference.current) {
            reference.current.open = true;
        }
    }

    function closeDialog(reference) {
        if(reference.current) {
            reference.current.open = false;
        }
    }

    function updateFilter(key, value) {
        setFilters(prev => ({ ...prev, [key]: value }));
    }

    function applyFilters() {
        return items.filter(item => {
            console.assert(item instanceof LogRecordItem, "'item' has to be of type 'LogRecordItem'");

            // Check Category:
            if (!filters.categories.includes(item.category)) {
                return false;
            }

            // Check Text Search Query:
            if (!item.search(filters.searchQuery)) {
                return false;
            }

            // Check Datetime Range:
            const start = filters.startDatetime.getTime();
            const end = filters.endDatetime.getTime();
            const current = item.timestamp;
            if (!((start <= current) && (current <= end))) {
                return false;
            }

            return true;
        });
    }
    
    // Handler For Search Input:
    function updateSearchQuery() {
        const query = textSearchRef.current.value;
        updateFilter("searchQuery", String(query));
    }

    // Handler for Category Chip Clicks:
    function updateCategory(category) {
        let selectedCategories = [];
        if(filters.categories.includes(category)) {
            selectedCategories = filters.categories.filter(c => c !== category); // remove category
        } else {
            selectedCategories = [...filters.categories, category]; // add category
        }
        updateFilter("categories", selectedCategories);
    };

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Hooks:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const textSearchRef = useRef(null);
    const startDateRef = { input:useRef(null), dialog:useRef(null), picker:useRef(null) };
    const startTimeRef = { input:useRef(null), dialog:useRef(null), picker:useRef(null) };
    const endDateRef = { input:useRef(null), dialog:useRef(null), picker:useRef(null) };
    const endTimeRef = { input:useRef(null), dialog:useRef(null), picker:useRef(null) };

    // Initialization:
    useEffect(() => {
        // Initialze ESC Key:
        document.body.addEventListener("keydown", function(event) {
            if (event.key === "Escape") {
                hideDetails();
            }
        });

        // Initialize Search Function:
        if(textSearchRef.current) {
            textSearchRef.current.addEventListener("input", updateSearchQuery);
            updateFilter("searchQuery", ""); // set default value
        }
        
        // Initialze Category Filter:
        const chips = Array.from(document.querySelectorAll("mdui-chip[variant='filter']"));
        const selectedChips = chips.filter(chip => chip.hasAttribute('selected'));
        const categories = chips.map(chip => chip.textContent.trim());
        const selectedCategories = selectedChips.map(chip => chip.textContent.trim());
        updateFilter("categories", selectedCategories);

        // Implement Event Handlers:
        function confirmStartDate() {
            const confirmedDateObj = startDateRef.picker.current.confirmedDateObj;
            function updateFilterDate(prevFilters) {
                const prevDate = prevFilters.startDatetime;
                const newDate = new Date(prevDate);
                newDate.setFullYear(confirmedDateObj.getFullYear());
                newDate.setMonth(confirmedDateObj.getMonth());
                newDate.setDate(confirmedDateObj.getDate());
                const newFilters = { ...prevFilters, startDatetime:newDate }
                return newFilters;
            }
            setFilters(updateFilterDate);
            closeDialog(startDateRef.dialog);
        }
        function confirmStartTime() {
            const confirmedDateObj = startTimeRef.picker.current.confirmedDateObj;
            function updateFilterDate(prevFilters) {
                const prevDate = prevFilters.startDatetime;
                const newDate = new Date(prevDate);
                newDate.setHours(confirmedDateObj.getHours());
                newDate.setMinutes(confirmedDateObj.getMinutes());
                newDate.setSeconds(confirmedDateObj.getSeconds());
                newDate.setMilliseconds(confirmedDateObj.getMilliseconds());
                const newFilters = { ...prevFilters, startDatetime:newDate }
                return newFilters;
            }
            setFilters(updateFilterDate);
            closeDialog(startTimeRef.dialog);
        }
        function confirmEndDate() {
            const confirmedDateObj = endDateRef.picker.current.confirmedDateObj;
            function updateFilterDate(prevFilters) {
                const prevDate = prevFilters.endDatetime;
                const newDate = new Date(prevDate);
                newDate.setFullYear(confirmedDateObj.getFullYear());
                newDate.setMonth(confirmedDateObj.getMonth());
                newDate.setDate(confirmedDateObj.getDate());
                const newFilters = { ...prevFilters, endDatetime:newDate }
                return newFilters;
            }
            setFilters(updateFilterDate);
            closeDialog(endDateRef.dialog);
        }
        function confirmEndTime() {
            const confirmedDateObj = endTimeRef.picker.current.confirmedDateObj;
            function updateFilterDate(prevFilters) {
                const prevDate = prevFilters.endDatetime;
                const newDate = new Date(prevDate);
                newDate.setHours(confirmedDateObj.getHours());
                newDate.setMinutes(confirmedDateObj.getMinutes());
                newDate.setSeconds(confirmedDateObj.getSeconds());
                newDate.setMilliseconds(confirmedDateObj.getMilliseconds());
                const newFilters = { ...prevFilters, endDatetime:newDate }
                return newFilters;
            }
            setFilters(updateFilterDate);
            closeDialog(endTimeRef.dialog);
        }

        // Initialize Datetime Pickers:
        if(startDateRef.picker.current) {
            const picker = startDateRef.picker.current;
            picker.addEventListener("confirm", confirmStartDate);
            picker.addEventListener("reset", () => { closeDialog(startDateRef.dialog); });
        }
        if(startTimeRef.picker.current) {
            const picker = startTimeRef.picker.current;
            picker.addEventListener("confirm", confirmStartTime);
            picker.addEventListener("reset", () => { closeDialog(startTimeRef.dialog); });
        }
        if(endDateRef.picker.current) {
            const picker = endDateRef.picker.current;
            picker.addEventListener("confirm", confirmEndDate);
            picker.addEventListener("reset", () => { closeDialog(endDateRef.dialog); });
        }
        if(endTimeRef.picker.current) {
            const picker = endTimeRef.picker.current;
            picker.addEventListener("confirm", confirmEndTime);
            picker.addEventListener("reset", () => { closeDialog(endTimeRef.dialog); });
        }
    }, []);

    // Update Datetime Filter on New Items:
    useEffect(() => {
        if(items.length > 0) {
            const timestamps = items.map(item => item.timestamp);
            const initStartDate = new Date(Math.min(...timestamps));
            const initEndDate = new Date(Math.max(...timestamps));
            updateFilter("startDatetime", new Date(initStartDate));
            updateFilter("endDatetime", new Date(initEndDate));
        }
    }, [items]);

    // Update Start Date and Time UI:
    useEffect(() => {
        if(startDateRef.input.current) {
            startDateRef.input.current.value = toDateString(filters.startDatetime);
        }
        if(startDateRef.picker.current) {
            startDateRef.picker.current.confirmedDateObj = filters.startDatetime;
        }
        if(startTimeRef.input.current) {
            startTimeRef.input.current.value = toTimeString(filters.startDatetime);
        }
        if(startTimeRef.picker.current) {
            startTimeRef.picker.current.confirmedDateObj = filters.startDatetime;
        }
    },[filters.startDatetime]);

    // Update End Date and Time UI:
    useEffect(() => {
        if(endDateRef.input.current) {
            endDateRef.input.current.value = toDateString(filters.endDatetime);
        }
        if(endDateRef.picker.current) {
            endDateRef.picker.current.selectedDateObj = filters.endDatetime;
        }
        if(endTimeRef.input.current) {
            endTimeRef.input.current.value = toTimeString(filters.endDatetime);
        }
        if(endTimeRef.picker.current) {
            endTimeRef.picker.current.selectedDateObj = filters.endDatetime;
        }
    },[filters.endDatetime]);

    // Update Filtered Items:
    useEffect(() => {
        const filteredItems = applyFilters();
        updateFilteredItems(filteredItems);
    }, [items, filters]);

    return(
        <>
            <section>
                <HorizontalRow>
                    <mdui-text-field ref={textSearchRef} type="search" label="Search for logs or container names" clearable helper-on-focus>
                        <mdui-icon slot="icon" name="search"></mdui-icon>
                        <span slot="helper">Input multiple keywords using spaces</span>
                    </mdui-text-field>
                </HorizontalRow>
            </section>
            <section>
                <HorizontalRow>
                    {/* Input Start Date & Time */}
                    <mdui-card variant="filled" style={{ width: "100%" }}>
                        <mdui-text-field ref={startDateRef.input} label="Starting Date" readonly onClick={() => { openDialog(startDateRef.dialog); }}>
                            <mdui-icon slot="icon" name="calendar_month"></mdui-icon>
                        </mdui-text-field>
                        <mdui-dialog ref={startDateRef.dialog} close-on-esc close-on-overlay-click>
                            <date-picker ref={startDateRef.picker}>
                                <span slot="supporting-text">Select a date</span>
                                <mdui-top-app-bar-title slot="headline"></mdui-top-app-bar-title>
                                <mdui-button-icon slot="prev-month-btn" icon="keyboard_arrow_left"></mdui-button-icon>
                                <mdui-button-icon slot="next-month-btn" icon="keyboard_arrow_right"></mdui-button-icon>
                                <mdui-button-icon slot="prev-year-btn" icon="keyboard_arrow_left"></mdui-button-icon>
                                <mdui-button-icon slot="next-year-btn" icon="keyboard_arrow_right"></mdui-button-icon>
                                <mdui-button slot="cancel-btn" variant="text">Cancel</mdui-button>
                                <mdui-button slot="confirm-btn">OK</mdui-button>
                            </date-picker>
                        </mdui-dialog>
                        <mdui-text-field ref={startTimeRef.input} label="Starting Time" helper-on-focus onClick={() => { openDialog(startTimeRef.dialog); }}>
                            <mdui-icon slot="icon" name="access_time"></mdui-icon>
                        </mdui-text-field>
                        <mdui-dialog ref={startTimeRef.dialog} close-on-esc close-on-overlay-click>
                            <time-picker ref={startTimeRef.picker}>
                                <span slot="supporting-text">Select a time</span>
                                <mdui-top-app-bar-title slot="headline"></mdui-top-app-bar-title>
                                <mdui-text-field slot="hours" type="number"></mdui-text-field>
                                <mdui-button-icon slot="inc-hours" icon="keyboard_arrow_up"></mdui-button-icon>
                                <mdui-button-icon slot="dec-hours" icon="keyboard_arrow_down"></mdui-button-icon>
                                <mdui-text-field slot="minutes" type="number"></mdui-text-field>
                                <mdui-button-icon slot="inc-minutes" icon="keyboard_arrow_up"></mdui-button-icon>
                                <mdui-button-icon slot="dec-minutes" icon="keyboard_arrow_down"></mdui-button-icon>
                                <mdui-text-field slot="seconds" type="number"></mdui-text-field>
                                <mdui-button-icon slot="inc-seconds" icon="keyboard_arrow_up"></mdui-button-icon>
                                <mdui-button-icon slot="dec-seconds" icon="keyboard_arrow_down"></mdui-button-icon>
                                <mdui-text-field slot="millis" type="number"></mdui-text-field>
                                <mdui-button-icon slot="inc-millis" icon="keyboard_arrow_up"></mdui-button-icon>
                                <mdui-button-icon slot="dec-millis" icon="keyboard_arrow_down"></mdui-button-icon>
                                <mdui-button slot="cancel-btn" variant="text">Cancel</mdui-button>
                                <mdui-button slot="confirm-btn">OK</mdui-button>
                            </time-picker>
                        </mdui-dialog>
                    </mdui-card>
                    {/* Input End Date & Time */}
                    <mdui-card variant="filled" style={{ width: "100%" }}>
                        <mdui-text-field ref={endDateRef.input} label="Ending Date" readonly onClick={() => { openDialog(endDateRef.dialog); }}>
                            <mdui-icon slot="icon" name="calendar_month"></mdui-icon>
                        </mdui-text-field>
                        <mdui-dialog ref={endDateRef.dialog} close-on-esc close-on-overlay-click>
                            <date-picker ref={endDateRef.picker}>
                                <span slot="supporting-text">Select a date</span>
                                <mdui-top-app-bar-title slot="headline"></mdui-top-app-bar-title>
                                <mdui-button-icon slot="prev-month-btn" icon="keyboard_arrow_left"></mdui-button-icon>
                                <mdui-button-icon slot="next-month-btn" icon="keyboard_arrow_right"></mdui-button-icon>
                                <mdui-button-icon slot="prev-year-btn" icon="keyboard_arrow_left"></mdui-button-icon>
                                <mdui-button-icon slot="next-year-btn" icon="keyboard_arrow_right"></mdui-button-icon>
                                <mdui-button slot="cancel-btn" variant="text">Cancel</mdui-button>
                                <mdui-button slot="confirm-btn">OK</mdui-button>
                            </date-picker>
                        </mdui-dialog>
                        <mdui-text-field ref={endTimeRef.input} label="End Time" helper-on-focus onClick={() => { openDialog(endTimeRef.dialog); }}>
                            <mdui-icon slot="icon" name="access_time"></mdui-icon>
                        </mdui-text-field>
                        <mdui-dialog ref={endTimeRef.dialog} close-on-esc close-on-overlay-click>
                            <time-picker ref={endTimeRef.picker}>
                                <span slot="supporting-text">Select a time</span>
                                <mdui-top-app-bar-title slot="headline"></mdui-top-app-bar-title>
                                <mdui-text-field slot="hours" type="number"></mdui-text-field>
                                <mdui-button-icon slot="inc-hours" icon="keyboard_arrow_up"></mdui-button-icon>
                                <mdui-button-icon slot="dec-hours" icon="keyboard_arrow_down"></mdui-button-icon>
                                <mdui-text-field slot="minutes" type="number"></mdui-text-field>
                                <mdui-button-icon slot="inc-minutes" icon="keyboard_arrow_up"></mdui-button-icon>
                                <mdui-button-icon slot="dec-minutes" icon="keyboard_arrow_down"></mdui-button-icon>
                                <mdui-text-field slot="seconds" type="number"></mdui-text-field>
                                <mdui-button-icon slot="inc-seconds" icon="keyboard_arrow_up"></mdui-button-icon>
                                <mdui-button-icon slot="dec-seconds" icon="keyboard_arrow_down"></mdui-button-icon>
                                <mdui-text-field slot="millis" type="number"></mdui-text-field>
                                <mdui-button-icon slot="inc-millis" icon="keyboard_arrow_up"></mdui-button-icon>
                                <mdui-button-icon slot="dec-millis" icon="keyboard_arrow_down"></mdui-button-icon>
                                <mdui-button slot="cancel-btn" variant="text">Cancel</mdui-button>
                                <mdui-button slot="confirm-btn">OK</mdui-button>
                            </time-picker>
                        </mdui-dialog>
                    </mdui-card>
                </HorizontalRow>
            </section>
            <section>
                <HorizontalRow overflow>
                    <mdui-chip variant="filter" onClick={() => updateCategory("Critical")} selectable selected>Critical</mdui-chip>
                    <mdui-chip variant="filter" onClick={() => updateCategory("Error")} selectable selected>Error</mdui-chip>
                    <mdui-chip variant="filter" onClick={() => updateCategory("Warning")} selectable selected>Warning</mdui-chip>
                    <mdui-chip variant="filter" onClick={() => updateCategory("Info")} selectable>Info</mdui-chip>
                    <mdui-chip variant="filter" onClick={() => updateCategory("Debug")} selectable>Debug</mdui-chip>
                </HorizontalRow>
            </section>
        </>
    );
}

export default ItemFilters;