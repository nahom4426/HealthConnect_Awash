// Rate table checks shared by the editor (cell outlines, Activate disabled) and the mock backend's
// activate endpoint, so both refuse the same tables (plan 5.6).

import { parseDecimal } from "./money";

const positive = (v) => {
  const d = parseDecimal(v);
  return d !== null && d > 0n;
};
const nonNegative = (v) => {
  const d = parseDecimal(v);
  return d !== null && d >= 0n;
};
const maxDecimals = (v, n) => !String(v ?? "").includes(".") || String(v).split(".")[1].length <= n;

/**
 * Returns a list of { tab, path, message }: path is "general.vatPct", "commodityRates.2.ratePct", …
 * so the editor can outline the exact cell. Empty list = the table can be activated.
 */
export function validateRateTable(t) {
  const errors = [];
  const err = (tab, path, message) => errors.push({ tab, path, message });

  if (!String(t?.name ?? "").trim()) err("General", "name", "Version name is required");
  if (!t?.effectiveFrom) err("General", "effectiveFrom", "Effective from is required");

  const g = t?.general ?? {};
  [
    ["upliftPct", "Uplift %"],
    ["minPremium", "Minimum premium"],
    ["vatPct", "VAT %"],
    ["stampDuty", "Stamp duty"],
  ].forEach(([k, label]) => {
    if (!nonNegative(g[k])) err("General", `general.${k}`, `${label} must be 0 or more`);
  });

  (t?.commodityRates ?? []).forEach((r, i) => {
    if (!positive(r.ratePct)) err("Commodity rates", `commodityRates.${i}.ratePct`, `${r.commodityClass}: rate must be greater than 0`);
    else if (!maxDecimals(r.ratePct, 4)) err("Commodity rates", `commodityRates.${i}.ratePct`, `${r.commodityClass}: at most 4 decimals`);
  });

  ["ICC_A", "ICC_B", "ICC_C"].forEach((c) => {
    if (!positive(t?.clauseFactors?.[c])) err("Clause factors", `clauseFactors.${c}`, `${c.replace("_", " ")} factor must be greater than 0`);
  });

  const seen = new Set();
  (t?.routeFactors ?? []).forEach((r, i) => {
    if (!r.originRegion) err("Route factors", `routeFactors.${i}.originRegion`, `Row ${i + 1}: origin region is required`);
    if (!r.destination) err("Route factors", `routeFactors.${i}.destination`, `Row ${i + 1}: destination is required`);
    if (!r.mode) err("Route factors", `routeFactors.${i}.mode`, `Row ${i + 1}: mode is required`);
    if (!positive(r.factor)) err("Route factors", `routeFactors.${i}.factor`, `Row ${i + 1}: factor must be greater than 0`);
    const key = `${r.originRegion}|${r.destination}|${r.mode}`;
    if (seen.has(key)) err("Route factors", `routeFactors.${i}.originRegion`, `Row ${i + 1}: this origin, destination and mode already has a row`);
    seen.add(key);
  });

  ageBandErrors(t?.ageBands ?? []).forEach((e) => err("Vessel age bands", e.path, e.message));

  if (!nonNegative(t?.warStrikes?.warRatePct)) err("War and strikes", "warStrikes.warRatePct", "War rate must be 0 or more");
  if (!nonNegative(t?.warStrikes?.strikesRatePct)) err("War and strikes", "warStrikes.strikesRatePct", "Strikes rate must be 0 or more");

  return errors;
}

/** Bands must cover 0 to 99 years with no overlap and no gap. */
export function ageBandErrors(bands) {
  const out = [];
  const rows = bands
    .map((b, i) => ({ ...b, i, from: Number(b.fromAge), to: Number(b.toAge) }))
    .sort((a, b) => a.from - b.from);

  bands.forEach((b, i) => {
    if (b.fromAge === "" || b.toAge === "" || Number.isNaN(Number(b.fromAge)) || Number.isNaN(Number(b.toAge)))
      out.push({ path: `ageBands.${i}.fromAge`, message: `Band ${i + 1}: from and to ages are required` });
    else if (Number(b.toAge) < Number(b.fromAge))
      out.push({ path: `ageBands.${i}.toAge`, message: `Band ${i + 1}: to age is before from age` });
    if (!["LOAD", "REFER", "DECLINE"].includes(b.action)) out.push({ path: `ageBands.${i}.action`, message: `Band ${i + 1}: pick an action` });
    if (b.action === "LOAD" && !nonNegative(b.loadingPct)) out.push({ path: `ageBands.${i}.loadingPct`, message: `Band ${i + 1}: loading must be 0 or more` });
  });
  if (out.length) return out;

  if (!rows.length) return [{ path: "ageBands", message: "Add at least one age band from 0 to 99" }];
  if (rows[0].from !== 0) out.push({ path: `ageBands.${rows[0].i}.fromAge`, message: "Age bands must start at 0" });
  for (let k = 1; k < rows.length; k++) {
    const prev = rows[k - 1];
    const cur = rows[k];
    if (cur.from <= prev.to) out.push({ path: `ageBands.${cur.i}.fromAge`, message: `Bands ${prev.from}–${prev.to} and ${cur.from}–${cur.to} overlap` });
    else if (cur.from > prev.to + 1) out.push({ path: `ageBands.${cur.i}.fromAge`, message: `Ages ${prev.to + 1}–${cur.from - 1} are not covered` });
  }
  if (rows[rows.length - 1].to < 99) out.push({ path: `ageBands.${rows[rows.length - 1].i}.toAge`, message: "Age bands must reach 99" });
  return out;
}

/** The band a vessel age falls in, or null. */
export function bandForAge(bands, age) {
  return (bands ?? []).find((b) => age >= Number(b.fromAge) && age <= Number(b.toAge)) ?? null;
}
