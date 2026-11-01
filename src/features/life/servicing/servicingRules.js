// Servicing, premium and document rules (contract 2026-10, G5, G6, G7). Refunds, premium adjustments,
// taxes and amounts due are the backend's; these rules decide what to offer and stop incomplete input.
const blank = (v) => v === null || v === undefined || String(v).trim() === "";
const today = () => new Date().toISOString().slice(0, 10);

// ── servicing (ServicingRequest) ──
export const SERVICING = {
  cancel: { title: "Cancel policy", confirmText: "Cancel policy", done: "Policy cancelled", tone: "danger", hint: "Future instalments are waived and the unearned premium is refunded at the configured percentage." },
  lapse: { title: "Lapse policy", confirmText: "Lapse policy", done: "Policy lapsed", tone: "danger", hint: "Only when a premium is unpaid past the grace period." },
  reinstate: { title: "Reinstate policy", confirmText: "Reinstate", done: "Policy reinstated", hint: "Within 24 months of the lapse, with the arrears paid. After 90 days, health evidence is needed." },
  renew: { title: "Renew for another term", confirmText: "Renew", done: "Renewal created", hint: "Creates a draft renewal; this policy becomes Renewed once the renewal is issued." },
};

/** Which servicing actions the policy's status allows (PolicyStatus / BenefitStatus) */
export function servicingActions(status) {
  return {
    cancel: status === "ACTIVE" || status === "LAPSED",
    lapse: status === "ACTIVE",
    reinstate: status === "LAPSED",
    renew: status === "ACTIVE" || status === "EXPIRED",
  };
}

export const newServicingForm = () => ({ effectiveDate: today(), reason: "", note: "", healthEvidenceReceived: false });

export function validateServicing(action, f) {
  const e = {};
  if (!f.effectiveDate) e.effectiveDate = "Required";
  if (blank(f.reason)) e.reason = "Give a reason";
  else if (String(f.reason).trim().length > 300) e.reason = "At most 300 characters";
  if (String(f.note || "").trim().length > 500) e.note = "At most 500 characters";
  if (!SERVICING[action]) e.action = "Unknown action";
  return e;
}

export function toServicingRequest(action, f) {
  const body = { effectiveDate: f.effectiveDate, reason: String(f.reason).trim() };
  if (!blank(f.note)) body.note = String(f.note).trim();
  if (action === "reinstate") body.healthEvidenceReceived = !!f.healthEvidenceReceived;
  return body;
}

// ── endorsements (EndorsementRequest) ──
export const ENDORSEMENT_TYPES = [
  { value: "ADD_MEMBER", label: "Add a member", group: true },
  { value: "REMOVE_MEMBER", label: "Remove a member", group: true },
  { value: "CHANGE_SUM_ASSURED", label: "Change the sum assured", group: true, individual: true },
];
export const endorsementTypes = (kind) => ENDORSEMENT_TYPES.filter((t) => (kind === "benefit" ? t.individual : t.group));
export const endorsementLabel = (v) => ENDORSEMENT_TYPES.find((t) => t.value === v)?.label || v || "";

export const newEndorsementMember = () => ({ insuredUuid: "", title: "", firstName: "", fatherName: "", grandFatherName: "", gender: "", birthDate: "", idNumber: "", phone: "", sumAssured: "" });

/** @param {'policy'|'benefit'} kind */
export function validateEndorsement(f, kind) {
  const e = {};
  if (!endorsementTypes(kind).some((t) => t.value === f.type)) e.type = "Choose";
  if (!f.effectiveDate) e.effectiveDate = "Required";
  if (String(f.note || "").trim().length > 500) e.note = "At most 500 characters";
  const rows = (f.insured || []).map((m) => {
    const r = {};
    if (f.type === "ADD_MEMBER") {
      for (const k of ["firstName", "fatherName"]) if (blank(m[k])) r[k] = "Required";
      if (!["Male", "Female"].includes(m.gender)) r.gender = "Choose";
      if (!m.birthDate) r.birthDate = "Required";
      else if (m.birthDate >= today()) r.birthDate = "Must be in the past";
    } else if (kind === "policy" && !m.insuredUuid) r.insuredUuid = "Choose the member";
    if (f.type !== "REMOVE_MEMBER") {
      if (blank(m.sumAssured)) r.sumAssured = "Required";
      else if (!(Number(m.sumAssured) > 0)) r.sumAssured = "Must be more than 0";
    }
    return r;
  });
  if (!rows.length) e.insured = kind === "benefit" ? "Enter the new sum assured" : "Add at least one member";
  else if (rows.some((r) => Object.keys(r).length)) e.rows = rows;
  return e;
}

