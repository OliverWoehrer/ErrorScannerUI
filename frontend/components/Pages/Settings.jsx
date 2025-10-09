// React Components:
import Form from '../Form';
import InputRow from '../InputRow';
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
        <mdui-card variant="elevated" >
            <Form action="#">
                <TopBar title="Docker Network"></TopBar>
                <mdui-divider></mdui-divider>
                <section>
                    <div>
                        <h4>Network Interface</h4>
                        <span>Network interface of this container</span>
                    </div>
                    <mdui-text-field value="5000" defaultValue="5000" label="Port Number"></mdui-text-field>
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

    const LoggingForm = (
        <mdui-card variant="elevated" >
            <Form action="#">
                <TopBar title="Logging"></TopBar>
                <mdui-divider></mdui-divider>
                <section>
                    <div>
                        <h4>Logs</h4>
                        <span>Categorize log messages based on their tag and select which ones to log</span>
                    </div>
                    <InputRow>
                        <mdui-text-field label="Critical" value="[CRITICAL]" defaultValue="[CRITICAL]" name="critical"></mdui-text-field>
                        <mdui-switch checked defaultChecked name="critical-enabled"></mdui-switch>
                    </InputRow>
                    <InputRow>
                        <mdui-text-field label="Error" value="[ERROR]" defaultValue="[ERROR]" name="error"></mdui-text-field>
                        <mdui-switch checked defaultChecked name="error-enabled"></mdui-switch>
                    </InputRow>
                    <InputRow>
                        <mdui-text-field label="Warning" value="[WARNING]" defaultValue="[WARNING]" name="warning"></mdui-text-field>
                        <mdui-switch checked defaultChecked name="warning-enabled"></mdui-switch>
                    </InputRow>
                    <InputRow>
                        <mdui-text-field label="Info" value="[INFO]" defaultValue="[INFO]" name="warning"></mdui-text-field>
                        <mdui-switch name="info-enabled"></mdui-switch>
                    </InputRow>
                    <InputRow>
                        <mdui-text-field label="Debug" value="[DEBUG]" defaultValue="[DEBUG]" name="debug"></mdui-text-field>
                        <mdui-switch name="debug-enabled"></mdui-switch>
                    </InputRow>
                </section>
            </Form>
        </mdui-card>
    );

    return(
        <FeedLayout>
            {DockerNetworkForm}
            {LoggingForm}
        </FeedLayout>
    );
}

export default Settings;