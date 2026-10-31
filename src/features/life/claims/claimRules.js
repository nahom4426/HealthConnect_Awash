// Life claim rules (claims v2, contract 2026-10 G3). A claim moves
// SAVED → REQUESTED → REGISTERED → REVIEWED → APPROVED → AUTHORIZED → PAID; REJECTED is final and
// INFO_REQUESTED sends it back to the agency. Amounts (net payable, payee amounts, outstanding
// premium) are the backend's; these rules only decide what to offer and stop incomplete input.
import { ClaimStatus as S } from "../constants/statuses";

const blank = (v) => v === null || v === undefined || String(v).trim() === "";
const PHONE = /^\+?\d{9,13}$/;

// ── types and documents ──
/** Claim types term cover can pay (MATURITY and SURRENDER return 422 for term cover) */
export const CLAIM_TYPES = [
  { value: "DEATH", label: "Death" },
  { value: "ACCIDENTAL_DEATH", label: "Accidental death" },
  { value: "TOTAL_PERMANENT_DISABILITY", label: "Total permanent disability" },
  { value: "CRITICAL_ILLNESS", label: "Critical illness" },
  { value: "RIDER", label: "Other rider benefit" },
];
/** These are paid by a rider, so the claim names the rider */
export const RIDER_CLAIM_TYPES = ["ACCIDENTAL_DEATH", "TOTAL_PERMANENT_DISABILITY", "CRITICAL_ILLNESS", "RIDER"];
export const needsRider = (type) => RIDER_CLAIM_TYPES.includes(type);

const humanize = (v) => (v ? String(v).charAt(0) + String(v).slice(1).toLowerCase().replace(/_/g, " ") : "");
export const claimTypeLabel = (v) => CLAIM_TYPES.find((t) => t.value === v)?.label || humanize(v);
export const documentTypeLabel = humanize;

// ── work queues: each tab is one status of GET /claim/v2/list ──
export const AGENCY_TABS = [
  { status: S.SAVED, label: "Drafts", hint: "Prepared but not yet sent. Attach the checklist documents, then submit." },
  { status: S.INFO_REQUESTED, label: "Info requested", hint: "The insurer asked for more information. Add it and submit again." },
  { status: S.REQUESTED, label: "Submitted", hint: "Sent to the insurer and waiting to be registered." },
  { status: S.REGISTERED, label: "Registered", hint: "Registered by the insurer and being reviewed." },
  { status: S.APPROVED, label: "Approved", hint: "Approved and waiting for authorization." },
  { status: S.PAID, label: "Paid", hint: "Paid out to the payees." },
  { status: S.REJECTED, label: "Rejected", hint: "Rejected by the insurer; the reason is on the claim." },
];
export const DESK_TABS = [
  { status: S.REQUESTED, label: "New", hint: "Submitted by the agency. Register it to give it a claim number." },
  { status: S.REGISTERED, label: "Registered", hint: "Check the documents, then mark it reviewed." },
  { status: S.REVIEWED, label: "Reviewed", hint: "Assess the amount payable, then approve." },
  { status: S.APPROVED, label: "Approved", hint: "Above the auto-authorize limit; waiting for authorization." },
  { status: S.AUTHORIZED, label: "Authorized", hint: "Waiting for payment to the payees." },
  { status: S.PAID, label: "Paid", hint: "Paid out to the payees." },
  { status: S.INFO_REQUESTED, label: "Waiting for info", hint: "Sent back to the agency for more information." },
  { status: S.REJECTED, label: "Rejected", hint: "Rejected; the reason is on the claim." },
];
export const tabsFor = (side) => (side === "agency" ? AGENCY_TABS : DESK_TABS);

/** What the claim's status allows (privileges are checked by the page) */
export function claimActions(c = {}) {
  const s = c.status;
  const open = [S.REQUESTED, S.REGISTERED, S.REVIEWED].includes(s);
  return {
    submit: s === S.SAVED || s === S.INFO_REQUESTED,
    documents: s === S.SAVED || s === S.INFO_REQUESTED,
    remove: s === S.SAVED,
    register: s === S.REQUESTED,
    review: s === S.REGISTERED,
    assess: s === S.REVIEWED,
    approve: s === S.REVIEWED && c.approvedAmount != null,
    authorize: s === S.APPROVED,
    pay: s === S.AUTHORIZED,
    requestInfo: open,
    reject: open || s === S.APPROVED,
  };
}

