// Policyholder (customer) rules for individual policies. Fields follow CustomerRequest (type INDIVIDUAL);
// KYC is decided on the server (PUT /customer/{uuid}/kyc), these checks only stop incomplete input.
const blank = (v) => v === null || v === undefined || String(v).trim() === "";
const PHONE = /^\+?\d{9,13}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const GENDERS = ["Male", "Female"];
export const ID_TYPES = [
  { value: "NATIONAL_ID", label: "National ID (Fayda)" },
  { value: "KEBELE_ID", label: "Kebele ID" },
  { value: "PASSPORT", label: "Passport" },
  { value: "OTHER", label: "Other" },
];
export const idTypeLabel = (v) => ID_TYPES.find((t) => t.value === v)?.label || v || "";

// [key, label, maxLength]
const REQUIRED = [["firstName", "First name", 60], ["fatherName", "Father's name", 60], ["idNumber", "ID number", 40]];
/** Not needed to register the customer, but the backend won't verify KYC without them */
export const KYC_FIELDS = [["nationality", "Nationality", 60], ["occupation", "Occupation", 100], ["sourceOfIncome", "Source of income", 150], ["region", "Region", 60]];
const OPTIONAL = [
  ["title", "Title", 20], ["grandFatherName", "Grandfather's name", 60], ["email", "Email", 120], ["tin", "TIN", 20], ["employer", "Employer", 150],
  ["zone", "Zone / sub-city", 60], ["woreda", "Woreda", 60], ["kebele", "Kebele", 60], ["houseNumber", "House number", 30],
];
const TEXT_FIELDS = [...REQUIRED, ...KYC_FIELDS, ...OPTIONAL];

export function fromCustomer(c = {}) {
  const f = { gender: c.gender ?? "", dateOfBirth: c.dateOfBirth ? String(c.dateOfBirth).slice(0, 10) : "", idType: c.idType ?? "", phone: c.phone ?? "" };
  for (const [k] of TEXT_FIELDS) f[k] = c[k] ?? "";
  return f;
}

/** A new customer prefilled from the policy's insured person (BenefitResponse) */
export function customerFromBenefit(b = {}) {
  const gender = GENDERS.find((g) => g.toLowerCase() === String(b.gender || "").toLowerCase()) || "";
  return fromCustomer({ firstName: b.firstName, fatherName: b.fatherName, grandFatherName: b.grandFatherName, gender, dateOfBirth: b.dateOfBirth, phone: b.personPhone, nationality: "Ethiopian" });
}

export function validateCustomer(f, today = new Date().toISOString().slice(0, 10)) {
  const e = {};
  for (const [k, , max] of TEXT_FIELDS) if (String(f[k] ?? "").trim().length > max) e[k] = `At most ${max} characters`;
  for (const [k] of REQUIRED) if (blank(f[k])) e[k] = "Required";
  if (!GENDERS.includes(f.gender)) e.gender = "Choose";
  if (!f.dateOfBirth) e.dateOfBirth = "Required";
  else if (f.dateOfBirth >= today) e.dateOfBirth = "Must be in the past";
  if (!ID_TYPES.some((t) => t.value === f.idType)) e.idType = "Choose";
  if (blank(f.phone)) e.phone = "Required";
  else if (!PHONE.test(String(f.phone).trim())) e.phone = "9 to 13 digits, optionally starting with +";
  if (!e.email && !blank(f.email) && !EMAIL.test(String(f.email).trim())) e.email = "Enter a valid email";
  return e;
}

/** CustomerRequest; blank optional fields are left out. dateOfBirth is a plain date (LocalDate). */
export function toCustomerRequest(f) {
  const body = { type: "INDIVIDUAL", gender: f.gender, dateOfBirth: f.dateOfBirth, idType: f.idType, phone: String(f.phone).trim() };
  for (const [k] of TEXT_FIELDS) {
    const v = String(f[k] ?? "").trim();
    if (v) body[k] = v;
  }
  return body;
}

/** Labels of the due-diligence fields still missing before KYC can be verified */
export const kycMissing = (c = {}) => KYC_FIELDS.filter(([k]) => blank(c[k])).map(([, label]) => label);

/** Query for GET /customer/duplicate-check from the form (only the parts that are filled) */
export function duplicateParams(f) {
  const p = {};
  if (!blank(f.idNumber)) p.idNumber = String(f.idNumber).trim();
  if (!blank(f.phone)) p.phone = String(f.phone).trim();
  if (f.dateOfBirth) p.dateOfBirth = f.dateOfBirth;
  return p;
}

export const customerName = (c = {}) => [c.title, c.firstName, c.fatherName, c.grandFatherName].filter(Boolean).join(" ");
export const FIELD_GROUPS = { REQUIRED, KYC_FIELDS, OPTIONAL };
