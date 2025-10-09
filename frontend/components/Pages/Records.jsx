// React Components:
import { useEffect, useState } from 'react';
import { useSearchParams } from "react-router"
import { ListDetailLayout } from '../Layouts';
import RecordView from '../RecordView';
import DetailsView from '../DetailsView';
import TopBar from '../TopBar';
import Form from '../Form.jsx';

// Material Components:
import 'mdui/components/button.js';
import 'mdui/components/button-icon.js';
import 'mdui/components/card.js';
import 'mdui/components/chip.js';
import 'mdui/components/list.js';
import 'mdui/components/select.js';
import 'mdui/components/menu-item.js';
import 'mdui/components/text-field.js';

// Local Imports:
import { openDialog, closeDialog } from '../../scripts/scripts.js'

function Records() {
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

    function selectItem(id) {
        setSelectedId(id);
        setSearchParams({ selected: id });
    };

    function closeDetails() {
        setSelectedId(null);
        setSearchParams({}, { replace:true });
    };

    const ListHeader = (
        <mdui-button icon="add" onClick={() => (openDialog("add-record"))}>Add new record</mdui-button>
    );

    const ListPane = (
        <>
            {items ? (
                <mdui-list>
                    {items.map(item => (<RecordView key={item.id} log={item} onClick={selectItem} isSelected={item.id === selectedId} />))}
                </mdui-list>
            ) : (
                <div style={{alignItems:'center', display:'flex', flexDirection:'column'}}>
                    <mdui-button-icon loading icon="search" variant="standard"></mdui-button-icon>
                </div>
            )}
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

    const TopBarElement = selectedItem && (
        <>
            <TopBar title={"#"+selectedItem.id} closeFunction={closeDetails}>
                <mdui-button-icon icon="delete" onClick={() => (openDialog("delete-record"))}></mdui-button-icon>
                <mdui-button-icon icon="edit" onClick={() => (openDialog("edit-record"))}></mdui-button-icon>
            </TopBar>
            <mdui-dialog id="edit-record" close-on-esc close-on-overlay-click>
                <TopBar title={"Edit #"+selectedItem.id} closeFunction={() => (closeDialog("edit-record"))}></TopBar>
                <Form action="#" >
                    <section>
                        <div>
                            <mdui-text-field label="Time" value={selectedItem.time} defaultValue={selectedItem.time} name="time"></mdui-text-field>
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
                        <div>
                            <mdui-text-field label="Add Solution" value={selectedItem.solution} defaultValue={selectedItem.solution} name="solution" autosize max-rows="7" enterkeyhint="enter"></mdui-text-field>
                        </div>
                    </section>
                </Form>
            </mdui-dialog>
            <mdui-dialog id="delete-record" close-on-esc close-on-overlay-click>
                <TopBar title={"Delete #"+selectedItem.id} closeFunction={() => (closeDialog("delete-record"))}></TopBar>
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
        <ListDetailLayout listHeader={ListHeader} list={ListPane} detail={DetailPane} />
    );
}

export default Records;