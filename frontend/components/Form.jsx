// Material Components:
import 'mdui/components/button.js';
import { snackbar } from 'mdui/functions/snackbar.js';

function defaultSubmit(event) {
    event.preventDefault(); // prevent automatic form submisson
};

function manualSubmit(event) {
    const form = document.getElementById("my-form");
    snackbar({ message: "Form submitted", closeable:true });
    // TODO: send post request manually
    // form.submit() will trigger a page reload
}

function Form({ action, children }) {
    return(
        <form id="my-form" action={action} method="GET" onSubmit={defaultSubmit} style={{alignItems:"stretch", display:"flex", flexDirection:"column", height:"100%", justifyContent:"space-between"}}>
            {/* TODO: change method to POST */}
            <div>
                {children}
            </div>
            <div style={{alignSelf:"flex-end", float:"right", marginTop:"12px"}}>
                <mdui-button type="reset" variant="text">Discard changes</mdui-button>
                <mdui-button type="submit" onClick={manualSubmit}>Confirm</mdui-button>
            </div>
        </form>
    );
}

export default Form;