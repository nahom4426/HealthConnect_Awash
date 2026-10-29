// Customer registration (KYC) on top of the parties table: a customer is a party of type INSURED with
// its identity, address and documents. Registered customers wait for approval; only approved ones can
// be insured (quotes and open covers check it). Records seeded before registration existed have no
// status and count as approved.
import { db, fail, invalid, nowIso, year, lc, listParam, actor, audit, page, partyRef, on, hasRole, brokerOnly, caller } from "./core";
import { todayIso } from "../utils/format";
import { CUSTOMER_DOCUMENT_KINDS, ETH_REGIONS } from "../constants";

const REGISTER = ["ADMIN", "BROKER", "UNDERWRITER", "SENIOR_UNDERWRITER"];
const APPROVE = ["ADMIN", "UNDERWRITER", "SENIOR_UNDERWRITER"];
const READ = [...REGISTER, "CLAIMS_HANDLER", "CLAIMS_MANAGER", "FINANCE"];
const MAX_FILE = 20 * 1024 * 1024;
const FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export const customerStatus = (p) => p.status ?? "APPROVED";
export const isCustomer = (p) => p.types?.includes("INSURED");
const mine = (p) => !brokerOnly() || p.brokerId === caller.brokerPartyId;

function documentChecklist(p) {
  return CUSTOMER_DOCUMENT_KINDS.filter((k) => k.for === (p.kind ?? "COMPANY") || k.for === "ANY").map((k) => {
    const files = (p.documents ?? []).filter((d) => d.kind === k.value);
    return { kind: k.value, label: k.label, mandatory: k.mandatory, status: files.length ? "RECEIVED" : "MISSING", files };
  });
}
const missingDocuments = (p) => documentChecklist(p).filter((d) => d.mandatory && d.status === "MISSING");

export function customerView(p) {
  const policies = db.policies.filter((x) => x.snapshot?.insuredId === p.id);
  const outstanding = db.notes
    .filter((n) => n.customerId === p.id && ["UNPAID", "PARTLY_PAID"].includes(n.status))
    .reduce((sum, n) => sum + (n.kind === "DEBIT" ? 1 : -1) * (Number(n.total) - Number(n.paid)), 0);
  return {
    ...p,
    kind: p.kind ?? "COMPANY",
    status: customerStatus(p),
    broker: p.brokerId ? partyRef(p.brokerId) : null,
    documentsChecklist: documentChecklist(p),
    missingDocuments: missingDocuments(p).map((d) => d.label),
    policyCount: policies.length,
    activePolicyCount: policies.filter((x) => x.status === "ACTIVE").length,
    outstanding: outstanding.toFixed(2),
  };
}

function getCustomer(id) {
  if (!hasRole(...READ)) fail(403, "You don't have permission for this action.");
  const p = db.parties.find((x) => x.id === id && isCustomer(x)) ?? fail(404, "Customer not found");
  if (!mine(p)) fail(404, "Customer not found");
  return p;
}

const IDENTITY = ["kind", "name", "tin", "tradeLicenceNo", "idType", "idNumber", "firstName", "fatherName", "grandfatherName"];
const FIELDS = [
  ...IDENTITY, "tradeLicenceExpiry", "vatRegNo", "businessType", "contactPerson", "dateOfBirth", "phone", "email", "addressParts", "brokerId",
];
const blank = (v) => !String(v ?? "").trim();

