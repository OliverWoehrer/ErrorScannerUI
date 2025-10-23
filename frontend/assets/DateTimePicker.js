class DateTimePicker extends HTMLElement {
    constructor() {
        super()
        // Set Default Properties:
        this.dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        this.monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        this.sundayFirst = false;
        this.persistOnSelect = false;
        this.longPressThreshold = 500;
        this.longPressInterval = 150;
        this.initDate = null;
        this.ignoreOnFocus = false;
        this.showCloseIcon = false;
        this._inputStrIsValidDate = false;
        this._longPressIntervalIds = [];
        this._longPressTimerIds = [];

        // Setup Shadow DOM:
        const template = document.getElementById("datepicker-template");
        if(!template) {
            console.error("Template 'datepicker-template' not found!");
            return;
        }
        this.shadow = this.attachShadow({ mode:"closed" });
        this.shadow.append(template.content.cloneNode(true));
    }

    static observedAttributes = ["init-date", "ignore-on-focus", "persist-on-select", "show-close-icon"];

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'init-date') {
            this.initDate = newValue;
        } else if (name === 'ignore-on-focus') {
            this.ignoreOnFocus = true;
        } else if (name === 'persist-on-select') {
            this.persistOnSelect = true;
        } else if (name === 'show-close-icon') {
            this.showCloseIcon = true;
        }
    }

    connectedCallback() {
        // Find Internal Shadow DOM Elements:
        this.calContainer = this.shadow.querySelector("#calContainer");
        this.calTitle = this.shadow.querySelector("#calTitle");
        
        // Initialize Slotted Elements:
        const dateInputSlot = this.shadow.querySelector("slot[name='date-input']"); // slot reference
        this.dateInputElement = dateInputSlot.assignedElements()[0]; // returns slotted element or default element from template
        if(!this.dateInputElement) {
            return;
        }

        this.dateObj = new Date(); // this will hold the selected date
        var obj

        if (this.initDate !== null) {
            obj = this._parseAndValidateInputStr(this.initDate)
            if (obj.valid) {
                this.dateObj = new Date(obj.year, obj.month, obj.day)
                this._inputStrIsValidDate = true
                this.dateInputElement.value = this._returnDateString(this.dateObj)
            } else if (this.initDate === 'current') {
                this._inputStrIsValidDate = true
                this.dateInputElement.value = this._returnDateString(this.dateObj)
            }
        } else {
            obj = this._parseAndValidateInputStr(this.dateInputElement.value)
            if (obj.valid) {
                this.dateObj = new Date(obj.year, obj.month, obj.day)
                this._inputStrIsValidDate = true
            } else {
                this._inputStrIsValidDate = false
            }
        }
        this.initDate = null

        this.displayedMonth = this.dateObj.getMonth()
        this.displayedYear = this.dateObj.getFullYear()

        this.calContainer.style.display = 'none' // Already hidden by CSS, but good to be explicit
        this._populateDayNames()
        this._addHeaderEventHandlers()
        this._renderCalendar()

        if (!this.ignoreOnFocus) {
            // The original used 'onfocus', which is good.
            this.dateInputElement.onfocus = this._inputOnFocusHandler.bind(this)
        }
        
        // This is what you asked for: open the picker on click.
        // We'll just trigger the same 'onfocus' handler.
        this.dateInputElement.addEventListener("click", this._inputOnFocusHandler.bind(this));

        this.dateInputElement.oninput = this._inputOnInputHandler.bind(this)
        this.dateInputElement.onblur = this._blurHandler.bind(this)

        this.calContainer.onblur = this._blurHandler.bind(this)

        if (!this.showCloseIcon) {
            // *** FIXED SELECTOR ***
            this.shadow.querySelector('#calCtrlHideCal').style.display = 'none'
        }
    }

    setFocusOnCal() {
        if (this.calContainer) {
            this.calContainer.style.display = 'block'
            this.calContainer.focus()
        }
    }

    // --- All original methods copied below, with selector fixes ---
    
    _dayClickedEventHandler(event) {
        this._inputStrIsValidDate = true
        this._setNewDateValue(event.target.innerHTML, this.displayedMonth, this.displayedYear)
        this.dateInputElement.value = this._returnDateString(this.dateObj)
        this.dateInputElement.dispatchEvent(new CustomEvent('dateselect'))
        this._renderCalendar()
        if (!this.persistOnSelect) {
            this._hideCalendar()
        }
    }

    _hideCalendar() {
        if (document.activeElement === this.dateInputElement) {
             this.dateInputElement.blur();
        }
        this.calContainer.style.display = 'none'
    }

    _calKeyDownEventHandler(event) {
        if (event.key === 'Enter') {
            this._dayClickedEventHandler(event)
        }
    }

    _blurHandler() {
        setTimeout(() => { checkActiveElement(this) }, 0)
        function checkActiveElement(ctx) {
            // Check if the new active element is *outside* the component's shadow DOM
            if (ctx.shadow.activeElement === null) {
                ctx.calContainer.style.display = 'none'
                ctx._mouseUpEventHandler()
                if (!ctx._inputStrIsValidDate) {
                    ctx.textInputElement.dispatchEvent(new Event('invalid'))
                }
            }
        }
    }

    _addHeaderEventHandlers() {
        // This is OK, as this.calContainer is already scoped to shadow DOM
        var entries = this.calContainer.querySelectorAll('.calCtrl').entries() 
        var entry = entries.next()
        while (entry.done === false) {
            entry.value[1].tabIndex = 0
            entry.value[1].onblur = this._blurHandler.bind(this)
            entry.value[1].onclick = this._controlKeyDownEventHandler.bind(this)
            entry.value[1].onkeydown = this._controlKeyDownEventHandler.bind(this)
            entry.value[1].onmousedown = this._mouseDownEventHandler.bind(this)
            entry.value[1].onmouseup = this._mouseUpEventHandler.bind(this)
            entry.value[1].onmouseleave = this._mouseUpEventHandler.bind(this)
            entry.value[1].ontouchstart = this._mouseDownEventHandler.bind(this)
            entry.value[1].ontouchend = this._mouseUpEventHandler.bind(this)
            entry.value[1].ontouchcancel = this._mouseUpEventHandler.bind(this)
            entry = entries.next()
        }
    }

    _startLongPressAction(event) {
        this._longPressIntervalIds.push(setInterval(() => { this._controlKeyDownEventHandler(event) }, this.longPressInterval))
        // *** FIXED SELECTOR ***
        this.shadow.querySelector('#' + event.target.id).onclick = () => { this._onClickHandlerAfterLongPress(event, this) }
    }

    _onClickHandlerAfterLongPress(event, ctx) {
        // *** FIXED SELECTOR ***
        ctx.shadow.querySelector('#' + event.target.id).onclick = ctx._controlKeyDownEventHandler.bind(ctx)
    }

    _mouseDownEventHandler(event) {
        this._longPressTimerIds.push(setTimeout(() => { this._startLongPressAction(event) }, this.longPressThreshold))
    }

    _mouseUpEventHandler() {
        this._longPressTimerIds.forEach(clearTimeout)
        this._longPressTimerIds = []
        this._longPressIntervalIds.forEach(clearInterval)
        this._longPressIntervalIds = []
    }

    _parseAndValidateInputStr(str) {
        var obj = {}
        var day, month, year
        var value = str.match(/^\s*(\d{1,2})\.(\d{1,2})\.(\d\d\d\d)\s*$/)
        if (value === null) {
            obj.valid = false
        } else {
            day = Number(value[1])
            month = Number(value[2])
            year = Number(value[3])
            if (this._dateIsValid(day, month, year)) {
                obj.valid = true
                obj.day = day
                obj.month = month - 1
                obj.year = year
            } else {
                obj.valid = false
            }
        }
        return obj
    }

    _inputOnInputHandler() {
        var obj = this._parseAndValidateInputStr(this.dateInputElement.value)
        if (obj.valid) {
            this._inputStrIsValidDate = true
            this._setNewDateValue(obj.day, obj.month, obj.year)
            this.displayedMonth = obj.month
            this.displayedYear = obj.year
            this.dateInputElement.dispatchEvent(new CustomEvent('dateselect'))
            this._renderCalendar()
        } else {
            this._inputStrIsValidDate = false
        }
    }

    _dateIsValid(day, month, year) {
        if (month < 1 || month > 12) {
            return false
        }
        var last_day_of_month = this._daysInMonth(month, year)
        if (day < 1 || day > last_day_of_month) {
            return false
        }
        return true
    }

    _controlKeyDownEventHandler(event) {
        if (event.key === 'Enter' || event.type !== 'keydown') {
            switch (event.target.id) {
                case 'calCtrlPrevYear':
                    this._showPrevYear()
                    break
                case 'calCtrlNextYear':
                    this._showNextYear()
                    break
                case 'calCtrlPrevMonth':
                    this._showPrevMonth()
                    break
                case 'calCtrlNextMonth':
                    this._showNextMonth()
                    break
                case 'calCtrlHideCal':
                    this._hideCalendar()
                    break
            }
        }
    }

    // This is the method you wanted to call "openPicker"
    _inputOnFocusHandler() {
        this._inputOnInputHandler()
        this.calContainer.style.display = 'block'
    }

    _showNextYear() {
        this.displayedYear++
        this._renderCalendar()
    }

    _showPrevYear() {
        this.displayedYear--
        this._renderCalendar()
    }

    _showNextMonth() {
        if (this.displayedMonth === 11) {
            this.displayedMonth = 0
            this.displayedYear++
        } else {
            this.displayedMonth++
        }
        this._renderCalendar()
    }

    _showPrevMonth() {
        if (this.displayedMonth === 0) {
            this.displayedMonth = 11
            this.displayedYear--
        } else {
            this.displayedMonth--
        }
        this._renderCalendar()
    }

    _renderCalendar() {
        var tempDate = new Date(this.displayedYear, this.displayedMonth)
        tempDate.setDate(1)
        this.calTitle.innerHTML = this.monthNames[this.displayedMonth] + ' ' + this.displayedYear
        var dayNumbers = []
        var adjacentMonthDays = []
        this._generateDayArray(tempDate, dayNumbers, adjacentMonthDays)
        
        // This is OK, as this.calContainer is already scoped to shadow DOM
        var entries = this.calContainer.querySelectorAll('.calDay').entries()
        var entry = entries.next()
        while (entry.done === false) {
            entry.value[1].classList.remove('calAdjacentMonthDay')
            entry.value[1].classList.remove('calSelectedDay')
            entry.value[1].classList.remove('calHiddenRow')
            entry.value[1].classList.remove('calDayStyle')
            entry.value[1].onclick = null
            entry.value[1].onblur = null
            entry.value[1].onkeydown = null
            if (adjacentMonthDays[entry.value[0]]) {
                entry.value[1].classList.add('calAdjacentMonthDay')
            } else {
                entry.value[1].classList.add('calDayStyle')
            }
            entry.value[1].innerHTML = dayNumbers[entry.value[0]]
            if (this.displayedMonth === this.dateObj.getMonth() && this.displayedYear === this.dateObj.getFullYear() && dayNumbers[entry.value[0]] === this.dateObj.getDate() && !adjacentMonthDays[entry.value[0]]) {
                entry.value[1].classList.add('calSelectedDay')
            }
            if (!adjacentMonthDays[entry.value[0]]) {
                entry.value[1].onclick = this._dayClickedEventHandler.bind(this)
                entry.value[1].onkeydown = this._calKeyDownEventHandler.bind(this)
                entry.value[1].tabIndex = 0
                entry.value[1].onblur = this._blurHandler.bind(this)
            } else {
                entry.value[1].removeAttribute('tabindex')
            }
            entry = entries.next()
        }

        var lastSeven = adjacentMonthDays.slice(35, 42)
        if (lastSeven.every(x => x === true)) {
            entries = this.calContainer.querySelectorAll('.calDay').entries()
            entry = entries.next()
            while (entry.done === false) {
                if (entry.value[0] > 34) {
                    entry.value[1].classList.add('calHiddenRow')
                }
                entry = entries.next()
            }
        }
    }

    getDateString() {
        if (this._inputStrIsValidDate) {
            return this._returnDateString(this.dateObj)
        }
        return null
    }

    getDateObject() {
        if (this._inputStrIsValidDate) {
            return this.dateObj
        }
        return null
    }

    _setNewDateValue(day, month, year) {
        day = Number(day)
        month = Number(month)
        year = Number(year)
        if (day !== this.dateObj.getDate() || month !== this.dateObj.getMonth() || year !== this.dateObj.getFullYear()) {
            this.dateObj.setFullYear(year)
            this.dateObj.setMonth(month, day)
        }
    }

    _returnDateString(date) {
        const split = date.toISOString().split('T')
        const dateString = split[0]
        const timeString = split[1]
        return dateString
    }

    _populateDayNames() {
        var dayNameArray = []
        dayNameArray = this.dayNames.slice()
        if (this.sundayFirst) {
            dayNameArray.pop()
            dayNameArray.unshift(this.dayNames[6])
        }
        // This is OK, as this.calContainer is already scoped to shadow DOM
        var entries = this.calContainer.querySelectorAll('.calDayName').entries()
        var entry = entries.next()
        while (entry.done === false) {
            entry.value[1].innerHTML = dayNameArray[entry.value[0]]
            entry = entries.next()
        }
    }

    _generateDayArray(date, dayArray, adjacentMonthDaysArray) {
        var index
        var dateDay = date.getDay()
        var dateMonth = date.getMonth() + 1
        var dateYear = date.getFullYear()
        var daysInMonth = this._daysInMonth(dateMonth, dateYear)

        date.setDate(date.getDate() - 1)
        var prevMonth = date.getMonth() + 1
        var prevMonthYear = date.getFullYear()
        var daysInPrevMonth = this._daysInMonth(prevMonth, prevMonthYear)

        if (this.sundayFirst) {
            for (index = 0; index < dateDay; index++) {
                dayArray.unshift(daysInPrevMonth)
                daysInPrevMonth--
                adjacentMonthDaysArray.push(true)
            }
        } else {
            if (dateDay === 0) {
                for (index = 0; index < 6; index++) {
                    dayArray.unshift(daysInPrevMonth)
                    daysInPrevMonth--
                    adjacentMonthDaysArray.push(true)
                }
            } else {
                for (index = 0; index < dateDay - 1; index++) {
                    dayArray.unshift(daysInPrevMonth)
                    daysInPrevMonth--
                    adjacentMonthDaysArray.push(true)
                }
            }
        }

        for (index = 0; index < daysInMonth; index++) {
            dayArray.push(index + 1)
            adjacentMonthDaysArray.push(false)
        }

        var numberOfNextMonthDays = 42 - dayArray.length
        for (index = 0; index < numberOfNextMonthDays; index++) {
            dayArray.push(index + 1)
            adjacentMonthDaysArray.push(true)
        }
    }

    _isItLeapYear(year) {
        return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)
    }

    _daysInMonth(month, year) {
        if (month === 1 || month === 3 || month === 5 || month === 7 || month === 8 || month === 10 || month === 12) {
            return 31
        } else if (month === 4 || month === 6 || month === 9 || month === 11) {
            return 30
        } else if (month === 2 && this._isItLeapYear(year)) {
            return 29
        } else if (month === 2 && !(this._isItLeapYear(year))) {
            return 28
        }
    }
}

// Define the new component
customElements.define('datetime-picker', DateTimePicker);