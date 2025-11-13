// React Components:
import { useEffect, useState, useRef } from 'react';
import { ListDetailLayout } from '../Layouts';
import DetailsView from '../DetailsView';
import Form from '../Form.jsx';
import ItemFilters from '../ItemFilters.jsx';
import RecordItemView from '../RecordItemView';
import RecordForm from '../RecordForm.jsx';
import TopBar from '../TopBar';
import HorizontalRow from '../HorizontalRow.jsx';

// Material Components:
import 'mdui/components/button-icon.js';
import 'mdui/components/fab.js';
import 'mdui/components/list.js';
import 'mdui/components/select.js';
import 'mdui/components/menu-item.js';
import 'mdui/components/text-field.js';

// Local Imports:
import { useFetchDataStream as useFetchData } from '../../hooks/useFetchData.js';


function Records() {
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Global Properties
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const { isLoading, data:items, reloadData } = useFetchData("/api/records");
    const [filteredItems, setFilteredItems] = useState(items);
    const [selectedItem, setSelectedItem] = useState(null);
    const newRecordDialogRef = useRef(null);
    const editRecordDialogRef = useRef(null);
    const deleteRecordDialogRef = useRef(null);

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
                        <mdui-fab extended ref={loadingAnimationRef} onClick={() => {openDialog(newRecordDialogRef)}} icon="note_add">Add new record</mdui-fab>
                        <mdui-button id="showFilters" variant="text" end-icon="keyboard_arrow_down">Use filters</mdui-button>
                    </div>
                    <div style={{padding:"0 0.5rem"}}>
                        <ItemFilters items={items} updateFilteredItems={setFilteredItems} />
                    </div>
                </mdui-collapse-item>
            </mdui-collapse>
            <mdui-dialog ref={newRecordDialogRef} close-on-esc close-on-overlay-click>
                <TopBar title="Add new record" closeFunction={() => (closeDialog(newRecordDialogRef))}></TopBar>
                <RecordForm action="/api/form/new-record" onSuccess={() => (closeDialog(newRecordDialogRef))}></RecordForm>
            </mdui-dialog>
            <div style={{paddingLeft:"16px"}}>
                <span className="info-text">Showing {filteredItems.length} of {items.length}</span>
            </div>
        </>
    );

    const ListPane = filteredItems.length > 0 ? (
        <mdui-list>
            {filteredItems.map(item => (<RecordItemView key={item.id} log={item} onClick={showDetails} isSelected={item === selectedItem} />))}
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
                <mdui-button-icon icon="edit" onClick={() => (openDialog(editRecordDialogRef))}></mdui-button-icon>
                <mdui-button-icon icon="delete" onClick={() => (openDialog(deleteRecordDialogRef))}></mdui-button-icon>
            </TopBar>
            <mdui-dialog ref={editRecordDialogRef} close-on-esc close-on-overlay-click>
                <TopBar title={"Edit Record #"+selectedItem.id} closeFunction={() => (closeDialog(editRecordDialogRef))}></TopBar>
                <RecordForm action="/api/form/edit-record" onSuccess={() => (closeDialog(editRecordDialogRef))} record={selectedItem}></RecordForm>
            </mdui-dialog>
            <mdui-dialog ref={deleteRecordDialogRef} close-on-esc close-on-overlay-click>
                <TopBar title={"Delete Record #"+selectedItem.id} closeFunction={() => (closeDialog(deleteRecordDialogRef))}></TopBar>
                <Form action="/api/form/delete-record" onSuccess={() => (closeDialog(deleteRecordDialogRef))}>
                    <input type="hidden" name="id" value={selectedItem.id}/>
                    Do you want to delete this record?
                </Form>
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

export default Records;