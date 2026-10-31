// Phase 3 of the mock backend (plan section 7): annual open covers with agreed rates and limits,
// per-shipment declarations (quotes carrying openCoverId), and the year-end adjustment.
import {
  db, fail, invalid, nowIso, year, nextNo, lc, listParam, actor, audit, page, partyRef, commodityRef, quoteView, on,
  hasRole, brokerOnly, caller, coverUsed, nextId, certificateStatus, pickQuote,
} from "./core";
import { todayIso } from "../utils/format";
import { parseDecimal, toFixedString } from "../utils/money";

const UW = ["UNDERWRITER", "SENIOR_UNDERWRITER"];
const gt = (a, b) => (parseDecimal(a) ?? 0n) > (parseDecimal(b) ?? 0n);
const mine = (c) => !brokerOnly() || c.brokerId === caller.brokerPartyId;

function coverStatus(c) {
  if (c.adjustment) return "ADJUSTED";
  return c.periodTo < todayIso() ? "EXPIRED" : "ACTIVE";
}

function declarations(c) {
  return db.quotes
    .filter((q) => q.openCoverId === c.id && q.status !== "DRAFT")
    .map((q) => {
      const policy = q.policyId ? db.policies.find((p) => p.id === q.policyId) : null;
      const cert = policy ? db.certificates.filter((x) => x.policyId === policy.id).sort((a, b) => b.version - a.version)[0] : null;
      return {
        quoteId: q.id,
        quoteNo: q.quoteNo,
        policyId: policy?.id ?? null,
        policyNo: policy?.policyNo ?? null,
        certificateId: cert?.id ?? null,
        certNo: cert?.certNo ?? null,
        sailingDate: q.sailingDate,
        declaredAt: q.createdAt,
        vessel: q.vesselImo ? db.vessels.find((v) => v.imo === q.vesselImo)?.name : q.inland?.truckPlate ?? null,
        commodity: commodityRef(q.hsCode),
        sumInsured: q.premium?.sumInsured?.total ?? null,
        premium: q.premium?.total ?? null,
        late: !!q.late,
        status: cert ? certificateStatus(cert) : q.status,
      };
    })
    .sort((a, b) => b.declaredAt.localeCompare(a.declaredAt));
}

export function coverView(c) {
  const used = coverUsed(c);
  const decl = declarations(c);
  const annual = parseDecimal(c.annualLimit) ?? 1n;
  return {
    ...c,
    status: coverStatus(c),
    insured: partyRef(c.insuredId),
    broker: partyRef(c.brokerId),
    commodities: c.commodities.map((x) => ({ ...x, commodity: commodityRef(x.hsCode) })),
    used: toFixedString(used),
    remaining: toFixedString(annual - used),
    usedPct: Number((used * 10000n) / annual) / 100,
    declarationCount: decl.filter((d) => d.policyId).length,
    lateCount: decl.filter((d) => d.policyId && d.late).length,
  };
}

/** Same open-cover record shaped for the Policies list (no duplicate policy row). */
export function openCoverAsPolicy(c) {
  const view = coverView(c);
  return {
    id: `oc-${c.id}`,
    policyNo: c.masterPolicyNo || c.coverNo,
    coverNo: c.coverNo,
    policyType: "OPEN_COVER",
    product: "OPEN_COVER",
    status: view.status,
    periodFrom: c.periodFrom,
    periodTo: c.periodTo,
    insuredId: c.insuredId,
    insured: view.insured,
    brokerId: c.brokerId,
    openCoverId: c.id,
    openCover: { id: c.id, coverNo: c.coverNo },
    currency: c.currency || "ETB",
    sumInsuredTotal: c.annualLimit,
    premiumTotal: null,
    certificates: [],
    createdAt: c.createdAt,
    createdBy: c.createdBy,
  };
}

