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

async function sendData(event, onSuccess) {
    // Validate Form:
    const form = event.target.closest("form");
    if(!form) {
        printMessage(`Could not find parent <form> element`);
        return;
    }
    if(!form.reportValidity()) {
        return; // dont send invalid data
    }

    // Build JSON Form Data:
    const formData = new FormData(form);
    const formDataObject = Object.fromEntries(formData.entries());
    const formDataJsonString = JSON.stringify(formDataObject); // convert to serialized JSON string
    const endpoint = form.getAttribute('action');

    // Send JSON Data:
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type":"application/json" },
            body: formDataJsonString,
        });
        if(!response.ok) {
            const text = await response.text();
            printMessage(`Failed to submit data to '${endpoint}': [${response.status} ${response.statusText}] ${text}`);
            return;
        }
        if(onSuccess) {
            onSuccess(); // callback function on success
        }
        printMessage(`Submitted data successfully`, 3000);
    } catch(error) {
        printMessage(`Failed to submit data to '${endpoint}' [${error}]`);
    }
}

function Form({ action, submitButtonText, resetButtonText, onSuccess, onReset, children }) {
    const submitText = submitButtonText || "Confirm changes";
    const resetText = resetButtonText || "Discard changes";

    function handleSubmit(event) {
        sendData(event, onSuccess);
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

export default Form;