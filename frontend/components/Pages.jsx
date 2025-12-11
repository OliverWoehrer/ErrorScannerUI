// React Components:
import { useEffect, useState, useRef } from 'react';
import ItemFilters from './Filters.jsx';
import { TextForm, FileForm } from './Forms.jsx';
import { LogItemView, RecordItemView, ItemFormView, LogItemListView, RecordItemListView } from "./ItemViews.jsx";

// Material Components:
import 'mdui/components/button-icon.js';
import 'mdui/components/card.js';
import 'mdui/components/collapse.js';
import 'mdui/components/collapse-item.js';
import 'mdui/components/divider.js';
import 'mdui/components/switch.js';
import 'mdui/components/tabs.js';
import 'mdui/components/tab.js';
import 'mdui/components/tab-panel.js';
import 'mdui/components/tooltip.js';

// Local Imports:
import { useFetchData, useFetchDataStream } from '../hooks/useFetchData.js';
import useScreenSize from '../hooks/useScreenSize.js';
import { LogRecordItem } from '../assets/LogRecordItem.js';
import "./../assets/styles.css"
import "./../assets/FileInput.js"

function ListDetailsLayout({ items, Header, ListView, DetailsView }) {
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Global Properties
    ///////////////////////////////////////////////////////////////////////////////////////////////
    
    // References for Collapsable Filter:  
    const collapseRef = useRef(null);
    const triggerRef = useRef(null);
    
    // Filtered Items:
    const [filteredItems, setFilteredItems] = useState(items);
    const [selectedItem, setSelectedItem] = useState(null);
    
    // Layout Conditionals:
    const { isAtMost } = useScreenSize();
    const isSmallerScreen = isAtMost('medium'); // split view for medium (601-992px) and large (993px+)
    

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Helper Functions:
    ///////////////////////////////////////////////////////////////////////////////////////////////

    function showDetails(id) {
        setSelectedItem(items.find(item => item.id === id));
    };

    function hideDetails() {
        setSelectedItem(null);
    };


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Hooks:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    
    // Initialize:
    useEffect(() => {
        // Initialze ESC Key:
        document.body.addEventListener("keydown", function(event) {
            if (event.key === "Escape") {
                hideDetails();
            }
        });

        // Listen On Collapse Open:
        if(collapseRef.current) {
            collapseRef.current.addEventListener("open", () => {
                triggerRef.current.setAttribute("end-icon", "keyboard_arrow_up");
            });
        }

        // Listen On Collapse Close:
        if(collapseRef.current) {
            collapseRef.current.addEventListener("close", () => {
                triggerRef.current.setAttribute("end-icon", "keyboard_arrow_down");
            });
        }
    }, []);


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Sub-Elements:
    ///////////////////////////////////////////////////////////////////////////////////////////////

    const ListElements = items.length > 0 ? (
        <mdui-list>
            {filteredItems.map(item => (<ListView key={item.id} item={item} onClick={showDetails} isSelected={item === selectedItem} />))}
        </mdui-list>
    ) : (
        <div style={{alignItems:'center', display:'flex', justifyContent:'center', margin:'auto'}}>
            <mdui-button-icon icon="search_off" variant="standard"></mdui-button-icon>
            <span>No logs found for the selected filters.</span>
        </div>
    );

    const ListPane = (
        <main className="flex-column">
            <header>
                <mdui-collapse ref={collapseRef}>
                    <mdui-collapse-item trigger="#showFilters">
                        <div slot="header" className="flex-row" style={{padding:"12px 0.5rem 0.5rem"}}>
                            <div>
                                {Header}
                            </div>
                            <mdui-button ref={triggerRef} id="showFilters" variant="text" end-icon="keyboard_arrow_down">Use filters</mdui-button>
                        </div>
                        <div style={{padding:"0 0.5rem"}}>
                            <ItemFilters items={items} updateFilteredItems={setFilteredItems} />
                        </div>
                    </mdui-collapse-item>
                </mdui-collapse>
                <div className="info-text" style={{paddingLeft:"16px"}}>
                    Showing {filteredItems.length} of {items.length}
                </div>
            </header>
            <main>
                {ListElements}
            </main>
        </main>
    );

    const DetailElement = selectedItem && (
        <div className='flex-column'>
            <header>
                <mdui-top-app-bar>
                    <mdui-tooltip content="Close">
                        <mdui-button-icon icon="clear" onClick={hideDetails} />
                    </mdui-tooltip>
                    <mdui-top-app-bar-title>{"#"+selectedItem.id}</mdui-top-app-bar-title>
                </mdui-top-app-bar>
            </header>
            <main>
                <DetailsView item={selectedItem} />
            </main>
        </div>
    );

    function DetailPane() {
        if(isSmallerScreen) { // make details fullscreen overlay on smaller screens
            return(
                <mdui-dialog fullscreen open={DetailElement}>
                    {DetailElement}
                </mdui-dialog>
            );
        } else if(DetailElement) { // details on bigger screen, wrap the details within a card element
            return(
                <aside>
                    <mdui-card variant="elevated" style={{height:"100%",width:"100%"}}>
                        {DetailElement}
                    </mdui-card>
                </aside>
            );
        } else { // no details to show on bigger screen, display placeholder instead
            return(
                <aside>
                    <div>
                        Select a log to see more details
                    </div>
                </aside>
            );
        }
    }

    return(
        <>
            <style>{`
            .list-detail-layout {
                align-items: stretch;
                display: flex;
                flex-direction: row;
                height: 100%;
                box-sizing: border-box;
            }
            .list-detail-layout > main {
                flex-basis: 0%;
                flex-grow: 1;
                flex-shrink: 1;
                min-width: 0;
                height: 100%;
            }
            .list-detail-layout > aside {
                box-sizing: border-box;
                flex-basis: 0%;
                flex-grow: 1;
                flex-shrink: 1;
                padding: 12px;

                align-items: center;
                display: flex;
                flex-direction: column;
                height: 100%;
                justify-content: center;
            }
            `}</style>
            <div className="list-detail-layout">
                {ListPane}
                <DetailPane />
            </div>
        </>
    );
}

