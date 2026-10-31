// Group quotation rules. Field names follow QuotationRequest, InsuredRequest, QuotedRiderRequest,
// the pay query (PUT /quotation/pay) and PolicyRequest. Premiums, taxes and totals come from the
// backend; these checks only stop incomplete input before it is sent.
import { QuotationStatus } from "../constants/statuses";
import { toDateTime } from "../constants/labels";

const blank = (v) => v === null || v === undefined || String(v).trim() === "";
const tooLong = (v, n) => String(v ?? "").trim().length > n;
const PHONE = /^\+?\d{7,12}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const today = () => new Date().toISOString().slice(0, 10);

/** What each quotation status allows (docs/life-insurance/07-status-lifecycle.md) */
export function quotationActions(q = {}) {
  const s = q.quotationStatus;
  return {
    edit: s === QuotationStatus.PENDING,
    remove: s === QuotationStatus.PENDING,
    issue: s === QuotationStatus.PENDING,
    accept: s === QuotationStatus.ISSUED,
    pay: s === QuotationStatus.ACCEPTED,
    issuePolicy: s === QuotationStatus.PAID && !q.policyIssuedDate,
    revise: s === QuotationStatus.PAID && !!q.policyIssuedDate,
  };
}

// ── quotation details ──
export function fromQuotation(q = {}) {
  return {
    institutionUuid: q.institutionUuid ?? "",
    institutionName: q.institutionName ?? "",
    term: q.term ?? "",
    contactPersonFullName: q.contactPersonFullName ?? "",
    contactPhone: q.contactPhone ?? "",
  };
}

export function validateQuotation(f) {
  const e = {};
  if (!f.institutionUuid) e.institutionUuid = "Choose the institution";
  if (blank(f.term)) e.term = "Enter the term";
  else if (!Number.isInteger(Number(f.term)) || Number(f.term) < 1) e.term = "Whole number of years, at least 1";
  if (tooLong(f.contactPersonFullName, 60)) e.contactPersonFullName = "At most 60 characters";
  if (!blank(f.contactPhone) && !PHONE.test(String(f.contactPhone).trim())) e.contactPhone = "Digits only, optionally starting with +";
  return e;
}

/** `user` = the signed-in user (authStore.auth.user); the quotation records who prepared it. */
export function toQuotationRequest(f, user = {}, status) {
  const body = {
    institutionUuid: f.institutionUuid,
    institutionName: String(f.institutionName || "").trim().slice(0, 100),
    term: Number(f.term),
    contactPersonFullName: String(f.contactPersonFullName || "").trim(),
    contactPhone: String(f.contactPhone || "").trim(),
  };
  if (user?.userUuid) {
    body.quotedByUuid = user.userUuid;
    body.quotedByFullName = [user.firstName, user.fatherName || user.lastName].filter(Boolean).join(" ");
  }
  if (status) body.quotationStatus = status;
  return body;
}

// ── insured persons ──
export const GENDERS = ["Male", "Female"];
export const INSURED_FIELDS = [
  // [key, required, maxLength]
  ["title", true, 25], ["firstName", true, 25], ["fatherName", true, 25], ["grandFatherName", true, 25],
  // branchOffice and position are optional in Swagger, but the database rejects a member without them
  ["phone", true, 13], ["email", false, 50], ["idNumber", false, 50], ["branchOffice", true, 50], ["position", true, 50],
  ["address1", true, 50], ["address2", true, 50], ["address3", true, 50], ["state", true, 50], ["country", true, 50],
];

export function fromInsured(p = {}) {
  const f = { birthDate: p.birthDate ? String(p.birthDate).slice(0, 10) : "", gender: p.gender ?? "", sumAssured: p.sumAssured ?? "" };
  for (const [k] of INSURED_FIELDS) f[k] = p[k] ?? "";
  return f;
}

export function validateInsured(f) {
  const e = {};
  for (const [k, required, max] of INSURED_FIELDS) {
    if (required && blank(f[k])) e[k] = "Required";
    else if (tooLong(f[k], max)) e[k] = `At most ${max} characters`;
  }
  if (!e.phone && !PHONE.test(String(f.phone).trim())) e.phone = "Digits only, optionally starting with +";
  if (!e.email && !blank(f.email) && !EMAIL.test(String(f.email).trim())) e.email = "Enter a valid email";
  if (!f.birthDate) e.birthDate = "Required";
  else if (f.birthDate >= today()) e.birthDate = "Must be in the past";
  if (!GENDERS.includes(f.gender)) e.gender = "Choose";
  if (blank(f.sumAssured)) e.sumAssured = "Required";
  else if (!(Number(f.sumAssured) > 0)) e.sumAssured = "Must be more than 0";
  return e;
}

