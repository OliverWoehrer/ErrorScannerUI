export class DataItem {
    constructor(data) {
        // Default Fallback Construct:
        if(!data) { // if no json object was given, create item with default values
            this.id = "";
            this.timestamp = new Date();
            this.category = "critical";
            this.source = "";
            this.message = "";
            this.solution = "";
            this.searchkey = "";
            return;
        }

        // Copy Construct:
        if(data instanceof DataItem) { // given object is of type DataItem
            this.id = data.id;
            this.timestamp = new Date(data.timestamp);
            this.category = data.category;
            this.source = data.source;
            this.message = data.message;
            this.solution = data.solution;
            this.searchkey = data.searchkey;
            return;
        }

        // Parse Mandatory JSON Properties:
        if(!data.hasOwnProperty("timestamp")) {
            throw new Error(`Could not parse 'timestamp' from ${data}.`);
        }
        if(!this.#isValidDatetimeString(data.timestamp)) {
            throw new Error(`Invalid 'timestamp' string ${data.timestamp}.`);
        }
        this.timestamp = new Date(data.timestamp);

        if(!data.hasOwnProperty("category")) {
            throw new Error(`Could not parse 'category' from ${data}.`);
        }
        this.category = data.category;

        if(!data.hasOwnProperty("source")) {
            throw new Error(`Could not parse 'source' from ${data}.`);
        }
        this.source = data.source;

        if(!data.hasOwnProperty("id")) {
            throw new Error(`Could not parse 'id' from ${data}`);
        }
        this.id = data.id;

        // Try to Parse Optional Properties:
        this.message = data.message || "";
        this.solution = data.solution || "";
        this.searchkey = data.searchkey || "";
    }

    get datetimeObj() {
        return this.timestamp;
    }

    set datetimeObj(datetime) {
        console.assert(datetime instanceof Date, "Given 'datetime' has to be of type 'Date'");
        if(datetime instanceof Date) {
            this.timestamp = new Date(datetime);
        }
    }

    /**
     * Return date in format DD.MM.YYYY
     */
    get dateString() {
        return this.timestamp.toLocaleString("fr-CH").split(" ")[0];
    }

    /**
     * Return time in format hh:mm:ss.sss
     */
    get timeString() {
        const time = this.timestamp.toLocaleString("fr-CH").split(" ")[1];
        const millis = this.timestamp.getMilliseconds();
        return time+"."+("000"+millis).slice(-3);
    }

    /**
     * Return date and time in format DD.MM.YYYY hh:mm:ss.sss
     */
    get datetimeString() {
        const date = this.dateString;
        const time = this.timeString;
        return date+" "+time;
    }

    /**
     * Checks if the given query text is in the given item
     * @param {JSON} item item to search
     * @param {String} query query text to look for
     * @returns true if a match was found, false otherwise
     */
    search(query) {
        if(!query) { return true; }
        query = query.toLocaleLowerCase();
        const words = query.split(/\s+/); // split at any length of whitespace
        let hasMatch = true; // true if all key words from query had a match
        for(const word of words) {
            if(!hasMatch) { break; } // no match on previous key word, stop iteration 
            if(this.id && String(this.id).toLocaleLowerCase().includes(word)) { hasMatch &= true; continue; }
            if(this.source && String(this.source).toLocaleLowerCase().includes(word)) { hasMatch &= true; continue; }
            if(this.message && String(this.message).toLocaleLowerCase().includes(word)) { hasMatch &= true; continue; }
            if(this.solution && String(this.solution).toLocaleLowerCase().includes(word)) { hasMatch &= true; continue; }
            if(this.searchkey && String(this.solution).toLocaleLowerCase().includes(word)) { hasMatch &= true; continue; }
            hasMatch = false; // not match found for this word
        }
        return hasMatch;
    }

    /**
     * Tells if the given string is a date or datetime in ISO format. Valid is either the short
     * format (only date, YYYY-MM-DD), standard format (date and time, YYYY-MM-DDThh:mm:ss) or the
     * long format (with milliseconds, YYYY-MM-DDThh:mm:ss.ssssssZhh:mm).
     * @info More details on supported formats: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format
     * @param {String} str String to check
     * @returns 'true' if the string is a valid format
     */
    #isValidDatetimeString(str) {
        // const ISO_FORMAT = /^\d{4}  (-\d{2}(-\d{2})?)?  (T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?)?  (([Z])|([+-]\d{2}:\d{2}))?$/;
        const ISO_FORMAT = /^\d{4}(-\d{2}(-\d{2})?)?(T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?)?(([Z])|([+-]\d{2}:\d{2}))?$/;
        return ISO_FORMAT.test(str);
    }
}