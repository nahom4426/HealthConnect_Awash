// Dates show as "28 Oct 2026" and times as "28 Oct 2026, 14:05", always in Addis Ababa time.
// The API sends ISO dates ("2026-10-28") and instants ("2026-10-28T11:05:00Z").

const ZONE = "Africa/Addis_Ababa";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: ZONE });
const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: ZONE });

function toDate(value) {
  if (!value) return null;
  // A bare ISO date is a calendar day: read it at noon UTC so no zone shifts the day
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value) {
  const d = toDate(value);
  return d ? dateFmt.format(d) : "—";
}

export function formatDateTime(value) {
  const d = toDate(value);
  return d ? `${dateFmt.format(d)}, ${timeFmt.format(d)}` : "—";
}

/** Today's calendar date in Addis Ababa as "YYYY-MM-DD". */
export function todayIso(at = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: ZONE }).format(at);
  return parts; // en-CA formats as YYYY-MM-DD
}

export function addDays(iso, days) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (ISO dates). */
export function daysBetween(from, to) {
  return Math.round((new Date(`${to}T12:00:00Z`) - new Date(`${from}T12:00:00Z`)) / 86400000);
}

/** "2 hours ago"-style age for queues and audit entries. */
export function formatAge(value, now = new Date()) {
  const d = toDate(value);
  if (!d) return "—";
  const mins = Math.max(0, Math.round((now - d) / 60000));
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.round(hours / 24)} days`;
}

export const dash = (v) => (v === null || v === undefined || v === "" ? "—" : v);
