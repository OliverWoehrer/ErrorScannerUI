/**
 * This component is based on <wc-datepicker> from https://github.com/vanillawc/wc-datepicker
 * It is intendet to extend the Material Design User Interface library (https://www.mdui.org)
 * 
 * Link MDUI styles sheet and MDUI components in your HTML head
 * <link rel="stylesheet" href="https://unpkg.com/mdui@2/mdui.css">
 * <script src="https://unpkg.com/mdui@2/mdui.global.js"></script>
 */
class DateTimePicker extends HTMLElement {
    static observedAttributes = ["init-date", "ignore-on-focus", "persist-on-select"];

    constructor() {
        super()
        // Set Default Properties:
        this.dayNames = ["M","T","W","T","F","S","S"];
        this.monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        this.closeOnSelect = false;
        this.initDate = null;
        this.ignoreOnFocus = false;

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
        } else if(name === "ignore-on-focus") {
            this.ignoreOnFocus = true;
        } else if(name === "close-on-select") {
            this.closeOnSelect = true;
        }
    }

    connectedCallback() {
        // Find Internal Shadow DOM Elements:
        this.containerElement = this.shadow.querySelector("#date-picker");
        this.headline = this.shadow.querySelector("#headline");
        this.headlineMonth = this.shadow.querySelector("#headlineMonth");
        this.headlineYear = this.shadow.querySelector("#headlineYear");

        // Initialize Date Object (holds picked datetime):
        if(this.initDate === null) {
            this.dateObj = new Date(); // use current datetime
            this.confirmedDateObj = new Date();
        } else if(this.#isValidDatetimeString(this.initDate)) {
            this.dateObj = new Date(this.initDate); // use ISO datetime string
            this.confirmedDateObj = new Date(this.initDate);
        } else { // invalid datetime string
            throw new Error(`Attribute 'init-date' has an invalid string format: "${this.initDate}". Use ISO format YYYY-MM-DDThh:mm:ss.zzz`);
        }
        
        // Initialize Slotted Elements:
        const dateInputSlot = this.shadow.querySelector("slot[name='date-input']"); // slot reference
        this.dateInputElement = dateInputSlot.assignedElements()[0]; // returns slotted element or default element from template
        if(!this.dateInputElement) {
            return;
        }
        this.dateInputElement.value = this.#toDateString(this.dateObj);

        const timeInputSlot = this.shadow.querySelector("slot[name='time-input']");
        this.timeInputElement = timeInputSlot.assignedElements()[0];
        if(!this.timeInputElement) {
            return;
        }
        this.timeInputElement.value = this.#toTimeString(this.dateObj);
        
        // Initialize Internal State:
        this.displayedMonth = this.dateObj.getMonth();
        this.displayedYear = this.dateObj.getFullYear();
        this.containerElement.style.display = "none";
        this.#populateDayNames();
        this.#renderCalendar();

        // Setup Event Handlers:
        if(!this.ignoreOnFocus) {
            this.dateInputElement.onfocus = () => { this.#openDatePicker() };
        }
        this.dateInputElement.addEventListener("click", () => { this.#openDatePicker() });
        this.dateInputElement.oninput = () => { this.#onInputHandler() };
        this.dateInputElement.onblur = () => { this.#blurHandler() };
        this.containerElement.onblur = () => { this.#blurHandler() };

        // Setup Control Buttons:
        const btnNextYear = this.shadow.querySelector("#btnNextYear");
        if(btnNextYear) { btnNextYear.addEventListener("click", () => { this.#showNextYear(); }); }
        const btnPrevYear = this.shadow.querySelector("#btnPrevYear");
        if(btnPrevYear) { btnPrevYear.addEventListener("click", () => { this.#showPrevYear(); }); }
        const btnNextMonth = this.shadow.querySelector("#btnNextMonth");
        if(btnNextMonth) { btnNextMonth.addEventListener("click", () => { this.#showNextMonth(); }); }
        const btnPrevMonth = this.shadow.querySelector("#btnPrevMonth");
        if(btnPrevMonth) { btnPrevMonth.addEventListener("click", () => { this.#showPrevMonth(); }); }
        const btnCancelDatePicker = this.shadow.querySelector("#btnCancelDatePicker");
        if(btnCancelDatePicker) { btnCancelDatePicker.addEventListener("click", () => { this.#closeDatePicker(); }); }
        const btnConfirmDatePicker = this.shadow.querySelector("#btnConfirmDatePicker");
        if(btnConfirmDatePicker) { btnConfirmDatePicker.addEventListener("click", () => { this.#confirmDatePicker(); }); }
    }

    setFocusOnCal() {
        if(this.containerElement) {
            this.containerElement.style.display = "block";
            this.containerElement.focus();
        }
    }

    getDateString() {
        return this.#toDateString(this.dateObj);
    }

    getDateObject() {
        return this.dateObj;
    }

    #openDatePicker() {
        this.containerElement.style.display = "block";
    }

    #closeDatePicker() {
        if(document.activeElement === this.dateInputElement) {
            this.dateInputElement.blur();
        }
        this.#resetDateValue();
        this.containerElement.style.display = "none";
    }

    #confirmDatePicker() {
        this.#confirmDateValue();
        this.#closeDatePicker();
    }

    #setDateValue(day, month, year) {
        this.dateObj.setFullYear(Number(year));
        this.dateObj.setMonth(Number(month), Number(day));
        this.dateInputElement.value = this.#toDateString(this.dateObj);
        this.#renderCalendar();
        this.dateInputElement.dispatchEvent(new CustomEvent("dateselect"));
    }

    #resetDateValue() {
        this.dateObj = new Date(this.confirmedDateObj); // reset to prev confirmed date
        this.dateInputElement.value = this.#toDateString(this.dateObj);
        this.#renderCalendar();
    }

    #confirmDateValue() {
        this.confirmedDateObj = new Date(this.dateObj);
        this.dateInputElement.dispatchEvent(new CustomEvent("dateconfirm"));
    }

    #dayClickedEventHandler(event) {
        const clickedDay = event.target.innerHTML;
        this.#setDateValue(clickedDay, this.displayedMonth, this.displayedYear);
        // this.dateInputElement.value = this.#toDateString(this.dateObj);
        // this.dateInputElement.dispatchEvent(new CustomEvent("dateselect"));
        // this.#renderCalendar();
        if(this.closeOnSelect) {
            this.#confirmDateValue(this.dateObj);
            this.#closeDatePicker();
        }
    }

    #blurHandler() {
        const checkActiveElement = () => {
            if(this.shadow.activeElement === null) { // check if new active element is outside the component's shadow DOM
                console.log("Checked: active element not in shadow DOM");
                this.containerElement.style.display = "none";
            }
        }
        setTimeout(() => { /*checkActiveElement()*/ }, 0); // wait for all async blur events to fire
    }

    #isValidDatetimeString(str) {
        const ISO_FORMAT = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d{3})?)?$/;
        return ISO_FORMAT.test(str);
    }

    #onInputHandler() {
        if(!this.#isValidDatetimeString(this.dateInputElement.value)) {
            throw new Error(`Input value "${this.dateInputElement}" has an invalid string format: "${this.initDate}". Use ISO format YYYY-MM-DDThh:mm:ss.zzz`);
        }
        const obj = new Date(this.dateInputElement.value);
        this.#setDateValue(obj.getDate(), obj.getMonth(), obj.getFullYear());
        this.#confirmDateValue();
        this.displayedMonth = obj.month;
        this.displayedYear = obj.year;
        this.dateInputElement.dispatchEvent(new CustomEvent("dateselect"));
        this.#renderCalendar();
    }

    #showNextYear() {
        this.displayedYear++;
        this.#renderCalendar();
    }

    #showPrevYear() {
        this.displayedYear--;
        this.#renderCalendar();
    }

    #showNextMonth() {
        if(this.displayedMonth === 11) {
            this.displayedMonth = 0;
            this.displayedYear++;
        } else {
            this.displayedMonth++;
        }
        this.#renderCalendar();
    }

    #showPrevMonth() {
        if(this.displayedMonth === 0) {
            this.displayedMonth = 11;
            this.displayedYear--;
        } else {
            this.displayedMonth--;
        }
        this.#renderCalendar();
    }

    #renderCalendar() {
        // Set Headline:
        this.headline.innerHTML = ("0"+this.dateObj.getDate()).slice(-2)+"."+("0"+this.displayedMonth).slice(-2)+"."+this.displayedYear;
        this.headlineMonth.innerHTML = this.monthNames[this.displayedMonth];
        this.headlineYear.innerHTML = this.displayedYear;

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
            if (this.displayedMonth === this.dateObj.getMonth() && this.displayedYear === this.dateObj.getFullYear() && dayNumbers[idx] === this.dateObj.getDate() && !adjacentMonthDays[idx]) {
                dayElement.classList.add("selectedDay");
            }
            if(!adjacentMonthDays[idx]) {
                dayElement.onclick = this.#dayClickedEventHandler.bind(this);
                dayElement.tabIndex = 0;
                dayElement.onblur = () => { this.#blurHandler() };
            } else {
                dayElement.removeAttribute("tabindex");
            }
        }

        // Style Last Row:
        const lastSeven = adjacentMonthDays.slice(35, 42);
        if(lastSeven.every(x => x === true)) {
            const dayElements = this.containerElement.querySelectorAll(".day")
            for(const [idx,dayElement] of dayElements.entries()) {
                if(idx > 34) {
                    dayElement.classList.add("hidden")
                }
            }
        }
    }

    #toDateString(date) {
        const split = date.toISOString().split("T");
        const dateString = split[0];
        const timeString = split[1].slice(0, -1);
        return dateString;
    }

    #toTimeString(date) {
        const split = date.toISOString().split("T");
        const dateString = split[0];
        const timeString = split[1].slice(0, -1);
        return timeString;
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
}

// Define the new component
customElements.define("datetime-picker", DateTimePicker);