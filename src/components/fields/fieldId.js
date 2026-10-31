// Ids for shared form fields, unique across every Vue app on the page (pages and modal-x modals)
let seq = 0;
export const nextFieldId = () => `field-${++seq}`;
