class FileInput extends HTMLElement {
    //////////////////////////////////////////////////////////////////////////////////////////
    // Static Template:
    //////////////////////////////////////////////////////////////////////////////////////////
    static formAssociated = true; // this element is associated with its parent form element
    static observedAttributes = ["name","accept","helper-text"];
    static templateString = `
    <style>
        :host {
            height: 100%;
            width: 100%;
        }
        label {
            display: flex;
            align-items: center;
            padding: 0;
            height: 100%;
            width: 100%;
        }
        [part="file-picker"] {
            border: 1px solid;
        }
        #picker-text{
            opacity: 0.4;
        }
    </style>
    <label for="file-upload" part="file-picker">
        <span id="picker-text"></span>
        <input type="file" id="file-upload" name="file_exchange" accept=".jsonl" hidden>
    </label>
    `;

    //////////////////////////////////////////////////////////////////////////////////////////
    // Web Component Lifecycle Hooks:
    //////////////////////////////////////////////////////////////////////////////////////////

    constructor() {
        super();

        // Set Default Properties:
        this.name = "file_upload"; // form element name
        this.accept = "";
        this.helperString = "Choose File or Drag & Drop";
        this.internals = this.attachInternals(); // get element internals

        // Setup Shadow DOM:
        const template = document.createElement("template");
        if(!FileInput.templateString) { throw new Error("No template found"); }
        template.innerHTML = FileInput.templateString;
        this.shadow = this.attachShadow({ mode:"closed" });
        this.shadow.append(template.content.cloneNode(true));
    }

    /**
     * Lifecyle method. Called when the component is added to the DOM
     */
    connectedCallback() {
        // Initialize File Picker:
        this.pickerText = this.shadow.querySelector("#picker-text");
        if(!this.pickerText) { throw new Error("No picker text found"); }
        this.pickerText.textContent = this.helperString;

        // Initialize Input Element:
        this.input = this.shadow.querySelector("input");
        this.input.accept = this.accept;
        this.input.name = this.name;
        this.input.addEventListener("change", () => this.#updateFormValue());
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(name === "name") {
            this.name = newValue;
            this.input.name = newValue;
        } else if(name === "accept") {
            this.accept = newValue;
        } else if(name === "helper-text") {
            this.helperString = newValue;
        }
    }

    /**
     * Lifecycle method when associated with a form element
     */
    formResetCallback() {
        this.input.value = "";
        this.pickerText.textContent = this.helperString;
        this.pickerText.style.opacity = "0.4";
        this.#updateFormValue();
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Private Methods:
    //////////////////////////////////////////////////////////////////////////////////////////

    #updateFormValue() {
        if(this.input.files.length > 0) {
            const file = this.input.files[0];
            const formData = new FormData();
            formData.append(this.name, file, file.name);
            this.internals.setFormValue(formData);
            this.pickerText.style.opacity = "1.0";
            this.pickerText.textContent = file.name; // display file name in file picker
        } else {
            this.internals.setFormValue(null);
            this.pickerText.style.opacity = "0.4";
            this.pickerText.textContent = this.helperString; // remove file name from file picker
        }
    }
}

// Define the new component
customElements.define("file-input", FileInput);