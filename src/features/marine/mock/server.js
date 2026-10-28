// In-browser mock of the Marine & Cargo backend (plan: "MSW handlers double as a local mock
// backend"). It plugs in as the axios adapter of the marine client, answers every phase 0 and 1
// endpoint, and keeps its data in localStorage so records survive a reload.
// Reset it from the browser console with: localStorage.removeItem("marine.mockdb.v1")
import { AxiosError } from "axios";
import { createSeed } from "./seed";
import { rate } from "./rating";
import { buildCertificatePdf } from "./pdf";
import { addDays, todayIso } from "../utils/format";
import { isValidImo, vesselAge } from "../utils/imo";
import { normalizeAmount, parseDecimal } from "../utils/money";
import { parseFxCsv } from "../utils/fxCsv";
import { validateRateTable } from "../utils/rateTable";
import { FOREIGN_CURRENCIES, PAGE_SIZE } from "../constants";

const KEY = "marine.mockdb.v1";
let db = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fall through to a fresh seed */
  }
  return createSeed();
}
function save() {
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
class HttpError extends Error {
  constructor(status, message, { code = "", fields = [] } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
const fail = (status, message, opts) => {
  throw new HttpError(status, message, opts);
};
const invalid = (fields) => fail(422, "Some fields need attention.", { code: "VALIDATION", fields });
const nowIso = () => new Date().toISOString();
const year = () => new Date().getFullYear();
const nextNo = (prefix, key) => `${prefix}-${year()}-${String(++db.seq[key]).padStart(5, "0")}`;
const lc = (v) => String(v ?? "").toLowerCase();
const listParam = (v) => (Array.isArray(v) ? v : String(v ?? "").split(",")).filter(Boolean);

function actor() {
  try {
    const raw = JSON.parse(localStorage.getItem("userDetail") || "null");
    const u = raw?.user ?? raw;
    return [u?.firstName, u?.lastName].filter(Boolean).join(" ") || u?.name || u?.email || "You";
  } catch {
    return "You";
  }
}

function audit(entity, id, action, before, after) {
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

function page(items, query, { sortDefault = "updatedAt,desc" } = {}) {
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

function inRange(value, from, to) {
  const v = String(value ?? "").slice(0, 10);
  if (from && v < from) return false;
  if (to && v > to) return false;
  return true;
}

const partyRef = (id) => {
  const p = db.parties.find((x) => x.id === String(id));
  return p ? { id: p.id, name: p.name, email: p.email, phone: p.phone } : null;
};
const portRef = (code) => {
  const p = db.ports.find((x) => x.code === code);
  return p ? { code: p.code, name: p.name, country: p.country } : code ? { code, name: code, country: "" } : null;
};
const vesselRef = (imo) => {
  const v = db.vessels.find((x) => x.imo === imo);
  return v ? { ...v, age: vesselAge(v.yearBuilt) } : null;
};
const commodityRef = (hs) => db.commodities.find((c) => c.hsCode === hs) ?? null;

function activeTable(product = "SINGLE_SHIPMENT") {
  return db.rateTables.find((t) => t.status === "ACTIVE" && t.product === product) ?? db.rateTables.find((t) => t.status === "ACTIVE");
}

/** Today's rate, or the latest earlier one flagged as a fallback (MAR-25). */
function fxFor(currency, date = todayIso()) {
  if (currency === "ETB") return { currency, rate: "1", date, fallback: false };
  const rows = db.fxRates.filter((r) => r.currency === currency && r.date <= date).sort((a, b) => b.date.localeCompare(a.date));
  if (!rows.length) return null;
  return { currency, rate: rows[0].rate, date: rows[0].date, fallback: rows[0].date !== date };
}

// ── quotes ──
function refreshQuoteStatus(q) {
  if (["QUOTED", "APPROVED"].includes(q.status) && q.validUntil && q.validUntil < todayIso()) q.status = "EXPIRED";
  return q;
}

function quoteView(q) {
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
    commodity: commodityRef(q.hsCode),
    lcBank: q.lc?.enabled ? partyRef(q.lc.bankId) : null,
    policy: q.policyId ? (({ id, policyNo }) => ({ id, policyNo }))(db.policies.find((p) => p.id === q.policyId) ?? {}) : null,
  };
}

const QUOTE_FIELDS = [
  "product", "insuredId", "insuredRole", "consigneeId", "brokerId", "incoterm", "mode", "vesselImo", "portOfLoading",
  "transshipmentPorts", "portOfDischarge", "finalDestination", "sailingDate", "hsCode", "goodsDescription", "packing",
  "currency", "invoiceValue", "freight", "invoiceNo", "blNo", "containers", "clause", "warCover", "strikesCover",
  "deductible", "specialConditions", "lc",
];
const pickQuote = (body) => Object.fromEntries(QUOTE_FIELDS.filter((k) => k in body).map((k) => [k, body[k]]));

function quoteErrors(q) {
  const e = [];
  const req = (field, label) => (q[field] === undefined || q[field] === null || q[field] === "") && e.push({ field, message: `${label} is required` });
  req("product", "Product");
  req("insuredId", "Insured");
  req("insuredRole", "Insured is the buyer or seller");
  req("incoterm", "Incoterm");
  req("mode", "Mode of conveyance");
  if (q.mode !== "AIR") {
    if (!q.vesselImo) e.push({ field: "vesselImo", message: "Vessel is required for sea shipments" });
    else if (!isValidImo(q.vesselImo)) e.push({ field: "vesselImo", message: "This IMO number's check digit is wrong" });
  }
  req("portOfLoading", "Port of loading");
  req("portOfDischarge", "Port of discharge");
  if (q.portOfLoading && q.portOfLoading === q.portOfDischarge) e.push({ field: "portOfDischarge", message: "Port of discharge must differ from the port of loading" });
  req("finalDestination", "Final destination");
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

function editableQuote(id) {
  const q = db.quotes.find((x) => x.id === id) ?? fail(404, "Quote not found");
  refreshQuoteStatus(q);
  if (!["DRAFT", "QUOTED", "DECLINED", "REFERRED"].includes(q.status)) fail(409, `A ${lc(q.status)} quote can't be changed.`, { code: "WRONG_STATE" });
  return q;
}

// ── policies and certificates ──
function certificateStatus(c) {
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

function certificateView(c) {
  const policy = db.policies.find((p) => p.id === c.policyId);
  const q = policy?.snapshot ?? {};
  return {
    ...c,
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
    emails: [partyRef(q.insuredId)?.email, partyRef(q.brokerId)?.email, q.lc?.enabled ? partyRef(q.lc.bankId)?.email : null].filter(Boolean),
    versions: db.certificates
      .filter((x) => x.policyId === c.policyId && x.certNo === c.certNo)
      .map((x) => ({ id: x.id, version: x.version, status: certificateStatus(x), issuedAt: x.issuedAt })),
  };
}

function policyView(p) {
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
const routes = [];
const on = (method, pattern, handler) => {
  const keys = [];
  const re = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), "([^/]+)"))}$`);
  routes.push({ method, re, keys, handler });
};

// masters: vessels
on("get", "/vessels", ({ query }) => {
  const q = lc(query.q);
  let items = db.vessels.map((v) => ({ ...v, age: vesselAge(v.yearBuilt) }));
  if (q) items = items.filter((v) => lc(`${v.imo} ${v.name}`).includes(q));
  if (query.flag) items = items.filter((v) => v.flag === query.flag);
  if (query.minAge) items = items.filter((v) => v.age >= Number(query.minAge));
  if (query.maxAge) items = items.filter((v) => v.age <= Number(query.maxAge));
  return page(items, query, { sortDefault: "name,asc" });
});
on("get", "/vessels/:imo", ({ params }) => vesselRef(params.imo) ?? fail(404, "No vessel with this IMO number"));
function vesselErrors(b, existingImo) {
  const e = [];
  if (!isValidImo(b.imo)) e.push({ field: "imo", message: "IMO must be 7 digits with a valid check digit" });
  else if (b.imo !== existingImo && db.vessels.some((v) => v.imo === b.imo)) e.push({ field: "imo", message: "A vessel with this IMO already exists" });
  if (!String(b.name ?? "").trim()) e.push({ field: "name", message: "Name is required" });
  if (!b.flag) e.push({ field: "flag", message: "Flag is required" });
  const y = Number(b.yearBuilt);
  if (!(y >= 1900 && y <= year())) e.push({ field: "yearBuilt", message: `Year built must be between 1900 and ${year()}` });
  if (!b.classSociety) e.push({ field: "classSociety", message: "Class society is required" });
  if (b.grossTonnage !== "" && b.grossTonnage !== null && b.grossTonnage !== undefined && !(Number(b.grossTonnage) > 0)) e.push({ field: "grossTonnage", message: "Gross tonnage must be greater than 0" });
  return e;
}
on("post", "/vessels", ({ body }) => {
  const e = vesselErrors(body);
  if (e.length) invalid(e);
  const v = { imo: body.imo, name: body.name.trim(), flag: body.flag, yearBuilt: Number(body.yearBuilt), classSociety: body.classSociety, grossTonnage: Number(body.grossTonnage) || null, source: body.source || "MANUAL" };
  db.vessels.push(v);
  audit("vessel", v.imo, "Created", null, null);
  return vesselRef(v.imo);
});
on("put", "/vessels/:imo", ({ params, body }) => {
  const v = db.vessels.find((x) => x.imo === params.imo) ?? fail(404, "Vessel not found");
  const e = vesselErrors({ ...body, imo: params.imo }, params.imo);
  if (e.length) invalid(e);
  const before = { ...v };
  Object.assign(v, { name: body.name.trim(), flag: body.flag, yearBuilt: Number(body.yearBuilt), classSociety: body.classSociety, grossTonnage: Number(body.grossTonnage) || null });
  audit("vessel", v.imo, "Updated", before, v);
  return vesselRef(v.imo);
});

// masters: ports
on("get", "/ports", ({ query }) => {
  const q = lc(query.q);
  let items = db.ports;
  if (q) items = items.filter((p) => lc(`${p.code} ${p.name} ${p.country}`).includes(q));
  if (query.country) items = items.filter((p) => p.country === query.country);
  return page(items, query, { sortDefault: "code,asc" });
});
function portErrors(b, existing) {
  const e = [];
  const code = String(b.code ?? "").toUpperCase();
  if (!/^[A-Z]{2}[A-Z0-9]{3}$/.test(code)) e.push({ field: "code", message: "UN/LOCODE is a 2-letter country code and 3 characters, e.g. DJJIB" });
  else if (code !== existing && db.ports.some((p) => p.code === code)) e.push({ field: "code", message: "This UN/LOCODE already exists" });
  if (!String(b.name ?? "").trim()) e.push({ field: "name", message: "Name is required" });
  if (!String(b.country ?? "").trim()) e.push({ field: "country", message: "Country is required" });
  return e;
}
on("post", "/ports", ({ body }) => {
  const e = portErrors(body);
  if (e.length) invalid(e);
  const p = { code: body.code.toUpperCase(), name: body.name.trim(), country: body.country.trim() };
  db.ports.push(p);
  audit("port", p.code, "Created");
  return p;
});
on("put", "/ports/:code", ({ params, body }) => {
  const p = db.ports.find((x) => x.code === params.code) ?? fail(404, "Port not found");
  const e = portErrors({ ...body, code: params.code }, params.code);
  if (e.length) invalid(e);
  const before = { ...p };
  Object.assign(p, { name: body.name.trim(), country: body.country.trim() });
  audit("port", p.code, "Updated", before, p);
  return p;
});

// masters: commodities
on("get", "/commodities/classes", () => [...new Set(activeTable().commodityRates.map((r) => r.commodityClass))]);
on("get", "/commodities", ({ query }) => {
  const q = lc(query.q);
  let items = db.commodities;
  if (q) items = items.filter((c) => lc(`${c.hsCode} ${c.description}`).includes(q));
  if (query.commodityClass) items = items.filter((c) => c.commodityClass === query.commodityClass);
  if (query.restricted !== undefined && query.restricted !== "") items = items.filter((c) => String(c.restricted) === String(query.restricted));
  return page(items, query, { sortDefault: "hsCode,asc" });
});
function commodityErrors(b, existing) {
  const e = [];
  if (!/^\d{6,10}$/.test(String(b.hsCode ?? ""))) e.push({ field: "hsCode", message: "HS code is 6 to 10 digits" });
  else if (b.hsCode !== existing && db.commodities.some((c) => c.hsCode === b.hsCode)) e.push({ field: "hsCode", message: "This HS code already exists" });
  if (!String(b.description ?? "").trim()) e.push({ field: "description", message: "Description is required" });
  if (!b.commodityClass) e.push({ field: "commodityClass", message: "Class is required" });
  return e;
}
on("post", "/commodities", ({ body }) => {
  const e = commodityErrors(body);
  if (e.length) invalid(e);
  const c = { hsCode: body.hsCode, description: body.description.trim(), commodityClass: body.commodityClass, restricted: !!body.restricted };
  db.commodities.push(c);
  audit("commodity", c.hsCode, "Created");
  return c;
});
on("put", "/commodities/:hs", ({ params, body }) => {
  const c = db.commodities.find((x) => x.hsCode === params.hs) ?? fail(404, "Commodity not found");
  const e = commodityErrors({ ...body, hsCode: params.hs }, params.hs);
  if (e.length) invalid(e);
  const before = { ...c };
  Object.assign(c, { description: body.description.trim(), commodityClass: body.commodityClass, restricted: !!body.restricted });
  audit("commodity", c.hsCode, "Updated", before, c);
  return c;
});

// masters: parties
on("get", "/parties", ({ query }) => {
  const q = lc(query.q);
  let items = db.parties;
  if (q) items = items.filter((p) => lc(`${p.name} ${p.tin} ${p.email}`).includes(q));
  if (query.type) items = items.filter((p) => p.types.includes(query.type));
  return page(items, query, { sortDefault: "name,asc" });
});
on("get", "/parties/:id", ({ params }) => db.parties.find((p) => p.id === params.id) ?? fail(404, "Party not found"));
function partyErrors(b) {
  const e = [];
  if (!String(b.name ?? "").trim()) e.push({ field: "name", message: "Name is required" });
  if (!Array.isArray(b.types) || !b.types.length) e.push({ field: "types", message: "Pick at least one type" });
  if (b.tin && !/^\d{10}$/.test(b.tin)) e.push({ field: "tin", message: "TIN is 10 digits" });
  if (b.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) e.push({ field: "email", message: "Enter a valid email" });
  return e;
}
const PARTY_FIELDS = ["name", "types", "tin", "phone", "email", "address", "contactPerson"];
on("post", "/parties", ({ body }) => {
  const e = partyErrors(body);
  if (e.length) invalid(e);
  const p = { id: String(db.seq.party++), ...Object.fromEntries(PARTY_FIELDS.map((k) => [k, body[k] ?? ""])), name: body.name.trim() };
  db.parties.push(p);
  audit("party", p.id, "Created");
  return p;
});
on("put", "/parties/:id", ({ params, body }) => {
  const p = db.parties.find((x) => x.id === params.id) ?? fail(404, "Party not found");
  const e = partyErrors(body);
  if (e.length) invalid(e);
  const before = { ...p };
  Object.assign(p, Object.fromEntries(PARTY_FIELDS.map((k) => [k, body[k] ?? ""])), { name: body.name.trim() });
  audit("party", p.id, "Updated", before, p);
  return p;
});

on("get", "/audit", ({ query }) =>
  db.audit.filter((a) => a.entity === query.entity && a.entityId === String(query.id)).sort((a, b) => b.at.localeCompare(a.at))
);

// FX rates
on("get", "/fx-rates/today", () => {
  const today = todayIso();
  return FOREIGN_CURRENCIES.map((currency) => {
    const row = db.fxRates.find((r) => r.currency === currency && r.date === today);
    return { currency, date: today, rate: row?.rate ?? null, source: row?.source ?? null };
  });
});
on("get", "/fx-rates", ({ query }) => {
  const currencies = listParam(query.currency);
  let items = db.fxRates;
  if (currencies.length) items = items.filter((r) => currencies.includes(r.currency));
  items = items.filter((r) => inRange(r.date, query.from, query.to));
  return page(items, query, { sortDefault: "date,desc" });
});
function fxErrors(b) {
  const e = [];
  if (!FOREIGN_CURRENCIES.includes(b.currency)) e.push({ field: "currency", message: "Pick a currency" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(b.date ?? ""))) e.push({ field: "date", message: "Date is required" });
  else if (b.date > todayIso()) e.push({ field: "date", message: "Date can't be in the future" });
  else if (db.fxRates.some((r) => r.currency === b.currency && r.date === b.date)) e.push({ field: "date", message: "A rate for this day already exists." });
  const r = parseDecimal(b.rate);
  if (!(r > 0n)) e.push({ field: "rate", message: "Rate must be greater than 0" });
  else if (String(b.rate).includes(".") && String(b.rate).split(".")[1].length > 4) e.push({ field: "rate", message: "At most 4 decimals" });
  return e;
}
function addFx(b, source = "MANUAL") {
  const row = { id: String(db.seq.fx++), currency: b.currency, date: b.date, rate: normalizeAmount(b.rate, 4), source, enteredBy: actor(), createdAt: nowIso() };
  db.fxRates.push(row);
  return row;
}
on("post", "/fx-rates", ({ body }) => {
  const e = fxErrors(body);
  if (e.length) invalid(e);
  return addFx(body);
});
on("post", "/fx-rates/import", async ({ body }) => {
  const file = body instanceof FormData ? body.get("file") : null;
  if (!file) invalid([{ field: "file", message: "Choose a CSV file" }]);
  const text = await file.text();
  const rows = parseFxCsv(text);
  let imported = 0;
  const errors = [];
  rows.forEach((r) => {
    if (r.error) return errors.push({ row: r.line, message: r.error });
    const e = fxErrors(r);
    if (e.length) return errors.push({ row: r.line, message: e.map((x) => x.message).join("; ") });
    addFx(r);
    imported++;
  });
  return { imported, rejected: errors.length, errors };
});

// users
on("get", "/users", ({ query }) => {
  const q = lc(query.q);
  let items = db.users;
  if (q) items = items.filter((u) => lc(`${u.username} ${u.fullName} ${u.email}`).includes(q));
  if (query.role) items = items.filter((u) => u.roles.includes(query.role));
  if (query.status) items = items.filter((u) => (query.status === "ENABLED") === u.enabled);
  return page(items, query, { sortDefault: "username,asc" });
});
function userErrors(b, id) {
  const e = [];
  if (!/^[a-z0-9._-]{3,40}$/i.test(String(b.username ?? ""))) e.push({ field: "username", message: "Username is 3 to 40 letters, digits, dots, dashes or underscores" });
  else if (db.users.some((u) => lc(u.username) === lc(b.username) && u.id !== id)) e.push({ field: "username", message: "This username is taken" });
  if (!String(b.fullName ?? "").trim()) e.push({ field: "fullName", message: "Full name is required" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(b.email ?? ""))) e.push({ field: "email", message: "Enter a valid email" });
  if (!Array.isArray(b.roles) || !b.roles.length) e.push({ field: "roles", message: "Pick at least one role" });
  return e;
}
on("post", "/users", ({ body }) => {
  const e = userErrors(body);
  if (e.length) invalid(e);
  const u = { id: String(db.seq.user++), username: body.username, fullName: body.fullName.trim(), email: body.email, roles: body.roles, enabled: body.enabled !== false, lastSignInAt: null };
  db.users.push(u);
  audit("user", u.id, "Created");
  return u;
});
on("put", "/users/:id", ({ params, body }) => {
  const u = db.users.find((x) => x.id === params.id) ?? fail(404, "User not found");
  const e = userErrors(body, u.id);
  if (e.length) invalid(e);
  const before = { ...u };
  Object.assign(u, { username: body.username, fullName: body.fullName.trim(), email: body.email, roles: body.roles, enabled: body.enabled !== false });
  audit("user", u.id, "Updated", before, u);
  return u;
});
on("post", "/users/:id/:action", ({ params }) => {
  const u = db.users.find((x) => x.id === params.id) ?? fail(404, "User not found");
  u.enabled = params.action === "enable";
  audit("user", u.id, u.enabled ? "Enabled" : "Disabled");
  return u;
});

// quotes
on("get", "/quotes", ({ query }) => {
  const q = lc(query.q);
  const statuses = listParam(query.status);
  let items = db.quotes.map(quoteView);
  if (q) items = items.filter((x) => lc(`${x.quoteNo} ${x.insured?.name}`).includes(q));
  if (statuses.length) items = items.filter((x) => statuses.includes(x.status));
  if (query.product) items = items.filter((x) => x.product === query.product);
  if (query.brokerId) items = items.filter((x) => x.brokerId === query.brokerId);
  items = items.filter((x) => inRange(x.createdAt, query.createdFrom, query.createdTo));
  if (query.expiring) items = items.filter((x) => x.validUntil && x.validUntil <= addDays(todayIso(), Number(query.expiring)) && ["QUOTED", "APPROVED"].includes(x.status));
  return page(items.map((x) => ({ ...x, premiumTotal: x.premium?.total ?? null, sumInsuredTotal: x.premium?.sumInsured?.total ?? null })), query);
});
on("get", "/quotes/:id", ({ params }) => quoteView(db.quotes.find((x) => x.id === params.id) ?? fail(404, "Quote not found")));
on("post", "/quotes", ({ body }) => {
  const q = { id: String(db.seq.quote + 1), quoteNo: nextNo("Q", "quote"), status: "DRAFT", ...pickQuote(body), createdBy: actor(), createdAt: nowIso(), updatedAt: nowIso() };
  db.quotes.push(q);
  audit("quote", q.id, "Created");
  return quoteView(q);
});
on("put", "/quotes/:id", ({ params, body }) => {
  const q = editableQuote(params.id);
  const before = { ...q };
  Object.assign(q, pickQuote(body), { status: "DRAFT", premium: null, referralReasons: [], declineNote: "", fx: null, validUntil: null, updatedAt: nowIso() });
  audit("quote", q.id, "Updated", before, q);
  return quoteView(q);
});
on("post", "/quotes/:id/rate", ({ params }) => {
  const q = editableQuote(params.id);
  const e = quoteErrors(q);
  if (e.length) invalid(e);
  const table = activeTable(q.product) ?? fail(409, "There is no active rate table for this product.", { code: "NO_RATE_TABLE" });
  const fx = fxFor(q.currency) ?? fail(409, `There is no ${q.currency} exchange rate. Ask Finance to enter one.`, { code: "NO_FX_RATE" });
  const result = rate(q, { table, vessel: vesselRef(q.vesselImo), commodity: commodityRef(q.hsCode), fxRate: fx });
  Object.assign(q, {
    status: result.status,
    premium: result.premium,
    referralReasons: result.referralReasons,
    declineNote: result.declineNote,
    fx: result.fx,
    validUntil: addDays(todayIso(), 30),
    ratedAt: nowIso(),
    updatedAt: nowIso(),
  });
  audit("quote", q.id, `Rated: ${lc(result.status)}`);
  return quoteView(q);
});
on("post", "/quotes/:id/bind", ({ params }) => {
  const q = db.quotes.find((x) => x.id === params.id) ?? fail(404, "Quote not found");
  refreshQuoteStatus(q);
  const bindable = (q.status === "QUOTED" && !(q.referralReasons ?? []).length) || q.status === "APPROVED";
  if (!bindable) fail(409, q.status === "REFERRED" ? "Referral pending: an underwriter must approve before binding." : `A ${lc(q.status)} quote can't be bound.`, { code: "WRONG_STATE" });
  const policy = {
    id: String(db.seq.policy + 1),
    policyNo: nextNo("P", "policy"),
    status: "ACTIVE",
    product: q.product,
    periodFrom: q.sailingDate,
    periodTo: addDays(q.sailingDate, 90),
    wordingVersion: "ICC 1/1/2009",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  q.status = "BOUND";
  q.policyId = policy.id;
  q.updatedAt = nowIso();
  policy.snapshot = { ...q };
  db.policies.push(policy);
  const cert = {
    id: String(db.seq.certificate + 1),
    certNo: nextNo("C", "certificate"),
    version: 1,
    status: "PENDING",
    policyId: policy.id,
    token: crypto.randomUUID().replace(/-/g, ""),
    createdAt: nowIso(),
    issuedAt: null,
    events: [],
  };
  db.certificates.push(cert);
  audit("quote", q.id, `Bound: policy ${policy.policyNo}`);
  audit("policy", policy.id, "Created from quote " + q.quoteNo);
  return { quote: quoteView(q), policy: { id: policy.id, policyNo: policy.policyNo }, certificate: { id: cert.id, certNo: cert.certNo } };
});

// policies
on("get", "/policies", ({ query }) => {
  const q = lc(query.q);
  const statuses = listParam(query.status);
  let items = db.policies.map(policyView);
  if (q) items = items.filter((p) => lc(`${p.policyNo} ${p.insured?.name} ${p.vesselImo}`).includes(q));
  if (statuses.length) items = items.filter((p) => statuses.includes(p.status));
  if (query.product) items = items.filter((p) => p.product === query.product);
  items = items.filter((p) => inRange(p.periodFrom, query.periodFrom, query.periodTo));
  return page(items.map((p) => ({ ...p, sumInsuredTotal: p.premium?.sumInsured?.total, premiumTotal: p.premium?.total })), query);
});
on("get", "/policies/:id", ({ params }) => policyView(db.policies.find((p) => p.id === params.id) ?? fail(404, "Policy not found")));

// certificates
on("get", "/certificates", ({ query }) => {
  const q = lc(query.q);
  const statuses = listParam(query.status);
  let items = db.certificates.map(certificateView);
  if (q) items = items.filter((c) => lc(`${c.certNo} ${c.blNo}`).includes(q));
  if (statuses.length) items = items.filter((c) => statuses.includes(c.status));
  if (query.vesselImo) items = items.filter((c) => c.vessel?.imo === query.vesselImo);
  items = items.filter((c) => (query.issuedFrom || query.issuedTo ? c.issuedAt && inRange(c.issuedAt, query.issuedFrom, query.issuedTo) : true));
  return page(items, query, { sortDefault: "createdAt,desc" });
});
on("get", "/certificates/:id", ({ params }) => certificateView(db.certificates.find((c) => c.id === params.id) ?? fail(404, "Certificate not found")));
on("get", "/certificates/:id/pdf", async ({ params }) => {
  const c = db.certificates.find((x) => x.id === params.id) ?? fail(404, "Certificate not found");
  if (certificateStatus(c) === "PENDING") fail(409, "The PDF is still being generated.", { code: "PDF_PENDING" });
  const view = certificateView(c);
  const policy = db.policies.find((p) => p.id === c.policyId);
  return { __blob: await buildCertificatePdf(view, policy.snapshot, verifyUrl(c.token)) };
});
on("post", "/certificates/:id/email", ({ params, body }) => {
  const c = db.certificates.find((x) => x.id === params.id) ?? fail(404, "Certificate not found");
  const to = Array.isArray(body?.recipients) ? body.recipients : [];
  const bad = to.filter((r) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r));
  if (!to.length) invalid([{ field: "recipients", message: "Add at least one recipient" }]);
  if (bad.length) invalid([{ field: "recipients", message: `Not a valid email: ${bad.join(", ")}` }]);
  c.events.push({ kind: "EMAIL", by: actor(), at: nowIso(), to: to.join(", ") });
  return { __status: 202, queued: true };
});
on("post", "/certificates/:id/events", ({ params, body }) => {
  const c = db.certificates.find((x) => x.id === params.id) ?? fail(404, "Certificate not found");
  c.events.push({ kind: body?.kind === "PRINT" ? "PRINT" : "DOWNLOAD", by: actor(), at: nowIso(), to: "" });
  return { ok: true };
});

export const verifyUrl = (token) => `${location.origin}/verify/${token}`;

on("get", "/public/verify/:token", ({ params }) => {
  const c = db.certificates.find((x) => x.token === params.token) ?? fail(404, "We couldn't verify this certificate.");
  const v = certificateView(c);
  const latest = Math.max(...v.versions.map((x) => x.version));
  const status = v.status === "CANCELLED" ? "CANCELLED" : c.version < latest || v.status === "AMENDED" ? "SUPERSEDED" : v.status === "EXPIRED" ? "EXPIRED" : v.status === "ISSUED" ? "VALID" : "PENDING";
  return {
    status,
    certNo: v.certNo,
    version: v.version,
    insuredName: v.insured?.name,
    vesselName: v.vessel?.name ?? "By air",
    voyage: `${v.loadingPort?.name ?? "—"} → ${v.dischargePort?.name ?? "—"}${v.finalDestination ? ` → ${v.finalDestination}` : ""}`,
    sumInsured: v.sumInsured,
    currency: v.currency,
    issuedAt: v.issuedAt,
    insurerPhone: "+251 11 551 8400",
  };
});

// rate tables
const tableSummary = ({ id, name, product, effectiveFrom, effectiveTo, status, createdBy, createdAt }) => ({ id, name, product, effectiveFrom, effectiveTo, status, createdBy, createdAt });
on("get", "/rate-tables", ({ query }) => page(db.rateTables.map(tableSummary), query, { sortDefault: "createdAt,desc" }));
on("get", "/rate-tables/:id", ({ params }) => db.rateTables.find((t) => t.id === params.id) ?? fail(404, "Rate table not found"));
on("post", "/rate-tables", ({ body }) => {
  const source = db.rateTables.find((t) => t.id === String(body?.copyFrom)) ?? activeTable(body?.product) ?? db.rateTables[0];
  const n = db.rateTables.filter((t) => t.product === source.product).length + 1;
  const t = {
    ...structuredClone(source),
    id: String(db.seq.rateTable++),
    name: `${year()} v${n}`,
    status: "DRAFT",
    effectiveFrom: addDays(todayIso(), 1),
    effectiveTo: null,
    createdBy: actor(),
    createdAt: nowIso(),
  };
  db.rateTables.push(t);
  audit("rateTable", t.id, `Created from ${source.name}`);
  return t;
});
on("put", "/rate-tables/:id", ({ params, body }) => {
  const t = db.rateTables.find((x) => x.id === params.id) ?? fail(404, "Rate table not found");
  if (t.status !== "DRAFT") fail(409, "Only draft rate tables can be edited.", { code: "WRONG_STATE" });
  const before = structuredClone(t);
  ["name", "effectiveFrom", "general", "commodityRates", "clauseFactors", "routeFactors", "ageBands", "warStrikes"].forEach((k) => {
    if (k in body) t[k] = body[k];
  });
  audit("rateTable", t.id, "Updated", before, t);
  return t;
});
on("post", "/rate-tables/:id/activate", ({ params }) => {
  const t = db.rateTables.find((x) => x.id === params.id) ?? fail(404, "Rate table not found");
  if (t.status !== "DRAFT") fail(409, "Only a draft can be activated.", { code: "WRONG_STATE" });
  const e = validateRateTable(t);
  if (e.length) invalid(e.map((x) => ({ field: x.path, message: x.message })));
  db.rateTables
    .filter((x) => x.status === "ACTIVE" && x.product === t.product)
    .forEach((x) => {
      x.status = "RETIRED";
      x.effectiveTo = addDays(t.effectiveFrom, -1);
      audit("rateTable", x.id, `Retired by ${t.name}`);
    });
  t.status = "ACTIVE";
  audit("rateTable", t.id, "Activated");
  return t;
});

// ── adapter ──
function parseBody(data) {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data ?? {};
}

export async function handleRequest(config) {
  await new Promise((r) => setTimeout(r, 120 + Math.random() * 200));
  const method = String(config.method || "get").toLowerCase();
  const path = String(config.url || "").replace(/^https?:\/\/[^/]+/, "").replace(/^\/api\/marine\/v1/, "").split("?")[0];
  const route = routes.find((r) => r.method === method && r.re.test(path));
  const correlationId = crypto.randomUUID().slice(0, 8);
  const respond = (status, data) => ({ data, status, statusText: String(status), headers: { "x-correlation-id": correlationId }, config, request: {} });

  try {
    if (!route) fail(404, `Mock backend has no ${method.toUpperCase()} ${path}`);
    const m = path.match(route.re);
    const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    const result = await route.handler({ params, query: config.params || {}, body: parseBody(config.data) });
    if (method !== "get") save();
    if (result?.__blob) return respond(200, result.__blob);
    if (result?.__status) return respond(result.__status, { queued: true });
    // Deep copy so callers can't mutate the mock's records in place
    return respond(method === "post" && /\/(vessels|ports|commodities|parties|users|fx-rates|quotes|rate-tables)$/.test(path) ? 201 : 200, structuredClone(result));
  } catch (e) {
    if (!(e instanceof HttpError)) {
      console.error("[marine mock]", e);
      e = new HttpError(500, "The mock backend failed. See the console.");
    }
    const res = respond(e.status, { status: e.status, code: e.code, message: e.message, fields: e.fields, correlationId });
    throw new AxiosError(e.message, e.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST, config, {}, res);
  }
}