export function listPoliciesWithOpenCovers(query, { mine: isMine, policyView, page: pageFn, lc: lower, listParam: statusesOf, inRange: range }) {
  const q = lower(query.q);
  const statuses = statusesOf(query.status);
  const type = query.policyType || query.product || "";
  let shipments = db.policies.filter((p) => isMine(p.snapshot.brokerId)).map(policyView)
    .map((p) => ({ ...p, policyType: "SINGLE_SHIPMENT", sumInsuredTotal: p.premium?.sumInsured?.total ?? p.sumInsuredTotal, premiumTotal: p.premium?.total ?? p.premiumTotal }));
  let covers = db.openCovers.filter((c) => isMine(c.brokerId)).map(openCoverAsPolicy);
  if (q) {
    shipments = shipments.filter((p) => lower(`${p.policyNo} ${p.insured?.name} ${p.vesselImo}`).includes(q));
    covers = covers.filter((p) => lower(`${p.policyNo} ${p.coverNo} ${p.insured?.name}`).includes(q));
  }
  if (statuses.length) {
    shipments = shipments.filter((p) => statuses.includes(p.status));
    covers = covers.filter((p) => statuses.includes(p.status));
  }
  shipments = shipments.filter((p) => range(p.periodFrom, query.periodFrom, query.periodTo));
  covers = covers.filter((p) => range(p.periodFrom, query.periodFrom, query.periodTo));
  let items;
  if (type === "OPEN_COVER") items = covers;
  else if (type === "SINGLE_SHIPMENT" || type === "INLAND_TRANSIT" || type === "HULL") {
    items = type === "SINGLE_SHIPMENT" ? shipments : shipments.filter((p) => p.product === type);
  } else items = [...shipments, ...covers];
  return pageFn(items, query);
}

export function getPolicyIncludingOpenCover(id, { mine: isMine, ownPolicy, policyView, fail: failFn }) {
  if (String(id).startsWith("oc-")) {
    const coverId = String(id).slice(3);
    const cover = db.openCovers.find((c) => c.id === coverId) ?? failFn(404, "Policy not found");
    if (!isMine(cover.brokerId)) failFn(404, "Policy not found");
    return openCoverAsPolicy(cover);
  }
  return policyView(ownPolicy(db.policies.find((p) => p.id === id) ?? failFn(404, "Policy not found")));
}

function coverErrors(b) {
  const e = [];
  if (!b.insuredId) e.push({ field: "insured", message: "Insured is required" });
  if (!b.periodFrom) e.push({ field: "periodFrom", message: "Period from is required" });
  if (!b.periodTo) e.push({ field: "periodTo", message: "Period to is required" });
  else if (b.periodFrom && b.periodTo <= b.periodFrom) e.push({ field: "periodTo", message: "Period to must be after period from" });
  if (!(parseDecimal(b.annualLimit) > 0n)) e.push({ field: "annualLimit", message: "Annual limit must be greater than 0" });
  if (!(parseDecimal(b.perConveyanceLimit) > 0n)) e.push({ field: "perConveyanceLimit", message: "Per-conveyance limit must be greater than 0" });
  else if (gt(b.perConveyanceLimit, b.annualLimit)) e.push({ field: "perConveyanceLimit", message: "Per-conveyance limit can't be above the annual limit" });
  const days = Number(b.declarationDays);
  if (!(Number.isInteger(days) && days >= 1 && days <= 60)) e.push({ field: "declarationDays", message: "Declaration days must be 1 to 60" });
  if (!["ICC_A", "ICC_B", "ICC_C"].includes(b.clause)) e.push({ field: "clause", message: "Pick a default clause" });
  const list = b.commodities ?? [];
  if (!list.length) e.push({ field: "commodities", message: "Add at least one commodity" });
  const seen = new Set();
  list.forEach((r, i) => {
    if (!r.hsCode) e.push({ field: `commodities.${i}.hsCode`, message: `Row ${i + 1}: pick a commodity` });
    else if (seen.has(r.hsCode)) e.push({ field: `commodities.${i}.hsCode`, message: `Row ${i + 1}: this commodity is already listed` });
    seen.add(r.hsCode);
    if (!(parseDecimal(r.ratePct) > 0n)) e.push({ field: `commodities.${i}.ratePct`, message: `Row ${i + 1}: rate must be greater than 0` });
  });
  if (parseDecimal(b.provisionalPremium) === null || parseDecimal(b.provisionalPremium) < 0n) e.push({ field: "provisionalPremium", message: "Provisional premium must be 0 or more" });
  return e;
}

