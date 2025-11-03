// Material Components:
import 'mdui/components/button.js';
import 'mdui/components/divider.js';
import 'mdui/components/list-item.js';

function LogView({ log, onClick, isSelected }) {
    return (
        <>
            <mdui-divider middle></mdui-divider>
            <mdui-list-item headline-line={1} description-line={1} onClick={() => onClick(log.id)} active={isSelected} rounded>
                <div >
                    {log.message}
                </div>
                <div slot='description'>
                    {log.datetimeString}
                </div>
                <div slot='end-icon'>
                    <mdui-button variant='text' disabled>{log.category}</mdui-button>
                </div>
            </mdui-list-item>
        </>
    );
};

export default LogView;