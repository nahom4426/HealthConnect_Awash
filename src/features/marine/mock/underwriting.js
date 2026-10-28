// Phase 2 of the mock backend (plan section 6): every rated quote goes through sanctions
// screening, accumulation, warranties and the referral rules; referrals are queued, assigned and
// decided within the authority matrix; certificates can be amended or cancelled; the dashboard
// and alerts bell read one endpoint.
import { rate, routeOf } from "./rating";
import {
  db, fail, invalid, nowIso, lc, listParam, actor, audit, page, inRange, partyRef, portRef, vesselRef, commodityRef,
  activeTable, fxFor, quoteView, certificateStatus, certificateView, on, caller, hasRole, brokerOnly, save, nextId,
} from "./core";
import { addDays, todayIso } from "../utils/format";
import { vesselAge } from "../utils/imo";
import { add, parseDecimal, toFixedString } from "../utils/money";
import { FOREIGN_CURRENCIES } from "../constants";

const UW = ["UNDERWRITER", "SENIOR_UNDERWRITER"];
const gt = (a, b) => (parseDecimal(a) ?? 0n) > (parseDecimal(b) ?? 0n);

// ── sanctions screening (MAR-31 to MAR-34) ──
const STOP = new Set(["plc", "sc", "ltd", "llc", "sa", "co", "inc", "the", "and", "&", "share", "company", "mv", "pvt"]);
const tokens = (name) => new Set(lc(name).replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((t) => t && !STOP.has(t)));

/** Share of the list entry's name tokens found in the subject's name (0 to 1). */
export function matchScore(subject, entry) {
  const a = tokens(subject);
  const b = tokens(entry);
  if (!a.size || !b.size) return 0;
  let hit = 0;
  b.forEach((t) => a.has(t) && hit++);
  return hit / b.size;
}

function subjectsOf(q, vessel) {
  const party = (type, id) => {
    const p = db.parties.find((x) => x.id === String(id));
    return p ? { type, key: `${type}:${p.id}`, name: p.name, identifier: p.tin ? `TIN ${p.tin}` : "" } : null;
  };
  const countries = [...new Set([q.portOfLoading, ...(q.transshipmentPorts ?? []), q.portOfDischarge, q.inland?.from, q.inland?.to].filter(Boolean).map((c) => portRef(c)?.country).filter(Boolean))];
  return [
    party("Insured", q.insuredId),
    party("Consignee", q.consigneeId),
    q.lc?.enabled ? party("Bank", q.lc.bankId) : null,
    vessel ? { type: "Vessel", key: `vessel:${vessel.imo}`, name: vessel.name, identifier: `IMO ${vessel.imo}` } : null,
    vessel?.owner ? { type: "Owner or operator", key: `owner:${vessel.owner}`, name: vessel.owner, identifier: vessel.flag } : null,
    ...countries.map((c) => ({ type: "Route country", key: `country:${c}`, name: c, identifier: c })),
  ].filter(Boolean);
}

/** Screens every subject of a quote; a reviewed result (Clear or Confirmed) is kept on re-rating. */
function screen(q, vessel, { persist = true } = {}) {
  return subjectsOf(q, vessel).map((s) => {
    const matches = db.sanctionsList
      .map((e) => ({ list: e.list, matchedName: e.name, ref: e.ref, score: Math.round(matchScore(s.name, e.name) * 100) }))
      .filter((m) => m.score >= 60);
    const prior = db.screenings.find((x) => x.quoteId === q.id && x.key === s.key && x.name === s.name);
    if (prior && prior.reviewedAt) return prior;
    const record = {
      id: prior?.id ?? String(++db.seq.screening),
      quoteId: q.id,
      ...s,
      result: matches.length ? "POTENTIAL" : "CLEAR",
      matches,
      screenedAt: nowIso(),
    };
    if (persist) {
      if (prior) Object.assign(prior, record);
      else db.screenings.push(record);
    }
    return record;
  });
}

