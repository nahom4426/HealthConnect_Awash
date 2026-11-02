// Ethiopian mobile numbers: 09XXXXXXXX or 07XXXXXXXX, also accepted without the leading 0
// (9XXXXXXXX) or with the country code (+2519XXXXXXXX, 2519XXXXXXXX). Same rule as the mobile app.
const ETHIOPIAN_MOBILE = /^(\+?251|0)?[79]\d{8}$/;

export const cleanPhone = (input) => String(input ?? '').replace(/[\s-]/g, '');

/** An error message, or null when `value` is a valid Ethiopian mobile number. */
export function validateEthiopianPhone(value) {
  const phone = cleanPhone(value);
  if (!phone) return 'Please enter a phone number';
  if (!ETHIOPIAN_MOBILE.test(phone)) return 'Enter a valid phone number, e.g. 0912345678';
  return null;
}
