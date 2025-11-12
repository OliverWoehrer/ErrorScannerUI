// React Components:

// Material Components:
import 'mdui/components/button-icon.js';
import 'mdui/components/top-app-bar.js';
import 'mdui/components/top-app-bar-title.js';

// Local Import:
import ZeroMd from 'zero-md';
customElements.define('zero-md', ZeroMd);

function DetailsView({ top, log }) {
    return (
        <>
            {top}
            <div>
                <div>
                    <table>
                        <tbody>
                            <tr>
                                <td>Time:</td>
                                <td>{log.datetimeString}</td>
                            </tr>
                            <tr>
                                <td>Category:</td>
                                <td>{log.category}</td>
                            </tr>
                            <tr>
                                <td>Source:</td>
                                <td>{log.source}</td>
                            </tr>
                            <tr>
                                <td>Search Key:</td>
                                <td>{log.searchkey}</td>
                            </tr>
                        </tbody>
                    </table>
                    {log.message && ( /* render paragraph if message available */
                    <p>
                        {log.message}
                    </p>
                    )}
                </div>
                <div>
                    {log.solution && ( /* render paragraph if solution available */
                    <>
                    <mdui-divider></mdui-divider>
                    <zero-md>
                        <template>
                            <link rel="stylesheet" href="/github-markdown.css" />
                        </template>
                        <script type="text/markdown">
                            {log.solution}
                        </script>
                    </zero-md>
                    </>
                    )}
                </div>
            </div>
        </>
    );
}

export default DetailsView;