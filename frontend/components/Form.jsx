// Material Components:
import 'mdui/components/button.js';
import { snackbar } from 'mdui/functions/snackbar.js';

function defaultSubmit(event) {
    event.preventDefault(); // prevent automatic form submisson
};

async function sendData(event) {
    // Build JSON Form Data:
    const form = event.target.closest("form");
    if(!form) {
        snackbar({ message:`Could not find parent <form> element`, closeable:true });
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
        if(response.ok) {
            snackbar({ message:`Submitted data successfully`, closeable:true });
        } else {
            snackbar({ message:`Failed to submit data to '${endpoint}' [${response.status} ${response.statusText}]`, closeable:true });
            return;
        }
    } catch(error) {
        snackbar({ message:`Failed to submit data to '${endpoint}' [${error}]`, closeable:true });
    }
}

function Form({ action, children }) {
    return(
        <form name="my-form" action={action} method="GET" onSubmit={defaultSubmit} style={{alignItems:"stretch", display:"flex", flexDirection:"column", height:"100%", justifyContent:"space-between"}}>
            {/* TODO: change method to POST */}
            <div>
                {children}
            </div>
            <div style={{alignSelf:"flex-end", float:"right", marginTop:"12px"}}>
                <mdui-button type="reset" variant="text">Discard changes</mdui-button>
                <mdui-button type="submit" onClick={sendData}>Confirm</mdui-button>
            </div>
        </form>
    );
}

export default Form;