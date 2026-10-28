// Shared state and helpers of the mock backend: the database (localStorage), errors, paging,
// the record views every module returns, and the route table the adapter in server.js serves.
import { createSeed } from "./seed";
import { addDays, todayIso } from "../utils/format";
import { isValidImo, vesselAge } from "../utils/imo";
import { parseDecimal, sumInsured, toFixedString } from "../utils/money";
import { PAGE_SIZE } from "../constants";

const KEY = "marine.mockdb.v1";
export let db = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      // Data saved by an earlier version keeps its records and gains any newer tables
      const saved = JSON.parse(raw);
      const fresh = createSeed();
      return { ...fresh, ...saved, seq: { ...fresh.seq, ...saved.seq }, rules: { ...fresh.rules, ...saved.rules } };
    }
  } catch {
    /* fall through to a fresh seed */
  }
  return createSeed();
}
export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage full or blocked: keep working in memory */
  }
}
export function resetMockDb() {
  db = createSeed();
  save();
}

// ── helpers ──
export class HttpError extends Error {
  constructor(status, message, { code = "", fields = [] } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
export const fail = (status, message, opts) => {
  throw new HttpError(status, message, opts);
};
export const invalid = (fields) => fail(422, "Some fields need attention.", { code: "VALIDATION", fields });
export const nowIso = () => new Date().toISOString();
export const year = () => new Date().getFullYear();
export const nextNo = (prefix, key) => `${prefix}-${year()}-${String(++db.seq[key]).padStart(5, "0")}`;
export const lc = (v) => String(v ?? "").toLowerCase();
export const listParam = (v) => (Array.isArray(v) ? v : String(v ?? "").split(",")).filter(Boolean);

export function actor() {
  if (caller.user) return caller.user;
  try {
    const raw = JSON.parse(localStorage.getItem("userDetail") || "null");
    const u = raw?.user ?? raw;
    return [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.name || u?.email || "You";
  } catch {
    return "You";
  }
}

export function audit(entity, id, action, before, after) {
  const changes = [];
  if (before && after) {
    for (const k of Object.keys(after)) {
      if (["updatedAt", "createdAt", "premium", "referralReasons", "fx"].includes(k)) continue;
      const a = JSON.stringify(before[k] ?? null);
      const b = JSON.stringify(after[k] ?? null);
      if (a !== b) changes.push({ field: k, before: before[k] ?? null, after: after[k] ?? null });
    }
  }
  db.audit.push({ id: String(db.seq.audit++), entity, entityId: String(id), action, by: actor(), at: nowIso(), changes });
}

export function page(items, query, { sortDefault = "updatedAt,desc" } = {}) {
  const [field, dir] = String(query.sort || sortDefault).split(",");
  const sorted = [...items].sort((a, b) => {
    const x = a[field] ?? "";
    const y = b[field] ?? "";
    const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true });
    return dir === "asc" ? c : -c;
  });
  const size = Number(query.size) || PAGE_SIZE;
  const p = Math.max(0, Number(query.page) || 0);
  return { content: sorted.slice(p * size, p * size + size), page: p, size, totalElements: sorted.length };
}

export function inRange(value, from, to) {
  const v = String(value ?? "").slice(0, 10);
  if (from && v < from) return false;
  if (to && v > to) return false;
  return true;
}

export const partyRef = (id) => {
  const p = db.parties.find((x) => x.id === String(id));
  return p ? { id: p.id, name: p.name, email: p.email, phone: p.phone } : null;
};
export const portRef = (code) => {
  const p = db.ports.find((x) => x.code === code);
  return p ? { code: p.code, name: p.name, country: p.country } : code ? { code, name: code, country: "" } : null;
};
export const vesselRef = (imo) => {
  const v = db.vessels.find((x) => x.imo === imo);
  return v ? { ...v, age: vesselAge(v.yearBuilt) } : null;
};
export const commodityRef = (hs) => db.commodities.find((c) => c.hsCode === hs) ?? null;

export function activeTable(product = "SINGLE_SHIPMENT") {
  return db.rateTables.find((t) => t.status === "ACTIVE" && t.product === product) ?? db.rateTables.find((t) => t.status === "ACTIVE");
}

/** Today's rate, or the latest earlier one flagged as a fallback (MAR-25). */
export function fxFor(currency, date = todayIso()) {
  if (currency === "ETB") return { currency, rate: "1", date, fallback: false };
  const rows = db.fxRates.filter((r) => r.currency === currency && r.date <= date).sort((a, b) => b.date.localeCompare(a.date));
  if (!rows.length) return null;
  return { currency, rate: rows[0].rate, date: rows[0].date, fallback: rows[0].date !== date };
}

// ── quotes ──
export function refreshQuoteStatus(q) {
  if (["QUOTED", "APPROVED"].includes(q.status) && q.validUntil && q.validUntil < todayIso()) q.status = "EXPIRED";
  return q;
}

export function quoteView(q) {
  refreshQuoteStatus(q);
  return {
    ...q,
    insured: partyRef(q.insuredId),
    consignee: partyRef(q.consigneeId),
    broker: partyRef(q.brokerId),
    vessel: vesselRef(q.vesselImo),
    loadingPort: portRef(q.portOfLoading),
    dischargePort: portRef(q.portOfDischarge),
    transshipments: (q.transshipmentPorts ?? []).map(portRef),
    inlandFrom: q.inland?.from ? portRef(q.inland.from) : null,
    inlandTo: q.inland?.to ? portRef(q.inland.to) : null,
    commodity: commodityRef(q.hsCode),
    lcBank: q.lc?.enabled ? partyRef(q.lc.bankId) : null,
    policy: q.policyId ? (({ id, policyNo }) => ({ id, policyNo }))(db.policies.find((p) => p.id === q.policyId) ?? {}) : null,
    openCover: q.openCoverId ? (({ id, coverNo }) => ({ id, coverNo }))(db.openCovers.find((c) => c.id === q.openCoverId) ?? {}) : null,
    referral: (({ id, status, assigneeName, authorityNeeded, note } = {}) => (id ? { id, status, assigneeName, authorityNeeded, note } : null))(
      [...db.referrals].reverse().find((r) => r.quoteId === q.id)
    ),
    // Brokers see "Under review by underwriting" without the reasons or screening (plan 7.7, question 5)
    ...(brokerOnly() ? { referralReasons: q.status === "REFERRED" ? [] : q.referralReasons, checks: null, underReview: q.status === "REFERRED" } : {}),
  };
}

export const QUOTE_FIELDS = [
  "product", "insuredId", "insuredRole", "consigneeId", "brokerId", "incoterm", "mode", "vesselImo", "portOfLoading",
  "transshipmentPorts", "portOfDischarge", "finalDestination", "sailingDate", "hsCode", "goodsDescription", "packing",
  "currency", "invoiceValue", "freight", "invoiceNo", "blNo", "containers", "clause", "warCover", "strikesCover",
  "deductible", "specialConditions", "lc", "inland", "openCoverId",
];
export const pickQuote = (body) => Object.fromEntries(QUOTE_FIELDS.filter((k) => k in body).map((k) => [k, body[k]]));

export function quoteErrors(q) {
  const e = [];
  const req = (field, label) => (q[field] === undefined || q[field] === null || q[field] === "") && e.push({ field, message: `${label} is required` });
  req("product", "Product");
  req("insuredId", "Insured");
  req("insuredRole", "Insured is the buyer or seller");
  req("incoterm", "Incoterm");
  const inlandOnly = q.product === "INLAND_TRANSIT";
  if (!inlandOnly) req("mode", "Mode of conveyance");
  if (!inlandOnly && q.mode !== "AIR") {
    if (!q.vesselImo) e.push({ field: "vesselImo", message: "Vessel is required for sea shipments" });
    else if (!isValidImo(q.vesselImo)) e.push({ field: "vesselImo", message: "This IMO number's check digit is wrong" });
  }
  if (!inlandOnly) {
    req("portOfLoading", "Port of loading");
    req("portOfDischarge", "Port of discharge");
    if (q.portOfLoading && q.portOfLoading === q.portOfDischarge) e.push({ field: "portOfDischarge", message: "Port of discharge must differ from the port of loading" });
    req("finalDestination", "Final destination");
  }
  if (inlandOnly || q.mode === "SEA_ROAD") {
    if (!q.inland?.from) e.push({ field: "inland.from", message: "Inland leg start is required" });
    if (!q.inland?.to) e.push({ field: "inland.to", message: "Dry port is required" });
    if (!String(q.inland?.truckPlate ?? "").trim()) e.push({ field: "inland.truckPlate", message: "Truck plate is required" });
    if (!String(q.inland?.driverName ?? "").trim()) e.push({ field: "inland.driverName", message: "Driver name is required" });
  }
  req("sailingDate", "Sailing date");
  req("hsCode", "Commodity");
  if (q.hsCode && !commodityRef(q.hsCode)) e.push({ field: "hsCode", message: "Commodity is not in the master list" });
  req("goodsDescription", "Goods description");
  if (!(parseDecimal(q.invoiceValue) > 0n)) e.push({ field: "invoiceValue", message: "Invoice value must be greater than 0" });
  if (parseDecimal(q.freight) === null || parseDecimal(q.freight) < 0n) e.push({ field: "freight", message: "Freight must be 0 or more" });
  req("clause", "Clause");
  if (q.lc?.enabled) {
    if (!q.lc.number) e.push({ field: "lc.number", message: "LC number is required" });
    if (!q.lc.bankId) e.push({ field: "lc.bankId", message: "Issuing bank is required" });
    if (!(parseDecimal(q.lc.amount) > 0n)) e.push({ field: "lc.amount", message: "LC amount must be greater than 0" });
    if (!q.lc.expiry) e.push({ field: "lc.expiry", message: "LC expiry is required" });
    else if (q.sailingDate && q.lc.expiry <= q.sailingDate) e.push({ field: "lc.expiry", message: "LC expiry must be after the sailing date" });
  }
  return e;
}

export function editableQuote(id) {
  const q = db.quotes.find((x) => x.id === id) ?? fail(404, "Quote not found");
  refreshQuoteStatus(q);
  if (!["DRAFT", "QUOTED", "DECLINED", "REFERRED"].includes(q.status)) fail(409, `A ${lc(q.status)} quote can't be changed.`, { code: "WRONG_STATE" });
  return q;
}

// ── policies and certificates ──
export function certificateStatus(c) {
  // Generation takes a few seconds on the real backend; the mock issues it 6 s after binding
  if (c.status === "PENDING" && Date.now() - new Date(c.createdAt).getTime() > 6000) {
    c.status = "ISSUED";
    c.issuedAt = new Date(new Date(c.createdAt).getTime() + 6000).toISOString();
    save();
  }
  const policy = db.policies.find((p) => p.id === c.policyId);
  if (c.status === "ISSUED" && policy?.periodTo < todayIso()) return "EXPIRED";
  return c.status;
}

export function certificateView(c) {
  const policy = db.policies.find((p) => p.id === c.policyId);
  const q = c.snapshot ?? policy?.snapshot ?? {};
  const { snapshot, ...cert } = c;
  return {
    ...cert,
    product: q.product,
    mode: q.mode,
    inland: q.inland ? { ...q.inland, fromName: portRef(q.inland.from)?.name, toName: portRef(q.inland.to)?.name } : null,
    clause: q.clause,
    openCover: q.openCoverId ? (({ id, coverNo }) => ({ id, coverNo }))(db.openCovers.find((x) => x.id === q.openCoverId) ?? {}) : null,
    hasOpenClaim: db.claims.some((x) => x.certificateId === c.id && !["CLOSED", "DECLINED"].includes(x.status)),
    status: certificateStatus(c),
    policy: policy ? { id: policy.id, policyNo: policy.policyNo, periodFrom: policy.periodFrom, periodTo: policy.periodTo } : null,
    insured: partyRef(q.insuredId),
    vessel: vesselRef(q.vesselImo),
    loadingPort: portRef(q.portOfLoading),
    dischargePort: portRef(q.portOfDischarge),
    finalDestination: q.finalDestination,
    sailingDate: q.sailingDate,
    blNo: q.blNo,
    lcBank: q.lc?.enabled ? partyRef(q.lc.bankId) : null,
    goodsDescription: q.goodsDescription,
    currency: q.currency,
    sumInsured: q.premium?.sumInsured?.total,
    premiumTotal: q.premium?.total,
    emails: [partyRef(q.insuredId)?.email, partyRef(q.brokerId)?.email, q.lc?.enabled ? partyRef(q.lc.bankId)?.email : null].filter(Boolean),
    versions: db.certificates
      .filter((x) => x.policyId === c.policyId && x.certNo === c.certNo)
      .map((x) => ({ id: x.id, version: x.version, status: certificateStatus(x), issuedAt: x.issuedAt })),
  };
}

export function policyView(p) {
  const status = p.status === "ACTIVE" && p.periodTo < todayIso() ? "EXPIRED" : p.status;
  const { snapshot, ...policy } = p;
  return {
    ...quoteView({ ...snapshot }),
    ...policy,
    status,
    quoteId: snapshot.id,
    quoteNo: snapshot.quoteNo,
    certificates: db.certificates
      .filter((c) => c.policyId === p.id)
      .map((c) => ({ id: c.id, certNo: c.certNo, version: c.version, status: certificateStatus(c), issuedAt: c.issuedAt })),
  };
}

// ── routes ──
export const routes = [];
export const on = (method, pattern, handler) => {
  const keys = [];
  const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)"))}$`);
  routes.push({ method, re, keys, handler });
};

