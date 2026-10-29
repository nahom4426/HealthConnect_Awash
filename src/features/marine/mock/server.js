// In-browser mock of the Marine & Cargo backend (plan: "MSW handlers double as a local mock
// backend"). It plugs in as the axios adapter of the marine client and answers every endpoint;
// data lives in localStorage so records survive a reload. Domain routes are split across this
// file (masters, FX, users, quotes, policies, certificates, rate tables) and underwriting.js,
// openCovers.js and claims.js. Reset from the console: localStorage.removeItem("marine.mockdb.v1")
import { AxiosError } from "axios";
import { rate } from "./rating";
import { buildCertificatePdf } from "./pdf";
import { addDays, todayIso } from "../utils/format";
import { isValidImo, vesselAge } from "../utils/imo";
import { normalizeAmount, parseDecimal } from "../utils/money";
import { parseFxCsv } from "../utils/fxCsv";
import { validateRateTable } from "../utils/rateTable";
import { FOREIGN_CURRENCIES } from "../constants";
import {
  db, save, resetMockDb, HttpError, fail, invalid, nowIso, year, nextNo, lc, listParam, actor, audit, page, inRange,
  partyRef, portRef, vesselRef, commodityRef, activeTable, fxFor, refreshQuoteStatus, quoteView, pickQuote, quoteErrors,
  editableQuote, certificateStatus, certificateView, policyView, on, routes, caller, brokerOnly, nextId, declarationContext,
} from "./core";
import { assess, applyAssessment, syncReferral } from "./underwriting";
import { lockToCover } from "./openCovers";
import { approvedCustomerError } from "./customers";
import { raiseNote, splitPremium } from "./finance";
import "./claims";

export { resetMockDb };

