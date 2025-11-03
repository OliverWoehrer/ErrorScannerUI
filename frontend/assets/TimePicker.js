
const template = document.createElement("template");
template.innerHTML = `
<style>
    :host {
        --grid-margin: 10px;
        display: block;
        width: 100vw;
        max-width: 100%;
    }
    header {
        margin-bottom: 12px;
    }
    main {
        display: grid;
        grid-gap: var(--grid-margin);
        grid-template-columns: repeat(7, 1fr);
        margin-bottom: var(--grid-margin);
    }
    footer {
        display: flex;
        gap: var(--grid-margin);
        justify-content: flex-end;
    }
    .flexRow {
        align-items: center;
        display: flex;
        gap: var(--grid-margin);
        justify-content: space-between;
    }
    .gridItem {
        aspect-ratio: 1 / 1;
        box-sizing: border-box;
        cursor: default;
        display: grid;
        height: auto;
        place-items: center;
    }
    [part~="selected"] {
        border-style: solid;
        border-width: 1px;   
    }
    [part~="inactive"] {
        opacity: 0.4;
    }
</style>
<div id="container">
    <header>
        <div style="opacity: 0.4">
            <slot name="supporting-text"></slot>
        </div>
        <div id="headline">
            <slot name=headline></slot>
        </div>
        <div class="flexRow">
            <div class="flexRow">
                <slot name="prev-month-btn"><button>&#11207;</button></slot>
                <span id="month">Month</span>
                <slot name="next-month-btn"><button>&#11208;</button></slot>
            </div>
            <div class="flexRow">
                <slot name="prev-year-btn"><button>&#11207;</button></slot>
                <span id="year">Year</span>
                <slot name="next-year-btn"><button>&#11208;</button></slot>
            </div>
        </div>
    </header>
    <main>
        <!-- filled by'createGridItems()' on initialization -->
    </main>
    <footer class="footer">
        <slot name="cancel-btn"><button>Cancel</button></slot>
        <slot name="confirm-btn"><button>OK</button></slot>
    </footer>
</div>
`;

class DatePicker extends HTMLElement {
    //////////////////////////////////////////////////////////////////////////////////////////
    // Web Component Lifecycle Hooks:
    //////////////////////////////////////////////////////////////////////////////////////////

    static observedAttributes = ["init-date", "confirm-on-select"];

    constructor() {
        super()
        // Set Default Properties:
        this.dayNames = ["M","T","W","T","F","S","S"];
        this.monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        this.confirmOnSelect = false;
        this.initDate = null;

        // Setup Shadow DOM:
        if(!template) { throw new Error("No template found"); }
        this.shadow = this.attachShadow({ mode:"closed" });
        this.shadow.append(template.content.cloneNode(true));
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(name === "init-date") {
            this.initDate = newValue;
        } else if(name === "confirm-on-select") {
            this.confirmOnSelect = true;
        }
    }

