export class LogRecordItem {
    constructor(jsonObject = null) {
        const data = jsonObject || {};

        if(typeof data.id === "string") {
            this.id = data.id;
        } else {
            console.warn("Property 'id' has to be of type 'string'");
            this.id = "";
        }

        if(data.timestamp instanceof Date) {
            this.date = new Date(data.timestamp);
        } else if(typeof data.timestamp === "string") {
            if(this.#isValidDatetimeString(data.timestamp)) {
                this.date = new Date(data.timestamp);
            } else {
                console.warn("Property 'timestamp' is not ISO format string");
                this.date = new Date();
            }
        } else {
            console.warn("Property 'timestamp' has to be of type 'Date' or 'string'");
            this.date = new Date();
        }

        if(typeof data.category === "string") {
            this.category = data.category;
        } else {
            console.warn("Property 'category' has to be of type 'string'");
            this.category = "Info";
        }

        if(typeof data.source === "string") {
            this.source = data.source;
        } else {
            console.warn("Property 'source' has to be of type 'string'");
            this.source = "";
        }

        if(typeof data.message === "string") {
            this.message = data.message;
        } else {
            this.message = "";
        }

        if(data.solution) {
            if(typeof data.solution === "string") {
                this.solution = data.solution;
            } else {
                console.warn("Property 'solution' has to be of type 'string'");
                this.solution = null;
            }
        } else {
            this.solution = null;
        }

        if(data.searchkey) {
            if(typeof data.searchkey === "string") {
                this.searchkey = data.searchkey;
            } else {
                console.warn("Property 'searchkey' has to be of type 'string'");
                this.searchkey = null;
            }
        } else {
            this.searchkey = null;
        }
    }

    get timestamp() {
        this.date.getTime();
    }

    get dateString() {
        return this.date.toLocaleString("fr-CH").split(" ")[0];
    }

    get timeString() {
        return this.date.toLocaleString("fr-CH").split(" ")[1];
    }

    get datetimeString() {
        return this.date.toLocaleString("fr-CH");
    }

    get dateISOString() {
        return this.date.toLocaleString("sv-SE").split(" ")[0];
    }

    get timeISOString() {
        return this.date.toLocaleString("sv-SE").split(" ")[1];
    }

    get datetimeISOString() {
        console.assert(date instanceof Date, "Given parameter has to be of Type 'Date'");
        const split = date.toLocaleString("sv-SE").split(" ");
        return split[0]+"T"+split[1];
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
        if(this.id && String(this.id).toLocaleLowerCase().includes(query)) { return true; }
        if(this.source && String(this.source).toLocaleLowerCase().includes(query)) { return true; }
        if(this.message && String(this.message).toLocaleLowerCase().includes(query)) { return true; }
        if(this.solution && String(this.solution).toLocaleLowerCase().includes(query)) { return true; }
        if(this.searchkey && String(this.solution).toLocaleLowerCase().includes(query)) { return true; }
        return false;
    }

    /**
     * Tells if the given string is a date or datetime in ISO format. Valid is either the short
     * format (only date, YYYY-MM-DD), standard format (date and time, YYYY-MM-DDThh:mm:ss) or the
     * long format (with milliseconds, YYYY-MM-DDThh:mm:ss.zzz).
     * @param {String} str String to check
     * @returns 'true' if the string is a valid format
     */
    #isValidDatetimeString(str) {
        const ISO_FORMAT = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d+)?)?$/;
        return ISO_FORMAT.test(str);
    }
}