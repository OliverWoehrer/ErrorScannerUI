// React Components:
import Form from '../Form';
import HorizontalRow from '../HorizontalRow';
import { FeedLayout } from '../Layouts';
import TopBar from '../TopBar';

// Material Components:
import 'mdui/components/button-icon.js';
import 'mdui/components/card.js';
import 'mdui/components/divider.js';
import 'mdui/components/switch.js';
import 'mdui/components/tabs.js';
import 'mdui/components/tab.js';
import 'mdui/components/tab-panel.js';

// Local Import:
import { useFetchData } from '../../hooks/useFetchData.js';

function Settings() {
    function DockerInterfaceForm({endpoint}) {
        // Fetch Form Values:
        const {isLoading,data,reloadData} = useFetchData(endpoint);

        // Conditional Rendering:
        const Network = (isLoading || !data) ? (
            <mdui-text-field label="Docker Network" disabled>
                <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
            </mdui-text-field>
        ) : (
            <mdui-text-field label="Docker Network" name="network" value={data.network} defaultValue={data.network}></mdui-text-field>
        );

        const Whitelist = (isLoading || !data) ? (
            <mdui-text-field label="Whitelist" name="whitelist" autosize min-rows="5" max-rows="5" disabled>
                <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
            </mdui-text-field>
        ) : (
            <mdui-text-field label="Whitelist" name="whitelist" value={data.whitelist} defaultValue={data.whitelist} autosize min-rows="5" max-rows="5"></mdui-text-field>
        );
        
        const Blacklist = (isLoading || !data) ? (
            <mdui-text-field label="Blacklist" name="blacklist" autosize min-rows="5" max-rows="5" disabled>
                <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
            </mdui-text-field>
        ) : (
            <mdui-text-field label="Blacklist" name="blacklist" value={data.blacklist} defaultValue={data.blacklist} autosize min-rows="5" max-rows="5"></mdui-text-field>
        );

        // Return Final Component:
        return(
            <mdui-card variant="elevated">
                <Form action="/api/form/docker-interface" onSuccess={reloadData}>
                    <TopBar title="Docker Interface"></TopBar>
                    <section>
                        <h4>Network Interface</h4>
                        <span>Docker network to log messages from</span>
                        {Network}
                    </section>
                    <section>
                        <h4>Filter Lists</h4>
                        <span>Filter docker containers based on their name or id</span>
                        <mdui-tabs value="whitelist" full-width style={{backgroundColor:"inherit"}} variant="secondary">
                            <mdui-tab value="whitelist" style={{backgroundColor:"inherit"}}>Whitelist</mdui-tab>
                            <mdui-tab value="blacklist" style={{backgroundColor:"inherit"}}>Blacklist</mdui-tab>
                            <mdui-tab-panel slot="panel" value="whitelist">
                                {Whitelist}
                            </mdui-tab-panel>
                            <mdui-tab-panel slot="panel" value="blacklist">
                                {Blacklist}
                            </mdui-tab-panel>
                        </mdui-tabs>
                    </section>
                </Form>
            </mdui-card>
        );
    }

    function LogScannerForm({endpoint}) {
        // Fetch Form Values:
        const {isLoading,data,reloadData} = useFetchData(endpoint);

        // Conditional Rendering:
        const Critical = (isLoading || !data) ? (
            <>
                <mdui-text-field label="Critical" disabled>
                    <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
                </mdui-text-field>
                <mdui-switch disabled></mdui-switch>
                <mdui-switch disabled></mdui-switch>
            </>
        ) : (
            <>
                <mdui-text-field label="Critical" name="tags_critical" value={data.tags_critical} defaultValue={data.tags_critical}></mdui-text-field>
                <mdui-switch name="logging_critical" checked={data.logging_critical} defaultChecked={data.logging_critical}></mdui-switch>
                <mdui-switch name="recording_critical" checked={data.recording_critical} defaultChecked={data.recording_critical}></mdui-switch>
            </>
        );
        const Error = (isLoading || !data) ? (
            <>
                <mdui-text-field label="Error" disabled>
                    <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
                </mdui-text-field>
                <mdui-switch disabled></mdui-switch>
                <mdui-switch disabled></mdui-switch>
            </>
        ) : (
            <>
                <mdui-text-field label="Error" name="tags_error" value={data.tags_error} defaultValue={data.tags_error}></mdui-text-field>
                <mdui-switch name="logging_error" checked={data.logging_error} defaultChecked={data.logging_error}></mdui-switch>
                <mdui-switch name="recording_error" checked={data.recording_error} defaultChecked={data.recording_error}></mdui-switch>
            </>
        );
        const Warning = (isLoading || !data) ? (
            <>
                <mdui-text-field label="Warning" disabled>
                    <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
                </mdui-text-field>
                <mdui-switch disabled></mdui-switch>
                <mdui-switch disabled></mdui-switch>
            </>
        ) : (
            <>
                <mdui-text-field label="Warning" name="tags_warning" value={data.tags_warning} defaultValue={data.tags_warning}></mdui-text-field>
                <mdui-switch name="logging_warning" checked={data.logging_warning} defaultChecked={data.logging_warning}></mdui-switch>
                <mdui-switch name="recording_warning" checked={data.recording_warning} defaultChecked={data.recording_warning}></mdui-switch>
            </>
        );
        const Info = (isLoading || !data) ? (
            <>
                <mdui-text-field label="Info" disabled>
                    <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
                </mdui-text-field>
                <mdui-switch disabled></mdui-switch>
                <mdui-switch disabled></mdui-switch>
            </>
        ) : (
            <>
                <mdui-text-field label="Info" name="tags_info" value={data.tags_info} defaultValue={data.tags_info}></mdui-text-field>
                <mdui-switch name="logging_info" checked={data.logging_info} defaultChecked={data.logging_info}></mdui-switch>
                <mdui-switch name="recording_info" checked={data.recording_info} defaultChecked={data.recording_info}></mdui-switch>
            </>
        );
        const Debug = (isLoading || !data) ? (
            <>
                <mdui-text-field label="Debug" disabled>
                    <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
                </mdui-text-field>
                <mdui-switch disabled></mdui-switch>
                <mdui-switch disabled></mdui-switch>
            </>
        ) : (
            <>
                <mdui-text-field label="Debug" name="tags_debug" value={data.tags_debug} defaultValue={data.tags_debug}></mdui-text-field>
                <mdui-switch name="logging_debug" checked={data.logging_debug} defaultChecked={data.logging_debug}></mdui-switch>
                <mdui-switch name="recording_debug" checked={data.recording_debug} defaultChecked={data.recording_debug}></mdui-switch>
            </>
        );

        // Return Final Component:
        return (
            <mdui-card variant="elevated">
                <Form action="/api/form/scanner" onSuccess={reloadData}>
                    <TopBar title="Log Scanner"></TopBar>
                    <div>
                        <h4>Logs</h4>
                        <span>Categorize log messages based on their tag and select which ones to log</span>
                    </div>
                    <HorizontalRow>
                        <div style={{ width: "100%" }}></div>
                        <mdui-tooltip content="Enable which message category should be logged">
                            <div style={{ display: "flex", alignItems: "center" }} className="info-text">
                                Logging <mdui-icon name="info--outlined" style={{ fontSize: "1rem" }}></mdui-icon>
                            </div>
                        </mdui-tooltip>
                        <mdui-tooltip content="Enable which message category should be automatically added to records if unknown" style={{ display: "flex", alignItems: "center" }} className="info-text">
                            <div style={{ display: "flex", alignItems: "center" }} className="info-text">
                                Record <mdui-icon name="info--outlined" style={{ fontSize: "1rem" }}></mdui-icon>
                            </div>
                        </mdui-tooltip>
                    </HorizontalRow>
                    <HorizontalRow>
                        {Critical}
                    </HorizontalRow>
                    <HorizontalRow>
                        {Error}
                    </HorizontalRow>
                    <HorizontalRow>
                        {Warning}
                    </HorizontalRow>
                    <HorizontalRow>
                        {Info}
                    </HorizontalRow>
                    <HorizontalRow>
                        {Debug}
                    </HorizontalRow>
                </Form>
            </mdui-card>
        ); 
    }
    
    function DiskUsageForm({endpoint}) {
        // Fetch Form Values:
        const {isLoading,data,reloadData} = useFetchData(endpoint);

        // Conditional Rendering:
        const MaxLogs = (isLoading || !data) ? (
            <mdui-text-field label="Maximum number of logs" disabled>
                <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
            </mdui-text-field>
        ) : (
            <mdui-text-field label="Maximum number of logs" name="max_logs" value={data.max_logs} defaultValue={data.max_logs}></mdui-text-field>
        );
        
        // Return Final Component:
        return(
            <mdui-card variant="elevated">
                <Form action={endpoint} onSuccess={reloadData}>
                    <TopBar title="Disk Usage"></TopBar>
                    <h4>Size</h4>
                    <span>Set the maximum number of logs to keep</span>
                    {MaxLogs}
                </Form>
            </mdui-card>
        )
    };

    function DatebaseForm({endpoint}) {
        // Fetch Form Values:
        const {isLoading,data,reloadData} = useFetchData(endpoint);

        // Conditional Rendering:
        const Host = (isLoading || !data) ? (
            <mdui-text-field label="Host" disabled>
                <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
            </mdui-text-field>
        ) : (
            <mdui-text-field label="Host" name="host" value={data.host} defaultValue={data.host}></mdui-text-field>
        );
        const Port = (isLoading || !data) ? (
            <mdui-text-field label="Port" disabled>
                <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
            </mdui-text-field>
        ) : (
            <mdui-text-field label="Port" name="port" value={data.port} defaultValue={data.port}></mdui-text-field>
        );
        const Path = (isLoading || !data) ? (
            <mdui-text-field label="Path" disabled>
                <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
            </mdui-text-field>
        ) : (
            <mdui-text-field label="Path" name="path" value={data.path} defaultValue={data.path}></mdui-text-field>
        );
        const Key = (isLoading || !data) ? (
            <mdui-text-field label="Key" disabled>
                <mdui-button-icon slot="icon" disabled loading></mdui-button-icon>
            </mdui-text-field>
        ) : (
            <mdui-text-field label="Key" name="key" value={data.key} defaultValue={data.key}></mdui-text-field>
        );

        return(
            <mdui-card variant="elevated">
                <Form action={endpoint} onSuccess={reloadData}>
                    <TopBar title="Datebase"></TopBar>
                    <h4>Endpoint</h4>
                    <span>Set the URL and port of the database interface</span>
                    {Host}
                    {Port}
                    {Path}
                    {Key}
                </Form>
            </mdui-card>
        );
    }

    return(
        <FeedLayout>
            <DockerInterfaceForm endpoint="/api/form/docker-interface"/>
            <LogScannerForm endpoint="/api/form/scanner"/>
            <DiskUsageForm endpoint="/api/form/disk-usage"/>
            <DatebaseForm endpoint="/api/form/database"/>
        </FeedLayout>
    );
}

export default Settings;