// ── warranties (rules → Warranties) ──
function warrantyResults(q, vessel) {
  const waived = q.waivedWarranties ?? [];
  const age = vessel ? vesselAge(vessel.yearBuilt) : null;
  const results = db.rules.warranties
    .filter((w) => w.active && vessel)
    .map((w) => {
      const breached =
        w.condition === "CLASS_REQUIRED" ? ["Unclassed", "Other"].includes(vessel.classSociety) : w.condition === "VESSEL_AGE_MAX" ? age > Number(w.value) : false;
      const detail = w.condition === "CLASS_REQUIRED" ? `Class: ${vessel.classSociety}` : `Age ${age} years, maximum ${w.value}`;
      return { id: w.id, name: w.name, action: w.action, loadPct: w.loadPct, detail, result: !breached ? "PASS" : waived.includes(w.id) ? "WAIVED" : "BREACH" };
    });
  const loadPct = results.filter((r) => r.result === "BREACH" && r.action === "LOAD").reduce((sum, r) => sum + Number(r.loadPct || 0), 0);
  return { results, loadPct: String(loadPct) };
}

// ── accumulation per vessel and voyage, inland exposure per truck and convoy ──
function accumulation(q, siEtb) {
  const { softLimit, hardLimit } = db.rules.accumulation;
  if (!q.vesselImo) return null;
  const current = db.policies
    .filter((p) => p.status === "ACTIVE" && p.snapshot.vesselImo === q.vesselImo && p.snapshot.sailingDate === q.sailingDate && p.snapshot.id !== q.id)
    .reduce((sum, p) => sum + (parseDecimal(p.snapshot.premium?.sumInsuredEtb) ?? 0n), 0n);
  const total = current + (parseDecimal(siEtb) ?? 0n);
  return {
    current: toFixedString(current),
    thisQuote: siEtb,
    total: toFixedString(total),
    softLimit,
    hardLimit,
    level: total > (parseDecimal(hardLimit) ?? 0n) ? "HARD" : total > (parseDecimal(softLimit) ?? 0n) ? "SOFT" : "OK",
  };
}

function inlandExposure(q, siEtb) {
  if (!q.inland?.truckPlate) return null;
  const sameDay = db.policies.filter((p) => p.status === "ACTIVE" && p.snapshot.inland && p.snapshot.sailingDate === q.sailingDate && p.snapshot.id !== q.id);
  const sum = (list) => list.reduce((acc, p) => acc + (parseDecimal(p.snapshot.premium?.sumInsuredEtb) ?? 0n), 0n) + (parseDecimal(siEtb) ?? 0n);
  const vehicle = sum(sameDay.filter((p) => lc(p.snapshot.inland.truckPlate) === lc(q.inland.truckPlate)));
  const convoy = q.inland.convoyRef ? sum(sameDay.filter((p) => p.snapshot.inland.convoyRef && lc(p.snapshot.inland.convoyRef) === lc(q.inland.convoyRef))) : null;
  return {
    vehicle: toFixedString(vehicle),
    vehicleLimit: db.rules.inland.perVehicle,
    convoy: convoy === null ? null : toFixedString(convoy),
    convoyLimit: db.rules.inland.perConvoy,
  };
}

