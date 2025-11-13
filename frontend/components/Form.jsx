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
    // Build JSON Form Data:
    const form = event.target.closest("form");
    if(!form) {
        printMessage(`Could not find parent <form> element`);
        return;
    }
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
        // TODO: update form with received response
    } catch(error) {
        printMessage(`Failed to submit data to '${endpoint}' [${error}]`);
    }
}

function Form({ action, onSuccess, children }) {
    function handleSubmit(event) {
        sendData(event, onSuccess);
    }

    return(
        <form name="my-form" action={action} onSubmit={defaultSubmit} style={{alignItems:"stretch", display:"flex", flexDirection:"column", height:"100%", justifyContent:"space-between"}}>
            <div>
                {children}
            </div>
            <div style={{alignSelf:"flex-end", float:"right", marginTop:"12px"}}>
                <mdui-button type="reset" variant="text">Discard changes</mdui-button>
                <mdui-button type="submit" onClick={handleSubmit}>Confirm</mdui-button>
            </div>
        </form>
    );
}

export default Form;