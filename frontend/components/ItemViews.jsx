// React Components:
import { useEffect, useState, useRef } from 'react';
import { TextForm } from './Forms.jsx';

// Material Components:
import 'mdui/components/button.js';
import 'mdui/components/button-icon.js';
import 'mdui/components/divider.js';
import 'mdui/components/list-item.js';
import 'mdui/components/menu-item.js';
import 'mdui/components/select.js';
import 'mdui/components/top-app-bar.js';
import 'mdui/components/top-app-bar-title.js';
import 'mdui/components/tooltip.js';

// Local Import:
import { DatePicker, TimePicker } from './Pickers.jsx';
import ZeroMd from 'zero-md';
customElements.define('zero-md', ZeroMd);
import "../assets/TimePicker.js"

function TemplateView({ initItem, readonly }) {
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Confirm Picker Handler Functions:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    function confirmDate(confirmedDateObj) {
        item.datetimeObj.setFullYear(confirmedDateObj.getFullYear());
        item.datetimeObj.setMonth(confirmedDateObj.getMonth());
        item.datetimeObj.setDate(confirmedDateObj.getDate());
        setItem(new LogRecordItem(item)); // create new item (deep copy) to trigger reload
    }
    function confirmTime(confirmedDateObj) {
        item.datetimeObj.setHours(confirmedDateObj.getHours());
        item.datetimeObj.setMinutes(confirmedDateObj.getMinutes());
        item.datetimeObj.setSeconds(confirmedDateObj.getSeconds());
        item.datetimeObj.setMilliseconds(confirmedDateObj.getMilliseconds());
        setItem(new LogRecordItem(item)); // create new item (deep copy) to trigger reload
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Hooks:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const [item, setItem] = useState(initItem ?? new LogRecordItem()); // if no record is given, use default as fallback

    useEffect(() => {}, []);

    return(
        <>
            <div className="flex-row">
                <div></div>
                <div className="flex-row info-text">
                    {readonly ? (
                        <span><mdui-icon name='lock' style={{fontSize:"1.0rem"}} ></mdui-icon> Read Only Mode</span>
                    ) : (
                        <span><mdui-icon name='edit' style={{fontSize:"1.0rem"}} ></mdui-icon> Edit Mode</span>
                    )}
                </div>
                <div></div>
            </div>
            <section className="flex-row">
                <DatePicker name="date" readonly={readonly} datetimeObj={item.datetimeObj} onConfirm={confirmDate} />
                <TimePicker name="time" readonly={readonly} datetimeObj={item.datetimeObj} onConfirm={confirmTime} />
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
            <input type="hidden" name="id" value={item.id}/>
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
                <footer className="flex-row">
                    <mdui-button onclick={toggleMode} variant="outlined" icon="add">Add to records</mdui-button>
                </footer>
            </div>
        );
    } else {
        return(
            <TextForm action="/api/form/new-record" submitButtonText="Save new record" resetButtonText="Cancel" onSuccess={toggleMode} onReset={toggleMode}>
                <TemplateView initItem={item} readonly={false} />
            </TextForm>
        );
    }
}

export function RecordItemView({ item }) {
    const [mode, setMode] = useState(0);

    function updateMode(mode) {
        if(mode) {
            setMode(mode);
        } else {
            setMode(0);
        }
    }

    if(mode == 2) { // delete mode: confirm delete operation
        return(
            <TextForm action="/api/form/delete-record" submitButtonText="Delete record" resetButtonText="Cancel" onSuccess={updateMode} onReset={updateMode}>
                <div>Are you sure you want to delete this record?</div>
            </TextForm>
        );
    } else if(mode == 1) { // edit mode: confirm updated changes
        return(
            <TextForm action="/api/form/edit-record" submitButtonText="Update record" resetButtonText="Cancel" onSuccess={updateMode} onReset={updateMode}>
                <TemplateView initItem={item} readonly={false} />
            </TextForm>
        );
    } else { // default mode: view details
        return(
            <div className="flex-column">
                <main>
                    <TemplateView initItem={item} readonly={true} />
                </main>
                <footer className="flex-row">
                    <div>
                        <mdui-button onclick={() => {updateMode(1)}} variant="outlined" icon="edit">Edit Record</mdui-button>
                        <mdui-button onclick={() => {updateMode(2)}} variant="text" icon="delete">Delete Record</mdui-button>
                    </div>
                </footer>
            </div>
        );
    }
}

export function ItemFormView({ item, onSuccess, onReset }) {
    return(
        <TextForm action="/api/form/new-record" submitButtonText="Add new record" resetButtonText="Cancel" onSuccess={onSuccess} onReset={onReset}>
            <TemplateView initItem={item} readonly={false} />
        </TextForm>
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