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
import 'mdui/components/collapse.js';
import 'mdui/components/collapse-item.js';
import 'mdui/components/list.js';
import 'mdui/components/range-slider.js';
import 'mdui/components/text-field.js';
import 'mdui/components/tooltip.js';

// Local Imports:
import { useFetchDataStream as useFetchData } from '../../hooks/useFetchData.js';
import ItemFilters from '../ItemFilters.jsx';


function Logs() {
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Global Properties
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const { isLoading, data:items, reloadData } = useFetchData("/api/logs"); // rename generic 'data' to 'items' on import
    const [filteredItems, setFilteredItems] = useState(items);
    const [selectedItem, setSelectedItem] = useState(null);
    const newRecordDialogRef = useRef(null);

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
    }, []);

    // Update Loading Animation:
    const loadingAnimationRef = useRef(null);
    useEffect(() => {
        loadingAnimationRef.current.loading = isLoading;
    }, [isLoading]);


    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Sub-Elements:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const ListHeader = (
        <>
            <mdui-collapse>
                <mdui-collapse-item trigger="#showFilters">
                    <div slot="header" style={{alignContent:"flex-end", alignItems:"center", display:"flex", gap:"12px", justifyContent:"space-between", padding:"12px 0.5rem 0.5rem"}}>
                        <mdui-fab extended ref={loadingAnimationRef} onClick={() => {reloadData()}} icon="refresh">Refresh logs</mdui-fab>
                        <mdui-button id="showFilters" variant="text" end-icon="keyboard_arrow_down">Use filters</mdui-button>
                    </div>
                    <div style={{padding:"0 0.5rem"}}>
                        <ItemFilters items={items} updateFilteredItems={setFilteredItems} />
                    </div>
                </mdui-collapse-item>
            </mdui-collapse>
            <div style={{paddingLeft:"16px"}}>
                <span className="info-text">Showing {filteredItems.length} of {items.length}</span>
            </div>
        </>
    );

    const ListPane = filteredItems.length > 0 ? (
        <mdui-list>
            {filteredItems.map(item => (<LogItemView key={item.id} log={item} onClick={showDetails} isSelected={item === selectedItem} />))}
        </mdui-list>
    ) : (
        <div style={{alignItems:'center', display:'flex', justifyContent:'center', margin:'auto'}}>
            <mdui-button-icon icon="search_off" variant="standard"></mdui-button-icon>
            <span>No logs found for the selected filters.</span>
        </div>
    );

    const DetailsTopBarElement = selectedItem && (
        <>
            <TopBar title={"#"+selectedItem.id} closeFunction={hideDetails}>
                <mdui-button onclick={() => (openDialog(newRecordDialogRef))}>
                    <mdui-icon slot="icon" name="add"></mdui-icon>
                    Add to records
                </mdui-button>
            </TopBar>
            <mdui-dialog ref={newRecordDialogRef} close-on-esc close-on-overlay-click>
                <TopBar title="Add log to records" closeFunction={() => (closeDialog(newRecordDialogRef))}></TopBar>
                <RecordForm action="/api/form/new-record" onSuccess={() => (closeDialog(newRecordDialogRef))} record={selectedItem}></RecordForm>
            </mdui-dialog>
        </>
    );

    const DetailPane = selectedItem && (
        <DetailsView top={DetailsTopBarElement} log={selectedItem} />
    );

    return(
        <ListDetailLayout listHeader={ListHeader} list={ListPane} detail={DetailPane} />
    );
}

export default Logs;