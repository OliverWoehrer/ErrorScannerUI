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

export function toDateString(date) {
    console.assert(date instanceof Date, "Given parameter has to be of Type 'Date'");
    return date.toLocaleString("fr-CH").split(" ")[0];
}

export function toTimeString(date) {
    console.assert(date instanceof Date, "Given parameter has to be of Type 'Date'");
    return date.toLocaleString("fr-SH").split(" ")[1];
}