/** Who is calling: set by the adapter per request from the dev headers the marine client adds. */
export const caller = { roles: [], user: "", brokerPartyId: null };
export const hasRole = (...roles) => roles.some((r) => caller.roles.includes(r));
/** A broker with no internal role only sees their own business (plan 7.7). */
export const brokerOnly = () => caller.roles.length > 0 && caller.roles.every((r) => r === "BROKER");

/** Next numeric id in a table (ids are strings of integers). */
export const nextId = (list) => String(list.reduce((max, x) => Math.max(max, Number(x.id) || 0), 0) + 1);

/** Sum insured already declared (bound) on an open cover, in the cover's currency. */
export function coverUsed(cover, exceptQuoteId = null) {
  return db.quotes
    .filter((q) => q.openCoverId === cover.id && q.status === "BOUND" && q.id !== exceptQuoteId)
    .filter((q) => !db.certificates.some((c) => db.policies.find((p) => p.id === c.policyId)?.snapshot.id === q.id && c.status === "CANCELLED"))
    .reduce((sum, q) => sum + (parseDecimal(q.premium?.sumInsured?.total) ?? 0n), 0n);
}

/**
 * Declaration on an open cover (plan 7.4, MAR-03, MAR-05): the agreed rate, the late flag and the
 * limits before and after this shipment. Going over the per-conveyance limit or the balance refers.
 */
