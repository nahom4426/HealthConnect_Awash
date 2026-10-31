// Phase 4 of the mock backend (plan section 8): claims with survey, general average, salvage,
// carrier recovery, documents, deadlines and settlement (MAR-41 to MAR-46).
import {
  db, fail, invalid, nowIso, year, lc, listParam, actor, audit, page, inRange, partyRef, vesselRef, portRef, on, hasRole, caller,
  certificateStatus, nextId, fxFor,
} from "./core";
import { addDays, daysBetween, todayIso } from "../utils/format";
import { multiply, parseDecimal, toFixedString } from "../utils/money";
import { CAUSES_OF_LOSS, DOCUMENT_KINDS } from "../constants";

const CLAIMS = ["CLAIMS_HANDLER", "CLAIMS_MANAGER"];
const money = (v) => parseDecimal(v) ?? 0n;

function exclusionsAtLoss(conditions, cover) {
  const left = String(conditions ?? "").trim();
  const right = String(cover ?? "").trim();
  if (!right || left.includes(right)) return left || null;
  return left ? `${left}\n${right}` : right;
}

function claimsCeiling() {
  const manager = money(db.rules.authority.find((a) => a.role === "CLAIMS_MANAGER")?.maxSumInsured ?? "0");
  const handler = money(db.rules.authority.find((a) => a.role === "CLAIMS_HANDLER")?.maxSumInsured ?? "0");
  if (hasRole("CLAIMS_MANAGER") || caller.roles.length === 0) return manager;
  if (hasRole("CLAIMS_HANDLER")) return handler;
  return 0n;
}

function refuseReserve(claim, amount) {
  const rate = fxFor(claim.currency)?.rate ?? "1";
  const etb = multiply(amount, rate) ?? 0n;
  if (etb > claimsCeiling()) fail(403, "This reserve is above your claims authority.", { code: "ABOVE_AUTHORITY" });
}

function checkPaymentRef(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return "Payment reference is required";
  if (value.length > 80) return "Payment reference must be 80 characters or less";
  if ([...value].some((ch) => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127)) return "Payment reference cannot contain control characters";
  const used = db.claims.some((c) => (c.payments ?? []).some((p) => String(p.paymentRef).trim().toLowerCase() === value.toLowerCase()));
  if (used) return "This payment reference is already recorded";
  return "";
}
const s = (v) => toFixedString(v);
const MAX_FILE = 20 * 1024 * 1024;
const FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];

// ── clause check (MAR-41): which causes each Institute Cargo Clause names ──
const NAMED = {
  ICC_A: null, // all risks: every cause is covered unless excluded
  ICC_B: ["WATER_DAMAGE", "FIRE", "SINKING", "OVERTURNING"],
  ICC_C: ["FIRE", "SINKING", "OVERTURNING"],
};
export function clauseCheck(clause, cause) {
  const name = String(clause ?? "").replace("_", " ");
  const causeLabel = (CAUSES_OF_LOSS.find((c) => c.value === cause)?.label ?? cause).toLowerCase();
  if (cause === "OTHER") return { result: "CHECK", message: `Check the cause against ${name} manually` };
  const named = NAMED[clause];
  if (named === null || named?.includes(cause)) return { result: "COVERED", message: `Covered under ${name}` };
  return { result: "NOT_COVERED", message: `Not covered under ${name}: ${causeLabel} is not a named peril` };
}

// ── deadlines (MAR-45) ──
function baseDate(claim, base) {
  return { LOSS_DATE: claim.lossDate, NOTIFIED_DATE: claim.notifiedDate, DELIVERY_DATE: claim.deliveryDate, SURVEY_APPOINTMENT: claim.survey?.appointedDate }[base] ?? null;
}

