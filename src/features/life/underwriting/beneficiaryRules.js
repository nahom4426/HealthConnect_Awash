// Beneficiary designation rules (BeneficiaryDesignationRequest, contract 2026-10 G1). The backend
// enforces the same: shares per type add up to 100, at least one PRIMARY unless the statutory heirs
// are used, and anyone under 18 needs a guardian.
const blank = (v) => v === null || v === undefined || String(v).trim() === "";
const PHONE = /^\+?\d{9,13}$/;

export const BENEFICIARY_TYPES = [{ value: "PRIMARY", label: "Primary" }, { value: "CONTINGENT", label: "Contingent" }];
export const RELATIONSHIPS = [
  { value: "SPOUSE", label: "Spouse" }, { value: "CHILD", label: "Child" }, { value: "PARENT", label: "Parent" },
  { value: "SIBLING", label: "Sibling" }, { value: "OTHER", label: "Other" },
];
export const relationshipLabel = (v) => RELATIONSHIPS.find((r) => r.value === v)?.label || v || "";

/** Age in whole years on `today` (yyyy-MM-dd) */
export function ageOn(dateOfBirth, today = new Date().toISOString().slice(0, 10)) {
  if (!dateOfBirth) return null;
  const [y, m, d] = String(dateOfBirth).slice(0, 10).split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0);
}
export const isMinor = (dateOfBirth, today) => { const a = ageOn(dateOfBirth, today); return a !== null && a < 18; };

const FIELDS = ["beneficiaryUuid", "type", "firstName", "fatherName", "grandFatherName", "relationship", "dateOfBirth", "gender", "idType", "idNumber", "phone", "address", "sharePercent", "guardianName", "guardianPhone"];

export const newBeneficiary = (type = "PRIMARY") => ({ ...Object.fromEntries(FIELDS.map((k) => [k, ""])), type });

/** BeneficiaryDesignationResponse → form; only the ACTIVE beneficiaries are edited */
export function fromDesignation(d = {}) {
  return {
    statutoryDefault: !!d.statutoryDefault && !(d.beneficiaries || []).length,
    note: "",
    beneficiaries: (d.beneficiaries || []).filter((b) => b.status !== "SUPERSEDED").map((b) => Object.fromEntries(FIELDS.map((k) => [k, b[k] ?? ""]))),
  };
}

/** @returns {{ rows?: object[], shares?: string, primary?: string, note?: string }} empty when valid */
export function validateDesignation(f, today = new Date().toISOString().slice(0, 10)) {
  const e = {};
  const list = f.statutoryDefault ? [] : f.beneficiaries || [];
  const rows = list.map((b) => {
    const r = {};
    if (!BENEFICIARY_TYPES.some((t) => t.value === b.type)) r.type = "Choose";
    if (blank(b.firstName)) r.firstName = "Required";
    if (blank(b.fatherName)) r.fatherName = "Required";
    if (!RELATIONSHIPS.some((x) => x.value === b.relationship)) r.relationship = "Choose";
    if (!b.dateOfBirth) r.dateOfBirth = "Required";
    else if (b.dateOfBirth > today) r.dateOfBirth = "Can't be in the future";
    if (!(Number(b.sharePercent) > 0) || Number(b.sharePercent) > 100) r.sharePercent = "1 to 100";
    if (!blank(b.phone) && !PHONE.test(String(b.phone).trim())) r.phone = "9 to 13 digits";
    if (isMinor(b.dateOfBirth, today)) {
      if (blank(b.guardianName)) r.guardianName = "Required for a minor";
      if (blank(b.guardianPhone)) r.guardianPhone = "Required for a minor";
      else if (!PHONE.test(String(b.guardianPhone).trim())) r.guardianPhone = "9 to 13 digits";
    }
    return r;
  });
  if (rows.some((r) => Object.keys(r).length)) e.rows = rows;
  if (!f.statutoryDefault) {
    if (!list.some((b) => b.type === "PRIMARY")) e.primary = "Add at least one primary beneficiary, or pay the statutory heirs";
    // Whole hundredths per type, so 33.33 + 33.33 + 33.34 adds up exactly
    const bad = BENEFICIARY_TYPES.filter((t) => list.some((b) => b.type === t.value)).flatMap((t) => {
      const total = list.filter((b) => b.type === t.value).reduce((s, b) => s + Math.round(Number(b.sharePercent || 0) * 100), 0);
      return total === 10000 ? [] : [`${t.label} shares add up to ${total / 100}%`];
    });
    if (bad.length) e.shares = `${bad.join("; ")}. Each type must add up to 100%.`;
  }
  if (String(f.note || "").trim().length > 500) e.note = "At most 500 characters";
  return e;
}

/** subject = { insuredUuid } or { benefitUuid } */
export function toDesignationRequest(f, subject) {
  const body = { ...subject, statutoryDefault: !!f.statutoryDefault, beneficiaries: [] };
  if (!blank(f.note)) body.note = String(f.note).trim();
  if (f.statutoryDefault) return body;
  body.beneficiaries = f.beneficiaries.map((b) => {
    const item = {};
    for (const k of FIELDS) {
      const v = typeof b[k] === "string" ? b[k].trim() : b[k];
      if (!blank(v)) item[k] = v;
    }
    item.sharePercent = Number(b.sharePercent);
    return item;
  });
  return body;
}

export const beneficiaryName = (b = {}) => [b.firstName, b.fatherName, b.grandFatherName].filter(Boolean).join(" ");