const FIELDS = ["insuredId", "brokerId", "periodFrom", "periodTo", "currency", "annualLimit", "perConveyanceLimit", "declarationDays", "clause", "warCover", "strikesCover", "commodities", "provisionalPremium"];
const pick = (b) => Object.fromEntries(FIELDS.filter((k) => k in b).map((k) => [k, b[k]]));

on("post", "/quotes/:id/bind-open-cover", ({ params, body }) => {
  if (!hasRole(...UW)) fail(403, "You don't have permission for this action.");
  const q = db.quotes.find((x) => x.id === params.id) ?? fail(404, "Quote not found");
  if (!mine(q)) fail(404, "Quote not found");
  if (q.arrangement !== "OPEN_COVER") {
    invalid([{ field: "arrangement", message: "Only an Open Cover quotation can issue an Open Cover policy." }]);
  }
  if (q.status === "BOUND" || q.issuedOpenCoverId) fail(409, "This quotation has already issued an Open Cover policy.", { code: "WRONG_STATE" });
  if (q.status === "DECLINED") fail(409, "A declined quotation cannot issue an Open Cover policy.", { code: "WRONG_STATE" });
  const e = coverErrors({ ...body, insuredId: body.insuredId || q.insuredId });
  if (e.length) invalid(e);
  const id = nextId(db.openCovers);
  const seq = ++db.seq.openCover;
  const c = {
    id,
    coverNo: `OC-${year()}-${String(seq).padStart(5, "0")}`,
    masterPolicyNo: `MP-${year()}-${String(seq).padStart(5, "0")}`,
    status: "ACTIVE",
    ...pick(body),
    insuredId: q.insuredId,
    brokerId: q.brokerId,
    declarationDays: Number(body.declarationDays),
    currency: body.currency || q.currency || "ETB",
    commodities: body.commodities,
    adjustment: null,
    createdBy: actor(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.openCovers.push(c);
  q.status = "BOUND";
  q.issuedOpenCoverId = c.id;
  q.updatedAt = nowIso();
  audit("quote", q.id, `Open Cover policy issued ${c.coverNo}`);
  audit("openCover", c.id, `Issued from ${q.quoteNo}`);
  return { quote: quoteView(q), openCover: { id: c.id, coverNo: c.coverNo } };
});

on("get", "/open-covers", ({ query }) => {
  const q = lc(query.q);
  const statuses = listParam(query.status);
  let items = db.openCovers.filter(mine).map(coverView);
  if (q) items = items.filter((c) => lc(`${c.coverNo} ${c.insured?.name}`).includes(q));
  if (statuses.length) items = items.filter((c) => statuses.includes(c.status));
  if (query.brokerId) items = items.filter((c) => c.brokerId === query.brokerId);
  if (query.activeOn) items = items.filter((c) => c.periodFrom <= query.activeOn && c.periodTo >= query.activeOn);
  return page(items, query);
});

on("get", "/open-covers/:id", ({ params }) => {
  const c = db.openCovers.find((x) => x.id === params.id) ?? fail(404, "Open cover not found");
  if (!mine(c)) fail(404, "Open cover not found");
  return { ...coverView(c), declarations: declarations(c), masterPolicyNo: c.masterPolicyNo ?? `MP-${c.coverNo.slice(3)}` };
});

on("post", "/open-covers", ({ body }) => {
  if (!hasRole(...UW)) fail(403, "You don't have permission for this action.");
  const e = coverErrors(body);
  if (e.length) invalid(e);
  const id = nextId(db.openCovers);
  const seq = ++db.seq.openCover;
  const c = {
    id,
    coverNo: `OC-${year()}-${String(seq).padStart(5, "0")}`,
    masterPolicyNo: `MP-${year()}-${String(seq).padStart(5, "0")}`,
    ...pick(body),
    declarationDays: Number(body.declarationDays),
    currency: body.currency || "USD",
    adjustment: null,
    createdBy: actor(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.openCovers.push(c);
  audit("openCover", c.id, `Created with master policy ${c.masterPolicyNo}`);
  return coverView(c);
});

on("put", "/open-covers/:id", ({ params, body }) => {
  if (!hasRole(...UW)) fail(403, "You don't have permission for this action.");
  const c = db.openCovers.find((x) => x.id === params.id) ?? fail(404, "Open cover not found");
  if (c.adjustment) fail(409, "An adjusted cover can't be changed.", { code: "WRONG_STATE" });
  const e = coverErrors({ ...c, ...body });
  if (e.length) invalid(e);
  const before = structuredClone(c);
  Object.assign(c, pick(body), { declarationDays: Number(body.declarationDays ?? c.declarationDays), updatedAt: nowIso() });
  audit("openCover", c.id, "Updated", before, c);
  return coverView(c);
});

/** Declarations always carry the cover's insured, broker, currency and terms (plan 7.4). */
export function lockToCover(q) {
  const c = db.openCovers.find((x) => x.id === q.openCoverId);
  if (!c) return q;
  return Object.assign(q, {
    product: "SINGLE_SHIPMENT",
    insuredId: c.insuredId,
    brokerId: c.brokerId,
    currency: c.currency,
    clause: c.clause,
    warCover: !!c.warCover,
    strikesCover: !!c.strikesCover,
  });
}

on("post", "/open-covers/:id/declarations", ({ params, body }) => {
  if (!hasRole("BROKER", ...UW)) fail(403, "You don't have permission for this action.");
  const c = db.openCovers.find((x) => x.id === params.id) ?? fail(404, "Open cover not found");
  if (!mine(c)) fail(404, "Open cover not found");
  if (coverStatus(c) !== "ACTIVE") fail(409, "Declarations can only be made while the cover is active.", { code: "WRONG_STATE" });
  const q = lockToCover({
    id: nextId(db.quotes),
    quoteNo: nextNo("Q", "quote"),
    status: "DRAFT",
    ...pickQuote(body),
    openCoverId: c.id,
    createdBy: actor(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  db.quotes.push(q);
  audit("quote", q.id, `Declaration started on ${c.coverNo}`);
  audit("openCover", c.id, `Declaration ${q.quoteNo} started`);
  return quoteView(q);
});

// ── year-end adjustment (MAR-04) ──
function statement(c) {
  const bound = declarations(c).filter((d) => d.policyId && d.status !== "CANCELLED");
  const earned = bound.reduce((sum, d) => sum + (parseDecimal(d.premium) ?? 0n), 0n);
  const provisional = parseDecimal(c.provisionalPremium) ?? 0n;
  const diff = earned - provisional;
  return {
    declarationCount: bound.length,
    totalSumInsured: toFixedString(bound.reduce((sum, d) => sum + (parseDecimal(d.sumInsured) ?? 0n), 0n)),
    currency: c.currency,
    earnedPremium: toFixedString(earned),
    provisionalPremium: toFixedString(provisional),
    difference: toFixedString(diff < 0n ? -diff : diff),
    direction: diff >= 0n ? "DUE_FROM_INSURED" : "REFUND_TO_INSURED",
  };
}

on("post", "/open-covers/:id/adjustment", ({ params, body }) => {
  if (!hasRole("FINANCE")) fail(403, "You don't have permission for this action.");
  const c = db.openCovers.find((x) => x.id === params.id) ?? fail(404, "Open cover not found");
  if (c.adjustment) fail(409, "Already adjusted.", { code: "ALREADY_ADJUSTED" });
  if (c.periodTo >= todayIso()) fail(409, "The cover period hasn't ended yet.", { code: "PERIOD_OPEN" });
  const s = statement(c);
  if (body?.dryRun) return s;
  c.adjustment = { ...s, postedAt: nowIso(), postedBy: actor(), exportRef: `ACC-${year()}-${c.coverNo.slice(-5)}` };
  c.updatedAt = nowIso();
  audit("openCover", c.id, `Year-end adjustment posted: ${s.direction === "DUE_FROM_INSURED" ? "due from insured" : "refund to insured"} ETB ${s.difference}`);
  return coverView(c);
});

