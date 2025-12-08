// React Components:
import { useEffect, useRef, useState } from "react";

// Material Components:
import 'mdui/components/button.js';
import 'mdui/components/button-icon.js';
import 'mdui/components/dialog.js';
import 'mdui/components/top-app-bar-title.js';
import 'mdui/components/text-field.js';

// Local Import:
import "../assets/DatePicker.js"
import "../assets/TimePicker.js"

///////////////////////////////////////////////////////////////////////////////////////////////
// Helper Functions:
///////////////////////////////////////////////////////////////////////////////////////////////
function toDateString(date) {
    console.assert(date instanceof Date, "Given parameter has to be of Type 'Date'");
    return date.toLocaleString("fr-CH").split(" ")[0];
}

function toTimeString(date) {
    console.assert(date instanceof Date, "Given parameter has to be of Type 'Date'");
    return date.toLocaleString("fr-SH").split(" ")[1];
}


///////////////////////////////////////////////////////////////////////////////////////////////
// Exported Components:
///////////////////////////////////////////////////////////////////////////////////////////////
export function DatePicker({ name, readonly, datetimeObj, onConfirm }) {
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Global Properties
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const init = datetimeObj ? new Date(datetimeObj) : new Date();
    const [dateObj, setDateObj] = useState(init); // if no date is given, use current date as fallback
    const dialogRef = useRef(null);
    const pickerRef = useRef(null);


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Event Handler:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    function openDialog() {
        if(!readonly) { // only open if writeable
            const dialog = dialogRef.current;
            if(dialog) { dialog.open = true; }
        }
    }

    function closeDialog() {
        const dialog = dialogRef.current;
        if(dialog) { dialog.open = false; }
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Hooks:
    ///////////////////////////////////////////////////////////////////////////////////////////////

    // Initialize Datetime Picker:
    useEffect(() => {
        // Initialize Picker Element:
        function confirmHandler() {
            const confirmedDateObj = pickerRef.current.confirmedDateObj;
            if(onConfirm) { onConfirm(confirmedDateObj); }
            dateObj.setFullYear(confirmedDateObj.getFullYear());
            dateObj.setMonth(confirmedDateObj.getMonth());
            dateObj.setDate(confirmedDateObj.getDate());
            setDateObj(new Date(dateObj)); // create new date (deep copy) to trigger reload
            closeDialog();
        }
        const picker = pickerRef.current;
        if(picker) {
            picker.selectedDateObj = dateObj;
            picker.addEventListener("confirm", confirmHandler);
            picker.addEventListener("reset", closeDialog);
        }

        // Initialize Dialog:
        function closeHandler() {
            const confirmedDateObj = pickerRef.current.confirmedDateObj;
            pickerRef.current.selectedDateObj = confirmedDateObj;
        }
        const dialog = dialogRef.current;
        if(dialog) {
            dialog.addEventListener("close", closeHandler);
        }
    }, [dateObj]);

    // Update dateObj if datetimeObj input changes
    useEffect(() => {
        if(!datetimeObj) { return; }
        setDateObj(datetimeObj);
        if(pickerRef.current) {
            pickerRef.current.confirmedDateObj = datetimeObj;
        }
    }, [datetimeObj]);

    return(
        <>
            {/* Input Field */}
            <mdui-text-field label="Last Seen (Date)" value={toDateString(dateObj)} defaultValue={toDateString(dateObj)} name={name?(name+"-date"):"date"} readonly onClick={openDialog}>
                <mdui-icon slot="icon" name="calendar_month"></mdui-icon>
            </mdui-text-field>
            {/* Dialog with Picker */}
            <mdui-dialog ref={dialogRef} close-on-esc close-on-overlay-click>
                <date-picker ref={pickerRef}>
                    <span slot="supporting-text">Select a date</span>
                    <mdui-top-app-bar-title slot="headline"></mdui-top-app-bar-title>
                    <mdui-button-icon slot="prev-month-btn" icon="keyboard_arrow_left"></mdui-button-icon>
                    <mdui-button-icon slot="next-month-btn" icon="keyboard_arrow_right"></mdui-button-icon>
                    <mdui-button slot="cancel-btn" variant="text">Cancel</mdui-button>
                    <mdui-button slot="confirm-btn">OK</mdui-button>
                </date-picker>
            </mdui-dialog>
        </>
    );
}

export function TimePicker({ name, readonly, datetimeObj, onConfirm }) {
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Global Properties
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const init = datetimeObj ? new Date(datetimeObj) : new Date();
    const [dateObj, setDateObj] = useState(init); // if no date is given, use current date as fallback
    const dialogRef = useRef(null);
    const pickerRef = useRef(null);


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Event Handler:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    function openDialog() {
        if(!readonly) { // only open if writeable
            const dialog = dialogRef.current;
            if(dialog) { dialog.open = true; }
        }
    }

    function closeDialog() {
        const dialog = dialogRef.current;
        if(dialog) { dialog.open = false; }
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Hooks:
    ///////////////////////////////////////////////////////////////////////////////////////////////

    // Initialize Datetime Picker:
    useEffect(() => {
        // Initialize Picker Element:
        function confirmHandler() {
            const confirmedDateObj = pickerRef.current.confirmedDateObj;
            if(onConfirm) { onConfirm(confirmedDateObj); }
            dateObj.setHours(confirmedDateObj.getHours());
            dateObj.setMinutes(confirmedDateObj.getMinutes());
            dateObj.setSeconds(confirmedDateObj.getSeconds());
            dateObj.setMilliseconds(confirmedDateObj.getMilliseconds());
            setDateObj(new Date(dateObj)); // create new date (deep copy) to trigger reload
            closeDialog();
        }
        const picker = pickerRef.current;
        if(picker) {
            picker.addEventListener("confirm", confirmHandler);
            picker.addEventListener("reset", closeDialog);
        }

        // Initialize Dialog:
        function closeHandler() {
            const confirmedDateObj = pickerRef.current.confirmedDateObj;
            pickerRef.current.selectedDateObj = confirmedDateObj;
        }
        const dialog = dialogRef.current;
        if(dialog) {
            dialog.addEventListener("close", closeHandler);
        }
    }, []);

    // Update dateObj if datetimeObj input changes
    useEffect(() => {
        if(!datetimeObj) { return; }
        setDateObj(datetimeObj);
        pickerRef.current.confirmedDateObj = datetimeObj;
    }, [datetimeObj]);

    return(
        <>
            {/* Input Field */}
            <mdui-text-field label="Last Seen (Time)" value={toTimeString(dateObj)} defaultValue={toTimeString(dateObj)} name={name?(name+"-time"):"time"} readonly onClick={openDialog}>
                <mdui-icon slot="icon" name="access_time"></mdui-icon>
            </mdui-text-field>
            {/* Dialog with Picker */}
            <mdui-dialog ref={dialogRef} close-on-esc close-on-overlay-click>
                <time-picker ref={pickerRef}>
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
        </>
    );
}