/** Creates the deadlines whose base date is known; keeps open ones in step with changed dates. */
function syncDeadlines(claim) {
  for (const rule of db.rules.deadlines) {
    const base = baseDate(claim, rule.base);
    let d = db.deadlines.find((x) => x.claimId === claim.id && x.kind === rule.kind);
    if (!base) continue;
    // An appointed survey sets its own due date
    const due = rule.kind === "SURVEY" && claim.survey?.dueDate ? claim.survey.dueDate : addDays(base, Number(rule.days));
    if (!d) {
      d = { id: String(++db.seq.deadline), claimId: claim.id, kind: rule.kind, base: rule.base, alerts: rule.alerts, status: "OPEN", createdAt: nowIso() };
      db.deadlines.push(d);
    }
    if (d.status === "OPEN") Object.assign(d, { baseDate: base, dueDate: due });
  }
}

function meetDeadline(claim, kind, note) {
  const d = db.deadlines.find((x) => x.claimId === claim.id && x.kind === kind && x.status === "OPEN");
  if (d) Object.assign(d, { status: "MET", metAt: nowIso(), metBy: actor(), metNote: note });
}

function deadlineView(d) {
  const today = todayIso();
  const left = daysBetween(today, d.dueDate);
  const claim = db.claims.find((c) => c.id === d.claimId);
  return {
    ...d,
    claimNo: claim?.claimNo ?? null,
    daysLeft: left,
    overdue: d.status === "OPEN" && left < 0,
    // Alerts go out at each window the deadline has passed; overdue ones escalate on the due date
    alertsSent: d.status === "OPEN" ? (d.alerts ?? []).filter((w) => left <= w).map((w) => addDays(d.dueDate, -w)) : [],
    escalatedAt: d.status === "OPEN" && left < 0 ? d.dueDate : null,
  };
}

// ── views ──
function certFor(claim) {
  return db.certificates.find((c) => c.id === claim.certificateId);
}
function snapshotFor(claim) {
  const c = certFor(claim);
  return c?.snapshot ?? db.policies.find((p) => p.id === c?.policyId)?.snapshot ?? {};
}

function moneyStrip(claim) {
  const paid = claim.payments.reduce((t, p) => t + money(p.amount), 0n);
  const gaSalvage = claim.ga.reduce((t, g) => t + money(g.contributionAmount), 0n) + claim.salvage.reduce((t, x) => t + money(x.amount), 0n);
  const recovered = money(claim.recovery?.amountRecovered);
  return {
    currency: claim.currency,
    estimated: claim.estimatedAmount,
    reserve: claim.reserve ?? null,
    paid: s(paid),
    gaSalvage: s(gaSalvage),
    recovered: s(recovered),
    net: s(paid + gaSalvage - recovered),
  };
}

function documentChecklist(claim) {
  return DOCUMENT_KINDS.map((k) => {
    const files = claim.documents.filter((d) => d.kind === k.value);
    return { kind: k.value, label: k.label, mandatory: k.mandatory, status: files.length ? "RECEIVED" : "MISSING", files };
  });
}
const missingMandatory = (claim) => documentChecklist(claim).filter((d) => d.mandatory && d.status === "MISSING");

function displayStatus(claim) {
  if (claim.status === "PAID" && claim.recovery?.status === "OPEN") return "RECOVERY";
  return claim.status;
}

function claimRow(claim) {
  const cert = certFor(claim);
  const snap = snapshotFor(claim);
  const open = db.deadlines.filter((d) => d.claimId === claim.id && d.status === "OPEN").sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const strip = moneyStrip(claim);
  return {
    id: claim.id,
    claimNo: claim.claimNo,
    certificateId: claim.certificateId,
    certNo: cert?.certNo,
    policyId: cert?.policyId,
    insured: partyRef(snap.insuredId),
    type: claim.type,
    cause: claim.cause,
    lossDate: claim.lossDate,
    status: displayStatus(claim),
    reserve: strip.reserve,
    paid: strip.paid,
    currency: claim.currency,
    nextDeadline: open[0] ? deadlineView(open[0]) : null,
    handlerName: claim.handlerName,
    blNo: snap.blNo,
    updatedAt: claim.updatedAt,
  };
}

