// Unique DOM ids for label/control pairs (Vue 3.4 has no useId yet).
let n = 0;
export const useId = (prefix = "m") => `mar-${prefix}-${++n}`;
