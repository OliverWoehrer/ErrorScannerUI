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
import { useFilteredData } from '../../assets/useFilteredData.js';

///////////////////////////////////////////////////////////////////////////////////////////////
// Internal Components:
///////////////////////////////////////////////////////////////////////////////////////////////


function Logs() {
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Global Properties
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const {isLoading,filters,items,filteredItems,updateFilter,reloadItems} = useFilteredData("/api/logs");
    const snackBarRef = useRef(null);
    const [selectedItem, setSelectedItem] = useState(null);

    
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Event Handler (triggered on user interactions):
    ///////////////////////////////////////////////////////////////////////////////////////////////
    function openDetails(id) {
        setSelectedItem(items.find(item => item.id === id));
    };

    function closeDetails() {
        setSelectedItem(null);
    };

    const textSearchRef = useRef(null);
    function updateSearchQuery() {
        const query = textSearchRef.current.value;
        updateFilter("searchQuery", String(query));
    }

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
    // Hooks:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const categoryRef = useRef(null);
    useEffect(() => {
        // Initialize Search Function:
        if(textSearchRef.current) {
            textSearchRef.current.addEventListener("input", updateSearchQuery);
        }

        // Initialize Search Query Filter:
        updateFilter("searchQuery", "");

        // Initialize Date Picker:
        // TODO
        
        // Initialze Category Filter:
        // const NodesList = categoryRef.current.querySelectorAll("mdui-chip[variant='filter']");
        // const chips = Array.from(NodesList);
        const chips = Array.from(document.querySelectorAll("mdui-chip[variant='filter']"));
        const selectedChips = chips.filter(chip => chip.hasAttribute('selected'));
        const categories = chips.map(chip => chip.textContent.trim());
        const selectedCategories = selectedChips.map(chip => chip.textContent.trim());
        updateFilter("categories", selectedCategories);

        // Initialize Datetime Filter:
        updateFilter("startDatetime", new Date());
        updateFilter("endDatetime", new Date());

        // Initialze ESC Key:
        document.body.addEventListener("keydown", function(event) {
            if (event.key === "Escape") {
                closeDetails();
            }
        });
    }, []);

    const loadingAnimationRef = useRef(null);
    useEffect(() => {
        loadingAnimationRef.current.loading = isLoading;
    }, [isLoading]);    


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Sub-Elements:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const ListHeader = (
        <>
            <HorizontalRow>
                <mdui-tooltip content="Refresh logs">
                    <mdui-fab ref={loadingAnimationRef} onClick={() => {reloadItems()}} icon="refresh">Refresh logs</mdui-fab>
                </mdui-tooltip>
                <mdui-text-field ref={textSearchRef} type="search" label="Search for logs or container names" clearable helper-on-focus>
                    <mdui-icon slot="icon" name="search"></mdui-icon>
                </mdui-text-field>
            </HorizontalRow>
            <HorizontalRow>
                <mdui-card variant="filled" style={{width:"100%"}}>
                    <mdui-text-field label="Starting Date" helper-on-focus readonly>
                        <mdui-icon slot="icon" name="calendar_month"></mdui-icon>
                    </mdui-text-field>
                    <mdui-dialog>
                        <date-picker>
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
                     <mdui-text-field label="Ending Date" helper-on-focus readonly>
                        <mdui-icon slot="icon" name="calendar_month"></mdui-icon>
                    </mdui-text-field>
                    <mdui-dialog>
                        <date-picker>
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
            <HorizontalRow overflow>
                <mdui-chip variant="filter" onClick={() => updateCategory("Critical")} selectable selected>Critical</mdui-chip>
                <mdui-chip variant="filter" onClick={() => updateCategory("Error")} selectable selected>Error</mdui-chip>
                <mdui-chip variant="filter" onClick={() => updateCategory("Warning")} selectable selected>Warning</mdui-chip>
                <mdui-chip variant="filter" onClick={() => updateCategory("Info")} selectable>Info</mdui-chip>
                <mdui-chip variant="filter" onClick={() => updateCategory("Debug")} selectable>Debug</mdui-chip>
            </HorizontalRow>
            <section style={{display:"flex", gap:"8px", overflowX:"auto", justifyContent:"center"}}>
                
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