function ruleReasons(q, { siEtb, vessel, commodity, screenings }) {
  const out = [];
  const route = [q.portOfLoading, ...(q.transshipmentPorts ?? []), q.portOfDischarge].filter(Boolean);
  for (const r of db.rules.referral.filter((x) => x.active)) {
    if (r.condition === "SUM_INSURED_OVER" && gt(siEtb, r.value)) out.push({ code: "VALUE", message: `Sum insured is above ETB ${Number(r.value).toLocaleString("en")} (${r.name}).` });
    if (r.condition === "COMMODITY_CLASS_IN" && commodity && [].concat(r.value).includes(commodity.commodityClass) && !commodity.restricted)
      out.push({ code: "COMMODITY", message: `${commodity.commodityClass.toLowerCase()} cargo (${r.name}).` });
    if (r.condition === "ROUTE_IN" && route.some((p) => [].concat(r.value).includes(p))) out.push({ code: "ROUTE", message: `The voyage calls at ${route.filter((p) => [].concat(r.value).includes(p)).join(", ")} (${r.name}).` });
    if (r.condition === "VESSEL_AGE_OVER" && vessel && vesselAge(vessel.yearBuilt) > Number(r.value)) out.push({ code: "VESSEL_AGE", message: `Vessel over ${r.value} years (${r.name}).` });
    if (r.condition === "SANCTIONS_RESULT_IS" && screenings.some((x) => x.result === r.value))
      out.push({ code: "SANCTIONS", message: `Possible sanctions match: ${screenings.filter((x) => x.result === "POTENTIAL").map((x) => x.name).join(", ")}.` });
  }
  return out;
}

const dedupe = (reasons) => reasons.filter((r, i) => reasons.findIndex((x) => x.code === r.code && x.message === r.message) === i);

/** Authority needed for a sum insured in ETB: the first underwriting role whose limit covers it. */
export function authorityFor(siEtb, accLevel) {
  if (accLevel === "HARD") return "SENIOR_UNDERWRITER";
  const uw = db.rules.authority.find((a) => a.role === "UNDERWRITER");
  return uw && !gt(siEtb, uw.maxSumInsured) ? "UNDERWRITER" : "SENIOR_UNDERWRITER";
}

/** The caller's strongest authority row among the given roles. */
export function callerAuthority(roles = UW) {
  const rows = db.rules.authority.filter((a) => roles.includes(a.role) && caller.roles.includes(a.role));
  if (!rows.length) return null;
  return rows.reduce((best, a) => (gt(a.maxSumInsured, best.maxSumInsured) ? a : best));
}

/**
 * Rates and checks a quote (or a would-be amendment). extraReasons come from the open cover's
 * limits; agreedRatePct from its commodity list.
 */
export function assess(q, { persist = true, extraReasons = [], agreedRatePct = null } = {}) {
  const table = activeTable(q.product) ?? fail(409, "There is no active rate table for this product.", { code: "NO_RATE_TABLE" });
  const fxRate = fxFor(q.currency) ?? fail(409, `There is no ${q.currency} exchange rate. Ask Finance to enter one.`, { code: "NO_FX_RATE" });
  const vessel = vesselRef(q.vesselImo);
  const commodity = commodityRef(q.hsCode);
  const warranties = warrantyResults(q, vessel);
  const rated = rate(q, { table, vessel, commodity, fxRate, agreedRatePct, rateOverridePct: q.rateOverridePct ?? null, warrantyLoadPct: warranties.loadPct });
  const screenings = screen(q, vessel, { persist });
  const acc = accumulation(q, rated.sumInsuredEtb);
  const inland = inlandExposure(q, rated.sumInsuredEtb);

  const reasons = [...rated.tableReasons, ...ruleReasons(q, { siEtb: rated.sumInsuredEtb, vessel, commodity, screenings })];
  warranties.results.filter((w) => w.result === "BREACH" && w.action === "REFER").forEach((w) => reasons.push({ code: "WARRANTY", message: `Warranty breached: ${w.name} (${w.detail}).` }));
  if (acc && acc.level !== "OK")
    reasons.push({ code: "ACCUMULATION", message: `Vessel and voyage total ETB ${Number(acc.total).toLocaleString("en")} is over the ${acc.level === "HARD" ? "hard" : "soft"} limit.` });
  if (inland && gt(inland.vehicle, inland.vehicleLimit)) reasons.push({ code: "ACCUMULATION", message: `Truck ${q.inland.truckPlate} carries more than the per-vehicle limit today.` });
  if (inland?.convoy && gt(inland.convoy, inland.convoyLimit)) reasons.push({ code: "ACCUMULATION", message: `Convoy ${q.inland.convoyRef} is over the per-convoy limit.` });
  reasons.push(...extraReasons);

  const confirmed = screenings.some((x) => x.result === "CONFIRMED");
  const all = dedupe(reasons);
  return {
    status: rated.declineNote ? "DECLINED" : all.length || confirmed ? "REFERRED" : "QUOTED",
    declineNote: rated.declineNote,
    premium: rated.premium,
    fx: rated.fx,
    referralReasons: all,
    sanctionsConfirmed: confirmed,
    checks: { screenings, accumulation: acc, warranties: warranties.results, inland },
    authorityNeeded: authorityFor(rated.sumInsuredEtb, acc?.level),
  };
}

