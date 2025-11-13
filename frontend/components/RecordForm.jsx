// React Components:
import { useEffect, useRef, useState } from 'react';
import Form from './Form';
import HorizontalRow from './HorizontalRow.jsx';

// Material Components:
import 'mdui/components/button.js';
import 'mdui/components/divider.js';
import 'mdui/components/top-app-bar.js';
import 'mdui/components/top-app-bar-title.js';

// Local Imports:
import { toDateString, toTimeString } from '../assets/scripts.js'
import { LogRecordItem } from "../assets/LogRecordItem.js";
import "../assets/DatePicker.js"
import "../assets/TimePicker.js"

function RecordForm({ action, onSuccess, record }) {
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

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Hooks:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const [item, setItem] = useState(record ?? new LogRecordItem()); // if no record is given, use default as fallback
    const dateRef = { input:useRef(null), dialog:useRef(null), picker:useRef(null) };
    const timeRef = { input:useRef(null), dialog:useRef(null), picker:useRef(null) };

    useEffect(() => {
        // Implement Event Handlers:
        function confirmDate() {
            const confirmedDateObj = dateRef.picker.current.confirmedDateObj;
            item.datetimeObj.setFullYear(confirmedDateObj.getFullYear());
            item.datetimeObj.setMonth(confirmedDateObj.getMonth());
            item.datetimeObj.setDate(confirmedDateObj.getDate());
            setItem(new LogRecordItem(item)); // create new item (deep copy) to trigger reload
            closeDialog(dateRef.dialog);
        }
        function confirmTime() {
            const confirmedDateObj = timeRef.picker.current.confirmedDateObj;
            item.datetimeObj.setHours(confirmedDateObj.getHours());
            item.datetimeObj.setMinutes(confirmedDateObj.getMinutes());
            item.datetimeObj.setSeconds(confirmedDateObj.getSeconds());
            item.datetimeObj.setMilliseconds(confirmedDateObj.getMilliseconds());
            setItem(new LogRecordItem(item)); // create new item (deep copy) to trigger reload
            closeDialog(timeRef.dialog);
        }

        // Initialize Datetime Pickers:
        if(dateRef.picker.current) {
            const picker = dateRef.picker.current;
            picker.addEventListener("confirm", confirmDate);
            picker.addEventListener("reset", () => { closeDialog(dateRef.dialog); });
        }
        if(timeRef.picker.current) {
            const picker = timeRef.picker.current;
            picker.addEventListener("confirm", confirmTime);
            picker.addEventListener("reset", () => { closeDialog(timeRef.dialog); });
        }
    }, []);

    return (
        <Form action={action} onSuccess={onSuccess}>
            <HorizontalRow>
                <div>
                    <mdui-text-field ref={dateRef.input} label="Last Seen (Date)" value={item.dateString} defaultValue={item.dateString} readonly onClick={() => { openDialog(dateRef.dialog); }}>
                        <mdui-icon slot="icon" name="calendar_month"></mdui-icon>
                    </mdui-text-field>
                    <mdui-dialog ref={dateRef.dialog} close-on-esc close-on-overlay-click>
                        <date-picker ref={dateRef.picker}>
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
                </div>
                <div>
                    <mdui-text-field ref={timeRef.input} label="Last Seen (Time)" value={item.timeString} defaultValue={item.timeString} readonly onClick={() => { openDialog(timeRef.dialog); }}>
                        <mdui-icon slot="icon" name="access_time"></mdui-icon>
                    </mdui-text-field>
                    <mdui-dialog ref={timeRef.dialog} close-on-esc close-on-overlay-click>
                        <time-picker ref={timeRef.picker}>
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
                </div>
            </HorizontalRow>
            <HorizontalRow>
                <mdui-select label="Select Category" value={item.category} defaultValue={item.category} name="category" style={{width:"auto"}} >
                    <mdui-menu-item value="Critical">Critical</mdui-menu-item>
                    <mdui-menu-item value="Error">Error</mdui-menu-item>
                    <mdui-menu-item value="Warning">Warning</mdui-menu-item>
                    <mdui-menu-item value="Info">Info</mdui-menu-item>
                    <mdui-menu-item value="Debug">Debug</mdui-menu-item>
                </mdui-select>
                <mdui-text-field label="Name of Docker Container" value={item.source} defaultValue={item.source} name="source"></mdui-text-field>
            </HorizontalRow>
            <HorizontalRow>
                <mdui-text-field label="Search Key" value={item.searchkey} defaultValue={item.searchkey} name="searchkey"></mdui-text-field>
            </HorizontalRow>
            <HorizontalRow>
                <mdui-text-field label="Log Message" value={item.message} defaultValue={item.message} name="message" autosize min-rows="2" max-rows="7" enterkeyhint="enter"></mdui-text-field>
            </HorizontalRow>
            { (item.solution || item.solution === "") && (
                <HorizontalRow>
                    <mdui-text-field label="Add Solution" value={item.solution} defaultValue={item.solution} name="message" autosize min-rows="2" max-rows="7" enterkeyhint="enter"></mdui-text-field>
                </HorizontalRow>
            )}
        </Form>
    );
}

export default RecordForm;