    connectedCallback() {
        // Build Template Structure:
        this.#createGridItems();

        // Initialize Slotted Elements:
        const headlineSlot = this.shadow.querySelector("slot[name='headline']");
        this.headlineText = headlineSlot.assignedNodes({ flatten:true })[0];

        const prevMonthSlot = this.shadow.querySelector("slot[name='prev-month-btn']");
        const prevMonthButton = prevMonthSlot.assignedNodes({ flatten:true })[0];
        prevMonthButton.onclick = () => { this.#showPrevMonth() };

        const nextMonthSlot = this.shadow.querySelector("slot[name='next-month-btn']");
        const nextMonthButton = nextMonthSlot.assignedNodes({ flatten:true })[0];
        nextMonthButton.onclick = () => { this.#showNextMonth() };

        const prevYearSlot = this.shadow.querySelector("slot[name='prev-year-btn']");
        const prevYearButton = prevYearSlot.assignedNodes({ flatten:true })[0];
        prevYearButton.onclick = () => { this.#showPrevYear() };

        const nextYearSlot = this.shadow.querySelector("slot[name='next-year-btn']");
        const nextYearButton = nextYearSlot.assignedNodes({ flatten:true })[0];
        nextYearButton.onclick = () => { this.#showNextYear() };

        const cancelSlot = this.shadow.querySelector("slot[name='cancel-btn']");
        const cancelButton = cancelSlot.assignedNodes({ flatten:true })[0];
        cancelButton.onclick = () => { this.#resetDateValue() };

        const confirmSlot = this.shadow.querySelector("slot[name='confirm-btn']");
        const confirmButton = confirmSlot.assignedNodes({ flatten:true })[0];
        confirmButton.onclick = () => { this.#confirmDateValue() };

        // Initialize Date Object (holds picked datetime):
        if(this.initDate === null) {
            this.confirmedDateObj = new Date(); // use current datetime
        } else if(this.#isValidDatetimeString(this.initDate)) {
            this.confirmedDateObj = new Date(this.initDate); // use ISO datetime string
        } else { // invalid datetime string
            throw new Error(`Attribute 'init-date' has an invalid string format: "${this.initDate}". Use ISO format YYYY-MM-DDThh:mm:ss.zzz`);
        }

        // Initialize Internal State:
        this.displayedMonth = this.selectedDate.getMonth();
        this.displayedYear = this.selectedDate.getFullYear();
        this.#renderCalendar();
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Getters and Setters:
    //////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Returns the currently selected date
     * @returns Date() object
     */
    get selectedDateObj() {
        return this.selectedDate;
    }

    /**
     * Updates the currenlty selected date. The 'select' event is emitted depending on the given
     * setting of 'fireSelectEvent'.
     * @param {Date} date selected object to update
     */
    set selectedDateObj(date) {
        console.assert(date instanceof Date, "Given date has to be of type 'Date'");
        this.selectedDate = new Date(date); // clone date object
        this.#selectDateValue(this.selectedDate.getDate(), this.selectedDate.getMonth(), this.selectedDate.getFullYear());
    }

    /**
     * Returns the currently confirmed date
     * @returns Date() object
     */
    get confirmedDateObj() {
        return this.confirmedDate;
    }

    /**
     * Updates the currenlty confirmed date. Updating the confirmed date automatically updates the
     * selected date. The events 'select' and 'confirm' are emitted based on the given parameters.
     * @param {Date} date confirmedDate date object
     */
    set confirmedDateObj(date) {
        console.assert(date instanceof Date, "Given date has to be of type 'Date'");
        this.#selectDateValue(date.getDate(), date.getMonth(), date.getFullYear());
        this.#confirmDateValue();
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Private Methods:
    //////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Takes the given date parameters and sets the selected date object
     * @param {Number} day date number
     * @param {Number} month month index
     * @param {Number} year full year number
     * @param {Boolean} fireSelectEvent if true the 'select' event is emitted, otherwise not
     */
    #selectDateValue(day, month, year, fireSelectEvent = true) {
        if(this.selectedDate) {
            this.selectedDate.setFullYear(year);
            this.selectedDate.setMonth(month, day);
        } else {
            this.selectedDate = new Date(year, month, day);
        }
        
        // const headline = this.shadow.querySelector("#headline");
        const headline = this.headlineText;
        if(headline) { headline.textContent = this.#toDateString(this.selectedDate); }
        this.#renderCalendar();
        if(fireSelectEvent) {
            this.dispatchEvent(new CustomEvent("select"));
        }
    }

    /**
     * This function takes the currently selected date and confirms it. A confirmed date cannot be
     * reset to any previous date. See 'resetDateValue()' for more details. The 'confirm' event is
     * emitted depending on the given parameter.
     * @param {Boolean} fireConfirmEvent if true the 'confirm' event is emitted, otherwise not
     * @info Call this function if the confirm button is clicked
     */
    #confirmDateValue(fireConfirmEvent = true) {
        this.confirmedDate = new Date(this.selectedDate);
        if(fireConfirmEvent) {
            this.dispatchEvent(new CustomEvent("confirm"));
        }
    }

    /**
     * This function resets the currently selected date to the last confirmed date. A selected but
     * not yet confirmed date can be reset to the las confirmed date. The 'select' event is
     * emitted because the selection is updated.
     * @param {Boolean} fireResetEvent if true the 'reset' event is emitted, otherwise not
     * @info Call this function if the 'Cancel' button is clicked
     */
    #resetDateValue(fireResetEvent = true) {
        this.selectedDate = new Date(this.confirmedDate); // reset to prev confirmed date
        this.#selectDateValue(this.confirmedDate.getDate(), this.confirmedDate.getMonth(), this.confirmedDate.getFullYear());
        this.#renderCalendar();
        if(fireResetEvent) {
            this.dispatchEvent(new CustomEvent("reset"));
        }
    }

    /**
     * This function is called when the user clicks on a day element. Updates the selected date
     * object.
     * @param {Object} event Event object passed by the 'click' event
     */
    #dayClickedEventHandler(event) {
        const clickedDay = event.target.innerHTML;
        this.#selectDateValue(clickedDay, this.displayedMonth, this.displayedYear);
        if(this.confirmOnSelect) {
            this.#confirmDateValue();
        }
    }

    /**
     * This function increments the currently shown month
     * @info Call this function if the 'nextMonth' button is clicked
     */
    #showNextMonth() {
        if(this.displayedMonth === 11) {
            this.displayedMonth = 0;
            this.displayedYear++;
        } else {
            this.displayedMonth++;
        }
        this.#renderCalendar();
    }

    /**
     * This function decrements the currently shown month
     * @info Call this function if the 'prevMonth' button is clicked
     */
    #showPrevMonth() {
        if(this.displayedMonth === 0) {
            this.displayedMonth = 11;
            this.displayedYear--;
        } else {
            this.displayedMonth--;
        }
        this.#renderCalendar();
    }

    /**
     * This function increments the currently shown year
     * @info Call this function if the 'nextYear' button is clicked
     */
    #showNextYear() {
        this.displayedYear++;
        this.#renderCalendar();
    }

    /**
     * This function decrements the currently shown year
     * @info Call this function if the 'prevYear' button is clicked
     */
    #showPrevYear() {
        this.displayedYear--;
        this.#renderCalendar();
    }

    /**
     * Creates the elements of the calendar grid. Only called once during initialization.
     */
    #createGridItems() {
        const main = this.shadow.querySelector("main");
        if(!main) { throw new Error("Could not query grid element. Template needs an element 'main'."); }

        // Create Weekday Labels:
        const weekdays = this.dayNames;
        for(const weekday of weekdays) {
            const labelElement = document.createElement("div");
            labelElement.className = "gridItem"; // class 'gridItem' used for grid styling
            labelElement.setAttribute("part", "label");
            labelElement.innerHTML = weekday;
            main.appendChild(labelElement);
        }

        // Create Days:
        for(let idx = 0; idx < 42; idx++) {
            const dayElement = document.createElement("div");
            dayElement.className = "gridItem"; // class 'gridItem' used for grid styling
            dayElement.setAttribute("part", "day");
            main.appendChild(dayElement);
        }
    }

