// React Components:
import { useEffect, useState, useRef } from 'react';
import { ListDetailLayout } from '../Layouts';
import RecordItemView from '../RecordItemView';
import DetailsView from '../DetailsView';
import TopBar from '../TopBar';
import RecordForm from '../RecordForm.jsx';
import Form from '../Form.jsx';

// Material Components:
import 'mdui/components/button-icon.js';
import 'mdui/components/fab.js';
import 'mdui/components/list.js';
import 'mdui/components/select.js';
import 'mdui/components/menu-item.js';
import 'mdui/components/text-field.js';

// Local Imports:
import { openDialog, closeDialog, searchFunction } from '../../assets/scripts.js'
import HorizontalRow from '../HorizontalRow.jsx';

function Records() {
    const [items, setItems] = useState([]);
    const snackBarRef = useRef(null);
    const textSearchRef = useRef(null);
    const loadingAnimationRef = useRef(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        // Fetch Records:
        fetchItems("/api/records");

        // Initialize Search Function:
        if(textSearchRef.current) textSearchRef.current.addEventListener("input", textSearch);

        // Initialze ESC Key:
        document.body.addEventListener("keydown", function(event) {
            if (event.key === "Escape") {
                closeDetails();
            }
        })

    }, []); // fetch data only once

    /**
     * Update items if the filter changes
     */
    useEffect(() => {
        let filtered = items
        if(searchQuery) {
            console.log("aplpy search query");
            filtered = filtered.filter(item => searchFunction(item, searchQuery));
            console.log("filtered.length = "+filtered.length);
        }
        setFilteredItems(filtered);
    }, [items, searchQuery]);

    /**
     * Fetches items from the given path. The response has to be in JSON Lines format so they can
     * be parsed dynamically
     * @param {string} url path to fetch items from
     */
    async function fetchItems(url) {
        // Enable Loading Animation:
        loadingAnimationRef.current.loading = true;

        try {
            // Fetch Items:
            const response = await fetch(url);
            if(!response.ok) {
                snackBarRef.current.textContent = `Failed to fetch records [${response.status} ${response.statusText}]`;
                snackBarRef.current.open = true;
                return;
            }
            const reader = response.body.getReader()// decode bytes to text chungs
            setItems([]); // clear current items after successful request

            // Read Incoming Stream:
            let buffer = ''; // byte buffer to accumulate chunks
            while(true) {
                const { done, value } = await reader.read();
                buffer += new TextDecoder().decode(value);
                let newlineIndex;
                while((newlineIndex = buffer.indexOf('\n')) !== -1) {
                    const line = buffer.substring(0, newlineIndex);
                    buffer = buffer.substring(newlineIndex + 1); // advance buffer past the line (including the newline character)
                    let trimmed = line.trim() // remove whitespaces
                    if(!trimmed) { continue; } // skip loop on empty line 
                    try {
                        const jsonObject = JSON.parse(trimmed);
                        setItems(prevItems => [...prevItems, jsonObject])
                    } catch(e) {
                        console.error(`Error parsing JSON "${trimmed}": ${e}`);
                    }
                }
                if(done) { break; }
            }
        } catch (error) {
            console.error("Failed to fetch items:", error);
        } finally {
            // Disable Loading Animation:
            loadingAnimationRef.current.loading = false;
        }
    }

    function openDetails(id) {
        setSelectedItem(items.find(item => item.id === id));
    };

    function closeDetails() {
        setSelectedItem(null);
    };

    function textSearch() {
        const query = textSearchRef.current.value;
        setSearchQuery(String(query).toLocaleLowerCase());
    }


    const ListHeader = (
        <>
            <HorizontalRow>
                <mdui-tooltip content="Add new record">
                    <mdui-fab ref={loadingAnimationRef} onClick={() => (openDialog("add-record"))} icon="note_add">Add new record</mdui-fab>
                </mdui-tooltip>
                <mdui-text-field ref={textSearchRef} type="search" label="Search for records or container names" clearable>
                    <mdui-icon slot="icon" name="search"></mdui-icon>
                </mdui-text-field>
            </HorizontalRow>
            <section style={{alignItems:"center", display:"flex", gap:"8px", overflowX:"auto", justifyContent:"flex-start"}}>
            </section>
            <span className="info-text">Showing {filteredItems.length} of {items.length}</span>
            <mdui-dialog id="add-record" close-on-esc close-on-overlay-click>
                <TopBar title="Add new record" closeFunction={() => (closeDialog("add-record"))}></TopBar>
                <Form action="#">
                    <section>
                        <div>
                            <mdui-text-field label="Last seen" type="datetime-local" name="time"></mdui-text-field>
                        </div>
                        <div>
                            <mdui-select label="Select Category" value="Error" name="category">
                                <mdui-menu-item value="Critical">Critical</mdui-menu-item>
                                <mdui-menu-item value="Error">Error</mdui-menu-item>
                                <mdui-menu-item value="Warning">Warning</mdui-menu-item>
                                <mdui-menu-item value="Info">Info</mdui-menu-item>
                                <mdui-menu-item value="Debug">Debug</mdui-menu-item>
                            </mdui-select>
                        </div>
                        <div>
                            <mdui-text-field label="Docker Container" value="" defaultValue="" name="source"></mdui-text-field>
                        </div>
                        <div>
                            <mdui-text-field label="Log Message" value="" defaultValue="" name="message" autosize max-rows="7" enterkeyhint="enter" ></mdui-text-field>
                        </div>
                        <div>
                            <mdui-text-field label="Add Solution" value="" defaultValue="" name="solution" autosize max-rows="7" enterkeyhint="enter"></mdui-text-field>
                        </div>
                    </section>
                </Form>
            </mdui-dialog>
        </>
    );

    const ListPane = filteredItems.length > 0 ? (
        <mdui-list>
            {filteredItems.map(item => (<RecordItemView key={item.id} log={item} onClick={openDetails} isSelected={item === selectedItem} />))}
        </mdui-list>
    ) : (
        <div style={{alignItems:'center', display:'flex', justifyContent:'center', margin:'auto'}}>
            <mdui-button-icon icon="search_off" variant="standard"></mdui-button-icon>
            <span>No logs found for the selected filters.</span>
        </div>
    );

    const TopBarElement = selectedItem && (
        <>
            <TopBar title={"#"+selectedItem.id} closeFunction={closeDetails}>
                <mdui-button-icon icon="delete" onClick={() => (openDialog("delete-record"))}></mdui-button-icon>
                <mdui-button-icon icon="edit" onClick={() => (openDialog("edit-record"))}></mdui-button-icon>
            </TopBar>
            <mdui-dialog id="edit-record" close-on-esc close-on-overlay-click>
                <TopBar title={"Edit Record #"+selectedItem.id} closeFunction={() => (closeDialog("edit-record"))}></TopBar>
                <RecordForm action="#" record={selectedItem}></RecordForm>
            </mdui-dialog>
            <mdui-dialog id="delete-record" close-on-esc close-on-overlay-click>
                <TopBar title={"Delete Record #"+selectedItem.id} closeFunction={() => (closeDialog("delete-record"))}></TopBar>
                <Form action="#">
                    <section>
                        <input type="hidden" name="confirm" value={true}/>
                        Do you want to delete this record?
                    </section>
                </Form>
            </mdui-dialog>
        </>
    );

    const DetailPane = selectedItem && (
        <DetailsView top={TopBarElement} log={selectedItem} />
    );

    return(
        <>
            <mdui-snackbar ref={snackBarRef}></mdui-snackbar>
            <ListDetailLayout listHeader={ListHeader} list={ListPane} detail={DetailPane} />
        </>
    );
}

export default Records;