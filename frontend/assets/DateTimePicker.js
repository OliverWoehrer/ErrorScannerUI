/**
 * This component is based on <wc-datepicker> from https://github.com/vanillawc/wc-datepicker
 * It is intendet to extend the Material Design User Interface library (https://www.mdui.org)
 * 
 * Link MDUI styles sheet and MDUI components in your HTML head
 * <link rel="stylesheet" href="https://unpkg.com/mdui@2/mdui.css">
 * <script src="https://unpkg.com/mdui@2/mdui.global.js"></script>
 */
class DateTimePicker extends HTMLElement {
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
        const template = document.getElementById("datepicker-template");
        if(!template) {
            console.error("Template 'datepicker-template' not found!");
            return;
        }
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
        // Find Internal Shadow DOM Elements:
        this.containerElement = this.shadow.querySelector("#container");

        // Initialize Date Object (holds picked datetime):
        if(this.initDate === null) {
            this.selectedDate = new Date(); // use current datetime
            this.confirmedDate = new Date();
        } else if(this.#isValidDatetimeString(this.initDate)) {
            this.selectedDate = new Date(this.initDate); // use ISO datetime string
            this.confirmedDate = new Date(this.initDate);
        } else { // invalid datetime string
            throw new Error(`Attribute 'init-date' has an invalid string format: "${this.initDate}". Use ISO format YYYY-MM-DDThh:mm:ss.zzz`);
        }
        
        // Initialize Internal State:
        this.displayedMonth = this.selectedDate.getMonth();
        this.displayedYear = this.selectedDate.getFullYear();
        this.#populateDayNames();
        this.#renderCalendar();

        // Setup Control Buttons:
        const btnNextYear = this.shadow.querySelector("#btnNextYear");
        if(btnNextYear) { btnNextYear.addEventListener("click", () => { this.showNextYear() }); }
        const btnPrevYear = this.shadow.querySelector("#btnPrevYear");
        if(btnPrevYear) { btnPrevYear.addEventListener("click", () => { this.showPrevYear() }); }
        const btnNextMonth = this.shadow.querySelector("#btnNextMonth");
        if(btnNextMonth) { btnNextMonth.addEventListener("click", () => { this.showNextMonth() }); }
        const btnPrevMonth = this.shadow.querySelector("#btnPrevMonth");
        if(btnPrevMonth) { btnPrevMonth.addEventListener("click", () => { this.showPrevMonth() }); }
        const btnCancelDatePicker = this.shadow.querySelector("#btnCancelDatePicker");
        if(btnCancelDatePicker) { btnCancelDatePicker.addEventListener("click", () => { this.resetDateValue() }); }
        const btnConfirmDatePicker = this.shadow.querySelector("#btnConfirmDatePicker");
        if(btnConfirmDatePicker) { btnConfirmDatePicker.addEventListener("click", () => { this.confirmDateValue() }); }
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
        this.#selectDateValue(this.selectedDate.getDate(), this.selectedDate.getMonth(), this.selectedDate.getFullYear());
        this.confirmDateValue();
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Public Methods:
    //////////////////////////////////////////////////////////////////////////////////////////