function claimView(claim) {
  const cert = certFor(claim);
  const snap = snapshotFor(claim);
  const policy = db.policies.find((p) => p.id === cert?.policyId);
  return {
    ...claim,
    ...claimRow(claim),
    certificate: cert
      ? { id: cert.id, certNo: cert.certNo, version: cert.version, status: certificateStatus(cert), sumInsured: snap.premium?.sumInsured?.total, clause: snap.clause, vessel: vesselRef(snap.vesselImo)?.name ?? null }
      : null,
    policy: policy ? { id: policy.id, policyNo: policy.policyNo, periodFrom: policy.periodFrom, periodTo: policy.periodTo } : null,
    lossPayee: snap.lc?.enabled ? partyRef(snap.lc.bankId) : null,
    deductible: snap.deductible || "0",
    payee: partyRef(claim.payeeId),
    voyage: `${portRef(snap.portOfLoading)?.name ?? "—"} → ${portRef(snap.portOfDischarge)?.name ?? "—"}`,
    money: moneyStrip(claim),
    documentsChecklist: documentChecklist(claim),
    missingDocuments: missingMandatory(claim).map((d) => d.label),
    deadlines: db.deadlines.filter((d) => d.claimId === claim.id).map(deadlineView).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    survey: claim.survey ? { ...claim.survey, surveyor: partyRef(claim.survey.surveyorId) } : null,
    ga: claim.ga.map((g) => ({ ...g, adjuster: partyRef(g.adjusterId) })),
    salvage: claim.salvage.map((x) => ({ ...x, salvor: partyRef(x.salvorId) })),
    recovery: claim.recovery ? { ...claim.recovery, carrier: partyRef(claim.recovery.carrierId) } : null,
    recoveryResolved: !claim.recovery || claim.recovery.status !== "OPEN",
  };
}

const getClaim = (id) => {
  if (!hasRole(...CLAIMS)) fail(403, "You don't have permission for this action.");
  return db.claims.find((c) => c.id === id) ?? fail(404, "Claim not found");
};
const touch = (claim, action, note) => {
  claim.updatedAt = nowIso();
  claim.history.push({ at: nowIso(), by: actor(), action, note: note ?? "" });
  audit("claim", claim.id, action + (note ? `: ${note}` : ""));
};
function setStatus(claim, status, note) {
  claim.status = status;
  touch(claim, `Status ${status.toLowerCase()}`, note);
}

// ── list and register ──
on("get", "/claims", ({ query }) => {
  if (!hasRole(...CLAIMS)) fail(403, "You don't have permission for this action.");
  const q = lc(query.q);
  const statuses = listParam(query.status);
  let items = db.claims.map(claimRow);
  if (q) items = items.filter((c) => lc(`${c.claimNo} ${c.certNo} ${c.blNo} ${c.insured?.name}`).includes(q));
  if (statuses.length) items = items.filter((c) => statuses.includes(c.status));
  if (query.type) items = items.filter((c) => c.type === query.type);
  if (query.handler) items = items.filter((c) => lc(c.handlerName).includes(lc(query.handler)));
  if (query.policyId) items = items.filter((c) => c.policyId === query.policyId);
  if (query.certificateId) items = items.filter((c) => c.certificateId === query.certificateId);
  items = items.filter((c) => inRange(c.lossDate, query.lossFrom, query.lossTo));
  if (query.overdue === "true") items = items.filter((c) => c.nextDeadline?.overdue);
  // Default sort: next deadline, soonest first; claims with none go last
  if (!query.sort || query.sort === "nextDeadline,asc")
    items = items.map((c) => ({ ...c, nextDue: c.nextDeadline?.dueDate ?? "9999-12-31" }));
  return page(items, { ...query, sort: !query.sort || query.sort === "nextDeadline,asc" ? "nextDue,asc" : query.sort });
});

on("get", "/claims/:id", ({ params }) => claimView(getClaim(params.id)));

