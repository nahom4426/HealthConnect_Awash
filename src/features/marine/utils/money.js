// Decimal money maths for Marine & Cargo. Amounts travel as strings ("120000.00") and are
// computed as BigInt with 6 implied decimals, so 0.1 + 0.2 is exactly 0.30 and no JavaScript
// float ever touches a premium or sum insured. The backend computes premiums; the frontend
// only previews the sum insured with these helpers.

const SCALE = 6;
const ONE = 10n ** BigInt(SCALE);

/** Parses "1,234.5", 1234.5 or "" into a scaled BigInt (null when not a number). */
export function parseDecimal(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).replace(/,/g, "").trim();
  if (!/^-?\d*(\.\d*)?$/.test(s) || s === "" || s === "-" || s === ".") return null;
  const neg = s.startsWith("-");
  const [int = "0", frac = ""] = s.replace("-", "").split(".");
  const digits = BigInt((int || "0") + frac.padEnd(SCALE, "0").slice(0, SCALE));
  return neg ? -digits : digits;
}

function roundTo(scaled, places) {
  const step = 10n ** BigInt(SCALE - places);
  const half = step / 2n;
  const r = scaled >= 0n ? (scaled + half) / step : -((-scaled + half) / step);
  return r * step;
}

/** Scaled BigInt → plain decimal string with `places` decimals (half-up). */
export function toFixedString(scaled, places = 2) {
  if (scaled === null || scaled === undefined) return "";
  const r = roundTo(scaled, places);
  const neg = r < 0n;
  const abs = neg ? -r : r;
  const int = abs / ONE;
  const frac = (abs % ONE).toString().padStart(SCALE, "0").slice(0, places);
  return `${neg ? "-" : ""}${int}${places ? "." + frac : ""}`;
}

export function add(...values) {
  return values.reduce((sum, v) => sum + (parseDecimal(v) ?? 0n), 0n);
}

export function multiply(a, b) {
  const x = typeof a === "bigint" ? a : parseDecimal(a);
  const y = typeof b === "bigint" ? b : parseDecimal(b);
  if (x === null || y === null) return null;
  return (x * y) / ONE;
}

/** Normalises any input to a 2-decimal string, or "" when it isn't a number. */
export function normalizeAmount(value, places = 2) {
  const d = parseDecimal(value);
  return d === null ? "" : toFixedString(d, places);
}

export function compare(a, b) {
  const x = parseDecimal(a) ?? 0n;
  const y = parseDecimal(b) ?? 0n;
  return x === y ? 0 : x > y ? 1 : -1;
}

/**
 * Sum insured = (invoice + freight) × (1 + uplift%), the CIF + 10% basis (MAR-23).
 * Returns { base, uplift, total } as 2-decimal strings.
 */
export function sumInsured(invoice, freight, upliftPct = "10") {
  const base = add(invoice, freight);
  const uplift = (base * (parseDecimal(upliftPct) ?? 0n)) / (100n * ONE);
  return {
    base: toFixedString(base),
    uplift: toFixedString(uplift),
    total: toFixedString(roundTo(base, 2) + roundTo(uplift, 2)),
  };
}

/** Amount in currency × rate to ETB → ETB string. */
export function toEtb(amount, rate) {
  const r = multiply(amount, rate);
  return r === null ? "" : toFixedString(r);
}

/** "120000" → "120,000.00" */
export function formatAmount(value, places = 2) {
  const s = normalizeAmount(value, places);
  if (s === "") return "—";
  const [int, frac] = s.split(".");
  const neg = int.startsWith("-");
  const grouped = (neg ? int.slice(1) : int).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${neg ? "-" : ""}${grouped}${frac !== undefined ? "." + frac : ""}`;
}

/** "USD 120,000.00" */
export function formatMoney(value, currency = "ETB") {
  const a = formatAmount(value);
  return a === "—" ? a : `${currency} ${a}`;
}
