// IMO ship identification numbers (MAR-15): 7 digits, the last a check digit.
// Multiply the first six digits by 7, 6, 5, 4, 3, 2; the last digit of the sum is the check digit.
// Example: 9074729 → 9×7 + 0×6 + 7×5 + 4×4 + 7×3 + 2×2 = 139 → 9 ✓

export function normalizeImo(value) {
  return String(value ?? "").replace(/^IMO\s*/i, "").replace(/\s/g, "");
}

export function isValidImo(value) {
  const s = normalizeImo(value);
  if (!/^\d{7}$/.test(s)) return false;
  const sum = [7, 6, 5, 4, 3, 2].reduce((acc, w, i) => acc + Number(s[i]) * w, 0);
  return sum % 10 === Number(s[6]);
}

/** Field message for an IMO input, or "" when valid. */
export function imoError(value) {
  const s = normalizeImo(value);
  if (!s) return "IMO number is required";
  if (!/^\d{7}$/.test(s)) return "IMO number has 7 digits";
  if (!isValidImo(s)) return "This IMO number's check digit is wrong";
  return "";
}

/** Vessel age in whole years at a given date (defaults to today). */
export function vesselAge(yearBuilt, at = new Date()) {
  if (!yearBuilt) return null;
  return new Date(at).getFullYear() - Number(yearBuilt);
}

/** Container numbers (ISO 6346 shape): 4 letters + 7 digits. */
export function isValidContainerNo(value) {
  return /^[A-Z]{4}\d{7}$/.test(String(value ?? "").toUpperCase().replace(/\s/g, ""));
}