function lossErrors(b, cert) {
  const e = [];
  const today = todayIso();
  if (!b.lossDate) e.push({ field: "lossDate", message: "Loss date is required" });
  else if (b.lossDate > today) e.push({ field: "lossDate", message: "Loss date can't be in the future" });
  if (!b.notifiedDate) e.push({ field: "notifiedDate", message: "Notified date is required" });
  else if (b.lossDate && b.notifiedDate < b.lossDate) e.push({ field: "notifiedDate", message: "Notified date can't be before the loss date" });
  if (b.deliveryDate && b.lossDate && b.deliveryDate < b.lossDate) e.push({ field: "deliveryDate", message: "Delivery date can't be before the loss date" });
  if (!["PARTICULAR_AVERAGE", "GENERAL_AVERAGE", "SALVAGE", "TOTAL_LOSS"].includes(b.type)) e.push({ field: "type", message: "Pick a claim type" });
  if (!CAUSES_OF_LOSS.some((c) => c.value === b.cause)) e.push({ field: "cause", message: "Pick a cause of loss" });
  if (!String(b.description ?? "").trim()) e.push({ field: "description", message: "Description is required" });
  else if (b.description.length > 2000) e.push({ field: "description", message: "At most 2000 characters" });
  if (!String(b.lossLocation ?? "").trim()) e.push({ field: "lossLocation", message: "Loss location is required" });
  else if (b.lossLocation.length > 200) e.push({ field: "lossLocation", message: "Loss location must be 200 characters or less" });
  if (!String(b.affectedGoods ?? "").trim()) e.push({ field: "affectedGoods", message: "Affected goods are required" });
  else if (b.affectedGoods.length > 500) e.push({ field: "affectedGoods", message: "Affected goods must be 500 characters or less" });
  if (!(money(b.estimatedAmount) > 0n)) e.push({ field: "estimatedAmount", message: "Estimated amount must be greater than 0" });
  if (!b.payeeId) e.push({ field: "payee", message: "Payee is required" });
  if (cert === undefined) e.push({ field: "certificate", message: "Find the certificate first" });
  return e;
}

