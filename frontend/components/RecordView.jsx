// Material Components:
import 'mdui/components/button.js';
import 'mdui/components/divider.js';
import 'mdui/components/list-item.js';

function RecordView({ log, onClick, isSelected }) {
    return (
        <>
            <mdui-list-item headline-line={1} description-line={1} alignment='center' onClick={() => onClick(log.id)} active={isSelected} rounded>
                <div>
                    {log.message}
                </div>
                <div slot='description'>
                    {log.category}
                </div>
                <div slot='end-icon'>
                    <mdui-button variant='tonal' disabled>{log.solution? "solved" : null}</mdui-button>
                </div>
            </mdui-list-item>
            <mdui-divider middle></mdui-divider>
        </>
    );
}

export default RecordView;