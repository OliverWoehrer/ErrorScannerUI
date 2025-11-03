export function openDialog(id) {
    const dialog = document.getElementById(id);
    if(dialog) {
        dialog.open = true;
    }
}

export function closeDialog(id) {
    const dialog = document.getElementById(id);
    if(dialog) {
        dialog.open = false;
    }
}

/**
 * This function takes the given timestamp and returns the readable formated string of date.
 * @description Helper Function
 * @param {String} timestring string in ISO format
 * @returns string with format YYYY-MM-DD
 */
export function toDate(timestring) {
    const date = new Date(timestring);
    return date.toISOString().slice(0, 10);
}

/**
 * This function takes the given timestamp and returns the readable formated string of time.
 * @description Helper Function
 * @param {String} timestring string in ISO format
 * @returns string with format HH:MM:SS.sss
 */
export function toTime(timestring) {
    const  date = new Date(timestring);
    return date.toISOString().slice(11, 23);
}

export function toDateString(date) {
    console.assert(date instanceof Date, "Given parameter has to be of Type 'Date'");
    return date.toLocaleString("fr-CH").split(" ")[0];
}

export function toTimeString(date) {
    console.assert(date instanceof Date, "Given parameter has to be of Type 'Date'");
    return date.toLocaleString("fr-SH").split(" ")[1];
}

export function toISODatetime(date) {
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
export function searchFunction(item, query) {
    if(!query) {
        return true;
    }
    if(item.id && String(item.id).toLocaleLowerCase().includes(query)) {
        return true;
    }
    if(item.source && String(item.source).toLocaleLowerCase().includes(query)) {
        return true;
    }
    if(item.message && String(item.message).toLocaleLowerCase().includes(query)) {
        return true;
    }
    if(item.solution && String(item.solution).toLocaleLowerCase().includes(query)) {
        return true;
    }
    return false;
}

export function isInsideInterval(item, startDate, stopDate) {
    const date = new Date(item.timestamp);
    return startDate.getTime() <= date.getTime() && date.getTime() <= stopDate.getTime();
}