on("post", "/claims", ({ body }) => {
  if (!hasRole("CLAIMS_HANDLER", "CLAIMS_MANAGER")) fail(403, "You don't have permission for this action.");
  const cert = db.certificates.find((c) => c.id === body?.certificateId);
  const e = lossErrors(body ?? {}, cert);
  if (cert && certificateStatus(cert) === "CANCELLED") e.push({ field: "certificate", message: "A cancelled certificate can't take a claim" });
  if (e.length) invalid(e);
  const snap = cert.snapshot ?? db.policies.find((p) => p.id === cert.policyId)?.snapshot;
  const policy = db.policies.find((p) => p.id === cert.policyId);
  const claim = {
    id: nextId(db.claims),
    claimNo: `CL-${year()}-${String(++db.seq.claim).padStart(5, "0")}`,
    certificateId: cert.id,
    status: "REGISTERED",
    type: body.type,
    cause: body.cause,
    lossDate: body.lossDate,
    notifiedDate: body.notifiedDate,
    deliveryDate: body.deliveryDate || null,
    description: body.description.trim(),
    lossLocation: body.lossLocation.trim(),
    affectedGoods: body.affectedGoods.trim(),
    quoteId: policy?.snapshot?.id ?? null,
    quoteNo: policy?.snapshot?.quoteNo ?? null,
    insuredId: snap.insuredId ?? null,
    coverageClause: snap.clause ?? null,
    exclusions: exclusionsAtLoss(snap.specialConditions, snap.openCoverId ? db.openCovers.find((c) => c.id === snap.openCoverId)?.exclusions : null),
    currency: snap.currency,
    estimatedAmount: body.estimatedAmount,
    payeeId: body.payeeId,
    payeeNote: body.payeeNote ?? "",
    handlerName: actor(),
    clauseCheck: clauseCheck(snap.clause, body.cause),
    outsidePeriod: body.lossDate < policy.periodFrom || body.lossDate > policy.periodTo,
    reserve: null,
    assessment: null,
    survey: null,
    ga: [],
    salvage: [],
    recovery: null,
    documents: [],
    payments: [],
    history: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.claims.push(claim);
  touch(claim, `Registered against ${cert.certNo}`);
  syncDeadlines(claim);
  return claimView(claim);
});

on("put", "/claims/:id", ({ params, body }) => {
  const claim = getClaim(params.id);
  if (claim.status !== "REGISTERED") fail(409, "Loss details can only be changed while the claim is Registered.", { code: "WRONG_STATE" });
  const e = lossErrors({ ...claim, ...body }, certFor(claim));
  if (e.length) invalid(e);
  const before = { ...claim };
  ["lossDate", "notifiedDate", "deliveryDate", "type", "cause", "description", "lossLocation", "affectedGoods", "estimatedAmount", "payeeId", "payeeNote"].forEach((k) => k in body && (claim[k] = body[k] || (k === "deliveryDate" ? null : body[k])));
  claim.clauseCheck = clauseCheck(snapshotFor(claim).clause, claim.cause);
  const policy = db.policies.find((p) => p.id === certFor(claim).policyId);
  claim.outsidePeriod = claim.lossDate < policy.periodFrom || claim.lossDate > policy.periodTo;
  audit("claim", claim.id, "Loss details updated", before, claim);
  touch(claim, "Loss details updated");
  syncDeadlines(claim);
  return claimView(claim);
});

// ── tasks: survey, general average, salvage, recovery (MAR-42 to MAR-44) ──
function taskErrors(kind, b) {
  const e = [];
  if (kind === "SURVEY") {
    if (!b.surveyorId) e.push({ field: "surveyor", message: "Surveyor is required" });
    else if (!db.parties.find((p) => p.id === b.surveyorId)?.types?.includes("SURVEYOR")) e.push({ field: "surveyor", message: "This party is not a surveyor" });
    if (!b.appointedDate) e.push({ field: "appointedDate", message: "Appointed date is required" });
    if (!b.dueDate) e.push({ field: "dueDate", message: "Due date is required" });
    else if (b.appointedDate && b.dueDate <= b.appointedDate) e.push({ field: "dueDate", message: "Due date must be after the appointed date" });
    if (b.fee && money(b.fee) < 0n) e.push({ field: "fee", message: "Fee can't be negative" });
  }
  if (kind === "GA") {
    if (!b.declarationDate) e.push({ field: "declarationDate", message: "Declaration date is required" });
    if (!b.adjusterId) e.push({ field: "adjuster", message: "Adjuster is required" });
    if (!["GA_BOND", "GUARANTEE"].includes(b.securityType)) e.push({ field: "securityType", message: "Pick a security type" });
    if (!(money(b.contributionAmount) >= 0n)) e.push({ field: "contributionAmount", message: "Contribution must be 0 or more" });
  }
  if (kind === "SALVAGE") {
    if (!b.salvorId) e.push({ field: "salvor", message: "Salvor is required" });
    if (!(money(b.amount) > 0n)) e.push({ field: "amount", message: "Award or charges must be greater than 0" });
  }
  if (kind === "RECOVERY") {
    if (!b.carrierId) e.push({ field: "carrier", message: "Carrier is required" });
    if (money(b.amountRecovered) > money(b.amountClaimed)) e.push({ field: "amountRecovered", message: "Recovered can't be more than claimed" });
    if (!["OPEN", "RECOVERED", "PARTLY_RECOVERED", "WRITTEN_OFF"].includes(b.status ?? "OPEN")) e.push({ field: "status", message: "Pick a status" });
  }
  return e;
}

function saveTask(claim, body, taskId) {
  const kind = body?.kind;
  if (!["SURVEY", "GA", "SALVAGE", "RECOVERY"].includes(kind)) invalid([{ field: "kind", message: "Unknown task" }]);
  if (["CLOSED", "DECLINED"].includes(claim.status)) fail(409, "This claim is closed.", { code: "WRONG_STATE" });
  const e = taskErrors(kind, body);
  if (e.length) invalid(e);
  const { kind: _k, id: _i, ...data } = body;
  if (kind === "SURVEY") {
    claim.survey = { ...(claim.survey ?? { id: String(++db.seq.task) }), ...data };
    touch(claim, claim.survey.reportReceivedAt ? "Survey updated" : `Surveyor appointed: ${partyRef(data.surveyorId)?.name}`);
    syncDeadlines(claim);
  } else if (kind === "RECOVERY") {
    const wasNotified = !!claim.recovery?.noticeSentDate;
    claim.recovery = { status: "OPEN", ...(claim.recovery ?? { id: String(++db.seq.task) }), ...data };
    if (data.noticeSentDate && !wasNotified) meetDeadline(claim, "CARRIER_NOTICE", `Notice sent to ${partyRef(data.carrierId)?.name} on ${data.noticeSentDate}`);
    touch(claim, `Recovery ${claim.recovery.status.toLowerCase().replace("_", " ")}`);
  } else {
    const list = kind === "GA" ? claim.ga : claim.salvage;
    const existing = taskId ? list.find((t) => t.id === taskId) : null;
    if (taskId && !existing) fail(404, "Task not found");
    if (existing) Object.assign(existing, data);
    else list.push({ id: String(++db.seq.task), ...data, createdAt: nowIso() });
    touch(claim, kind === "GA" ? "General average recorded" : "Salvage recorded");
  }
  return claimView(claim);
}
on("post", "/claims/:id/tasks", ({ params, body }) => saveTask(getClaim(params.id), body));
on("put", "/claims/:id/tasks/:taskId", ({ params, body }) => saveTask(getClaim(params.id), body, params.taskId));

// ── documents (MAR-46) ──
on("post", "/claims/:id/documents", ({ params, body }) => {
  const claim = getClaim(params.id);
  const file = body instanceof FormData ? body.get("file") : null;
  const kind = body instanceof FormData ? body.get("kind") : null;
  if (!file) invalid([{ field: "file", message: "Choose a file" }]);
  if (!FILE_TYPES.includes(file.type)) invalid([{ field: "file", message: "Only PDF, JPG and PNG files can be uploaded" }]);
  if (file.size > MAX_FILE) invalid([{ field: "file", message: "Files can be at most 20 MB" }]);
  const doc = { id: String(++db.seq.document), kind: kind || "OTHER", name: file.name, size: file.size, type: file.type, uploadedBy: actor(), uploadedAt: nowIso() };
  claim.documents.push(doc);
  if (doc.kind === "SURVEY_REPORT" && claim.survey && !claim.survey.reportReceivedAt) {
    claim.survey.reportReceivedAt = nowIso();
    meetDeadline(claim, "SURVEY", `Survey report ${doc.name} received`);
    if (claim.status === "REGISTERED") setStatus(claim, "SURVEYED", "Survey report received");
  }
  if (doc.kind === "CARRIER_NOTICE") meetDeadline(claim, "CARRIER_NOTICE", `Notice ${doc.name} on file`);
  if (!missingMandatory(claim).length) meetDeadline(claim, "DOCUMENTS", "All mandatory documents received");
  touch(claim, `Document uploaded: ${doc.name}`);
  return claimView(claim);
});

// ── assess, settle, close ──
on("post", "/claims/:id/assess", ({ params, body }) => {
  const claim = getClaim(params.id);
  if (!["REGISTERED", "SURVEYED"].includes(claim.status)) fail(409, "Only a Registered or Surveyed claim can be assessed.", { code: "WRONG_STATE" });
  if (body?.covered === true) {
    if (!(money(body.reserve) > 0n)) invalid([{ field: "reserve", message: "Reserve must be greater than 0" }]);
    refuseReserve(claim, body.reserve);
    claim.reserve = body.reserve;
    claim.assessment = { covered: true, reserve: body.reserve, by: actor(), at: nowIso() };
    setStatus(claim, "APPROVED", `Covered, reserve ${claim.currency} ${body.reserve}`);
  } else if (body?.covered === false) {
    const reason = String(body.reason ?? "").trim();
    if (reason.length < 10) invalid([{ field: "reason", message: "Give a reason of at least 10 characters" }]);
    claim.assessment = { covered: false, reason, by: actor(), at: nowIso() };
    setStatus(claim, "DECLINED", reason);
  } else invalid([{ field: "covered", message: "Say whether the loss is covered" }]);
  return claimView(claim);
});

on("put", "/claims/:id/reserve", ({ params, body }) => {
  const claim = getClaim(params.id);
  if (!(money(body?.reserve) > 0n)) invalid([{ field: "reserve", message: "Reserve must be greater than 0" }]);
  refuseReserve(claim, body.reserve);
  claim.reserve = body.reserve;
  touch(claim, `Reserve set to ${claim.currency} ${body.reserve}`);
  return claimView(claim);
});

on("post", "/claims/:id/settle", ({ params, body }) => {
  const claim = getClaim(params.id);
  if (!hasRole("CLAIMS_MANAGER")) fail(403, "Only a claims manager can settle claims.");
  if (claim.status !== "APPROVED") fail(409, "Only an approved claim can be settled.", { code: "WRONG_STATE" });
  const e = [];
  if (!(money(body?.amount) > 0n)) e.push({ field: "amount", message: "Amount must be greater than 0" });
  if (!body?.payeeId) e.push({ field: "payee", message: "Payee is required" });
  const lossPayee = snapshotFor(claim).lc?.enabled ? snapshotFor(claim).lc.bankId : null;
  if (lossPayee && body?.payeeId !== lossPayee && !String(body?.payeeNote ?? "").trim()) e.push({ field: "payeeNote", message: "Say why payment doesn't go to the loss payee" });
  const paymentRefError = checkPaymentRef(body?.paymentRef);
  if (paymentRefError) e.push({ field: "paymentRef", message: paymentRefError });
  if (e.length) invalid(e);
  const missing = missingMandatory(claim);
  if (missing.length)
    fail(422, `Missing mandatory documents: ${missing.map((d) => d.label).join(", ")}.`, {
      code: "MISSING_DOCUMENTS",
      fields: missing.map((d) => ({ field: `documents.${d.kind}`, message: `${d.label} is missing` })),
    });
  const rate = fxFor(claim.currency)?.rate ?? "1";
  const etb = multiply(body.amount, rate) ?? 0n;
  const limit = db.rules.authority.find((a) => a.role === "CLAIMS_MANAGER")?.maxSumInsured ?? "0";
  if (etb > money(limit)) fail(403, "Needs a higher approval limit.", { code: "ABOVE_AUTHORITY" });
  claim.payments.push({ id: String(++db.seq.payment), amount: body.amount, payeeId: body.payeeId, payeeNote: body.payeeNote ?? "", paymentRef: body.paymentRef, paidAt: nowIso(), paidBy: actor(), exportRef: `PAY-${year()}-${String(db.seq.payment).padStart(5, "0")}` });
  claim.payeeId = body.payeeId;
  setStatus(claim, "PAID", `Paid ${claim.currency} ${body.amount}, reference ${body.paymentRef}`);
  return claimView(claim);
});

on("post", "/claims/:id/close", ({ params }) => {
  const claim = getClaim(params.id);
  if (claim.status !== "PAID") fail(409, "Only a paid claim can be closed.", { code: "WRONG_STATE" });
  if (claim.recovery?.status === "OPEN") fail(409, "Resolve the carrier recovery before closing.", { code: "RECOVERY_OPEN" });
  setStatus(claim, "CLOSED");
  db.deadlines.filter((d) => d.claimId === claim.id && d.status === "OPEN").forEach((d) => Object.assign(d, { status: "MET", metAt: nowIso(), metBy: actor(), metNote: "Claim closed" }));
  return claimView(claim);
});

// ── deadlines ──
on("get", "/deadlines", ({ query }) => {
  if (!hasRole(...CLAIMS)) fail(403, "You don't have permission for this action.");
  return db.deadlines.filter((d) => !query.claimId || d.claimId === query.claimId).map(deadlineView);
});
on("post", "/deadlines/:id/met", ({ params, body }) => {
  if (!hasRole(...CLAIMS)) fail(403, "You don't have permission for this action.");
  const d = db.deadlines.find((x) => x.id === params.id) ?? fail(404, "Deadline not found");
  const note = String(body?.note ?? "").trim();
  if (!note) invalid([{ field: "note", message: "A note is required" }]);
  if (d.status !== "OPEN") fail(409, "This deadline is already met.", { code: "WRONG_STATE" });
  Object.assign(d, { status: "MET", metAt: nowIso(), metBy: actor(), metNote: note });
  audit("claim", d.claimId, `Deadline met: ${d.kind.toLowerCase()} (${note})`);
  return deadlineView(d);
});