// ── one step with a comment ──
export const DECISIONS = {
  submit: { title: "Submit claim to the insurer", confirmText: "Submit claim", done: "Claim submitted", placeholder: "Anything the claims officer should know (optional)" },
  register: { title: "Register claim", confirmText: "Register", done: "Claim registered", placeholder: "Registration note (optional)" },
  review: { title: "Mark claim as reviewed", confirmText: "Mark reviewed", done: "Claim reviewed", placeholder: "Review notes for the assessor (optional)" },
  approve: { title: "Approve claim", confirmText: "Approve", done: "Claim approved", placeholder: "Approval note (optional)" },
  authorize: { title: "Authorize payment", confirmText: "Authorize", done: "Claim authorized", placeholder: "Authorization note (optional)" },
  requestInfo: { title: "Ask the agency for more information", confirmText: "Send request", done: "Sent back to the agency", placeholder: "What's missing — the agency sees this", required: true },
  reject: { title: "Reject claim", confirmText: "Reject claim", done: "Claim rejected", placeholder: "Reason for rejecting — the agency sees this", tone: "danger", required: true },
};

export const commentLimit = (action) => (action === "reject" || action === "requestInfo" ? 500 : 1000);

export function validateDecision(action, comment) {
  const text = String(comment || "").trim();
  if (DECISIONS[action]?.required && !text) return "Give a reason";
  if (DECISIONS[action]?.required && text.length < 2) return "At least 2 characters";
  const max = commentLimit(action);
  if (text.length > max) return `At most ${max} characters`;
  return "";
}

// ── new claim (LifeClaimRequest) ──
export function newClaimForm() {
  return {
    claimType: "", riderUuid: "", eventDate: "", causeOfEvent: "", placeOfEvent: "", suspectedSuicide: false,
    notifiedByName: "", notifiedByRelationship: "", notifiedByPhone: "", claimedAmount: "", payees: [],
  };
}
export const newPayee = () => ({ name: "", sharePercent: "", bankName: "", accountNumber: "" });

/**
 * @param {object} f form
 * @param {{ sumAssured?: number, coverStart?: string, coverEnd?: string }} cover the chosen member or policy
 */
export function validateClaim(f, cover = {}, today = new Date().toISOString().slice(0, 10)) {
  const e = {};
  if (!CLAIM_TYPES.some((t) => t.value === f.claimType)) e.claimType = "Choose the claim type";
  if (needsRider(f.claimType) && !f.riderUuid) e.riderUuid = "Choose the rider that pays this claim";
  if (!f.eventDate) e.eventDate = "Required";
  else if (f.eventDate > today) e.eventDate = "Can't be in the future";
  else if ((cover.coverStart && f.eventDate < cover.coverStart) || (cover.coverEnd && f.eventDate > cover.coverEnd)) e.eventDate = "Must be within the cover period";
  if (blank(f.causeOfEvent)) e.causeOfEvent = "Required";
  else if (String(f.causeOfEvent).trim().length > 500) e.causeOfEvent = "At most 500 characters";
  if (String(f.placeOfEvent || "").trim().length > 200) e.placeOfEvent = "At most 200 characters";
  if (blank(f.notifiedByName)) e.notifiedByName = "Required";
  else if (String(f.notifiedByName).trim().length > 120) e.notifiedByName = "At most 120 characters";
  if (String(f.notifiedByRelationship || "").trim().length > 60) e.notifiedByRelationship = "At most 60 characters";
  if (!blank(f.notifiedByPhone) && !PHONE.test(String(f.notifiedByPhone).trim())) e.notifiedByPhone = "9 to 13 digits, optionally starting with +";
  if (blank(f.claimedAmount)) e.claimedAmount = "Required";
  else if (!(Number(f.claimedAmount) > 0)) e.claimedAmount = "Must be more than 0";
  else if (cover.sumAssured != null && Number(f.claimedAmount) > Number(cover.sumAssured)) e.claimedAmount = "Can't be more than the sum assured";
  const payeeErrors = validatePayees(f.payees);
  if (payeeErrors) e.payees = payeeErrors;
  return e;
}

