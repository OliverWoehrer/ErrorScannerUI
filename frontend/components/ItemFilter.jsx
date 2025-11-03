// React Components:
import { useEffect, useState, useRef } from 'react';
import { ListDetailLayout } from '../Layouts';
import RecordForm from '../RecordForm';
import LogItemView from '../LogItemView.jsx';
import DetailsView from '../DetailsView';
import TopBar from '../TopBar';
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

function ItemFilters({filters, updateFilter}) {
    /**
     * Update the list of selected categories with the given category
     * @param {string} category category to toggle (remove or add to filter list)
     * @info called if the user (un-)selects any fiter
     */
    function toggleCategory(category) {
        if(filters.categories.includes(category)) {
            updatedCategories = filters.categories.filter(c => c !== category); // remove category
        } else {
            updatedCategories = [...filters.categories, category]; // add category
        }
        updateFilter("categories", updatedCategories);
    };

    return(
        <>
            <HorizontalRow>
                <mdui-tooltip content="Refresh logs">
                    <mdui-fab ref={loadingAnimationRef} onClick={() => {fetchItems("/api/logs")}} icon="refresh">Refresh logs</mdui-fab>
                </mdui-tooltip>
                <mdui-text-field ref={textSearchRef} type="search" label="Search for logs or container names" clearable helper-on-focus>
                    <mdui-icon slot="icon" name="search"></mdui-icon>
                </mdui-text-field>
            </HorizontalRow>
            <HorizontalRow>
                <mdui-card variant="filled" style={{width:"100%"}}>
                    <mdui-text-field ref={refs.startDate.input} label="Starting Date" helper-on-focus readonly>
                        <mdui-icon slot="icon" name="calendar_month"></mdui-icon>
                    </mdui-text-field>
                    <mdui-dialog ref={refs.startDate.dialog}>
                        <date-picker ref={refs.startDate.picker}>
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
                    <mdui-text-field type="time" label="Starting Time" helper-on-focus>
                        <mdui-icon slot="icon" name="access_time"></mdui-icon>
                    </mdui-text-field>
                </mdui-card>
                <mdui-card variant="filled" style={{width:"100%"}}>
                     <mdui-text-field ref={refs.stopDate.input} label="Ending Date" helper-on-focus readonly>
                        <mdui-icon slot="icon" name="calendar_month"></mdui-icon>
                    </mdui-text-field>
                    <mdui-dialog ref={refs.stopDate.dialog}>
                        <date-picker ref={refs.stopDate.picker}>
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
                    <mdui-text-field type="time" label="Ending Time" helper-on-focus readonly>
                        <mdui-icon slot="icon" name="access_time"></mdui-icon>
                    </mdui-text-field>
                </mdui-card>
            </HorizontalRow>
            <section id="category-filter" style={{display:"flex", gap:"8px", overflowX:"auto", justifyContent:"center"}}>
                <mdui-chip variant="filter" onClick={() => toggleCategory("Critical")} selectable selected>Critical</mdui-chip>
                <mdui-chip variant="filter" onClick={() => toggleCategory("Error")} selectable selected>Error</mdui-chip>
                <mdui-chip variant="filter" onClick={() => toggleCategory("Warning")} selectable selected>Warning</mdui-chip>
                <mdui-chip variant="filter" onClick={() => toggleCategory("Info")} selectable>Info</mdui-chip>
                <mdui-chip variant="filter" onClick={() => toggleCategory("Debug")} selectable>Debug</mdui-chip>
            </section>
        </>
    );
}

export default ItemFilters;