/** Keeps the quote's open referral in step with its latest rating. */
export function syncReferral(q, a) {
  const open = db.referrals.find((r) => r.quoteId === q.id && r.status === "OPEN");
  if (a.status !== "REFERRED") {
    if (open) Object.assign(open, { status: "WITHDRAWN", decidedAt: nowIso(), note: "No referral reasons left after re-checking" });
    return;
  }
  if (open) Object.assign(open, { reasons: a.referralReasons, sumInsuredEtb: a.premium.sumInsuredEtb, authorityNeeded: a.authorityNeeded });
  else
    db.referrals.push({
      id: String(++db.seq.referral),
      quoteId: q.id,
      status: "OPEN",
      reasons: a.referralReasons,
      sumInsuredEtb: a.premium.sumInsuredEtb,
      authorityNeeded: a.authorityNeeded,
      raisedAt: nowIso(),
      assigneeName: null,
      history: [{ at: nowIso(), by: actor(), action: "Raised" }],
    });
}

export function applyAssessment(q, a) {
  Object.assign(q, {
    status: a.status,
    premium: a.premium,
    referralReasons: a.referralReasons,
    declineNote: a.declineNote,
    fx: a.fx,
    checks: a.checks,
    sanctionsConfirmed: a.sanctionsConfirmed,
    updatedAt: nowIso(),
  });
}

// ── referrals (MAR-35, MAR-36) ──
const referralRow = (r) => {
  const q = db.quotes.find((x) => x.id === r.quoteId);
  return {
    ...r,
    quoteNo: q?.quoteNo,
    insured: partyRef(q?.insuredId),
    reasonCodes: [...new Set(r.reasons.map((x) => x.code))],
    waitingHours: Math.round((Date.now() - new Date(r.raisedAt).getTime()) / 3600000),
  };
};

on("get", "/referrals", ({ query }) => {
  if (!hasRole(...UW)) fail(403, "You don't have permission for this action.");
  const statuses = listParam(query.status);
  const reasons = listParam(query.reason);
  let items = db.referrals.map(referralRow);
  if (statuses.length) items = items.filter((r) => statuses.includes(r.status));
  if (reasons.length) items = items.filter((r) => r.reasonCodes.some((c) => reasons.includes(c)));
  if (query.assignee === "me") items = items.filter((r) => r.assigneeName === actor());
  if (query.assignee === "none") items = items.filter((r) => !r.assigneeName);
  items = items.filter((r) => inRange(r.raisedAt, query.raisedFrom, query.raisedTo));
  return page(items, query, { sortDefault: "raisedAt,asc" });
});

on("get", "/referrals/:id", ({ params }) => {
  if (!hasRole(...UW)) fail(403, "You don't have permission for this action.");
  const r = db.referrals.find((x) => x.id === params.id) ?? fail(404, "Referral not found");
  const q = db.quotes.find((x) => x.id === r.quoteId);
  const me = callerAuthority();
  return {
    ...referralRow(r),
    quote: quoteView(q),
    authority: me ? { role: me.role, maxSumInsured: me.maxSumInsured, canOverrideRate: me.canOverrideRate, canWaiveWarranty: me.canWaiveWarranty } : null,
  };
});

