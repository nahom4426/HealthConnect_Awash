// Life claim rules. Claim statuses are untyped strings, so a claim's stage is the backend list
// (queue) it was opened from (docs/life-insurance/07-status-lifecycle.md). Only the actions the API
// has are offered: agency submit, insurance review / approve, and reject with a reason.
// Authorize and pay don't exist yet (gap G3), so those queues are read-only.

export const AGENCY_QUEUES = [
  { key: "saved", label: "Drafts", hint: "Prepared but not yet sent to the insurer. Add the documents, then submit." },
  { key: "requested", label: "Submitted", hint: "Sent to the insurer and waiting for review." },
  { key: "approved", label: "Approved", hint: "Approved by the insurer." },
  { key: "paid", label: "Paid", hint: "Paid out." },
  { key: "rejected", label: "Rejected", hint: "Rejected by the insurer; the reason is on the claim." },
];
export const INSURANCE_QUEUES = [
  { key: "requested", label: "New", hint: "Submitted by the agency and not yet registered." },
  { key: "registered", label: "Registered", hint: "Registered and waiting for a claims officer's review." },
  { key: "reviewed", label: "Reviewed", hint: "Reviewed and waiting for a claims manager's approval." },
  { key: "approved", label: "Approved", hint: "Approved. Authorization isn't available in the system yet." },
  { key: "for-authorization", label: "To authorize", hint: "Waiting for authorization (no authorize action in the API yet)." },
  { key: "authorized", label: "Authorized", hint: "Authorized and waiting for payment (no pay action in the API yet)." },
  { key: "paid", label: "Paid", hint: "Paid out." },
  { key: "rejected", label: "Rejected", hint: "Rejected; the reason is on the claim." },
];
export const queuesFor = (side) => (side === "agency" ? AGENCY_QUEUES : INSURANCE_QUEUES);

/** Status string → queue key, for a claim opened without a queue (e.g. a shared link). */
export function queueFromStatus(status) {
  const s = String(status || "").toLowerCase().replace(/_/g, "-");
  if (s.startsWith("save")) return "saved";
  if (s.startsWith("request")) return "requested";
  if (s.startsWith("regist")) return "registered";
  if (s.startsWith("review")) return "reviewed";
  if (s.startsWith("approv")) return "approved";
  if (s.includes("for-author")) return "for-authorization";
  if (s.startsWith("author")) return "authorized";
  if (s.startsWith("paid")) return "paid";
  if (s.startsWith("reject") || s.startsWith("den")) return "rejected";
  return "";
}

/** What the person can do on a claim in this queue. */
export function claimActions(side, queue) {
  const agency = side === "agency";
  return {
    submit: agency && queue === "saved",
    remove: agency && queue === "saved",
    documents: agency && queue === "saved",
    review: !agency && queue === "registered",
    approve: !agency && queue === "reviewed",
    reject: !agency && ["requested", "registered", "reviewed", "approved"].includes(queue),
  };
}

export const DECISIONS = {
  submit: { title: "Submit claim to the insurer", confirmText: "Submit claim", done: "Claim submitted", placeholder: "Anything the claims officer should know (optional)" },
  review: { title: "Mark claim as reviewed", confirmText: "Mark reviewed", done: "Claim reviewed", placeholder: "Review notes for the approver (optional)" },
  approve: { title: "Approve claim", confirmText: "Approve", done: "Claim approved", placeholder: "Approval note (optional)" },
  reject: { title: "Reject claim", confirmText: "Reject claim", done: "Claim rejected", placeholder: "Reason for rejecting — the agency sees this", tone: "danger", required: true },
};

export function validateDecision(action, comment) {
  const text = String(comment || "").trim();
  if (DECISIONS[action]?.required && !text) return "Give a reason";
  if (text.length > 1000) return "At most 1000 characters";
  return "";
}

export function validateAttachment(file, name) {
  const e = {};
  if (!file) e.file = "Choose a file";
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

/** ClaimApproverResponse → ordered sign-off steps */
export function approvalTrail(a = {}) {
  const who = (f, l) => [a[f], a[l]].filter(Boolean).join(" ");
  return [
    { label: "Reviewed", by: who("reviewedByFirstName", "reviewedByFatherName"), date: a.reviewedDate },
    { label: "Approved", by: who("approvedByFirstName", "approvedByFatherName"), date: a.approvedDate },
    { label: "Authorized", by: who("authorizedByFirstName", "authorizedByFatherName"), date: a.authorizedDate },
    { label: "Paid", by: who("paidByFirstName", "paidByFatherName"), date: a.paidDate },
  ];
}
