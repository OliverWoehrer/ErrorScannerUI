// React Components:

// Material Components:
import 'mdui/components/button.js';
import 'mdui/components/card.js';
import 'mdui/components/dialog.js';
import 'mdui/components/icon.js';

// Local Imports:
import useScreenSize from '../../hooks/useScreenSize.js';
import "./style.css"

function ListDetailLayout({listHeader, listFooter, list, detail}) {
    // Layout Conditionals
    const { isAtMost } = useScreenSize();
    const isSmallerScreen = isAtMost('medium'); // split view for medium (601-992px) and large (993px+)

    function DetailPane() {
        if(isSmallerScreen) { // make details fullscreen overlay on smaller screens
            return(
                <mdui-dialog fullscreen open={detail}>
                    {detail}
                </mdui-dialog>
            );
        } else if(detail) { // details on bigger screen, wrap the details within a card element
            return(
                <aside>
                    <mdui-card variant="elevated">
                        {detail}
                    </mdui-card>
                </aside>
            );
        } else { // no details to show on bigger screen, display placeholder instead
            return(
                <aside>
                    <div>
                        Select a log to see more details
                    </div>
                </aside>
            );
        }
    }

    return(
        <div className="list-detail-layout">
            <main>
                <div className='flex-column'>
                    <header>
                        {listHeader}
                    </header>
                    <main>
                        {list}
                    </main>
                    <footer>
                        {listFooter}
                    </footer>
                </div>
            </main>
            <DetailPane />
        </div>
    );
}

export default ListDetailLayout;