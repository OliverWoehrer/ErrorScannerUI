// React Components:
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router"
import { TextForm } from './Forms.jsx';

// Material Components:
import 'mdui/components/button.js';
import 'mdui/components/button-icon.js';
import 'mdui/components/divider.js';
import 'mdui/components/icon.js';
import 'mdui/components/list-item.js';
import 'mdui/components/menu-item.js';
import 'mdui/components/select.js';
import 'mdui/components/top-app-bar.js';
import 'mdui/components/top-app-bar-title.js';
import 'mdui/components/tooltip.js';

// Markdown Render Library:
import ZeroMd from 'zero-md';
if(!customElements.get('zero-md')) {
    customElements.define('zero-md', ZeroMd);
}

// Local Import:
import { DatePicker, TimePicker } from './Pickers.jsx';
import { DataItem } from "../assets/DataItem.js";

function ReadOnlyView({ initialItem = new DataItem()}) {
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Global Properties
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const [item, setItem] = useState(initialItem);

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Confirm Picker Handler Functions:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    function confirmDate(confirmedDateObj) {
        item.datetimeObj.setFullYear(confirmedDateObj.getFullYear());
        item.datetimeObj.setMonth(confirmedDateObj.getMonth());
        item.datetimeObj.setDate(confirmedDateObj.getDate());
        setItem(new DataItem(item)); // create new item object to trigger re-render of this component
    }
    function confirmTime(confirmedDateObj) {
        item.datetimeObj.setHours(confirmedDateObj.getHours());
        item.datetimeObj.setMinutes(confirmedDateObj.getMinutes());
        item.datetimeObj.setSeconds(confirmedDateObj.getSeconds());
        item.datetimeObj.setMilliseconds(confirmedDateObj.getMilliseconds());
        setItem(new DataItem(item)); // create new item object to trigger re-render of this component
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Hooks:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    useEffect(() => {}, []);

    return(
        <>
            <section className="flex-row">
                <DatePicker name="date" readonly datetimeObj={item.datetimeObj} onConfirm={confirmDate} />
                <TimePicker name="time" readonly datetimeObj={item.datetimeObj} onConfirm={confirmTime} />
            </section>
            <section className="flex-row">
                <mdui-select label="Category" value={item.category} defaultValue={item.category} name="category" readonly style={{width:"auto"}} >
                    <mdui-menu-item value="critical">Critical</mdui-menu-item>
                    <mdui-menu-item value="error">Error</mdui-menu-item>
                    <mdui-menu-item value="warning">Warning</mdui-menu-item>
                    <mdui-menu-item value="info">Info</mdui-menu-item>
                    <mdui-menu-item value="debug">Debug</mdui-menu-item>
                </mdui-select>
                <mdui-text-field label="Name of Docker Container" value={item.source} defaultValue={item.source} name="source" readonly></mdui-text-field>
            </section>
            {item.matchpattern && ( // show matchpattern if available
                <section>
                    <mdui-text-field label="Match Pattern" value={item.matchpattern || ""} defaultValue={item.matchpattern || ""} name="matchpattern" readonly>
                        <span slot="helper">Enter a Regex to identify this record based on its message string. This helps the system to check if a matching record already exists. Should be as strict as possible to prevent false positive matches.</span>
                    </mdui-text-field>
                </section>
            )}
            <section>
                <mdui-text-field label="Log Message" value={item.message || ""} defaultValue={item.message || ""} name="message" readonly autosize enterkeyhint="enter"></mdui-text-field>
            </section>
            {item.solution && ( // render solution as Markdown if available
                <section>
                    <mdui-card variant="filled" style={{width:"100%"}}>
                        <zero-md>
                            <template>
                                <link rel="stylesheet" href="/github-markdown.css" type="text/html"/>
                            </template>
                            <script type="text/markdown">
                                {item.solution}
                            </script>
                        </zero-md>
                    </mdui-card>
                </section>
            )}
            <input type="hidden" name="id" value={item.id}/>
        </>
    );
}

function EditableView({ initialItem = new DataItem()}) {
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Global Properties
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const [item, setItem] = useState(initialItem);

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Confirm Picker Handler Functions:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    function confirmDate(confirmedDateObj) {
        item.datetimeObj.setFullYear(confirmedDateObj.getFullYear());
        item.datetimeObj.setMonth(confirmedDateObj.getMonth());
        item.datetimeObj.setDate(confirmedDateObj.getDate());
        setItem(new DataItem(item)); // create new item object to trigger re-render of this component
    }
    function confirmTime(confirmedDateObj) {
        item.datetimeObj.setHours(confirmedDateObj.getHours());
        item.datetimeObj.setMinutes(confirmedDateObj.getMinutes());
        item.datetimeObj.setSeconds(confirmedDateObj.getSeconds());
        item.datetimeObj.setMilliseconds(confirmedDateObj.getMilliseconds());
        setItem(new DataItem(item)); // create new item object to trigger re-render of this component
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Hooks:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    useEffect(() => {}, []);

    return(
        <>
            <div className="flex-row">
                <div></div>
                <mdui-tooltip content="You can edit values before you save the data">
                    <div className="flex-row hint">
                        <mdui-icon name='edit' style={{fontSize:"1.0rem"}} ></mdui-icon>
                        <div>Edit values now</div>
                    </div>
                </mdui-tooltip>
                <div></div>
            </div>
            <section className="flex-row">
                <DatePicker name="date" datetimeObj={item.datetimeObj} onConfirm={confirmDate} />
                <TimePicker name="time" datetimeObj={item.datetimeObj} onConfirm={confirmTime} />
            </section>
            <section className="flex-row">
                <mdui-select label="Category" value={item.category} defaultValue={item.category} name="category" style={{width:"auto"}} >
                    <mdui-menu-item value="critical">Critical</mdui-menu-item>
                    <mdui-menu-item value="error">Error</mdui-menu-item>
                    <mdui-menu-item value="warning">Warning</mdui-menu-item>
                    <mdui-menu-item value="info">Info</mdui-menu-item>
                    <mdui-menu-item value="debug">Debug</mdui-menu-item>
                </mdui-select>
                <mdui-text-field label="Name of Docker Container" value={item.source} defaultValue={item.source} name="source"></mdui-text-field>
            </section>
            <section>
                <mdui-text-field label="Match Pattern" value={item.matchpattern || ""} defaultValue={item.matchpattern || ""} name="matchpattern">
                    <span slot="helper">Enter a Regex to identify this record based on its message string. This helps the system to check if a matching record already exists. Should be as strict as possible to prevent false positive matches.</span>
                </mdui-text-field>
            </section>
            <section>
                <mdui-text-field label="Log Message" value={item.message || ""} defaultValue={item.message || ""} name="message" autosize enterkeyhint="enter"></mdui-text-field>
            </section>
            <section>
                <mdui-text-field label="Edit Solution" value={item.solution || ""} defaultValue={item.solution || ""} name="solution" autosize enterkeyhint="enter"></mdui-text-field>
            </section>
            <input type="hidden" name="id" value={item.id}/>
        </>
    );
}

export function LogItemView({ item, onUpdate }) {
    const [isReadonly, setIsReadonly] = useState(true);
    const navigate = useNavigate();

    function toggleMode() {
        setIsReadonly((prev) => !prev);
    }

    function afterUpdate(payload) {
        const updatedItem = new DataItem(payload); // create new item from response
        item.solution = updatedItem.id; // link this item to the newly created record
        if(onUpdate) { onUpdate(updatedItem); }
        setIsReadonly((prev) => !prev);
    }

    function goToRecord() {
        navigate({pathname: "/records", search: `?id=${item.solution}`});
    }

    if(isReadonly) {
        return(
            <div className="flex-column">
                <main>
                    <ReadOnlyView initialItem={item} />
                </main>
                <footer>
                    {item.solution ? ( // ID of matching record is stored as solution
                        <mdui-button onClick={goToRecord} variant="outlined" icon="check">View matching record</mdui-button>
                    ) : (
                        <mdui-button onClick={toggleMode} variant="outlined" icon="add">Add to records</mdui-button>
                    )}
                </footer>
            </div>
        );
    } else {
        return(
            <TextForm action="/api/form/new-record" onSuccess={afterUpdate}>
                <main>
                    <EditableView initialItem={item} />
                </main>
                <footer>
                    <mdui-button type="submit">Add new record</mdui-button>
                    <mdui-button type="reset" onClick={toggleMode} variant="text">Cancel</mdui-button>
                </footer>
            </TextForm>
        );
    }
}

export function RecordItemView({ item, onUpdate, onDelete }) {
    const [mode, setMode] = useState(0);

    function afterDelete() {
        if(onDelete) { onDelete(item.id); }
        setMode(0);
    }

    function afterUpdate(payload) {
        const updatedItem = new DataItem(payload); // create new item from response
        if(onUpdate) { onUpdate(updatedItem); }
        setMode(0);
    }

    if(mode == 2) { // delete mode: confirm delete operation
        return(
            <TextForm action="/api/form/delete-record" onSuccess={afterDelete}>
                <main>
                    <div>Are you sure you want to delete this record?</div>
                    <input type="hidden" name="id" value={item.id}/>
                </main>
                <footer>
                    <mdui-button type="submit">Delete record</mdui-button>
                    <mdui-button type="reset" onClick={() => {setMode(0)}} variant="text">Cancel</mdui-button>
                </footer>
            </TextForm>
        );
    } else if(mode == 1) { // edit mode: confirm updated changes
        return(
            <TextForm action="/api/form/edit-record" onSuccess={afterUpdate}>
                <main>
                    <EditableView initialItem={item} />
                </main>
                <footer>
                    <mdui-button type="submit">Update record</mdui-button>
                    <mdui-button type="reset" onClick={() => {setMode(0)}} variant="text">Cancel</mdui-button>
                </footer>
            </TextForm>
        );
    } else { // default mode: view details
        return(
            <div className="flex-column">
                <main>
                    <ReadOnlyView initialItem={item} />
                </main>
                <footer className="flex-row">
                    <div>
                        <mdui-button onclick={() => {setMode(1)}} variant="outlined" icon="edit">Edit Record</mdui-button>
                        <mdui-button onclick={() => {setMode(2)}} variant="text" icon="delete">Delete Record</mdui-button>
                    </div>
                </footer>
            </div>
        );
    }
}

export function ItemFormView({ item, onSuccess, onReset }) {
    return(
        <TextForm action="/api/form/new-record" onSuccess={onSuccess}>
            <main>
                <EditableView initialItem={item} />
            </main>
            <footer>
                <mdui-button type="submit">Add new record</mdui-button>
                <mdui-button type="reset" onClick={onReset} variant="text">Cancel</mdui-button>
            </footer>
        </TextForm>
    );
}

export function LogItemListView({ item, onClick, isSelected }) {
    return (
        <>
            <mdui-divider middle></mdui-divider>
            <mdui-list-item headline-line={1} description-line={1} onClick={() => onClick(item.id)} active={isSelected} rounded>
                <div>
                    {"["+item.category+"]"} {item.message}
                </div>
                <div slot='description'>
                    {item.datetimeString}
                </div>
                <div slot='end-icon'>
                    <mdui-button variant='text' disabled>
                        {item.solution && (
                            <div>
                                <mdui-icon name='check' style={{fontSize:"1.0rem"}} ></mdui-icon><br/>
                                <span>recorded</span>
                            </div>
                        )}
                    </mdui-button>
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