export function toEndorsementRequest(f) {
  const body = { type: f.type, effectiveDate: f.effectiveDate, insured: [] };
  if (!blank(f.note)) body.note = String(f.note).trim();
  body.insured = (f.insured || []).map((m) => {
    const out = {};
    const keys = f.type === "ADD_MEMBER" ? ["title", "firstName", "fatherName", "grandFatherName", "gender", "birthDate", "idNumber", "phone"] : ["insuredUuid"];
    for (const k of keys) if (!blank(m[k])) out[k] = String(m[k]).trim();
    if (f.type !== "REMOVE_MEMBER") out.sumAssured = Number(m.sumAssured);
    return out;
  });
  return body;
}

// ── premium payments (PremiumPaymentRequest) ──
export const PAYMENT_METHODS = [
  { value: "BANK_TRANSFER", label: "Bank transfer" }, { value: "CASH", label: "Cash" }, { value: "CHEQUE", label: "Cheque" },
  { value: "MOBILE_MONEY", label: "Mobile money" }, { value: "OTHER", label: "Other" },
];
export const payable = (item = {}) => item.status === "DUE" || item.status === "OVERDUE";

export const newPremiumPayment = () => ({ receiptNumber: "", receiptDate: today(), method: "BANK_TRANSFER", reference: "" });

export function validatePremiumPayment(f) {
  const e = {};
  if (blank(f.receiptNumber)) e.receiptNumber = "Enter the receipt number";
  else if (String(f.receiptNumber).trim().length > 40) e.receiptNumber = "At most 40 characters";
  if (!f.receiptDate) e.receiptDate = "Required";
  else if (f.receiptDate > today()) e.receiptDate = "Can't be in the future";
  if (!PAYMENT_METHODS.some((m) => m.value === f.method)) e.method = "Choose";
  if (String(f.reference || "").trim().length > 100) e.reference = "At most 100 characters";
  return e;
}

/** The amount is the item's amountDue, as the backend requires */
export function toPremiumPayment(f, item) {
  const body = { scheduleItemUuid: item.scheduleItemUuid, amount: item.amountDue, receiptNumber: String(f.receiptNumber).trim(), receiptDate: f.receiptDate, method: f.method };
  if (!blank(f.reference)) body.reference = String(f.reference).trim();
  return body;
}

// ── documents (LifeDocumentResponse) ──
export const DOCUMENT_TYPES = [
  { value: "APPLICATION_FORM", label: "Application form" }, { value: "ID_COPY", label: "ID copy" }, { value: "MEDICAL_REPORT", label: "Medical report" },
  { value: "SIGNED_SCHEDULE", label: "Signed policy schedule" }, { value: "CORRESPONDENCE", label: "Correspondence" }, { value: "OTHER", label: "Other" },
];
export const documentTypeLabel = (v) => DOCUMENT_TYPES.find((t) => t.value === v)?.label || (v ? v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, " ") : "");

/** Latest version of each document type first, older versions after it */
export function groupDocuments(docs = []) {
  const byType = new Map();
  for (const d of docs) byType.set(d.documentType, [...(byType.get(d.documentType) || []), d]);
  return [...byType.entries()].map(([type, list]) => {
    const sorted = [...list].sort((a, b) => (b.version ?? 0) - (a.version ?? 0));
    return { type, latest: sorted.find((d) => d.latest) || sorted[0], older: sorted.filter((d) => d !== (sorted.find((x) => x.latest) || sorted[0])) };
  });
}
