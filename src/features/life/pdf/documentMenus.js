// Which client PDFs a life record offers, by its stage. The detail pages and the list rows both
// read these, so a list row never offers a document its detail page doesn't.
// Each item: { key, label, hint } where key is a useLifePdfs action.

export function quotationDocuments(q = {}) {
  const s = q.quotationStatus;
  if (!s || s === "PENDING") return [];
  return [
    { key: "quotation", label: "Quotation", hint: "Members, riders and premium" },
    ...(s === "ACCEPTED" || s === "PAID" ? [{ key: "debitNote", label: "Debit note", hint: "Premium due from the institution" }] : []),
    ...(s === "PAID" ? [{ key: "receipt", label: "Official receipt", hint: "Premium payment received" }] : []),
    ...(q.policyIssuedDate ? [{ key: "policySchedule", label: "Policy schedule", hint: "Cover, members and riders" }] : []),
  ];
}

// A group policy is the quotation it was issued from (GET /quotation/{uuid} carries the policy fields)
export const groupPolicyDocuments = (p = {}) => (p.policyIssuedDate ? [
  { key: "policySchedule", label: "Policy schedule", hint: "Cover, members and riders" },
  { key: "receipt", label: "Official receipt", hint: "Premium payment received" },
] : []);

export const individualPolicyDocuments = (b = {}) => (b.policyNumber ? [
  { key: "individualPolicy", label: "Policy schedule", hint: "Policyholder, cover and riders" },
] : []);

export const claimDocuments = (c = {}) => (["AUTHORIZED", "PAID"].includes(c.status) ? [
  { key: "claimSettlement", label: "Settlement advice", hint: c.status === "PAID" ? "Payments to the payees" : "Net payable and payees, for signing" },
] : []);