/** Payees are optional (the primary beneficiaries are used); when given, shares must add up to 100. */
export function validatePayees(payees = []) {
  if (!payees.length) return null;
  const rows = payees.map((p) => {
    const e = {};
    if (blank(p.name)) e.name = "Required";
    if (!(Number(p.sharePercent) > 0) || Number(p.sharePercent) > 100) e.sharePercent = "1 to 100";
    if (blank(p.bankName)) e.bankName = "Required";
    if (blank(p.accountNumber)) e.accountNumber = "Required";
    return e;
  });
  // Whole hundredths, so 33.33 + 33.33 + 33.34 adds up exactly
  const total = payees.reduce((sum, p) => sum + Math.round(Number(p.sharePercent || 0) * 100), 0);
  const share = total === 10000 ? "" : `Shares add up to ${total / 100}%; they must add up to 100%`;
  return rows.some((r) => Object.keys(r).length) || share ? { rows, share } : null;
}

/** subject = { insuredPersonUuid } (group member) or { benefitUuid } (individual policy) */
export function toClaimRequest(f, subject) {
  const body = {
    ...subject,
    claimType: f.claimType,
    eventDate: f.eventDate,
    causeOfEvent: String(f.causeOfEvent).trim(),
    suspectedSuicide: !!f.suspectedSuicide,
    notifiedBy: { name: String(f.notifiedByName).trim() },
    claimedAmount: Number(f.claimedAmount),
  };
  if (needsRider(f.claimType)) body.riderUuid = f.riderUuid;
  if (!blank(f.placeOfEvent)) body.placeOfEvent = String(f.placeOfEvent).trim();
  if (!blank(f.notifiedByRelationship)) body.notifiedBy.relationship = String(f.notifiedByRelationship).trim();
  if (!blank(f.notifiedByPhone)) body.notifiedBy.phone = String(f.notifiedByPhone).trim();
  if (f.payees?.length) {
    body.payees = f.payees.map((p) => ({ name: String(p.name).trim(), sharePercent: Number(p.sharePercent), bankName: String(p.bankName).trim(), accountNumber: String(p.accountNumber).trim() }));
  }
  return body;
}

// ── assessment (ClaimAssessmentRequest) ──
export function fromAssessment(c = {}) {
  return {
    eligibleAmount: c.eligibleAmount ?? c.claimedAmount ?? "",
    approvedAmount: c.approvedAmount ?? "",
    outstandingPremiumDeducted: c.outstandingPremiumDeducted ?? c.outstandingPremium ?? 0,
    deductions: (c.deductions || []).map((d) => ({ reason: d.reason ?? "", amount: d.amount ?? "" })),
    decisionNote: c.decisionNote ?? "",
  };
}

export function validateAssessment(f, c = {}) {
  const e = {};
  const amount = (k, label) => {
    if (blank(f[k])) e[k] = "Required";
    else if (Number.isNaN(Number(f[k])) || Number(f[k]) < 0) e[k] = "Must be 0 or more";
    else if (c.sumAssured != null && Number(f[k]) > Number(c.sumAssured)) e[k] = `${label} can't be more than the sum assured`;
  };
  amount("eligibleAmount", "Eligible amount");
  amount("approvedAmount", "Approved amount");
  if (!e.approvedAmount && !e.eligibleAmount && Number(f.approvedAmount) > Number(f.eligibleAmount)) e.approvedAmount = "Can't be more than the eligible amount";
  if (!blank(f.outstandingPremiumDeducted) && (Number.isNaN(Number(f.outstandingPremiumDeducted)) || Number(f.outstandingPremiumDeducted) < 0)) e.outstandingPremiumDeducted = "Must be 0 or more";
  const rows = (f.deductions || []).map((d) => {
    const r = {};
    if (blank(d.reason)) r.reason = "Required";
    if (!(Number(d.amount) > 0)) r.amount = "Must be more than 0";
    return r;
  });
  if (rows.some((r) => Object.keys(r).length)) e.deductions = rows;
  if (blank(f.decisionNote)) e.decisionNote = "Explain the decision";
  else if (String(f.decisionNote).trim().length > 1000) e.decisionNote = "At most 1000 characters";
  return e;
}

