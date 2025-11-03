// React Components:
import { useEffect, useState, useRef } from 'react';
import { ListDetailLayout } from '../Layouts';
import RecordForm from '../RecordForm';
import LogItemView from '../LogItemView.jsx';
import DetailsView from '../DetailsView';
import TopBar from '../TopBar';

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
import { openDialog, closeDialog, searchFunction, toDateString, isInsideInterval } from '../../assets/scripts.js'
import HorizontalRow from '../HorizontalRow.jsx';

///////////////////////////////////////////////////////////////////////////////////////////////
// Internal Components:
///////////////////////////////////////////////////////////////////////////////////////////////


function Logs() {
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Global Properties
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const [items, setItems] = useState([]);
    const snackBarRef = useRef(null);
    const textSearchRef = useRef(null);
    const loadingAnimationRef = useRef(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [activeFilters, setActiveFilters] = useState(["Critical","Error","Warning","Info","Debug"]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Helper Functions:
    ///////////////////////////////////////////////////////////////////////////////////////////////
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
                snackBarRef.current.textContent = `Failed to fetch logs [${response.status} ${response.statusText}]`;
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

    /**
     * Updates the currently selected item
     * @param {string} id id of the item to select
     * @info called if the user clicks a list item  
     */
    function openDetails(id) {
        setSelectedItem(items.find(item => item.id === id));
    };

    /**
     * Resets the currently selected item
     * @info called if the user closes the detail window  
     */
    function closeDetails() {
        setSelectedItem(null);
    };

    function updateSearchQuery() {
        const query = textSearchRef.current.value;
        setSearchQuery(String(query).toLocaleLowerCase());
    }

    /**
     * Update the list of active filters with the given category
     * @param {string} category category to toggle (remove or add to filter list)
     * @info called if the user un-selects any fiter
     */
    function changeFilter(category) {
        function updateFunction(prevFilters) {
            if(prevFilters.includes(category)) {
                // If it's already active, remove it (deselect)
                return prevFilters.filter(filter => filter !== category);
            } else {
                // If it's not active, add it (select)
                return [...prevFilters, category];
            }
        }
        setActiveFilters(updateFunction); // use function state update
    };

    const initializeRefs = () => ({
        startDate: {
            state: useState(new Date()),
            input: useRef(null),
            dialog: useRef(null),
            picker: useRef(null),
        },
        stopDate: {
            state: useState(new Date()),
            input: useRef(null),
            dialog: useRef(null),
            picker: useRef(null),
        }
    });
    const refs = initializeRefs();

    function updateDatetime(ref) {
        const datetimePicker = ref.picker.current;
        const datetimeInput = ref.input.current;
        const [datetimeValue, setDatetimeValue] = ref.state;
        if(datetimePicker && datetimeInput) {
            setDatetimeValue(datetimePicker.confirmedDateObj);
        }
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Hooks:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * Inialize list of active filters based on 'selected' property of html element
     */
    useEffect(() => {
        // Fetch Logs:
        fetchItems("/api/logs");

        

        // Initialize Search Function:
        if(textSearchRef.current) textSearchRef.current.addEventListener("input", updateSearchQuery);

        // Initialize Date Picker:
        const startDateInput = refs.startDate.input.current;
        const startDateDialog = refs.startDate.dialog.current;
        const startDatePicker = refs.startDate.picker.current;
        if(startDateInput && startDateDialog) startDateInput.addEventListener("click", () => { startDateDialog.open = true; })
        if(startDatePicker && startDateDialog) {
            startDatePicker.addEventListener("confirm", () => { updateDatetime(refs.startDate); startDateDialog.open = false; });
            startDatePicker.addEventListener("reset", () => { startDateDialog.open = false; });
        }
        const stopDateInput = refs.stopDate.input.current;
        const stopDateDialog = refs.stopDate.dialog.current;
        const stopDatePicker = refs.stopDate.picker.current;
        if(stopDateInput && stopDateDialog) stopDateInput.addEventListener("click", () => { stopDateDialog.open = true; })
        if(stopDatePicker && stopDateDialog) {
            stopDatePicker.addEventListener("confirm", () => { updateDatetime(refs.stopDate); stopDateDialog.open = false; });
            stopDatePicker.addEventListener("reset", () => { startDateDialog.open = false; });
        }
        

        // Get All Chip Filters:
        const chips = Array.from(document.querySelectorAll('#category-filter mdui-chip'));
        const selectedChips = chips.filter(chip => chip.hasAttribute('selected'))
        const categories = chips.map(chip => chip.textContent.trim());
        const selectedCategories = selectedChips.map(chip => chip.textContent.trim());
        
        // Set Initial Filters State:
        if(selectedCategories.length > 0) { // set selected filter
            setActiveFilters(selectedCategories);
        } else if(chips.length > 0) { // non of the exisiting filters is selected
            setActiveFilters([]);
        } else { // no exisitng filter, select all by default
            setActiveFilters(categories);
        }

        // Initialze ESC Key:
        document.body.addEventListener("keydown", function(event) {
            if (event.key === "Escape") {
                closeDetails();
            }
        });
    }, []);

    /**
     * Update items if the filter changes
     */
    useEffect(() => {
        // Apply Category Filter:
        let filtered = items.filter(item => activeFilters.includes(item.category));
        
        // Apply Text Search Query:
        if(searchQuery) {
            filtered = filtered.filter(item => searchFunction(item, searchQuery));
        }

        const startDate = refs.startDate.state[0];
        const stopDate = refs.stopDate.state[0];
        if(startDate && stopDate) {
            filtered = filtered.filter(item => isInsideInterval(item, startDate, stopDate));
        }

        setFilteredItems(filtered);
    }, [items, activeFilters, searchQuery, refs.startDate.state[0], refs.stopDate.state[0]]);

    useEffect(() => {
        const startDateInput = refs.startDate.input.current;
        if(startDateInput) { startDateInput.value = toDateString(refs.startDate.state[0]); }
        const stopDateInput = refs.stopDate.input.current;
        if(stopDateInput) { stopDateInput.value = toDateString(refs.stopDate.state[0]); }
    }, [refs.startDate.state, refs.stopDate.state]);

    useEffect(() => {
        if(items.length == 0) { return; }
        let minDate = new Date(items[0].timestamp);
        let maxDate = new Date(items[0].timestamp);
        for(const item of items) {
            const date = new Date(item.timestamp);
            if(date.getTime() < minDate.getTime()) {
                minDate = new Date(date);
            }
            if(date.getTime() > maxDate.getTime()) {
                maxDate = new Date(date);
            }
        }
        refs.startDate.state[1](minDate);
        refs.stopDate.state[1](maxDate);
    }, [items]);


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Sub-Elements:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const ListHeader = (
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
                <mdui-chip variant="filter" onClick={() => changeFilter("Critical")} selectable selected>Critical</mdui-chip>
                <mdui-chip variant="filter" onClick={() => changeFilter("Error")} selectable selected>Error</mdui-chip>
                <mdui-chip variant="filter" onClick={() => changeFilter("Warning")} selectable selected>Warning</mdui-chip>
                <mdui-chip variant="filter" onClick={() => changeFilter("Info")} selectable>Info</mdui-chip>
                <mdui-chip variant="filter" onClick={() => changeFilter("Debug")} selectable>Debug</mdui-chip>
            </section>
            <span className="info-text">Showing {filteredItems.length} of {items.length}</span>
        </>
    );

    const ListPane = filteredItems.length > 0 ? (
        <>
            <mdui-list>
                {filteredItems.map(item => (<LogItemView key={item.id} log={item} onClick={openDetails} isSelected={item === selectedItem} />))}
            </mdui-list>
        </>
    ) : (
        <div style={{alignItems:'center', display:'flex', justifyContent:'center', margin:'auto'}}>
            <mdui-button-icon icon="search_off" variant="standard"></mdui-button-icon>
            <span>No logs found for the selected filters.</span>
        </div>
    );

    const TopBarElement = selectedItem && (
        <>
            <TopBar title={"#"+selectedItem.id} closeFunction={closeDetails}>
                <mdui-button onclick={() => (openDialog("add-to-records"))}>
                    <mdui-icon slot="icon" name="add"></mdui-icon>
                    Add to records
                </mdui-button>
            </TopBar>
            <mdui-dialog id="add-to-records" close-on-esc close-on-overlay-click>
                <TopBar title="Add log to records" closeFunction={() => (closeDialog("add-to-records"))}></TopBar>
                <RecordForm action="#" record={selectedItem}></RecordForm>
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

export default Logs;