// Brokers only reach their own business; anything else answers 404 as if it didn't exist (plan 7.7)
const mine = (brokerId) => !brokerOnly() || brokerId === caller.brokerPartyId;
function ownQuote(q) {
  if (!mine(q.brokerId)) fail(404, "Quote not found");
  return q;
}
const ownPolicy = (p) => (mine(p.snapshot.brokerId) ? p : fail(404, "Policy not found"));
const certSnapshot = (c) => c.snapshot ?? db.policies.find((p) => p.id === c.policyId)?.snapshot ?? {};
const ownCert = (c) => (mine(certSnapshot(c).brokerId) ? c : fail(404, "Certificate not found"));

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
  let items = db.quotes.filter((x) => mine(x.brokerId)).map(quoteView);
  if (q) items = items.filter((x) => lc(`${x.quoteNo} ${x.insured?.name}`).includes(q));
  if (statuses.length) items = items.filter((x) => statuses.includes(x.status));
  if (query.product) items = items.filter((x) => x.product === query.product);
  if (query.brokerId) items = items.filter((x) => x.brokerId === query.brokerId);
  items = items.filter((x) => inRange(x.createdAt, query.createdFrom, query.createdTo));
  if (query.expiring) items = items.filter((x) => x.validUntil && x.validUntil <= addDays(todayIso(), Number(query.expiring)) && ["QUOTED", "APPROVED"].includes(x.status));
  return page(items.map((x) => ({ ...x, premiumTotal: x.premium?.total ?? null, sumInsuredTotal: x.premium?.sumInsured?.total ?? null })), query);
});
on("get", "/quotes/:id", ({ params }) => quoteView(ownQuote(db.quotes.find((x) => x.id === params.id) ?? fail(404, "Quote not found"))));
on("post", "/quotes", ({ body }) => {
  const q = { id: nextId(db.quotes), quoteNo: nextNo("Q", "quote"), status: "DRAFT", ...pickQuote(body), createdBy: actor(), createdAt: nowIso(), updatedAt: nowIso() };
  // A broker's quotes always carry their own party as broker
  if (brokerOnly()) q.brokerId = caller.brokerPartyId;
  db.quotes.push(q);
  audit("quote", q.id, "Created");
  return quoteView(q);
});
on("put", "/quotes/:id", ({ params, body }) => {
  const q = ownQuote(editableQuote(params.id));
  const before = { ...q };
  Object.assign(q, pickQuote(body), { status: "DRAFT", premium: null, referralReasons: [], declineNote: "", fx: null, validUntil: null, checks: null, sanctionsConfirmed: false, updatedAt: nowIso() });
  if (brokerOnly()) q.brokerId = caller.brokerPartyId;
  if (q.openCoverId) lockToCover(q);
  audit("quote", q.id, "Updated", before, q);
  return quoteView(q);
});
on("post", "/quotes/:id/rate", ({ params }) => {
  const q = editableQuote(params.id);
  ownQuote(q);
  const e = quoteErrors(q);
  const notApproved = q.insuredId && approvedCustomerError(q.insuredId);
  if (notApproved) e.push(notApproved);
  if (e.length) invalid(e);
  if (q.product === "INLAND_TRANSIT") {
    q.mode = "ROAD";
    q.finalDestination = portRef(q.inland.to)?.name ?? q.inland.to;
  }
  // A fresh rating drops any earlier approval terms
  q.rateOverridePct = null;
  q.waivedWarranties = [];
  const decl = declarationContext(q);
  const a = assess(q, { agreedRatePct: decl.agreedRatePct, extraReasons: decl.extraReasons });
  applyAssessment(q, a);
  Object.assign(q, { validUntil: addDays(todayIso(), 30), ratedAt: nowIso(), late: decl.late, declarationReasons: decl.extraReasons, limits: decl.limits });
  syncReferral(q, a);
  audit("quote", q.id, `Rated: ${lc(a.status)}`);
  return quoteView(q);
});
on("post", "/quotes/:id/bind", ({ params }) => {
  const q = db.quotes.find((x) => x.id === params.id) ?? fail(404, "Quote not found");
  ownQuote(q);
  refreshQuoteStatus(q);
  if (q.sanctionsConfirmed) fail(409, "Sanctions match confirmed. This quote can't be bound.", { code: "SANCTIONS_CONFIRMED" });
  const bindable = (q.status === "QUOTED" && !(q.referralReasons ?? []).length) || q.status === "APPROVED";
  if (!bindable) fail(409, q.status === "REFERRED" ? "Referral pending: an underwriter must approve before binding." : `A ${lc(q.status)} quote can't be bound.`, { code: "WRONG_STATE" });
  const cover = q.openCoverId ? db.openCovers.find((c) => c.id === q.openCoverId) : null;
  const policy = {
    id: nextId(db.policies),
    policyNo: nextNo("P", "policy"),
    status: "ACTIVE",
    product: q.product,
    periodFrom: q.sailingDate,
    periodTo: addDays(q.sailingDate, q.product === "INLAND_TRANSIT" ? 30 : 90),
    wordingVersion: q.product === "INLAND_TRANSIT" ? "ICC 1/1/2009 with inland transit extension" : "ICC 1/1/2009",
    openCoverId: cover?.id ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  q.status = "BOUND";
  q.policyId = policy.id;
  q.updatedAt = nowIso();
  policy.snapshot = { ...q };
  db.policies.push(policy);
  const cert = {
    id: nextId(db.certificates),
    certNo: nextNo("C", "certificate"),
    version: 1,
    status: "PENDING",
    // Pay before cover; declarations are billed through the open cover's deposit and year-end adjustment
    awaitingPayment: !cover,
    policyId: policy.id,
    token: crypto.randomUUID().replace(/-/g, ""),
    createdAt: nowIso(),
    issuedAt: null,
    events: [],
    snapshot: { ...q },
  };
  db.certificates.push(cert);
  const debitNote = cover
    ? null
    : raiseNote({ source: "BIND", customerId: q.insuredId, brokerId: q.brokerId ?? null, policyId: policy.id, certificateId: cert.id, amounts: splitPremium(q.premium), description: `Premium for ${policy.policyNo}` });
  audit("quote", q.id, `Bound: policy ${policy.policyNo}`);
  audit("policy", policy.id, "Created from quote " + q.quoteNo);
  if (cover) audit("openCover", cover.id, `Declaration ${q.quoteNo} bound${q.late ? " (late)" : ""}`);
  return {
    quote: quoteView(q),
    policy: { id: policy.id, policyNo: policy.policyNo },
    certificate: { id: cert.id, certNo: cert.certNo, awaitingPayment: cert.awaitingPayment },
    debitNote: debitNote ? { id: debitNote.id, noteNo: debitNote.noteNo, total: debitNote.total } : null,
    openCover: cover ? { id: cover.id } : null,
  };
});

// policies
on("get", "/policies", ({ query }) => {
  const q = lc(query.q);
  const statuses = listParam(query.status);
  let items = db.policies.filter((p) => mine(p.snapshot.brokerId)).map(policyView);
  if (q) items = items.filter((p) => lc(`${p.policyNo} ${p.insured?.name} ${p.vesselImo}`).includes(q));
  if (statuses.length) items = items.filter((p) => statuses.includes(p.status));
  if (query.product) items = items.filter((p) => p.product === query.product);
  items = items.filter((p) => inRange(p.periodFrom, query.periodFrom, query.periodTo));
  return page(items.map((p) => ({ ...p, sumInsuredTotal: p.premium?.sumInsured?.total, premiumTotal: p.premium?.total })), query);
});
on("get", "/policies/:id", ({ params }) => policyView(ownPolicy(db.policies.find((p) => p.id === params.id) ?? fail(404, "Policy not found"))));

// certificates
on("get", "/certificates", ({ query }) => {
  const q = lc(query.q);
  const statuses = listParam(query.status);
  let items = db.certificates.filter((c) => mine(certSnapshot(c).brokerId)).map(certificateView);
  if (q) items = items.filter((c) => lc(`${c.certNo} ${c.blNo}`).includes(q));
  if (statuses.length) items = items.filter((c) => statuses.includes(c.status));
  if (query.vesselImo) items = items.filter((c) => c.vessel?.imo === query.vesselImo);
  items = items.filter((c) => (query.issuedFrom || query.issuedTo ? c.issuedAt && inRange(c.issuedAt, query.issuedFrom, query.issuedTo) : true));
  return page(items, query, { sortDefault: "createdAt,desc" });
});
on("get", "/certificates/:id", ({ params }) => certificateView(ownCert(db.certificates.find((c) => c.id === params.id) ?? fail(404, "Certificate not found"))));
on("get", "/certificates/:id/pdf", async ({ params }) => {
  const c = db.certificates.find((x) => x.id === params.id) ?? fail(404, "Certificate not found");
  if (certificateStatus(c) === "AWAITING_PAYMENT") fail(409, "The certificate is issued once the premium is paid.", { code: "AWAITING_PAYMENT" });
  if (certificateStatus(c) === "PENDING") fail(409, "The PDF is still being generated.", { code: "PDF_PENDING" });
  const view = certificateView(c);
  const policy = db.policies.find((p) => p.id === c.policyId);
  return { __blob: await buildCertificatePdf(view, c.snapshot ?? policy.snapshot, verifyUrl(c.token)) };
});
on("post", "/certificates/:id/email", ({ params, body }) => {
  const c = db.certificates.find((x) => x.id === params.id) ?? fail(404, "Certificate not found");
  if (certificateStatus(c) === "AWAITING_PAYMENT") fail(409, "The certificate is issued once the premium is paid.", { code: "AWAITING_PAYMENT" });
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
  // A paid-for version takes over; an amendment still awaiting payment doesn't supersede yet
  const latest = Math.max(...v.versions.filter((x) => x.status !== "AWAITING_PAYMENT").map((x) => x.version));
  const status = v.status === "CANCELLED" ? "CANCELLED" : c.version < latest || v.status === "AMENDED" ? "SUPERSEDED" : v.status === "EXPIRED" ? "EXPIRED" : v.status === "ISSUED" ? "VALID" : "PENDING"; // AWAITING_PAYMENT shows as not yet valid
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

  const header = (k) => config.headers?.[k] ?? config.headers?.get?.(k) ?? "";
  caller.roles = String(header("x-dev-roles") || "").split(",").filter(Boolean);
  caller.user = decodeURIComponent(String(header("x-dev-user") || ""));
  caller.brokerPartyId = String(header("x-dev-broker-party") || "") || null;

  try {
    if (!route) fail(404, `Mock backend has no ${method.toUpperCase()} ${path}`);
    const m = path.match(route.re);
    const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    const result = await route.handler({ params, query: config.params || {}, body: parseBody(config.data) });
    if (method !== "get") save();
    if (result?.__blob) return respond(200, result.__blob);
    if (result?.__status) return respond(result.__status, { queued: true });
    // Deep copy so callers can't mutate the mock's records in place
    return respond(method === "post" && /\/(vessels|ports|commodities|parties|customers|users|fx-rates|quotes|rate-tables)$/.test(path) ? 201 : 200, structuredClone(result));
  } catch (e) {
    if (!(e instanceof HttpError)) {
      console.error("[marine mock]", e);
      e = new HttpError(500, "The mock backend failed. See the console.");
    }
    const res = respond(e.status, { status: e.status, code: e.code, message: e.message, fields: e.fields, correlationId });
    throw new AxiosError(e.message, e.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST, config, {}, res);
  }
}