export function toAssessmentRequest(f) {
  return {
    eligibleAmount: Number(f.eligibleAmount),
    approvedAmount: Number(f.approvedAmount),
    deductions: (f.deductions || []).map((d) => ({ reason: String(d.reason).trim(), amount: Number(d.amount) })),
    outstandingPremiumDeducted: blank(f.outstandingPremiumDeducted) ? 0 : Number(f.outstandingPremiumDeducted),
    decisionNote: String(f.decisionNote).trim(),
  };
}

// ── payment (ClaimPayRequest): one payment per unpaid payee, for the payee's amount ──
export const unpaidPayees = (c = {}) => (c.payees || []).filter((p) => !p.paid);

export function paymentRows(c = {}, today = new Date().toISOString().slice(0, 10)) {
  return unpaidPayees(c).map((p) => ({ payeeUuid: p.payeeUuid, paymentVoucherNumber: "", paymentOrderNumber: "", paymentDate: today, bankTransactionCode: "" }));
}

export function validatePayments(rows, today = new Date().toISOString().slice(0, 10)) {
  const errors = rows.map((r) => {
    const e = {};
    if (blank(r.paymentVoucherNumber)) e.paymentVoucherNumber = "Required";
    if (!r.paymentDate) e.paymentDate = "Required";
    else if (r.paymentDate > today) e.paymentDate = "Can't be in the future";
    return e;
  });
  return errors.some((e) => Object.keys(e).length) ? errors : null;
}

/** Each payment is for the payee's own amount, as the server split it */
export function toPayRequest(claimUuid, rows, payees = []) {
  return {
    claimUuid,
    payments: rows.map((r) => {
      const p = { payeeUuid: r.payeeUuid, amount: payees.find((x) => x.payeeUuid === r.payeeUuid)?.amount, paymentVoucherNumber: String(r.paymentVoucherNumber).trim(), paymentDate: r.paymentDate };
      if (!blank(r.paymentOrderNumber)) p.paymentOrderNumber = String(r.paymentOrderNumber).trim();
      if (!blank(r.bankTransactionCode)) p.bankTransactionCode = String(r.bankTransactionCode).trim();
      return p;
    }),
  };
}

// ── timeline and documents ──
export function claimTimeline(c = {}) {
  // The backend stamps requestedDate when a draft is saved; a draft hasn't been submitted yet
  const submitted = c.status === S.SAVED ? null : c.requestedDate;
  return [
    ["Submitted", submitted, c.agencyComment],
    ["Registered", c.registeredDate],
    ["Reviewed", c.reviewedDate, c.reviewerComment],
    ["Assessed", c.assessedDate, c.decisionNote],
    ["Approved", c.approvedDate, c.approverComment],
    ["Authorized", c.authorizedDate, c.authorizerComment],
    ["Paid", c.paidDate],
  ].map(([label, date, comment]) => ({ label, date: date || null, comment: comment || "" }));
}

/** Checklist items still not received */
export const missingDocuments = (c = {}) => (c.documents || []).filter((d) => !d.received);

export function validateAttachment(file, name, documentType, requireType = false) {
  const e = {};
  if (!file) e.file = "Choose a file";
  if (requireType && !documentType) e.documentType = "Choose which document this is";
  if (!String(name || "").trim()) e.name = "Name the document, e.g. Death certificate";
  else if (String(name).trim().length > 100) e.name = "At most 100 characters";
  return e;
}

export const personName = (c = {}) => [c.title, c.firstName, c.fatherName, c.grandFatherName].filter(Boolean).join(" ");

export function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