on("post", "/referrals/:id/assign", ({ params }) => {
  if (!hasRole(...UW)) fail(403, "You don't have permission for this action.");
  const r = db.referrals.find((x) => x.id === params.id) ?? fail(404, "Referral not found");
  if (r.status !== "OPEN") fail(409, "This referral is already decided.", { code: "WRONG_STATE" });
  r.assigneeName = actor();
  r.history.push({ at: nowIso(), by: actor(), action: "Assigned to self" });
  return referralRow(r);
});

on("post", "/referrals/:id/decide", ({ params, body }) => {
  if (!hasRole(...UW)) fail(403, "You don't have permission for this action.");
  const r = db.referrals.find((x) => x.id === params.id) ?? fail(404, "Referral not found");
  if (r.status !== "OPEN") fail(409, "This referral is already decided.", { code: "WRONG_STATE" });
  const q = db.quotes.find((x) => x.id === r.quoteId);
  const note = String(body?.note ?? "").trim();
  const decision = body?.decision;
  if (!["APPROVE", "DECLINE", "ESCALATE"].includes(decision)) invalid([{ field: "decision", message: "Pick Approve or Decline" }]);

  if (decision === "DECLINE") {
    if (note.length < 10) invalid([{ field: "note", message: "A note of at least 10 characters is required to decline" }]);
    Object.assign(q, { status: "DECLINED", declineNote: note, updatedAt: nowIso() });
    Object.assign(r, { status: "DECLINED", note, decidedAt: nowIso(), decidedBy: actor() });
    r.history.push({ at: nowIso(), by: actor(), action: "Declined", note });
    audit("quote", q.id, `Referral declined: ${note}`);
    return referralRow(r);
  }

  const screenings = db.screenings.filter((x) => x.quoteId === q.id);
  if (screenings.some((x) => x.result === "CONFIRMED")) fail(409, "Sanctions match confirmed. This quote can't be bound.", { code: "SANCTIONS_CONFIRMED" });
  if (screenings.some((x) => x.result === "POTENTIAL")) fail(409, "Resolve sanctions matches first.", { code: "SANCTIONS_PENDING" });

  const me = callerAuthority();
  if (decision === "ESCALATE") {
    Object.assign(r, { authorityNeeded: "SENIOR_UNDERWRITER", assigneeName: null });
    r.history.push({ at: nowIso(), by: actor(), action: "Sent to senior underwriter", note });
    return referralRow(r);
  }
  if (!me || gt(r.sumInsuredEtb, me.maxSumInsured) || (r.authorityNeeded === "SENIOR_UNDERWRITER" && me.role !== "SENIOR_UNDERWRITER"))
    fail(403, "Needs a senior underwriter.", { code: "ABOVE_AUTHORITY" });
  if (body?.rateOverridePct && !me.canOverrideRate) fail(403, "Your role can't override the rate.");
  if (body?.waiveWarrantyIds?.length && !me.canWaiveWarranty) fail(403, "Your role can't waive warranties.");
  if (body?.rateOverridePct && !(parseDecimal(body.rateOverridePct) > 0n)) invalid([{ field: "rateOverridePct", message: "Rate must be greater than 0" }]);

  q.rateOverridePct = body?.rateOverridePct || null;
  q.waivedWarranties = body?.waiveWarrantyIds ?? [];
  const cover = q.openCoverId ? db.openCovers.find((c) => c.id === q.openCoverId) : null;
  const a = assess(q, { agreedRatePct: cover?.commodities.find((c) => c.hsCode === q.hsCode)?.ratePct ?? null });
  applyAssessment(q, a);
  Object.assign(q, { status: "APPROVED", decisionNote: note, validUntil: addDays(todayIso(), 30) });
  Object.assign(r, { status: "APPROVED", note, decidedAt: nowIso(), decidedBy: actor(), rateOverridePct: q.rateOverridePct, waived: q.waivedWarranties });
  r.history.push({ at: nowIso(), by: actor(), action: "Approved", note });
  audit("quote", q.id, `Referral approved${q.rateOverridePct ? ` with rate ${q.rateOverridePct}%` : ""}`);
  return referralRow(r);
});

