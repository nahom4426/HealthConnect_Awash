// Display labels for Life enum values (the values themselves stay exactly as the backend sends them)
export const treatyTypeLabel = { Surplus: "Surplus", Risk_Premium: "Risk premium" };
export const coverageLabel = { Term_Only: "Term only", Term_And_Riders: "Term and riders" };
export const insuranceTypeLabel = { Group: "Group", Individual: "Individual" };

/** "2026-01-01T00:00:00" → "1 Jan 2026" */
export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value).slice(0, 10) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** <input type="date"> value → the date-time string the Life DTOs expect */
export const toDateTime = (date) => (date ? `${date}T00:00:00` : null);
/** API date-time → <input type="date"> value */
export const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

/** Backend amount → "12,500.00" (display only; amounts are never computed here) */
export function formatAmount(value) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  return Number.isNaN(n) ? String(value) : n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const quotationStatusLabel = { PENDING: "Draft", ISSUED: "Issued", ACCEPTED: "Accepted", PAID: "Paid" };
