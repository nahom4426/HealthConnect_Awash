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

export const paymentFrequencyLabel = { ANNUAL: "Annual", SEMI_ANNUAL: "Semi-annual", QUARTERLY: "Quarterly", MONTHLY: "Monthly", SINGLE: "Single premium" };

export const quotationStatusLabel = { PENDING: "Draft", ISSUED: "Issued", ACCEPTED: "Accepted", PAID: "Paid" };

/** Whole days from today to an API date (negative once past); display only */
export function daysUntil(value, now = new Date()) {
  if (!value) return null;
  const end = new Date(String(value).slice(0, 10) + "T00:00:00");
  const start = new Date(now.toISOString().slice(0, 10) + "T00:00:00");
  return Number.isNaN(end.getTime()) ? null : Math.round((end - start) / 86400000);
}
export function remainingLabel(days) {
  if (days === null || days === undefined) return "—";
  if (days < 0) return `Ended ${-days} day${days === -1 ? "" : "s"} ago`;
  if (days === 0) return "Ends today";
  return `${days} day${days === 1 ? "" : "s"} left`;
}
