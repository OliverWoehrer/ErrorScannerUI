// React Components:
import { useEffect, useState, useRef } from 'react';
import { ListDetailLayout } from '../Layouts';
import ItemFilters from '../Filters.jsx';
import { RecordItemView, ItemFormView, RecordItemListView } from '../ItemViews.jsx';

// Material Components:
import 'mdui/components/button-icon.js';
import 'mdui/components/list.js';
import 'mdui/components/select.js';
import 'mdui/components/menu-item.js';
import 'mdui/components/text-field.js';

// Local Imports:
import { useFetchDataStream as useFetchData } from '../../hooks/useFetchData.js';
import useScreenSize from '../../hooks/useScreenSize.js';
import { LogRecordItem } from '../../assets/LogRecordItem.js';


function Records() {
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Global Properties
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const { isAtMost } = useScreenSize();
    const isSmallerScreen = isAtMost('medium'); // split view for medium (601-992px) and large (993px+)
    const { isLoading, data:items, reloadData } = useFetchData("/api/records");
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
        if(loadingAnimationRef.current) {
            loadingAnimationRef.current.loading = isLoading;
            loadingAnimationRef.current.disabled = isLoading;
        }
    }, [isLoading]);

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Sub-Elements:
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const ListHeader = (
        <>
            <mdui-collapse>
                <mdui-collapse-item trigger="#showFilters">
                    <div slot="header" className="flex-row" style={{padding:"12px 0.5rem 0.5rem"}}>
                        <div>
                            <mdui-button ref={loadingAnimationRef} onClick={reloadData} variant="filled" icon="refresh">Refresh records</mdui-button>
                            <mdui-button onClick={() => {openDialog(newRecordDialogRef)}} variant="text" icon="note_add">Add new record</mdui-button>
                        </div>
                        <mdui-button id="showFilters" variant="text" end-icon="keyboard_arrow_down">Use filters</mdui-button>
                    </div>
                    <div style={{padding:"0 0.5rem"}}>
                        <ItemFilters items={items} updateFilteredItems={setFilteredItems} />
                    </div>
                </mdui-collapse-item>
            </mdui-collapse>
            <mdui-dialog ref={newRecordDialogRef} close-on-esc close-on-overlay-click fullscreen={isSmallerScreen} style={{width:"100%"}}>
                <mdui-top-app-bar>
                    <mdui-button-icon icon="clear" onClick={() => closeDialog(newRecordDialogRef)} />
                    <mdui-top-app-bar-title>Add new record</mdui-top-app-bar-title>
                </mdui-top-app-bar>
                <ItemFormView item={new LogRecordItem()} onSuccess={() => (closeDialog(newRecordDialogRef))} onReset={() => (closeDialog(newRecordDialogRef))} />
            </mdui-dialog>
            <div className="info-text" style={{paddingLeft:"16px"}}>
                Showing {filteredItems.length} of {items.length}
            </div>
        </>
    );

    const ListPane = filteredItems.length > 0 ? (
        <mdui-list>
            {filteredItems.map(item => (<RecordItemListView key={item.id} item={item} onClick={showDetails} isSelected={item === selectedItem} />))}
        </mdui-list>
    ) : (
        <div style={{alignItems:'center', display:'flex', justifyContent:'center', margin:'auto'}}>
            <mdui-button-icon icon="search_off" variant="standard"></mdui-button-icon>
            <span>No logs found for the selected filters.</span>
        </div>
    );

    const DetailPane = selectedItem && (
        <div className='flex-column'>
            <header>
                <mdui-top-app-bar>
                    <mdui-button-icon icon="clear" onClick={hideDetails} />
                    <mdui-top-app-bar-title>{"#"+selectedItem.id}</mdui-top-app-bar-title>
                </mdui-top-app-bar>
            </header>
            <main>
                <RecordItemView item={selectedItem} />
            </main>
        </div>
    );

    return(
        <ListDetailLayout listHeader={ListHeader} list={ListPane} detail={DetailPane} />
    );
}

export default Records;