// Material Components:
import 'mdui/components/button.js';
import 'mdui/components/divider.js';
import 'mdui/components/top-app-bar.js';
import 'mdui/components/top-app-bar-title.js';

function defaultSubmit(event) {
    event.preventDefault(); // prevent automatic form submisson
};

function manualSubmit(event) {
    const form = document.getElementById("my-form");
    form.submit();
}

function Form({ action, children }) {
    
    return (
        <form id="my-form" action={action} method="GET" onSubmit={defaultSubmit} style={{alignItems:"stretch", display:"flex", flexDirection:"column", height:"100%", justifyContent:"space-between"}}>
            {/* TODO: change method to POST */}
            <div>
                {children}
            </div>
            <div className="w3-margin-top w3-right" style={{alignSelf:"flex-end"}}>
                <mdui-button type="reset" variant="text" >Discard changes</mdui-button>
                <mdui-button type="submit" onClick={manualSubmit}>Save changes</mdui-button>
            </div>
        </form>
    );
}

export default Form;