/** Premium is left out: the backend prices each member from the group term table. */
export function toInsuredRequest(f, { institutionUuid, quotationUuid, status } = {}) {
  const body = { institutionUuid, quotationUuid, birthDate: toDateTime(f.birthDate), gender: f.gender, sumAssured: Number(f.sumAssured) };
  for (const [k] of INSURED_FIELDS) body[k] = String(f[k] ?? "").trim();
  for (const [k, required] of INSURED_FIELDS) if (!required && !body[k]) delete body[k]; // optional and left blank
  if (status) body.status = status;
  return body;
}

export const insuredName = (p = {}) => [p.title, p.firstName, p.fatherName, p.grandFatherName].filter(Boolean).join(" ");

// ── riders on the quotation (RateTableEditor spec) ──
/** `riders` = active RiderResponse[] (riderUuid, riderName, minLimit, maxLimit) */
export function quotedRiderSpec(riders = []) {
  return {
    id: "quoted-rider",
    title: "Riders",
    emptyTitle: "No riders on this quotation",
    idField: "quotedRiderUuid",
    columns: [
      { key: "riderUuid", label: "Rider", type: "select", wide: true, lockExisting: true, options: riders.map((r) => ({ value: r.riderUuid, label: r.riderName })) },
      { key: "sumAssured", label: "Sum assured", type: "decimal", min: 0 },
    ],
    uniqueBy: (r) => r.riderUuid || "",
    uniqueLabel: "rider",
    formatKey: (k) => riders.find((r) => r.riderUuid === k)?.riderName || k,
    // The rider's own limits, as configured in Products & rates
    checks: (rows) => ({
      errors: rows.flatMap((row) => {
        const r = riders.find((x) => x.riderUuid === row.riderUuid);
        if (!r || row.sumAssured === null || Number.isNaN(row.sumAssured)) return [];
        const low = r.minLimit ?? null, high = r.maxLimit ?? null;
        if ((low !== null && row.sumAssured < low) || (high !== null && row.sumAssured > high)) {
          return [`${r.riderName}: sum assured must be between ${low ?? 0} and ${high ?? "no limit"}.`];
        }
        return [];
      }),
    }),
  };
}

/** Splits the rider grid's rows into the three calls the API offers. */
export function riderChanges(rows, original, quotationUuid) {
  const before = new Map(original.map((o) => [o.quotedRiderUuid, o]));
  const create = rows.filter((r) => !r.quotedRiderUuid).map((r) => ({ riderUuid: r.riderUuid, quotationUuid, sumAssured: Number(r.sumAssured) }));
  const update = rows
    .filter((r) => r.quotedRiderUuid && Number(before.get(r.quotedRiderUuid)?.sumAssured) !== Number(r.sumAssured))
    .map((r) => ({ quotedRiderUuid: r.quotedRiderUuid, sumAssured: Number(r.sumAssured) }));
  return { create, update };
}

// ── payment (PUT /quotation/{uuid}/pay, JSON body) ──
// The requested premium is the server's grossPremium. Withholding tax, revenue stamp and net premium
// are entered from the receipt until finance configures the tax rates; then the server calculates
// them (the quotation's calculated* fields are no longer null) and the payment needs only the receipt.
export const PAYMENT_TAXES = [
  ["withHoldingTax", "Withholding tax"],
  ["revenueStamp", "Revenue stamp"],
  ["netPremium", "Net premium received"],
];

/** True once the server returns calculated tax amounts for this quotation */
export const taxesCalculated = (q = {}) => Object.keys(q).some((k) => k.startsWith("calculated") && q[k] != null);

export function validatePayment(f, { taxesRequired = true } = {}) {
  const e = {};
  if (tooLong(f.receiptNumber, 60)) e.receiptNumber = "At most 60 characters";
  if (blank(f.receiptNumber)) e.receiptNumber = "Enter the receipt number";
  if (!f.receiptDate) e.receiptDate = "Required";
  else if (f.receiptDate > today()) e.receiptDate = "Can't be in the future";
  if (taxesRequired) {
    for (const [k] of PAYMENT_TAXES) {
      if (blank(f[k])) e[k] = "Required";
      else if (Number.isNaN(Number(f[k])) || Number(f[k]) < 0) e[k] = "Must be 0 or more";
    }
  }
  return e;
}

export function toPaymentBody(f, { taxesRequired = true } = {}) {
  const body = { receiptNumber: String(f.receiptNumber).trim(), receiptDate: f.receiptDate };
  if (taxesRequired) for (const [k] of PAYMENT_TAXES) body[k] = Number(f[k]);
  return body;
}

// ── policy issue (PolicyRequest) ──
export function validatePolicyDates(f) {
  const e = {};
  if (!f.beginDate) e.beginDate = "Required";
  if (!f.endDate) e.endDate = "Required";
  else if (f.beginDate && f.endDate <= f.beginDate) e.endDate = "Must be after the start date";
  return e;
}
export const toPolicyRequest = (f) => ({ beginDate: toDateTime(f.beginDate), endDate: toDateTime(f.endDate) });
