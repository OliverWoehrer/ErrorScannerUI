// React Components:
import { useEffect, useState, useRef } from 'react';
import { ListDetailLayout } from '../Layouts';
import { LogItemView, LogItemListView } from '../ItemViews.jsx';

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
import 'mdui/components/top-app-bar.js';
import 'mdui/components/top-app-bar-title.js';

// Local Imports:
import { useFetchDataStream as useFetchData } from '../../hooks/useFetchData.js';
import ItemFilters from '../Filters.jsx';


function Logs() {
    ///////////////////////////////////////////////////////////////////////////////////////////////
    // Global Properties
    ///////////////////////////////////////////////////////////////////////////////////////////////
    const { isLoading, data:items, reloadData } = useFetchData("/api/logs"); // rename generic 'data' to 'items' on import
    const [filteredItems, setFilteredItems] = useState(items);
    const [selectedItem, setSelectedItem] = useState(null);
    const collapseRef = useRef(null);
    const triggerRef = useRef(null);


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
            <mdui-collapse ref={collapseRef}>
                <mdui-collapse-item trigger="#showFilters">
                    <div slot="header" className="flex-row" style={{padding:"12px 0.5rem 0.5rem"}}>
                        <mdui-button ref={loadingAnimationRef} onClick={() => {reloadData()}} variant="filled" icon="refresh">Refresh logs</mdui-button>
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
        </>
    );

    const ListPane = filteredItems.length > 0 ? (
        <mdui-list>
            {filteredItems.map(item => (<LogItemListView key={item.id} item={item} onClick={showDetails} isSelected={item === selectedItem} />))}
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
                    <mdui-button-icon icon="clear" onClick={hideDetails}></mdui-button-icon>
                    <mdui-top-app-bar-title>{"#"+selectedItem.id}</mdui-top-app-bar-title>
                </mdui-top-app-bar>
            </header>
            <main>
                <LogItemView item={selectedItem} />
            </main>
        </div>
    );

    return(
        <ListDetailLayout listHeader={ListHeader} list={ListPane} detail={DetailPane} />
    );
}

export default Logs;