export function declarationContext(q) {
  const cover = q.openCoverId ? db.openCovers.find((c) => c.id === q.openCoverId) : null;
  if (!cover) return { agreedRatePct: null, extraReasons: [], late: false, limits: null };
  const agreed = cover.commodities.find((c) => c.hsCode === q.hsCode)?.ratePct ?? null;
  const si = parseDecimal(sumInsured(q.invoiceValue || "0", q.freight || "0", "10").total) ?? 0n;
  const used = coverUsed(cover, q.id);
  const annual = parseDecimal(cover.annualLimit) ?? 0n;
  const reasons = [];
  if (!agreed) reasons.push({ code: "DECLARATION_LIMIT", message: "This commodity is not on the open cover's list." });
  if (si > (parseDecimal(cover.perConveyanceLimit) ?? 0n)) reasons.push({ code: "DECLARATION_LIMIT", message: `Sum insured is over the per-conveyance limit of ${cover.currency} ${Number(cover.perConveyanceLimit).toLocaleString("en")}.` });
  if (used + si > annual) reasons.push({ code: "DECLARATION_LIMIT", message: "Sum insured is more than the cover's remaining balance." });
  const late = !!q.sailingDate && q.sailingDate < addDays(todayIso(), -Number(cover.declarationDays));
  return {
    agreedRatePct: agreed,
    extraReasons: reasons,
    late,
    limits: {
      currency: cover.currency,
      annualLimit: cover.annualLimit,
      perConveyanceLimit: cover.perConveyanceLimit,
      remainingBefore: toFixedString(annual - used),
      thisDeclaration: toFixedString(si),
      remainingAfter: toFixedString(annual - used - si),
    },
  };
}
