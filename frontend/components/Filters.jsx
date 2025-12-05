// React Components:
import { useEffect, useState, useRef, useMemo } from 'react';

// Material Components:
import 'mdui/components/card.js';
import 'mdui/components/chip.js';
import 'mdui/components/list.js';
import 'mdui/components/range-slider.js';
import 'mdui/components/text-field.js';
import 'mdui/components/tooltip.js';

// Local Imports:
import { DatePicker, TimePicker } from './Pickers.jsx'
import { LogRecordItem } from "../assets/LogRecordItem.js";
import "../assets/DatePicker.js"
import "../assets/TimePicker.js"

function Filters({items, updateFilteredItems}) {
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Helper Functions:
    ///////////////////////////////////////////////////////////////////////////////////////////////

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
            const current = item.unixtime;
            if(!((start <= current) && (current <= end))) {
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
    // Confirm Picker Handler Functions:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    function confirmStartDate(confirmedDateObj) {
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
    }

    function confirmStartTime(confirmedDateObj) {
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
    }

    function confirmEndDate(confirmedDateObj) {
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
    }

    function confirmEndTime(confirmedDateObj) {
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
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Hooks:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const [filters, setFilters] = useState({
        categories: [],
        searchQuery: '',
        startDatetime: new Date(0),
        endDatetime: new Date(),
    });
    const textSearchRef = useRef(null);
    const categoriesRef = useRef(null);

    // Initialization:
    useEffect(() => {
        // Initialize Search Function:
        if(textSearchRef.current) {
            textSearchRef.current.addEventListener("input", updateSearchQuery);
            updateFilter("searchQuery", ""); // set default value
        }
        
        // Initialze Category Filter:
        if(categoriesRef.current) {
            // const chips = Array.from(document.querySelectorAll("mdui-chip[variant='filter']"));
            const chips = Array.from(categoriesRef.current.querySelectorAll("mdui-chip"));
            const selectedChips = chips.filter(chip => chip.hasAttribute('selected'));
            const selectedCategories = selectedChips.map(chip => chip.textContent.trim().toLowerCase());
            updateFilter("categories", selectedCategories);
        }
    }, []);

    // Update Datetime Filter on New Items:
    useEffect(() => {
        if(items.length > 0) {
            const unixtimes = items.map(item => item.unixtime);
            const initStartDate = new Date(Math.min(...unixtimes));
            const initEndDate = new Date(Math.max(...unixtimes));
            updateFilter("startDatetime", new Date(initStartDate));
            updateFilter("endDatetime", new Date(initEndDate));
        }
    }, [items]);

    // Update Filtered Items:
    useEffect(() => {
        const filteredItems = applyFilters();
        updateFilteredItems(filteredItems);
    }, [items, filters]);

    return(
        <>
            <section className="flex-row">
                <mdui-text-field ref={textSearchRef} type="search" label="Search for logs or container names" clearable helper-on-focus>
                    <mdui-icon slot="icon" name="search"></mdui-icon>
                    <span slot="helper">Input multiple keywords using spaces</span>
                </mdui-text-field>
            </section>
            <section className="flex-row">
                    <mdui-card variant="filled" style={{ width: "100%" }}>
                        <DatePicker datetimeObj={filters.startDatetime} onConfirm={confirmStartDate} />
                        <TimePicker datetimeObj={filters.startDatetime} onConfirm={confirmStartTime} />
                    </mdui-card>
                    <mdui-card variant="filled" style={{ width: "100%" }}>
                        <DatePicker datetimeObj={filters.endDatetime} onConfirm={confirmEndDate} />
                        <TimePicker datetimeObj={filters.endDatetime} onConfirm={confirmEndTime} />
                    </mdui-card>
            </section>
            <section ref={categoriesRef} className="flex-row" style={{justifyContent:"flex-start",overflowX:"auto"}}>
                <mdui-chip variant="filter" onClick={() => updateCategory("critical")} selectable selected>Critical</mdui-chip>
                <mdui-chip variant="filter" onClick={() => updateCategory("error")} selectable selected>Error</mdui-chip>
                <mdui-chip variant="filter" onClick={() => updateCategory("warning")} selectable selected>Warning</mdui-chip>
                <mdui-chip variant="filter" onClick={() => updateCategory("info")} selectable>Info</mdui-chip>
                <mdui-chip variant="filter" onClick={() => updateCategory("debug")} selectable>Debug</mdui-chip>
            </section>
        </>
    );
}

export default Filters;