    /**
     * Renders the calendar grid with the currently displayed month and year
     */
    #renderCalendar() {
        // Generate Day Array:
        let dayNumbers = []; // numbers of dates
        let activeDays = []; // boolean values, if the daynumber with the same index is active or not
        this.#generateDayArray(dayNumbers, activeDays);

        const main = this.shadow.querySelector("main");
        if(!main) { throw new Error("Could not query grid element. Template needs an element 'main'."); }

        // Style Day Elements:
        const gridElements = main.querySelectorAll("[part~='day']"); // the '~=' attribute selector matches the specified word delimited by spaces
        for(const [idx,gridElement] of gridElements.entries()) {
            gridElement.innerHTML = dayNumbers[idx];
            gridElement.removeAttribute("part"); // clean any parts
            gridElement.onclick = null; // remove any event listeners
            let attributeString = "day";
            if(activeDays[idx]) {
                gridElement.onclick = (event) => { this.#dayClickedEventHandler(event) };
                attributeString += " active";
                if(this.displayedMonth === this.selectedDate.getMonth() && this.displayedYear === this.selectedDate.getFullYear() && dayNumbers[idx] === this.selectedDate.getDate()) {
                    attributeString += " selected";
                }
            } else {
                attributeString += " inactive";
            }
            gridElement.setAttribute("part", attributeString);
        }

        // Update Text:
        const month = this.shadow.querySelector("#month");
        if(month) { month.innerHTML = this.monthNames[this.displayedMonth]; }
        const year = this.shadow.querySelector("#year");
        if(year) { year.innerHTML = this.displayedYear; }
    }

