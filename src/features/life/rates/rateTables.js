// Column definitions and client-side checks for the Life rate tables. Field names and
// enums follow the OpenAPI request DTOs exactly; the backend remains the authority on
// what it accepts. These checks only stop obviously broken rows before a bulk save.
import { PolicyStatus, RecordStatus } from "../constants/statuses";

/**
 * @typedef {{ key: string, label: string, type: 'int'|'decimal'|'status'|'select'|'bool'|'text', min?: number, max?: number, maxLength?: number, optional?: boolean, statuses?: string[], hint?: string }} RateColumn
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
  rangePairs: [["minAge", "maxAge", "from age"]],
  noOverlap: { from: "minAge", to: "maxAge", label: "Age ranges" },
};

const isBlank = (v) => v === "" || v === null || v === undefined;

/** Converts the editor's string inputs back to numbers; blank stays null. */
export function normalizeRow(spec, row) {
  const out = { ...row };
  for (const c of spec.columns) {
    if (c.type === "status" || c.type === "select") continue;
    const v = row[c.key];
    if (c.type === "bool") { out[c.key] = !!v; continue; }
    if (c.type === "text") { out[c.key] = String(v ?? "").trim(); continue; }
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
      if (c.type === "select") {
        if (!c.options.some((o) => o.value === raw[c.key])) set(raw._key, c.key, "Required");
        continue;
      }
      if (c.type === "bool") continue;
      if (c.type === "text") {
        if (!r[c.key] && !c.optional) set(raw._key, c.key, "Required");
        else if (c.maxLength && r[c.key].length > c.maxLength) set(raw._key, c.key, `At most ${c.maxLength} characters`);
        continue;
      }
      const v = r[c.key];
      if (v === null || Number.isNaN(v)) { set(raw._key, c.key, "Required"); continue; }
      if (c.type === "int" && !Number.isInteger(Number(raw[c.key]))) set(raw._key, c.key, "Whole number");
      else if (c.min !== undefined && v < c.min) set(raw._key, c.key, `Min ${c.min}`);
      else if (c.max !== undefined && v > c.max) set(raw._key, c.key, `Max ${c.max}`);
    }
    for (const [from, to, label] of spec.rangePairs || []) {
      if (r[from] !== null && r[to] !== null && r[from] > r[to]) set(raw._key, to, `Must be ≥ ${label}`);
    }
  }

  // Duplicates on the business key (age, age+term, age range, reinsurer…)
  if (spec.uniqueBy) {
    const seen = new Map();
    for (const raw of rows) {
      const k = spec.uniqueBy(normalizeRow(spec, raw));
      if (seen.has(k)) {
        tableErrors.push(`Two rows have the same ${spec.uniqueLabel} (${spec.formatKey ? spec.formatKey(k) : k.replace("|", " / ")}).`);
        set(raw._key, spec.columns[0].key, "Duplicate");
      } else seen.set(k, raw._key);
    }
  }

  // Bands that must not overlap (group rider age bands, FCL lives bands)
  if (spec.noOverlap) {
    const { from, to, label } = spec.noOverlap;
    const bands = rows.map((raw) => ({ raw, r: normalizeRow(spec, raw) }))
      .filter(({ r }) => r[from] !== null && r[to] !== null && r[from] <= r[to])
      .sort((a, b) => a.r[from] - b.r[from]);
    for (let i = 1; i < bands.length; i++) {
      const prev = bands[i - 1].r, cur = bands[i].r;
      if (cur[from] <= prev[to]) {
        tableErrors.push(`${label} ${prev[from]}–${prev[to]} and ${cur[from]}–${cur[to]} overlap.`);
        set(bands[i].raw._key, from, "Overlaps");
      }
    }
  }

  // Spec-specific checks over the whole table: errors block saving, warnings don't
  const extra = spec.checks ? spec.checks(rows.map((raw) => normalizeRow(spec, raw))) : {};
  tableErrors.push(...(extra.errors || []));

  return {
    fieldErrors,
    tableErrors: [...new Set(tableErrors)],
    warnings: extra.warnings || [],
    valid: !Object.keys(fieldErrors).length && !tableErrors.length,
  };
}

const rowChanged = (spec, before, raw) => !before || spec.columns.some((c) => String(before[c.key] ?? "") !== String(raw[c.key] ?? ""));

/** Number of new or edited rows compared with what was loaded. */
export function countChanges(spec, rows, original) {
  const byId = new Map(original.map((o) => [o[spec.idField], o]));
  const edited = rows.filter((raw) => !raw[spec.idField] || rowChanged(spec, byId.get(raw[spec.idField]), raw)).length;
  const removed = original.filter((o) => !rows.some((r) => r[spec.idField] === o[spec.idField])).length;
  return edited + removed;
}

/**
 * Builds the bulk-save payload, numbers normalized and editor keys removed.
 * By default only new or changed rows; `all` sends every row (for bulk endpoints whose
 * replace-or-merge behaviour isn't documented, sending the full list is right either way).
 */
export function toSavePayload(spec, rows, original, extra = {}, { all = false } = {}) {
  const byId = new Map(original.map((o) => [o[spec.idField], o]));
  return rows
    .filter((raw) => all || !raw[spec.idField] || rowChanged(spec, byId.get(raw[spec.idField]), raw))
    .map((raw) => {
      const r = normalizeRow(spec, raw);
      const body = { ...extra };
      if (raw[spec.idField]) body[spec.idField] = raw[spec.idField];
      for (const c of spec.columns) body[c.key] = r[c.key];
      return body;
    });
}
