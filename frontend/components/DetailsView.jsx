// React Components:

// Material Components:
import 'mdui/components/button-icon.js';
import 'mdui/components/top-app-bar.js';
import 'mdui/components/top-app-bar-title.js';

// Local Import:

function DetailsView({ top, log }) {
    return (
        <>
            {top}
            <div className="log-content" style={{fontFamily:"Monospace"}}>
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
                        </tbody>
                    </table>
                    <p>
                        {log.message}
                    </p>
                </div>
                <div>
                    {log.solution && (
                    <p>
                        Solution:<br/>
                        {log.solution}
                    </p>
                    )}
                </div>
            </div>
        </>
    );
}

export default DetailsView;