on("post", "/screenings/:id/review", ({ params, body }) => {
  if (!hasRole(...UW)) fail(403, "You don't have permission for this action.");
  const s = db.screenings.find((x) => x.id === params.id) ?? fail(404, "Screening not found");
  const note = String(body?.note ?? "").trim();
  const e = [];
  if (!["CLEAR", "CONFIRM"].includes(body?.decision)) e.push({ field: "decision", message: "Pick Clear or Confirm match" });
  if (note.length < 10) e.push({ field: "note", message: "A note of at least 10 characters is required" });
  if (e.length) invalid(e);
  Object.assign(s, { result: body.decision === "CLEAR" ? "CLEAR" : "CONFIRMED", reviewNote: note, reviewedBy: actor(), reviewedAt: nowIso() });
  const q = db.quotes.find((x) => x.id === s.quoteId);
  const cover = q.openCoverId ? db.openCovers.find((c) => c.id === q.openCoverId) : null;
  const a = assess(q, { agreedRatePct: cover?.commodities.find((c) => c.hsCode === q.hsCode)?.ratePct ?? null, extraReasons: q.declarationReasons ?? [] });
  applyAssessment(q, a);
  // A cleared false positive with nothing else to refer goes straight back to Quoted
  syncReferral(q, a);
  audit("quote", q.id, `Sanctions ${s.result === "CLEAR" ? "cleared" : "match confirmed"} for ${s.name}`);
  return s;
});

// ── amend and cancel certificates (MAR-39) ──
const AMENDABLE = ["vesselImo", "sailingDate", "invoiceValue", "freight", "lc", "specialConditions"];

function amendTarget(id) {
  if (!hasRole(...UW)) fail(403, "You don't have permission for this action.");
  const c = db.certificates.find((x) => x.id === id) ?? fail(404, "Certificate not found");
  const latest = Math.max(...db.certificates.filter((x) => x.certNo === c.certNo).map((x) => x.version));
  if (c.version !== latest || !["ISSUED", "PENDING"].includes(certificateStatus(c))) fail(409, "Only the current version of an issued certificate can be changed.", { code: "WRONG_STATE" });
  return c;
}

on("post", "/certificates/:id/amend", ({ params, body }) => {
  const c = amendTarget(params.id);
  const policy = db.policies.find((p) => p.id === c.policyId);
  const before = c.snapshot ?? policy.snapshot;
  const changes = Object.fromEntries(AMENDABLE.filter((k) => body?.changes && k in body.changes).map((k) => [k, body.changes[k]]));
  const reason = String(body?.reason ?? "").trim();
  if (!body?.dryRun && reason.length < 10) invalid([{ field: "reason", message: "Give a reason of at least 10 characters" }]);
  const next = { ...before, ...changes, id: before.id };
  if (next.sailingDate && next.lc?.enabled && next.lc.expiry <= next.sailingDate) invalid([{ field: "lc.expiry", message: "LC expiry must be after the sailing date" }]);
  if (!(parseDecimal(next.invoiceValue) > 0n)) invalid([{ field: "invoiceValue", message: "Invoice value must be greater than 0" }]);
  const cover = before.openCoverId ? db.openCovers.find((x) => x.id === before.openCoverId) : null;
  const a = assess(next, { persist: false, agreedRatePct: cover?.commodities.find((x) => x.hsCode === next.hsCode)?.ratePct ?? null });
  const preview = {
    oldPremium: before.premium?.total,
    newPremium: a.premium.total,
    difference: toFixedString(add(a.premium.total, `-${before.premium?.total ?? "0"}`)),
    oldSumInsured: before.premium?.sumInsured?.total,
    newSumInsured: a.premium.sumInsured.total,
    screenings: a.checks.screenings.filter((s) => ["Vessel", "Owner or operator", "Bank"].includes(s.type)),
    referralReasons: a.status === "QUOTED" ? [] : a.referralReasons.length ? a.referralReasons : [{ code: "DECLINED", message: a.declineNote }],
  };
  if (body?.dryRun) return preview;
  if (preview.referralReasons.length) fail(409, "This change needs an underwriting referral first.", { code: "NEEDS_REFERRAL" });

  const snapshot = { ...next, premium: a.premium, fx: a.fx, checks: a.checks };
  const version = c.version + 1;
  c.status = "AMENDED";
  const cert = {
    id: nextId(db.certificates),
    certNo: c.certNo,
    version,
    status: "PENDING",
    policyId: c.policyId,
    token: crypto.randomUUID().replace(/-/g, ""),
    createdAt: nowIso(),
    issuedAt: null,
    events: [],
    snapshot,
    amendReason: reason,
  };
  db.certificates.push(cert);
  policy.snapshot = snapshot;
  policy.updatedAt = nowIso();
  audit("policy", policy.id, `Certificate ${c.certNo} amended to version ${version}: ${reason}`, before, snapshot);
  return { id: cert.id, certNo: cert.certNo, version };
});

