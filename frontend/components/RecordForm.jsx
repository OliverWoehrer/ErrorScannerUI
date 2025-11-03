// React Components:
import Form from './Form';
import HorizontalRow from './HorizontalRow.jsx';

// Material Components:
import 'mdui/components/button.js';
import 'mdui/components/divider.js';
import 'mdui/components/top-app-bar.js';
import 'mdui/components/top-app-bar-title.js';

function RecordForm({ action, record }) {
    const DEFAULT_RECORD = {
        id: "0",
        timestamp: new Date().toISOString().slice(0, -1),
        category: "Info",
        source: "your-docker-container",
        message: "",
        solution: "your solution"
    };

    const item = (record ?? DEFAULT_RECORD); // checks if record is null or uses the DEFAULT as fallback

    return (
        <Form action={action}>
            <HorizontalRow>
                <mdui-text-field label="Last Seen (Date)" value={item.dateISOString} defaultValue={item.dateISOString} name="date" step="0.001" type="date" style={{width:"49%"}}></mdui-text-field>
                <mdui-text-field label="Last Seen (Time)" value={item.timeISOString} defaultValue={item.timeISOString} name="time" step="0.001" type="time" style={{width:"49%"}}></mdui-text-field>
            </HorizontalRow>
            <HorizontalRow>
                <mdui-select label="Select Category" value={item.category} defaultValue={item.category} name="category" style={{width:"auto"}} >
                    <mdui-menu-item value="Critical">Critical</mdui-menu-item>
                    <mdui-menu-item value="Error">Error</mdui-menu-item>
                    <mdui-menu-item value="Warning">Warning</mdui-menu-item>
                    <mdui-menu-item value="Info">Info</mdui-menu-item>
                    <mdui-menu-item value="Debug">Debug</mdui-menu-item>
                </mdui-select>
                <mdui-text-field label="Name of Docker Container" value={item.source} defaultValue={item.source} name="source"></mdui-text-field>
            </HorizontalRow>
            <HorizontalRow>
                <mdui-text-field label="Log Message" value={item.message} defaultValue={item.message} name="message" autosize min-rows="2" max-rows="7" enterkeyhint="enter"></mdui-text-field>
            </HorizontalRow>
            { item.solution && (
                <HorizontalRow>
                    <mdui-text-field label="Add Solution" value={item.solution} defaultValue={item.message} name="message" autosize min-rows="2" max-rows="7" enterkeyhint="enter"></mdui-text-field>
                </HorizontalRow>
            )}
        </Form>
    );
}

export default RecordForm;