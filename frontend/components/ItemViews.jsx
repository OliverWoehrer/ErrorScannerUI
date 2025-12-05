// React Components:
import { useEffect, useState, useRef } from 'react';
import Form from './Form.jsx';

// Material Components:
import 'mdui/components/button.js';
import 'mdui/components/button-icon.js';
import 'mdui/components/divider.js';
import 'mdui/components/list-item.js';
import 'mdui/components/top-app-bar.js';
import 'mdui/components/top-app-bar-title.js';

// Local Import:
import { DatePicker, TimePicker } from './Pickers.jsx';
import ZeroMd from 'zero-md';
customElements.define('zero-md', ZeroMd);
import "../assets/TimePicker.js"

function TemplateView({ initItem, readonly }) {
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Helper Functions:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    function openDialog(reference) {
        if(reference.current) { reference.current.open = true; }
    }

    function closeDialog(reference) {
        if(reference.current) { reference.current.open = false; }
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Hooks:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const [item, setItem] = useState(initItem ?? new LogRecordItem()); // if no record is given, use default as fallback
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
            picker.selectedDateObj = item.datetimeObj;
            picker.addEventListener("confirm", confirmDate);
            picker.addEventListener("reset", () => { closeDialog(dateRef.dialog); });
        }
        if(timeRef.picker.current) {
            const picker = timeRef.picker.current;
            picker.selectedDateObj = item.datetimeObj;
            picker.addEventListener("confirm", confirmTime);
            picker.addEventListener("reset", () => { closeDialog(timeRef.dialog); });
        }
    }, []);

    return(
        <>
            <section className="flex-row">
                <DatePicker initItem={item} />
                <TimePicker initItem={item} />
            </section>
            <section className="flex-row">
                <mdui-select label="Category" value={item.category} defaultValue={item.category} name="category" readonly={readonly} style={{width:"auto"}} >
                    <mdui-menu-item value="critical">Critical</mdui-menu-item>
                    <mdui-menu-item value="error">Error</mdui-menu-item>
                    <mdui-menu-item value="warning">Warning</mdui-menu-item>
                    <mdui-menu-item value="info">Info</mdui-menu-item>
                    <mdui-menu-item value="debug">Debug</mdui-menu-item>
                </mdui-select>
                <mdui-text-field label="Name of Docker Container" value={item.source} defaultValue={item.source} name="source" readonly={readonly}></mdui-text-field>
            </section>
            <section>
                <mdui-text-field label="Search Key" value={item.searchkey} defaultValue={item.searchkey} name="searchkey" readonly={readonly}>
                    <span slot="helper">String to identify this record. Should be a sub-string of the original log message.</span>
                </mdui-text-field>
            </section>
            <section>
                <mdui-text-field label="Log Message" value={item.message} defaultValue={item.message} name="message" readonly={readonly} autosize enterkeyhint="enter"></mdui-text-field>
            </section>
            {readonly && item.solution && (
                <section>
                    <mdui-card variant="filled" style={{width:"100%"}}>
                        <zero-md>
                            <template>
                                <link rel="stylesheet" href="/github-markdown.css" />
                            </template>
                            <script type="text/markdown">
                                {item.solution}
                            </script>
                        </zero-md>
                    </mdui-card>
                </section>
            )}
            {!readonly && (
                <section>
                    <mdui-text-field label="Edit Solution" value={item.solution} defaultValue={item.solution} name="message" readonly={readonly} autosize enterkeyhint="enter"></mdui-text-field>
                </section>
            )}
        </>
    );
}

export function LogItemView({ item }) {
    const [isReadonly, setIsReadonly] = useState(true);

    function toggleMode() {
        setIsReadonly((prev) => !prev);
    }

    if(isReadonly) {
        return(
            <div className="flex-column">
                <main>
                    <TemplateView initItem={item} readonly={true} />
                </main>
                <footer>
                    <mdui-button onclick={toggleMode} variant="outlined" icon="add">Add to records</mdui-button>
                </footer>
            </div>
        );
    } else {
        return(
            <Form action="/api/form/new-record" submitButtonText="Save new record" resetButtonText="Do not save" onSuccess={toggleMode} onReset={toggleMode}>
                <TemplateView initItem={item} readonly={false} />
            </Form>
        );
    }
}

export function RecordItemView({ item }) {
    const [isReadonly, setIsReadonly] = useState(true);

    function toggleMode() {
        setIsReadonly((prev) => !prev);
    }

    if(isReadonly) {
        return(
            <div className="flex-column">
                <main>
                    <TemplateView initItem={item} readonly={true} />
                </main>
                <footer>
                    <mdui-button onclick={toggleMode} variant="outlined" icon="edit">Edit Record</mdui-button>
                    <mdui-button onclick={toggleMode} variant="text" icon="delete">Delete Record</mdui-button>
                </footer>
            </div>
        );
    } else {
        return(
            <Form action="/api/form/edit-record" submitButtonText="Update record" resetButtonText="Discard changes" onSuccess={toggleMode} onReset={toggleMode}>
                <TemplateView initItem={item} readonly={false} />
            </Form>
        );
    }
}

export function ItemFormView({ item, onSuccess, onReset }) {
    return(
        <Form action="/api/form/new-record" submitButtonText="Add new record" resetButtonText="Discard changes" onSuccess={onSuccess} onReset={onReset}>
            <TemplateView initItem={item} readonly={false} />
        </Form>
    );
}

export function LogItemListView({ item, onClick, isSelected }) {
    return (
        <>
            <mdui-divider middle></mdui-divider>
            <mdui-list-item headline-line={1} description-line={1} onClick={() => onClick(item.id)} active={isSelected} rounded>
                <div>
                    {item.message}
                </div>
                <div slot='description'>
                    {item.datetimeString}
                </div>
                <div slot='end-icon'>
                    <mdui-button variant='text' disabled>{item.category}</mdui-button>
                </div>
            </mdui-list-item>
        </>
    );
};

export function RecordItemListView({ item, onClick, isSelected }) {
    return (
        <>
            <mdui-divider middle></mdui-divider>
            <mdui-list-item headline-line={1} description-line={1} onClick={() => onClick(item.id)} active={isSelected} rounded>
                <div>
                    {item.message}
                </div>
                <div slot='description'>
                    {item.category}
                </div>
                <div slot='end-icon'>
                    <mdui-button variant='text' disabled>{item.solution? "solved" : null}</mdui-button>
                </div>
            </mdui-list-item>
        </>
    );
}