on("post", "/certificates/:id/cancel", ({ params, body }) => {
  const c = amendTarget(params.id);
  const e = [];
  if (!["SHIPMENT_CANCELLED", "ISSUED_IN_ERROR", "REPLACED"].includes(body?.reason)) e.push({ field: "reason", message: "Pick a reason" });
  if (!String(body?.note ?? "").trim()) e.push({ field: "note", message: "A note is required" });
  if (e.length) invalid(e);
  if (db.claims.some((x) => x.certificateId === c.id && !["CLOSED", "DECLINED"].includes(x.status))) fail(409, "This certificate has an open claim.", { code: "OPEN_CLAIM" });
  const policy = db.policies.find((p) => p.id === c.policyId);
  c.status = "CANCELLED";
  c.cancelledAt = nowIso();
  c.cancelReason = body.reason;
  c.cancelNote = body.note;
  // Shipment never sailed or certificate issued in error: full premium back. Replaced: no refund.
  const premium = (c.snapshot ?? policy.snapshot).premium?.total ?? "0";
  policy.refund = { amount: body.reason === "REPLACED" ? "0.00" : premium, reason: body.reason, at: nowIso(), certNo: c.certNo };
  if (db.certificates.filter((x) => x.policyId === policy.id).every((x) => ["CANCELLED", "AMENDED"].includes(x.status))) policy.status = "CANCELLED";
  audit("policy", policy.id, `Certificate ${c.certNo} v${c.version} cancelled: ${body.note}`);
  return certificateView(c);
});

// ── rules admin (plan 6.7) ──
on("get", "/rules", () => db.rules);
on("put", "/rules/:section", ({ params, body }) => {
  if (!hasRole("ADMIN")) fail(403, "You don't have permission for this action.");
  const section = params.section;
  if (!["referral", "accumulation", "warranties", "authority", "inland", "deadlines"].includes(section)) fail(404, "Unknown rules section");
  const note = String(body?.note ?? "").trim();
  if (!note) invalid([{ field: "note", message: "Say what changed and why" }]);
  const data = body?.data;
  const e = [];
  if (section === "accumulation") {
    if (!(parseDecimal(data.softLimit) > 0n)) e.push({ field: "softLimit", message: "Soft limit must be greater than 0" });
    if (!gt(data.hardLimit, data.softLimit)) e.push({ field: "hardLimit", message: "Hard limit must be greater than the soft limit" });
  }
  if (section === "inland") {
    if (!(parseDecimal(data.perVehicle) > 0n)) e.push({ field: "perVehicle", message: "Per-vehicle limit must be greater than 0" });
    if (gt(data.perVehicle, data.perConvoy)) e.push({ field: "perConvoy", message: "Per-convoy limit can't be below the per-vehicle limit" });
  }
  if (section === "deadlines") data.forEach((d, i) => !(Number(d.days) > 0) && e.push({ field: `${i}.days`, message: `Row ${i + 1}: days must be greater than 0` }));
  if (section === "referral") data.forEach((r, i) => !String(r.name ?? "").trim() && e.push({ field: `${i}.name`, message: `Row ${i + 1}: name is required` }));
  if (e.length) invalid(e);
  db.rules[section] = data;
  db.rules.changes.push({ section, note, by: actor(), at: nowIso() });
  audit("rules", section, `Updated: ${note}`);
  return db.rules;
});

