// Column definitions and client-side checks for the Life rate tables. Field names and
// enums follow the OpenAPI request DTOs exactly; the backend remains the authority on
// what it accepts. These checks only stop obviously broken rows before a bulk save.
import { PolicyStatus, RecordStatus } from "../constants/statuses";

/**
 * @typedef {{ key: string, label: string, type: 'int'|'decimal'|'status', min?: number, statuses?: string[], hint?: string }} RateColumn
 * @typedef {{ id: string, title: string, idField: string, columns: RateColumn[], uniqueBy: (r: any) => string, uniqueLabel: string }} RateTableSpec
 */

const rateCols = [
  { key: "maleRate", label: "Male rate", type: "decimal", min: 0 },
  { key: "femaleRate", label: "Female rate", type: "decimal", min: 0 },
  { key: "rateUnit", label: "Per (sum assured)", type: "int", min: 1, hint: "Rate is charged per this amount of sum assured, e.g. 1000" },
];

/** GroupTermRequest: age, maleRate, femaleRate, rateUnit, status (ACTIVE | PENDING | DISABLED) */
export const groupTermSpec = {
  id: "group-term",
  title: "Group term rates",
  idField: "groupTermUuid",
  columns: [{ key: "age", label: "Age", type: "int", min: 0 }, ...rateCols, { key: "status", label: "Status", type: "status", statuses: Object.values(RecordStatus) }],
  uniqueBy: (r) => `${r.age}`,
  uniqueLabel: "age",
};

/** IndividualTermRequest: age, term, rates, maxDiscount, maxLoad, status */
export const individualTermSpec = {
  id: "individual-term",
  title: "Individual term rates",
  idField: "insuranceTermUuid",
  columns: [
    { key: "age", label: "Age", type: "int", min: 0 },
    { key: "term", label: "Term (years)", type: "int", min: 1 },
    ...rateCols,
    { key: "maxDiscount", label: "Max discount %", type: "decimal", min: 0 },
    { key: "maxLoad", label: "Max load %", type: "decimal", min: 0 },
    { key: "status", label: "Status", type: "status", statuses: Object.values(PolicyStatus) },
  ],
  uniqueBy: (r) => `${r.age}|${r.term}`,
  uniqueLabel: "age and term",
};

/** IndividualRiderRequest: age, rates, riderUuid, status */
export const individualRiderSpec = {
  id: "individual-rider",
  title: "Individual rider rates",
  idField: "individualRiderUuid",
  columns: [{ key: "age", label: "Age", type: "int", min: 0 }, ...rateCols, { key: "status", label: "Status", type: "status", statuses: Object.values(PolicyStatus) }],
  uniqueBy: (r) => `${r.age}`,
  uniqueLabel: "age",
};

/** GroupRiderRequest: minAge, maxAge, rates, riderUuid, status */
export const groupRiderSpec = {
  id: "group-rider",
  title: "Group rider rates",
  idField: "groupRiderUuid",
  columns: [
    { key: "minAge", label: "From age", type: "int", min: 0 },
    { key: "maxAge", label: "To age", type: "int", min: 0 },
    ...rateCols,
    { key: "status", label: "Status", type: "status", statuses: Object.values(PolicyStatus) },
  ],
  uniqueBy: (r) => `${r.minAge}-${r.maxAge}`,
  uniqueLabel: "age range",
};

const isBlank = (v) => v === "" || v === null || v === undefined;

/** Converts the editor's string inputs back to numbers; blank stays null. */
export function normalizeRow(spec, row) {
  const out = { ...row };
  for (const c of spec.columns) {
    if (c.type === "status") continue;
    const v = row[c.key];
    out[c.key] = isBlank(v) ? null : c.type === "int" ? Number.parseInt(v, 10) : Number(v);
  }
  return out;
}

/**
 * Validates every row of a table. Returns a map rowKey → { field → message } plus
 * table-level messages (duplicates, overlapping ranges). Empty result = valid.
 * @param {RateTableSpec} spec
 * @param {Array<{ _key: string }>} rows editor rows (each has a stable _key)
 */
export function validateRateRows(spec, rows) {
  const fieldErrors = {};
  const tableErrors = [];
  const set = (k, f, m) => ((fieldErrors[k] ||= {})[f] = m);

  for (const raw of rows) {
    const r = normalizeRow(spec, raw);
    for (const c of spec.columns) {
      if (c.type === "status") {
        if (!c.statuses.includes(raw[c.key])) set(raw._key, c.key, "Pick a status");
        continue;
      }
      const v = r[c.key];
      if (v === null || Number.isNaN(v)) { set(raw._key, c.key, "Required"); continue; }
      if (c.type === "int" && !Number.isInteger(Number(raw[c.key]))) set(raw._key, c.key, "Whole number");
      else if (c.min !== undefined && v < c.min) set(raw._key, c.key, `Min ${c.min}`);
    }
    if ("minAge" in r && "maxAge" in r && r.minAge !== null && r.maxAge !== null && r.minAge > r.maxAge) {
      set(raw._key, "maxAge", "Must be ≥ from age");
    }
  }

  // Duplicates on the business key (age, age+term, age range)
  const seen = new Map();
  for (const raw of rows) {
    const k = spec.uniqueBy(normalizeRow(spec, raw));
    if (seen.has(k)) {
      tableErrors.push(`Two rows have the same ${spec.uniqueLabel} (${k.replace("|", " / ")}).`);
      set(raw._key, spec.columns[0].key, "Duplicate");
    } else seen.set(k, raw._key);
  }

  // Overlapping age ranges among active-looking rows (group rider rates)
  if (spec.id === "group-rider") {
    const ranges = rows.map((raw) => ({ raw, r: normalizeRow(spec, raw) }))
      .filter(({ r }) => r.minAge !== null && r.maxAge !== null && r.minAge <= r.maxAge)
      .sort((a, b) => a.r.minAge - b.r.minAge);
    for (let i = 1; i < ranges.length; i++) {
      const prev = ranges[i - 1].r, cur = ranges[i].r;
      if (cur.minAge <= prev.maxAge) {
        tableErrors.push(`Age ranges ${prev.minAge}–${prev.maxAge} and ${cur.minAge}–${cur.maxAge} overlap.`);
        set(ranges[i].raw._key, "minAge", "Overlaps");
      }
    }
  }

  return { fieldErrors, tableErrors: [...new Set(tableErrors)], valid: !Object.keys(fieldErrors).length && !tableErrors.length };
}

/** Builds the bulk-save payload: only changed or new rows, numbers normalized, editor keys removed. */
export function toSavePayload(spec, rows, original, extra = {}) {
  const byId = new Map(original.map((o) => [o[spec.idField], o]));
  return rows
    .filter((raw) => {
      if (!raw[spec.idField]) return true; // new row
      const before = byId.get(raw[spec.idField]);
      return !before || spec.columns.some((c) => String(before[c.key] ?? "") !== String(raw[c.key] ?? ""));
    })
    .map((raw) => {
      const r = normalizeRow(spec, raw);
      const body = { ...extra };
      if (raw[spec.idField]) body[spec.idField] = raw[spec.idField];
      for (const c of spec.columns) body[c.key] = r[c.key];
      return body;
    });
}
