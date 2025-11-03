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

function Settings() {
    const DockerNetworkForm = (
        <mdui-card variant="elevated">
            <Form action="#">
                <TopBar title="Docker Interface"></TopBar>
                <section>
                    <div>
                        <h4>Network Interface</h4>
                        <span>Docker network to log messages from</span>
                    </div>
                    <mdui-text-field label="Docker Network" value="lognet" defaultValue="lognet"></mdui-text-field>
                </section>
                <section>
                    <div>
                        <h4>Filter Lists</h4>
                        <span>Filter docker containers based on their name or id</span>
                    </div>
                    <mdui-tabs value="whitelist" full-width style={{backgroundColor:"inherit"}} variant="secondary">
                        <mdui-tab value="whitelist" style={{backgroundColor:"inherit"}}>Whitelist</mdui-tab>
                        <mdui-tab value="blacklist" style={{backgroundColor:"inherit"}}>Blacklist</mdui-tab>
                        <mdui-tab-panel slot="panel" value="whitelist">
                            <mdui-text-field
                                label="Whitelist"
                                value={"generator-loggen-app-1\ngenerator-loggen-app-2\ngenerator-loggen-app-lost-1\ngenerator-loggen-app-lost-2"}
                                defaultValue={"generator-loggen-app-1\ngenerator-loggen-app-2\ngenerator-loggen-app-lost-1\ngenerator-loggen-app-lost-2"}
                                autosize min-rows="5" max-rows="5"
                                name="whitelist"
                            ></mdui-text-field>
                        </mdui-tab-panel>
                        <mdui-tab-panel slot="panel" value="blacklist">
                            <mdui-text-field
                                label="Blacklist"
                                value={"generator-loggen-app-3\ngenerator-loggen-app-lost-3"}
                                defaultValue={"generator-loggen-app-3\ngenerator-loggen-app-lost-3"}
                                autosize min-rows="5" max-rows="5"
                                name="blacklist"
                            ></mdui-text-field>
                        </mdui-tab-panel>
                    </mdui-tabs>
                </section>
            </Form>
        </mdui-card>
    );

    const LogScannerForm = (
        <mdui-card variant="elevated" >
            <Form action="#">
                <TopBar title="Log Scanner"></TopBar>
                <section>
                    <div>
                        <h4>Logs</h4>
                        <span>Categorize log messages based on their tag and select which ones to log</span>
                    </div>
                    <HorizontalRow>
                        <mdui-text-field label="Critical" value="[CRITICAL]" defaultValue="[CRITICAL]" name="critical"></mdui-text-field>
                        <mdui-switch checked defaultChecked name="critical-enabled"></mdui-switch>
                    </HorizontalRow>
                    <HorizontalRow>
                        <mdui-text-field label="Error" value="[ERROR]" defaultValue="[ERROR]" name="error"></mdui-text-field>
                        <mdui-switch checked defaultChecked name="error-enabled"></mdui-switch>
                    </HorizontalRow>
                    <HorizontalRow>
                        <mdui-text-field label="Warning" value="[WARNING]" defaultValue="[WARNING]" name="warning"></mdui-text-field>
                        <mdui-switch checked defaultChecked name="warning-enabled"></mdui-switch>
                    </HorizontalRow>
                    <HorizontalRow>
                        <mdui-text-field label="Info" value="[INFO]" defaultValue="[INFO]" name="warning"></mdui-text-field>
                        <mdui-switch name="info-enabled"></mdui-switch>
                    </HorizontalRow>
                    <HorizontalRow>
                        <mdui-text-field label="Debug" value="[DEBUG]" defaultValue="[DEBUG]" name="debug"></mdui-text-field>
                        <mdui-switch name="debug-enabled"></mdui-switch>
                    </HorizontalRow>
                </section>
            </Form>
        </mdui-card>
    );

    const DatabaseForm = (
        <mdui-card variant="elevated" >
            <Form action="#">
                <TopBar title="Database"></TopBar>
                <section>
                    <div>
                        <h4>Size</h4>
                        <span>Set the maximum number of logs to keep</span>
                    </div>
                    <HorizontalRow>
                        <mdui-text-field label="Maximum number of logs" value="80000" defaultValue="80000"></mdui-text-field>
                    </HorizontalRow>
                </section>
            </Form>
        </mdui-card>
    );

    return(
        <FeedLayout>
            {DockerNetworkForm}
            {LogScannerForm}
            {DatabaseForm}
        </FeedLayout>
    );
}

export default Settings;