    /**
     * Generates the array of days for the currently displayed month and year. The day array is
     * essentially a list (=Array) starting with the last monday of the previous month. Followed
     * by the days of the current month. Ending with the first few days of the next month.
     * @param {Array} dayArray Array of numbers that holds the date numbers of the days to render
     * @param {Array} activeDays Array of booleans with same length as 'dayArray'. Active days with
     * the same index are set 'true', inactive days are set 'false'.
     */
    #generateDayArray(dayArray, activeDays) {
        // Date Obj For Rendering Calendar Grid:
        const displayedDate = new Date(this.displayedYear, this.displayedMonth);
        displayedDate.setDate(1);

        // Current Date:
        const weekday = displayedDate.getDay();
        const month = displayedDate.getMonth() + 1;
        const year = displayedDate.getFullYear();
        let daysInMonth = this.#daysInMonth(month, year);

        // Previous Date:
        displayedDate.setDate(displayedDate.getDate() - 1); // decrement date to get yesterday
        const prevMonth = displayedDate.getMonth() + 1;
        const prevMonthYear = displayedDate.getFullYear();
        const daysInPrevMonth = this.#daysInMonth(prevMonth, prevMonthYear);

        // Build Day Array:
        const offset = ((weekday == 0) ? 6 : (weekday-1)); // sunday: weekday=0, monday: weekday=1
        const firstMonday = daysInPrevMonth - (offset - 1); // date of the first monday to generate (= last monday of prev month)
        for(let day = firstMonday; day <= daysInPrevMonth; day++) { // append days of prev month (=non-active days)
            dayArray.push(day);
            activeDays.push(false);
        }
        for(let day = 1; day <= daysInMonth; day++) { // append days of this month (=active-days)
            dayArray.push(day);
            activeDays.push(true);
        }
        const numberOfNextMonthDays = 42 - dayArray.length;
        for(let day = 1; day <= numberOfNextMonthDays; day++) { // append days of next month (=non-active days)
            dayArray.push(day);
            activeDays.push(false);
        }
    }

    /**
     * Tells if the given year is a leap year
     * @param {Number} year 
     * @returns 'true' if the year is a leap year, false otherwise
     */
    #isLeapYear(year) {
        return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)
    }

    /**
     * Tells how many days there are in the given month of the year
     * @param {Number} month month to inspect
     * @param {Number} year year of the month
     * @returns Number of days of the given month
     */
    #daysInMonth(month, year) {
        if(month === 1 || month === 3 || month === 5 || month === 7 || month === 8 || month === 10 || month === 12) {
            return 31;
        } else if(month === 4 || month === 6 || month === 9 || month === 11) {
            return 30;
        } else if(month === 2 && this.#isLeapYear(year)) {
            return 29;
        } else if(month === 2 && !(this.#isLeapYear(year))) {
            return 28;
        }
    }

    /**
     * Tells if the given string is a date or datetime in ISO format. Valid is either the short
     * format (only date, YYYY-MM-DD), standard format (date and time, YYYY-MM-DDThh:mm:ss) or the
     * long format (with milliseconds, YYYY-MM-DDThh:mm:ss.zzz).
     * @param {String} str String to check
     * @returns 'true' if the string is a valid format
     */
    #isValidDatetimeString(str) {
        const ISO_FORMAT = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d{3})?)?$/;
        return ISO_FORMAT.test(str);
    }

    /**
     * Extracts a readble string from the the given date
     * @param {Date} date date object to stringify
     * @returns string in format "18. Oct 2025"
     */
    #toDateString(date) {
        console.assert(date instanceof Date, "Given parameter has to be of Type 'Date'");
        const day = date.getDate();
        const month = this.monthNames[date.getMonth()];
        const year = date.getFullYear();
        const split = date.toISOString().split("T");
        const dateString = split[0];
        const timeString = split[1].slice(0, -1);
        return day+". "+month+" "+year;
    }
}

// Define the new component
customElements.define("date-picker", DatePicker);