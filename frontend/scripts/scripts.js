export function openDialog(id) {
    const dialog = document.getElementById(id);
    dialog.open = true;
}

export function closeDialog(id) {
    const dialog = document.getElementById(id);
    dialog.open = false;
}