function customerErrors(b, id) {
  const e = [];
  const req = (field, label) => blank(b[field]) && e.push({ field, message: `${label} is required` });
  if (!["COMPANY", "INDIVIDUAL"].includes(b.kind)) e.push({ field: "kind", message: "Pick company or individual" });
  if (b.kind === "COMPANY") {
    req("name", "Company name");
    if (!/^\d{10}$/.test(String(b.tin ?? ""))) e.push({ field: "tin", message: "TIN is 10 digits" });
    req("tradeLicenceNo", "Trade licence number");
    if (blank(b.tradeLicenceExpiry)) e.push({ field: "tradeLicenceExpiry", message: "Licence expiry is required" });
    else if (b.tradeLicenceExpiry < todayIso()) e.push({ field: "tradeLicenceExpiry", message: "The trade licence has expired" });
    req("businessType", "Business type");
    req("contactPerson", "Contact person");
  }
  if (b.kind === "INDIVIDUAL") {
    req("firstName", "First name");
    req("fatherName", "Father's name");
    req("grandfatherName", "Grandfather's name");
    req("idType", "ID type");
    req("idNumber", "ID number");
    if (b.tin && !/^\d{10}$/.test(b.tin)) e.push({ field: "tin", message: "TIN is 10 digits" });
    if (b.dateOfBirth && b.dateOfBirth > todayIso()) e.push({ field: "dateOfBirth", message: "Date of birth can't be in the future" });
  }
  if (String(b.phone ?? "").replace(/\D/g, "").length < 9) e.push({ field: "phone", message: "Enter a phone number with at least 9 digits" });
  if (b.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) e.push({ field: "email", message: "Enter a valid email" });
  if (!ETH_REGIONS.includes(b.addressParts?.region)) e.push({ field: "addressParts.region", message: "Pick a region" });
  if (blank(b.addressParts?.city)) e.push({ field: "addressParts.city", message: "City is required" });

  // Duplicates: the same TIN, trade licence or ID can't be registered twice
  const others = db.parties.filter((p) => p.id !== id);
  if (b.tin && /^\d{10}$/.test(b.tin)) {
    const dup = others.find((p) => p.tin === b.tin);
    if (dup) e.push({ field: "tin", message: `This TIN is already registered to ${dup.name}` });
  }
  if (b.kind === "COMPANY" && b.tradeLicenceNo) {
    const dup = others.find((p) => lc(p.tradeLicenceNo) === lc(b.tradeLicenceNo));
    if (dup) e.push({ field: "tradeLicenceNo", message: `This licence is already registered to ${dup.name}` });
  }
  if (b.kind === "INDIVIDUAL" && b.idNumber) {
    const dup = others.find((p) => p.idType === b.idType && lc(p.idNumber) === lc(b.idNumber));
    if (dup) e.push({ field: "idNumber", message: `This ID is already registered to ${dup.name}` });
  }
  return e;
}

function normalise(b) {
  const c = Object.fromEntries(FIELDS.filter((k) => k in b).map((k) => [k, typeof b[k] === "string" ? b[k].trim() : b[k]]));
  if (c.kind === "INDIVIDUAL") c.name = [c.firstName, c.fatherName, c.grandfatherName].filter(Boolean).join(" ");
  const a = c.addressParts ?? {};
  c.address = [a.houseNo && `House ${a.houseNo}`, a.woreda && `Woreda ${a.woreda}`, a.subCity, a.city, a.region !== a.city ? a.region : ""].filter(Boolean).join(", ");
  if (brokerOnly()) c.brokerId = caller.brokerPartyId;
  return c;
}

on("get", "/customers", ({ query }) => {
  if (!hasRole(...READ)) fail(403, "You don't have permission for this action.");
  const q = lc(query.q);
  const statuses = listParam(query.status);
  let items = db.parties.filter((p) => isCustomer(p) && mine(p)).map(customerView);
  if (q) items = items.filter((c) => lc(`${c.name} ${c.customerNo} ${c.tin} ${c.tradeLicenceNo} ${c.idNumber} ${c.phone} ${c.email}`).includes(q));
  if (statuses.length) items = items.filter((c) => statuses.includes(c.status));
  if (query.kind) items = items.filter((c) => c.kind === query.kind);
  if (query.brokerId) items = items.filter((c) => c.brokerId === query.brokerId);
  return page(items, query, { sortDefault: "name,asc" });
});

on("get", "/customers/:id", ({ params }) => customerView(getCustomer(params.id)));

on("post", "/customers", ({ body }) => {
  if (!hasRole(...REGISTER)) fail(403, "You don't have permission for this action.");
  const e = customerErrors(body ?? {});
  if (e.length) invalid(e);
  const p = {
    id: String(db.seq.party++),
    types: ["INSURED"],
    tin: "",
    email: "",
    contactPerson: "",
    ...normalise(body),
    customerNo: `CU-${year()}-${String(++db.seq.customer).padStart(5, "0")}`,
    status: "PENDING_APPROVAL",
    documents: [],
    registeredBy: actor(),
    registeredAt: nowIso(),
  };
  db.parties.push(p);
  audit("customer", p.id, `Registered ${p.customerNo}`);
  return customerView(p);
});

