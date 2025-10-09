// React Components:

// Material Components:
import 'mdui/components/button.js';
import 'mdui/components/card.js';
import 'mdui/components/dialog.js';
import 'mdui/components/icon.js';

// Local Imports:
import useScreenSize from '../../assets/useScreenSize';
import "./style.css"

function ListDetailLayout({listHeader, listFooter, list, detail}) {
    // Layout Conditionals
    const { isAtLeast } = useScreenSize();
    const isBiggerScreen = isAtLeast('large'); // Split view for medium (601-992px) and large (993px+)

    function DetailPane() {
        if(isBiggerScreen) {
            if(detail) { // if details displayed, wrap the details within a card element
                detail = (
                    <mdui-card variant="filled">
                        {detail}
                    </mdui-card>
                );
            } else {
                detail = (
                    <div>
                        Select a log to see more details
                    </div>
                );
            }
            return(
                <aside>
                    {detail}
                </aside>
            );
        }
        return(
            <mdui-dialog fullscreen open={detail}>
                {detail}
            </mdui-dialog>
        );
    }

    return(
        <div className="list-detail-layout">
            <main>
                <div className='elastic'>
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