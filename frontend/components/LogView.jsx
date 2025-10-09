// Material Components:
import 'mdui/components/button.js';
import 'mdui/components/chip.js';
import 'mdui/components/divider.js';
import 'mdui/components/list-item.js';

const DEFAULT_LOG = {
    id: "ABC123",
    time: "1970-01-01 00:00:00.000",
    category: "Info",
    source: "Default Docker Container",
    message: "Lorem ipsum dolor sit amet consectetur adipiscing elit.",
    solution: null
}

function LogView({ log, onClick, isSelected }) {
    return (
        <>
            <mdui-list-item headline-line={1} description-line={1} onClick={() => onClick(log.id)} active={isSelected} rounded>
                <div >
                    {log.message}
                </div>
                <div slot='description'>
                    {log.time}
                </div>
                <div slot='end-icon'>
                    <mdui-button variant='text' disabled>{log.category}</mdui-button>
                </div>
            </mdui-list-item>
            <mdui-divider middle></mdui-divider>
        </>
    );
};

export default LogView;