// React Components:
import { useEffect, useState } from 'react';
import { useSearchParams } from "react-router"
import { ListDetailLayout } from '../Layouts';
import Form from '../Form';
import LogView from '../LogView';
import DetailsView from '../DetailsView';
import InputRow from '../InputRow';
import TopBar from '../TopBar';

// Material Components:
import 'mdui/components/button.js';
import 'mdui/components/button-icon.js';
import 'mdui/components/card.js';
import 'mdui/components/chip.js';
import 'mdui/components/list.js';
import 'mdui/components/text-field.js';

// Local Imports:
import { openDialog, closeDialog } from '../../scripts/scripts.js'

function Logs() {
    const [selectedId, setSelectedId] = useState(null);
    const [items, setItems] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();

    const selectedString = searchParams.get('selected');
    const selectedItem = items.find(item => item.id === selectedString);

    useEffect(() => {
        async function fetchLogs() {
            const fetched = [
                {id:"2001", time:"1970-01-01 00:00:00.000", category:"Info", source:"Default Docker Container", message:"Lorem ipsum dolor sit amet consectetur adipiscing elit. Lorem ipsum dolor sit amet.", solution:null},
                {id:"2002", time:"2025-10-07 13:36:03.000", category:"Error", source:"Docker Container One", message:"Lorem ipsum dolor sit amet consectetur adipiscing elit.", solution:"just pray at this point"},
                {id:"2003", time:"2025-10-07 13:36:03.000", category:"Error", source:"Docker Container Two", message:"Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.", solution:null},
                {id:"2004", time:"2025-10-07 13:36:03.000", category:"Error", source:"Docker Container One", message:"Lorem ipsum dolor sit amet consectetur adipiscing elit.", solution:"just pray at this point"},
                {id:"2005", time:"2025-10-07 13:36:03.000", category:"Error", source:"Docker Container One", message:"Lorem ipsum dolor sit amet consectetur adipiscing elit.", solution:"just pray at this point"},
                {id:"2006", time:"1970-01-01 00:00:00.000", category:"Info", source:"Default Docker Container", message:"Lorem ipsum dolor sit amet consectetur adipiscing elit. Lorem ipsum dolor sit amet.", solution:null},
                {id:"2007", time:"1970-01-01 00:00:00.000", category:"Info", source:"Default Docker Container", message:"Lorem ipsum dolor sit amet consectetur adipiscing elit. Lorem ipsum dolor sit amet.", solution:null},
                {id:"2008", time:"2025-10-07 13:36:03.000", category:"Error", source:"Docker Container One", message:"Lorem ipsum dolor sit amet consectetur adipiscing elit.", solution:"just pray at this point"},
                {id:"2009", time:"2025-10-07 13:36:03.000", category:"Error", source:"Docker Container Two", message:"Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.", solution:null},
                {id:"2010", time:"2025-10-07 13:36:03.000", category:"Error", source:"Docker Container Two", message:"Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.", solution:null},
                {id:"2011", time:"2025-10-07 13:36:03.000", category:"Error", source:"Docker Container Two", message:"Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.", solution:null},
                {id:"2012", time:"2025-10-07 13:36:03.000", category:"Error", source:"Docker Container One", message:"Lorem ipsum dolor sit amet consectetur adipiscing elit.", solution:"just pray at this point"},
                {id:"2013", time:"2025-10-07 13:36:03.000", category:"Error", source:"Docker Container Two", message:"Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.", solution:null},
                {id:"2014", time:"1970-01-01 00:00:00.000", category:"Info", source:"Default Docker Container", message:"Lorem ipsum dolor sit amet consectetur adipiscing elit. Lorem ipsum dolor sit amet.", solution:null},
            ];
            setItems(fetched);
        }
        fetchLogs();
    }, []); // fetch data only once

    function openDetails(id) {
        setSelectedId(id);
        setSearchParams({ selected: id });
    };

    function closeDetails() {
        setSelectedId(null);
        setSearchParams({}, { replace:true });
    };

    const ListHeader = (
        <>
            {/* <mdui-card variant="filled" style={{width:'100%'}} className="">
                <mdui-text-field label="Search" type="search" enterkeyhint="search" inputmode="search">
                <mdui-button-icon slot="icon" icon="search"></mdui-button-icon>
                </mdui-text-field>
            </mdui-card> */}
            <InputRow>
                <mdui-chip variant="filter" selectable selected>Critical</mdui-chip>
                <mdui-chip variant="filter" selectable selected>Error</mdui-chip>
                <mdui-chip variant="filter" selectable selected>Warning</mdui-chip>
                <mdui-chip variant="filter" selectable>Info</mdui-chip>
                <mdui-chip variant="filter" selectable>Debug</mdui-chip>
            </InputRow>
        </>
    );

    const ListPane = (
        <>
            {items ? (
                <mdui-list>
                    {items.map(item => (<LogView key={item.id} log={item} onClick={openDetails} isSelected={item.id === selectedId} />))}
                </mdui-list>
            ) : (
                <div style={{alignItems:'center', display:'flex', flexDirection:'column'}}>
                    <mdui-button-icon loading icon="search" variant="standard"></mdui-button-icon>
                </div>
            )}
        </>
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
                <TopBar title="Add log to record" closeFunction={() => (closeDialog("add-to-records"))}></TopBar>
                <Form action="#">
                    <section>
                        <div>
                            <mdui-text-field label="Log seen" value={selectedItem.time} defaultValue={selectedItem.time} name="time"></mdui-text-field>
                        </div>
                        <div>
                            <mdui-select label="Select Category" value={selectedItem.category} defaultValue={selectedItem.category} name="category">
                                <mdui-menu-item value="Critical">Critical</mdui-menu-item>
                                <mdui-menu-item value="Error">Error</mdui-menu-item>
                                <mdui-menu-item value="Warning">Warning</mdui-menu-item>
                                <mdui-menu-item value="Info">Info</mdui-menu-item>
                                <mdui-menu-item value="Debug">Debug</mdui-menu-item>
                            </mdui-select>
                        </div>
                        <div>
                            <mdui-text-field label="Docker Container" value={selectedItem.source} defaultValue={selectedItem.source} name="source"></mdui-text-field>
                        </div>
                        <div>
                            <mdui-text-field label="Log Message" value={selectedItem.message} defaultValue={selectedItem.message} name="message" autosize max-rows="7" enterkeyhint="enter"></mdui-text-field>
                        </div>
                    </section>
                </Form>
            </mdui-dialog>
        </>
    );

    const DetailPane = selectedItem && (
        <DetailsView top={TopBarElement} log={selectedItem} />
    );

    return(
        <ListDetailLayout listHeader={ListHeader} list={ListPane} detail={DetailPane} />
    );
}

export default Logs;