on("put", "/customers/:id", ({ params, body }) => {
  const p = getCustomer(params.id);
  if (!hasRole(...REGISTER)) fail(403, "You don't have permission for this action.");
  const next = { ...p, ...body, kind: p.kind ?? body.kind };
  const e = customerErrors(next, p.id);
  if (e.length) invalid(e);
  const before = { ...p };
  Object.assign(p, normalise(next));
  // Changing who the customer is sends an approved or rejected record back for approval
  const identityChanged = IDENTITY.some((k) => String(before[k] ?? "") !== String(p[k] ?? ""));
  if (customerStatus(before) === "REJECTED" || (customerStatus(before) === "APPROVED" && identityChanged)) {
    Object.assign(p, { status: "PENDING_APPROVAL", approvedBy: null, approvedAt: null, rejectReason: "" });
  }
  audit("customer", p.id, identityChanged && customerStatus(before) === "APPROVED" ? "Identity changed: back to pending approval" : "Updated", before, p);
  return customerView(p);
});

on("post", "/customers/:id/documents", ({ params, body }) => {
  const p = getCustomer(params.id);
  const file = body instanceof FormData ? body.get("file") : null;
  const kind = body instanceof FormData ? body.get("kind") : null;
  if (!file) invalid([{ field: "file", message: "Choose a file" }]);
  if (!FILE_TYPES.includes(file.type)) invalid([{ field: "file", message: "Only PDF, JPG and PNG files can be uploaded" }]);
  if (file.size > MAX_FILE) invalid([{ field: "file", message: "Files can be at most 20 MB" }]);
  p.documents = p.documents ?? [];
  const doc = { id: String(++db.seq.document), kind: kind || "OTHER", name: file.name, size: file.size, type: file.type, uploadedBy: actor(), uploadedAt: nowIso() };
  p.documents.push(doc);
  audit("customer", p.id, `Document uploaded: ${doc.name}`);
  return customerView(p);
});

on("post", "/customers/:id/approve", ({ params, body }) => {
  if (!hasRole(...APPROVE)) fail(403, "You don't have permission for this action.");
  const p = getCustomer(params.id);
  if (customerStatus(p) !== "PENDING_APPROVAL") fail(409, "Only a customer pending approval can be approved.", { code: "WRONG_STATE" });
  const missing = missingDocuments(p);
  if (missing.length)
    fail(422, `Missing documents: ${missing.map((d) => d.label).join(", ")}.`, {
      code: "MISSING_DOCUMENTS",
      fields: missing.map((d) => ({ field: `documents.${d.kind}`, message: `${d.label} is missing` })),
    });
  Object.assign(p, { status: "APPROVED", approvedBy: actor(), approvedAt: nowIso(), approvalNote: String(body?.note ?? "").trim(), rejectReason: "" });
  audit("customer", p.id, "Approved");
  return customerView(p);
});

on("post", "/customers/:id/reject", ({ params, body }) => {
  if (!hasRole(...APPROVE)) fail(403, "You don't have permission for this action.");
  const p = getCustomer(params.id);
  if (customerStatus(p) !== "PENDING_APPROVAL") fail(409, "Only a customer pending approval can be rejected.", { code: "WRONG_STATE" });
  const reason = String(body?.reason ?? "").trim();
  if (reason.length < 10) invalid([{ field: "reason", message: "Give a reason of at least 10 characters" }]);
  Object.assign(p, { status: "REJECTED", rejectReason: reason, rejectedBy: actor(), rejectedAt: nowIso() });
  audit("customer", p.id, `Rejected: ${reason}`);
  return customerView(p);
});

/** 422 field error when a quote or open cover names a customer who isn't approved. */
export function approvedCustomerError(partyId, field = "insuredId") {
  const p = db.parties.find((x) => x.id === String(partyId));
  if (!p || !isCustomer(p) || customerStatus(p) === "APPROVED") return null;
  return { field, message: customerStatus(p) === "REJECTED" ? `${p.name} was rejected and can't be insured` : `${p.name} is waiting for approval and can't be insured yet` };
}