// ── dashboard and alerts bell (plan 6.1) ──
on("get", "/dashboard", () => {
  const me = actor();
  const widgets = {};
  const take = (rows) => ({ count: rows.length, rows: rows.slice(0, 5) });
  const today = todayIso();
  if (hasRole(...UW)) {
    const open = db.referrals.filter((r) => r.status === "OPEN").map(referralRow);
    widgets.myReferrals = take(open.filter((r) => r.assigneeName === me));
    widgets.unassignedReferrals = take(open.filter((r) => !r.assigneeName).sort((a, b) => a.raisedAt.localeCompare(b.raisedAt)));
  }
  if (hasRole("BROKER", "UNDERWRITER")) {
    const mine = (q) => !brokerOnly() || q.brokerId === caller.brokerPartyId;
    widgets.expiringQuotes = take(
      db.quotes
        .filter((q) => mine(q) && ["QUOTED", "APPROVED"].includes(q.status) && q.validUntil >= today && q.validUntil <= addDays(today, 5))
        .map((q) => ({ id: q.id, quoteNo: q.quoteNo, insured: partyRef(q.insuredId), validUntil: q.validUntil }))
    );
  }
  if (hasRole("FINANCE")) {
    const missing = FOREIGN_CURRENCIES.filter((c) => !db.fxRates.some((r) => r.currency === c && r.date === today));
    widgets.missingFx = { count: missing.length, rows: missing.map((c) => ({ currency: c })) };
  }
  if (hasRole("UNDERWRITER")) {
    widgets.lateDeclarations = take(
      db.quotes
        .filter((q) => q.openCoverId && q.late && q.status === "BOUND")
        .map((q) => ({ id: q.id, quoteNo: q.quoteNo, coverId: q.openCoverId, coverNo: db.openCovers.find((c) => c.id === q.openCoverId)?.coverNo, insured: partyRef(q.insuredId), sailingDate: q.sailingDate }))
    );
  }
  if (hasRole("CLAIMS_HANDLER", "CLAIMS_MANAGER")) {
    const due = db.deadlines
      .filter((d) => d.status === "OPEN" && d.dueDate <= addDays(today, 7))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .map((d) => ({ ...d, claimNo: db.claims.find((c) => c.id === d.claimId)?.claimNo }));
    widgets.deadlines = take(due);
  }
  if (brokerOnly()) {
    widgets.recentCertificates = take(
      db.certificates
        .filter((c) => (c.snapshot ?? db.policies.find((p) => p.id === c.policyId)?.snapshot)?.brokerId === caller.brokerPartyId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((c) => ({ id: c.id, certNo: c.certNo, version: c.version, status: certificateStatus(c), issuedAt: c.issuedAt }))
    );
  }
  const overdue = db.deadlines.filter((d) => d.status === "OPEN" && d.dueDate < today).length;
  const bell = (widgets.myReferrals?.count ?? 0) + (hasRole("CLAIMS_HANDLER", "CLAIMS_MANAGER") ? overdue : 0);
  save();
  return { widgets, bell };
});