export function LogsPage() {
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Global Properties
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const { isLoading, data:items, reloadData } = useFetchDataStream("/api/logs"); // rename generic 'data' to 'items' on import


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Hooks:
    ///////////////////////////////////////////////////////////////////////////////////////////////

    // Update Loading Animation:
    const loadingAnimationRef = useRef(null);
    useEffect(() => {
        loadingAnimationRef.current.loading = isLoading;
    }, [isLoading]);


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Sub-Elements:
    ///////////////////////////////////////////////////////////////////////////////////////////////

    const HeaderElement = (
        <>
            <mdui-button ref={loadingAnimationRef} onClick={() => {reloadData()}} variant="filled" icon="refresh">Refresh logs</mdui-button>
        </>
    );

    return(
        <ListDetailsLayout items={items} Header={HeaderElement} ListView={LogItemListView} DetailsView={LogItemView}/>
    );
}

export function RecordsPage() {
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Global Properties
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const { isLoading, data:items, reloadData } = useFetchDataStream("/api/records");
    const { isAtMost } = useScreenSize();
    const isSmallerScreen = isAtMost('medium'); // split view for medium (601-992px) and large (993px+)

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Helper Functions:
    ///////////////////////////////////////////////////////////////////////////////////////////////

    const newRecordDialogRef = useRef(null);
    function openDialog() {
        const dialog = newRecordDialogRef.current;
        if(dialog) {
            dialog.open = true;
        }
    }

    function closeDialog() {
        const dialog = newRecordDialogRef.current;
        if(dialog) {
            dialog.open = false;
        }
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Hooks:
    ///////////////////////////////////////////////////////////////////////////////////////////////

    // Update Loading Animation:
    const loadingAnimationRef = useRef(null);
    useEffect(() => {
        if(loadingAnimationRef.current) {
            loadingAnimationRef.current.loading = isLoading;
        }
    }, [isLoading]);


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Sub-Elements:
    ///////////////////////////////////////////////////////////////////////////////////////////////

    const HeaderElement = (
        <>
            <mdui-button ref={loadingAnimationRef} onClick={reloadData} variant="filled" icon="refresh">Refresh records</mdui-button>
            <mdui-button onClick={openDialog} variant="text" icon="note_add">Add new record</mdui-button>
            <mdui-dialog ref={newRecordDialogRef} close-on-esc close-on-overlay-click fullscreen={isSmallerScreen}>
                <div className="flex-column">
                    <mdui-top-app-bar>
                        <mdui-button-icon icon="clear" onClick={closeDialog} />
                        <mdui-top-app-bar-title>Add new record</mdui-top-app-bar-title>
                    </mdui-top-app-bar>
                    <ItemFormView item={new LogRecordItem()} onSuccess={closeDialog} onReset={closeDialog} />
                </div>
            </mdui-dialog>
        </>
    );

    return(
        <ListDetailsLayout items={items} Header={HeaderElement} ListView={RecordItemListView} DetailsView={RecordItemView} />
    );
}

function FeedLayout({ children }) {
    return (
        <>
            <style>{`
            .feed-layout {
                align-content: flex-start;
                align-items: stretch;
                box-sizing: border-box;
                display: flex;
                flex-wrap: wrap;
                height: 100%;
                justify-content: flex-start;
                gap: 12px;
                overflow-y: auto;
                padding: 12px;
            }
            .feed-layout > * {
                width: 32%;
            }
            @media (max-width:1200px) {
                .feed-layout > * {
                    width: 49%;
                }
            }
            @media (max-width:993px) {
                .feed-layout > * {
                    width: 99%;
                }
            }
            `}</style>
            <div className="feed-layout">
                {children}
            </div>
        </>
    );
}

export function SettingsPage() {
    function DockerInterfaceForm({endpoint}) {
        // Fetch Form Values:
        const {isLoading,data,reloadData} = useFetchData(endpoint);

        // Conditional Rendering:
        const Network = (isLoading || !data) ? (
            <mdui-text-field label="Docker Network" disabled>
                <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
            </mdui-text-field>
        ) : (
            <mdui-text-field label="Docker Network" name="network" value={data.network} defaultValue={data.network}></mdui-text-field>
        );

        const Whitelist = (isLoading || !data) ? (
            <mdui-text-field label="Whitelist" name="whitelist" autosize min-rows="5" max-rows="5" disabled>
                <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
            </mdui-text-field>
        ) : (
            <mdui-text-field label="Whitelist" name="whitelist" value={data.whitelist} defaultValue={data.whitelist} autosize min-rows="5" max-rows="5"></mdui-text-field>
        );
        
        const Blacklist = (isLoading || !data) ? (
            <mdui-text-field label="Blacklist" name="blacklist" autosize min-rows="5" max-rows="5" disabled>
                <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
            </mdui-text-field>
        ) : (
            <mdui-text-field label="Blacklist" name="blacklist" value={data.blacklist} defaultValue={data.blacklist} autosize min-rows="5" max-rows="5"></mdui-text-field>
        );

        // Return Final Component:
        return(
            <mdui-card variant="elevated">
                <TextForm action="/api/form/docker-interface" submitButtonText="Save changes" resetButtonText="Discard changes" onSuccess={reloadData}>
                    <mdui-top-app-bar-title>Docker Interface</mdui-top-app-bar-title>
                    <section>
                        <h4>Network Interface</h4>
                        <span>Docker network to log messages from</span>
                        {Network}
                    </section>
                    <section>
                        <h4>Filter Lists</h4>
                        <span>Filter docker containers based on their name or id</span>
                        <mdui-tabs value="whitelist" full-width style={{backgroundColor:"inherit"}} variant="secondary">
                            <mdui-tab value="whitelist" style={{backgroundColor:"inherit"}}>Whitelist</mdui-tab>
                            <mdui-tab value="blacklist" style={{backgroundColor:"inherit"}}>Blacklist</mdui-tab>
                            <mdui-tab-panel slot="panel" value="whitelist">
                                {Whitelist}
                            </mdui-tab-panel>
                            <mdui-tab-panel slot="panel" value="blacklist">
                                {Blacklist}
                            </mdui-tab-panel>
                        </mdui-tabs>
                    </section>
                </TextForm>
            </mdui-card>
        );
    }

    function LogScannerForm({endpoint}) {
        // Fetch Form Values:
        const {isLoading,data,reloadData} = useFetchData(endpoint);

        // Conditional Rendering:
        const Critical = (isLoading || !data) ? (
            <>
                <mdui-text-field label="Critical" disabled>
                    <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
                </mdui-text-field>
                <mdui-switch disabled></mdui-switch>
                <mdui-switch disabled></mdui-switch>
            </>
        ) : (
            <>
                <mdui-text-field label="Critical" name="tags_critical" value={data.tags_critical} defaultValue={data.tags_critical}></mdui-text-field>
                <mdui-switch name="logging_critical" checked={data.logging_critical} defaultChecked={data.logging_critical}></mdui-switch>
                <mdui-switch name="recording_critical" checked={data.recording_critical} defaultChecked={data.recording_critical}></mdui-switch>
            </>
        );
        const Error = (isLoading || !data) ? (
            <>
                <mdui-text-field label="Error" disabled>
                    <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
                </mdui-text-field>
                <mdui-switch disabled></mdui-switch>
                <mdui-switch disabled></mdui-switch>
            </>
        ) : (
            <>
                <mdui-text-field label="Error" name="tags_error" value={data.tags_error} defaultValue={data.tags_error}></mdui-text-field>
                <mdui-switch name="logging_error" checked={data.logging_error} defaultChecked={data.logging_error}></mdui-switch>
                <mdui-switch name="recording_error" checked={data.recording_error} defaultChecked={data.recording_error}></mdui-switch>
            </>
        );
        const Warning = (isLoading || !data) ? (
            <>
                <mdui-text-field label="Warning" disabled>
                    <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
                </mdui-text-field>
                <mdui-switch disabled></mdui-switch>
                <mdui-switch disabled></mdui-switch>
            </>
        ) : (
            <>
                <mdui-text-field label="Warning" name="tags_warning" value={data.tags_warning} defaultValue={data.tags_warning}></mdui-text-field>
                <mdui-switch name="logging_warning" checked={data.logging_warning} defaultChecked={data.logging_warning}></mdui-switch>
                <mdui-switch name="recording_warning" checked={data.recording_warning} defaultChecked={data.recording_warning}></mdui-switch>
            </>
        );
        const Info = (isLoading || !data) ? (
            <>
                <mdui-text-field label="Info" disabled>
                    <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
                </mdui-text-field>
                <mdui-switch disabled></mdui-switch>
                <mdui-switch disabled></mdui-switch>
            </>
        ) : (
            <>
                <mdui-text-field label="Info" name="tags_info" value={data.tags_info} defaultValue={data.tags_info}></mdui-text-field>
                <mdui-switch name="logging_info" checked={data.logging_info} defaultChecked={data.logging_info}></mdui-switch>
                <mdui-switch name="recording_info" checked={data.recording_info} defaultChecked={data.recording_info}></mdui-switch>
            </>
        );
        const Debug = (isLoading || !data) ? (
            <>
                <mdui-text-field label="Debug" disabled>
                    <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
                </mdui-text-field>
                <mdui-switch disabled></mdui-switch>
                <mdui-switch disabled></mdui-switch>
            </>
        ) : (
            <>
                <mdui-text-field label="Debug" name="tags_debug" value={data.tags_debug} defaultValue={data.tags_debug}></mdui-text-field>
                <mdui-switch name="logging_debug" checked={data.logging_debug} defaultChecked={data.logging_debug}></mdui-switch>
                <mdui-switch name="recording_debug" checked={data.recording_debug} defaultChecked={data.recording_debug}></mdui-switch>
            </>
        );

        // Return Final Component:
        return (
            <mdui-card variant="elevated">
                <TextForm action="/api/form/scanner" submitButtonText="Save changes" resetButtonText="Discard changes" onSuccess={reloadData}>
                    <mdui-top-app-bar-title>Log Scanner</mdui-top-app-bar-title>
                    <div>
                        <h4>Logs</h4>
                        <span>Categorize log messages based on their tag and select which ones to log</span>
                    </div>
                    <section className="flex-row">
                        <div style={{ width: "100%" }}></div>
                        <mdui-tooltip
                            variant="rich"
                            headline="Log Category"
                            content="Enable which message category should be logged and which ones should be ignored">
                            <div style={{ display: "flex", alignItems: "center" }} className="info-text">
                                Logging <mdui-icon name="info--outlined" style={{ fontSize: "1rem" }}></mdui-icon>
                            </div>
                        </mdui-tooltip>
                        <mdui-tooltip
                            variant="rich"
                            headline="Auto Record"
                            content="Enable which message category should be automatically added to records if unknown"
                            style={{ display: "flex", alignItems: "center" }} className="info-text">
                            <div style={{ display: "flex", alignItems: "center" }} className="info-text">
                                Record <mdui-icon name="info--outlined" style={{ fontSize: "1rem" }}></mdui-icon>
                            </div>
                        </mdui-tooltip>
                    </section>
                    <section className="flex-row">
                        {Critical}
                    </section>
                    <section className="flex-row">
                        {Error}
                    </section>
                    <section className="flex-row">
                        {Warning}
                    </section>
                    <section className="flex-row">
                        {Info}
                    </section>
                    <section className="flex-row">
                        {Debug}
                    </section>
                </TextForm>
            </mdui-card>
        ); 
    }
    
    function DiskUsageForm({endpoint}) {
        // Fetch Form Values:
        const {isLoading,data,reloadData} = useFetchData(endpoint);

        // Conditional Rendering:
        const MaxLogs = (isLoading || !data) ? (
            <mdui-text-field label="Maximum number of logs" disabled>
                <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
            </mdui-text-field>
        ) : (
            <mdui-text-field label="Maximum number of logs" name="max_logs" value={data.max_logs} defaultValue={data.max_logs}></mdui-text-field>
        );
        
        // Return Final Component:
        return(
            <mdui-card variant="elevated">
                <TextForm action={endpoint} submitButtonText="Save changes" resetButtonText="Discard changes" onSuccess={reloadData}>
                    <mdui-top-app-bar-title>Disk Usage</mdui-top-app-bar-title>
                    <h4>Size</h4>
                    <span>Set the maximum number of logs to keep</span>
                    <section>
                        {MaxLogs}
                    </section>
                </TextForm>
            </mdui-card>
        )
    };

    function DatebaseForm({endpoint}) {
        // Fetch Form Values:
        const {isLoading,data,reloadData} = useFetchData(endpoint);

        // Conditional Rendering:
        const Host = (isLoading || !data) ? (
            <mdui-text-field label="Host" disabled>
                <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
            </mdui-text-field>
        ) : (
            <mdui-text-field label="Host" name="host" value={data.host} defaultValue={data.host}></mdui-text-field>
        );
        const Port = (isLoading || !data) ? (
            <mdui-text-field label="Port" disabled>
                <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
            </mdui-text-field>
        ) : (
            <mdui-text-field label="Port" name="port" value={data.port} defaultValue={data.port}></mdui-text-field>
        );
        const Path = (isLoading || !data) ? (
            <mdui-text-field label="Path" disabled>
                <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
            </mdui-text-field>
        ) : (
            <mdui-text-field label="Path" name="path" value={data.path} defaultValue={data.path}></mdui-text-field>
        );
        const Key = (isLoading || !data) ? (
            <mdui-text-field label="Key" disabled>
                <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
            </mdui-text-field>
        ) : (
            <mdui-text-field label="Key" name="key" value={data.key} defaultValue={data.key}></mdui-text-field>
        );

        return(
            <mdui-card variant="elevated">
                <TextForm action={endpoint} submitButtonText="Save changes" resetButtonText="Discard changes" onSuccess={reloadData}>
                    <mdui-top-app-bar-title>Database</mdui-top-app-bar-title>
                    <h4>Endpoint</h4>
                    <span>Set the URL and port of the database interface</span>
                    <section>
                        {Host}
                    </section>
                    <section>
                        {Port}
                    </section>
                    <section>
                        {Path}
                    </section>
                    <section>
                        {Key}
                    </section>
                </TextForm>
            </mdui-card>
        );
    }

    function FileExchangeForm({endpoint}) {
        return(
            <mdui-card variant="elevated">
                <mdui-top-app-bar-title>File Exchange</mdui-top-app-bar-title>
                <section>
                    <h4>Records File</h4>
                    <div>Download or upload records file. The file has to be in JSONLines format (.jsonl)</div>
                </section>
                <section>
                    <mdui-button variant="outlined" full-width href={endpoint} icon="download">Download File</mdui-button>
                </section>
                <section>
                    <FileForm action={endpoint}>
                        <div className="outlined flex-row">
                            <div style={{flexGrow:"1"}}>
                                <file-input helper-text="Select a file"></file-input>
                            </div>
                            <mdui-button variant="tonal" type="submit" icon="upload">Upload File</mdui-button>
                        </div>
                    </FileForm>
                </section>
            </mdui-card>
        );
    }

    return(
        <FeedLayout>
            <DockerInterfaceForm endpoint="/api/form/docker-interface"/>
            <LogScannerForm endpoint="/api/form/scanner"/>
            <DiskUsageForm endpoint="/api/form/disk-usage"/>
            <DatebaseForm endpoint="/api/form/database"/>
            <FileExchangeForm endpoint="/api/file/records"/>
        </FeedLayout>
    );
}