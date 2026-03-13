// Material Components:
import 'mdui/components/button.js';
import { snackbar } from 'mdui/functions/snackbar.js';

function printMessage(msg, delay = 0) {
    snackbar({
        message: msg,
        autoCloseDelay: delay,
        closeable: true
    });
}

function defaultSubmit(event) {
    event.preventDefault(); // prevent automatic form submisson
};

async function parseResponse(response) {
    const contentType = response.headers.get("content-type");
    if(contentType && contentType.includes("application/json")) {
        return await response.json();
    } else {
        return await response.text();
    }
}

async function sendData(event, isFileUpload, onSuccess) {
    // Validate Form:
    const form = event.target.closest("form");
    if(!form) {
        printMessage("Could not find parent <form> element, don't know what data to send.");
        return;
    }
    if(!form.reportValidity()) {
        return; // dont send invalid data
    }

    // Parse Form Data:
    const endpoint = form.getAttribute('action');
    const formData = new FormData(form);
    if(Array.from(formData.keys()).length === 0) {
        printMessage("No data submitted, please select something.");
        return;
    }

    // Set Request Properties:
    let requestBody;
    const requestHeaders = {};
    if(isFileUpload) {
        requestBody = formData;
    } else {
        const formDataObject = Object.fromEntries(formData.entries());
        requestBody = JSON.stringify(formDataObject); // convert to serialized JSON string
        requestHeaders["Content-Type"] = "application/json";
    }

    // Send JSON Data:
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: requestHeaders,
            body: requestBody,
        });
        if(!response.ok) {
            const text = await response.text();
            printMessage(`Failed to submit data to '${endpoint}': [${response.status} ${response.statusText}] ${text}`);
            return;
        }
        const payload = await parseResponse(response);
        if(onSuccess) { onSuccess(payload); } // callback function on success
        printMessage(`Submitted data successfully`, 3000);
    } catch(error) {
        printMessage(`Failed to submit data to '${endpoint}' [${error}]`);
    }
}

export function TextForm({ action, submitButtonText, resetButtonText, onSuccess, onReset, children }) {
    const submitText = submitButtonText || "Confirm changes";
    const resetText = resetButtonText || "Discard changes";

    function handleSubmit(event) {
        sendData(event, false, onSuccess);
    }

    return(
        <form name="my-form" action={action} onSubmit={defaultSubmit} className="flex-column">
            <main>
                {children}
            </main>
            <footer>
                <mdui-button type="submit" onClick={handleSubmit}>{submitText}</mdui-button>
                <mdui-button type="reset" onClick={onReset} variant="text">{resetText}</mdui-button>
            </footer>
        </form>
    );
}

export function FileForm({ action, onSuccess, children }) {
    function handleSubmit(event) {
        event.preventDefault(); // prevent automatic form submission
        sendData(event, true, onSuccess);
    }

    return(
        <form name="my-form" action={action} onSubmit={handleSubmit}>
            {children}
        </form>
    );
}