    /**
     * This function takes the currently selected date and confirms it. A confirmed date cannot be
     * reset to any previous date. See 'resetDateValue()' for more details. The 'confirm' event is
     * emitted depending on the given parameter.
     * @param {Boolean} fireConfirmEvent if true the 'confirm' event is emitted, otherwise not
     * @info Call this function if the 'OK' button is clicked
     */
    confirmDateValue(fireConfirmEvent = true) {
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
    resetDateValue(fireResetEvent = true) {
        this.selectedDate = new Date(this.confirmedDate); // reset to prev confirmed date
        this.#selectDateValue(this.confirmedDate.getDate(), this.confirmedDate.getMonth(), this.confirmedDate.getFullYear());
        this.#renderCalendar();
        if(fireResetEvent) {
            this.dispatchEvent(new CustomEvent("reset"));
        }
    }

    /**
     * This function increments the currently shown month
     * @info Call this function if the 'nextMonth' button is clicked
     */
    showNextMonth() {
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
    showPrevMonth() {
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
    showNextYear() {
        this.displayedYear++;
        this.#renderCalendar();
    }

    /**
     * This function decrements the currently shown year
     * @info Call this function if the 'prevYear' button is clicked
     */
    showPrevYear() {
        this.displayedYear--;
        this.#renderCalendar();
    }

    getMonthLabel() {
        return this.monthNames[this.displayedMonth];
    }

    //////////////////////////////////////////////////////////////////////////////////////////
    // Private Methods:
    //////////////////////////////////////////////////////////////////////////////////////////

    #selectDateValue(day, month, year, fireSelectEvent = true) {
        this.selectedDate.setFullYear(Number(year));
        this.selectedDate.setMonth(Number(month), Number(day));
        this.#renderCalendar();
        if(fireSelectEvent) {
            this.dispatchEvent(new CustomEvent("select"));
        }
    }

    #dayClickedEventHandler(event) {
        const clickedDay = event.target.innerHTML;
        this.#selectDateValue(clickedDay, this.displayedMonth, this.displayedYear);
        if(this.confirmOnSelect) {
            this.confirmDateValue();
        }
    }

    #renderCalendar() {
        // Generate Day Array:
        let dayNumbers = [];
        let adjacentMonthDays = [];
        this.#generateDayArray(dayNumbers, adjacentMonthDays);

        // Style Day Elements:
        const dayElements = this.containerElement.querySelectorAll(".day");
        for(const [idx,dayElement] of dayElements.entries()) {
            dayElement.classList.remove("adjacentMonthDay");
            dayElement.classList.remove("selectedDay");
            dayElement.classList.remove("hidden");
            dayElement.classList.remove("hover");
            dayElement.onclick = null;
            dayElement.onblur = null;
            dayElement.onkeydown = null;
            if (adjacentMonthDays[idx]) {
                dayElement.classList.add("adjacentMonthDay");
            } else {
                dayElement.classList.add("hover");
            }
            dayElement.innerHTML = dayNumbers[idx]
            if (this.displayedMonth === this.selectedDate.getMonth() && this.displayedYear === this.selectedDate.getFullYear() && dayNumbers[idx] === this.selectedDate.getDate() && !adjacentMonthDays[idx]) {
                dayElement.classList.add("selectedDay");
            }
            if(!adjacentMonthDays[idx]) {
                dayElement.onclick = (event) => { this.#dayClickedEventHandler(event) };
            }
        }

        // Style Last Row:
        const lastSeven = adjacentMonthDays.slice(35, 42);
        if(lastSeven.every(x => x === true)) {
            const dayElements = this.containerElement.querySelectorAll(".day")
            for(const [idx,dayElement] of dayElements.entries()) {
                if(idx > 34) {
                    dayElement.classList.add("hidden");
                }
            }
        }
    }

    #populateDayNames() {
        const dayNameArray = this.dayNames.slice();
        const days = this.containerElement.querySelectorAll(".name");
        for(const [idx,day] of days.entries()) {
            day.innerHTML = dayNameArray[idx];
        }
    }

    #generateDayArray(dayArray, adjacentMonthDaysArray) {
        // Date Obj For Rendering Calendar Grid:
        const displayedDate = new Date(this.displayedYear, this.displayedMonth);
        displayedDate.setDate(1);

        // Setup Date Index:
        let index;
        let dateDay = displayedDate.getDay();
        let dateMonth = displayedDate.getMonth() + 1;
        let dateYear = displayedDate.getFullYear();
        let daysInMonth = this.#daysInMonth(dateMonth, dateYear);
        displayedDate.setDate(displayedDate.getDate() - 1);
        let prevMonth = displayedDate.getMonth() + 1;
        let prevMonthYear = displayedDate.getFullYear();
        let daysInPrevMonth = this.#daysInMonth(prevMonth, prevMonthYear);

        // Iterate Days of Previous Month:
        if(dateDay === 0) {
            for (index = 0; index < 6; index++) {
                dayArray.unshift(daysInPrevMonth);
                daysInPrevMonth--;
                adjacentMonthDaysArray.push(true);
            }
        } else {
            for (index = 0; index < dateDay - 1; index++) {
                dayArray.unshift(daysInPrevMonth);
                daysInPrevMonth--;
                adjacentMonthDaysArray.push(true);
            }
        }

        // Iterate Days of This Month:
        for (index = 0; index < daysInMonth; index++) {
            dayArray.push(index + 1);
            adjacentMonthDaysArray.push(false);
        }

        // Iterate Days of Next Month:
        let numberOfNextMonthDays = 42 - dayArray.length
        for (index = 0; index < numberOfNextMonthDays; index++) {
            dayArray.push(index + 1)
            adjacentMonthDaysArray.push(true)
        }
    }

    #isLeapYear(year) {
        return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)
    }

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

    #isValidDatetimeString(str) {
        const ISO_FORMAT = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d{3})?)?$/;
        return ISO_FORMAT.test(str);
    }
}

// Define the new component
customElements.define("datetime-picker", DateTimePicker);