// Life dashboard and report helpers (contract 2026-10, G8). Every figure is the backend's; these only
// pick the period, label statuses and lay the counts out.

export const REPORTS = [
  { name: "policy-register", label: "Policy register", hint: "Group and individual policies issued in the period." },
  { name: "premium-register", label: "Premium register", hint: "Premium payments received in the period." },
  { name: "outstanding-premium", label: "Outstanding premium", hint: "Instalments due and not paid." },
  { name: "claims-register", label: "Claims register", hint: "Claims and their amounts." },
  { name: "expiring-policies", label: "Expiring policies", hint: "Policies whose cover ends in the period." },
  { name: "underwriting-decisions", label: "Underwriting decisions", hint: "Cases decided in the period." },
  { name: "reinsurance-bordereau", label: "Reinsurance bordereau", hint: "Ceded and retained sums assured and premiums by member." },
];
export const reportByName = (name) => REPORTS.find((r) => r.name === name);

const iso = (d) => d.toISOString().slice(0, 10);

/** Preset periods; `today` is a Date (yyyy-MM-dd strings out) */
export function periodFor(preset, today = new Date()) {
  const y = today.getFullYear(), m = today.getMonth();
  const d = (yy, mm, dd) => iso(new Date(Date.UTC(yy, mm, dd)));
  switch (preset) {
    case "month": return { from: d(y, m, 1), to: iso(today) };
    case "quarter": return { from: d(y, m - (m % 3), 1), to: iso(today) };
    case "last12": return { from: d(y - 1, m, today.getDate() + 1), to: iso(today) };
    default: return { from: d(y, 0, 1), to: iso(today) }; // year to date
  }
}
export const PERIODS = [
  { value: "month", label: "This month" }, { value: "quarter", label: "This quarter" },
  { value: "year", label: "Year to date" }, { value: "last12", label: "Last 12 months" },
];

export function validatePeriod({ from, to }) {
  if (!from || !to) return "Choose both dates";
  if (from > to) return "The start date must be before the end date";
  return "";
}

const humanize = (s) => (s ? s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ") : "");

/** { STATUS: count } → [{ status, label, count, share }] largest first; share is of the group's total, for bar widths */
export function statusBreakdown(counts = {}) {
  const entries = Object.entries(counts || {}).filter(([, n]) => Number(n) > 0);
  const total = entries.reduce((s, [, n]) => s + Number(n), 0);
  return entries
    .map(([status, n]) => ({ status, label: humanize(status), count: Number(n), share: total ? Number(n) / total : 0 }))
    .sort((a, b) => b.count - a.count);
}
export const totalOf = (counts = {}) => Object.values(counts || {}).reduce((s, n) => s + Number(n || 0), 0);

/** A report cell for display: dates stay as given, numbers keep their value (formatted by the page), null → "" */
export const isAmountColumn = (column) => /premium|amount|claimed|approved|payable|paid|gross|sum assured|\bSA\b/i.test(column) && !/date|number|installment/i.test(column);
export const isHiddenColumn = (column) => /uuid/i.test(column);
