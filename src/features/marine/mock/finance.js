// Finance: premium is paid before cover starts. Binding raises a debit note and the certificate waits
// (AWAITING_PAYMENT) until Finance records the receipt; amendments and cancellations raise debit or
// credit notes; a settled claim becomes a payment voucher Finance pays; broker commission is earned on
// premium received and billed in monthly statements. All finance amounts are in ETB.
import { db, fail, invalid, nowIso, year, lc, listParam, actor, audit, page, partyRef, on, hasRole, fxFor } from "./core";
import { addDays, daysBetween, todayIso } from "../utils/format";
import { multiply, parseDecimal, toFixedString } from "../utils/money";

const FINANCE = ["FINANCE"];
const READ = ["FINANCE", "ADMIN"];
const METHODS = ["BANK_TRANSFER", "CHEQUE", "CASH", "TELEBIRR"];
const money = (v) => parseDecimal(v) ?? 0n;
const s = (v) => toFixedString(v);
const PAYMENT_DAYS = 30;

const canRead = () => hasRole(...READ) || fail(403, "You don't have permission for this action.");
const canPost = () => hasRole(...FINANCE) || fail(403, "Only Finance can record payments.");

// ── notes ──
/** Net premium, VAT and stamp duty of a rated premium (the breakdown's lines). */
export function splitPremium(premium) {
  const line = (key) => money(premium?.lines?.find((l) => l.key === key)?.amount);
  const total = money(premium?.total);
  const vat = line("vat");
  const stamp = line("stamp");
  return { net: total - vat - stamp, vat, stamp, total };
}

function nextNoteNo(kind) {
  const key = kind === "DEBIT" ? "debitNote" : "creditNote";
  return `${kind === "DEBIT" ? "DN" : "CN"}-${year()}-${String(++db.seq[key]).padStart(5, "0")}`;
}

/**
 * Raises a note. amounts: { net, vat, stamp } as BigInt (negative = credit). Returns the note, or
 * null for a zero amount.
 */
export function raiseNote({ source, customerId, brokerId = null, policyId = null, certificateId = null, openCoverId = null, amounts, description }) {
  const total = amounts.net + amounts.vat + amounts.stamp;
  if (total === 0n) return null;
  const kind = total > 0n ? "DEBIT" : "CREDIT";
  const sign = kind === "DEBIT" ? 1n : -1n;
  const note = {
    id: String(db.notes.length + 1),
    noteNo: nextNoteNo(kind),
    kind,
    source,
    status: "UNPAID",
    customerId,
    brokerId,
    policyId,
    certificateId,
    openCoverId,
    currency: "ETB",
    net: s(amounts.net * sign),
    vat: s(amounts.vat * sign),
    stamp: s(amounts.stamp * sign),
    total: s(total * sign),
    paid: "0.00",
    description,
    issuedAt: nowIso(),
    dueDate: addDays(todayIso(), PAYMENT_DAYS),
    raisedBy: actor(),
  };
  db.notes.push(note);
  audit("note", note.id, `${note.noteNo} raised: ${description}`);
  return note;
}

/** Cancels the unpaid notes of a policy (cancellation before payment: nothing to refund). */
export function cancelUnpaidNotes(policyId, reason) {
  const notes = db.notes.filter((n) => n.policyId === policyId && n.kind === "DEBIT" && ["UNPAID", "PARTLY_PAID"].includes(n.status));
  notes.forEach((n) => {
    Object.assign(n, { status: "CANCELLED", cancelledAt: nowIso(), cancelReason: reason });
    audit("note", n.id, `${n.noteNo} cancelled: ${reason}`);
  });
  return notes;
}

/** Premium already received on a policy (debit notes paid, in ETB). */
export const paidOnPolicy = (policyId) =>
  db.notes.filter((n) => n.policyId === policyId && n.kind === "DEBIT").reduce((sum, n) => sum + money(n.paid), 0n);

export const outstanding = (n) => money(n.total) - money(n.paid);

const ageDays = (n) => Math.max(0, daysBetween(n.issuedAt.slice(0, 10), todayIso()));

export function noteView(n) {
  const policy = n.policyId ? db.policies.find((p) => p.id === n.policyId) : null;
  const cert = n.certificateId ? db.certificates.find((c) => c.id === n.certificateId) : null;
  const cover = n.openCoverId ? db.openCovers.find((c) => c.id === n.openCoverId) : null;
  return {
    ...n,
    customer: partyRef(n.customerId),
    broker: n.brokerId ? partyRef(n.brokerId) : null,
    policy: policy ? { id: policy.id, policyNo: policy.policyNo } : null,
    certificate: cert ? { id: cert.id, certNo: cert.certNo, version: cert.version } : null,
    openCover: cover ? { id: cover.id, coverNo: cover.coverNo } : null,
    outstanding: s(outstanding(n)),
    ageDays: ageDays(n),
    overdue: ["UNPAID", "PARTLY_PAID"].includes(n.status) && n.dueDate < todayIso(),
    receipts: db.receipts.filter((r) => r.noteId === n.id),
  };
}

// ── commission ──
export function commissionPct(brokerId) {
  const c = db.rules.commission ?? { defaultPct: "0", brokers: [] };
  return c.brokers.find((b) => b.brokerId === brokerId)?.pct ?? c.defaultPct;
}

/** Commission on the net share of an amount received (or refunded, negative) on a note. */
function accrueCommission(note, received) {
  if (!note.brokerId) return;
  const share = money(note.total) ? (money(note.net) * received) / money(note.total) : 0n;
  const pct = commissionPct(note.brokerId);
  const amount = multiply(share, (parseDecimal(pct) ?? 0n) / 100n) ?? 0n;
  if (amount === 0n) return;
  const sign = note.kind === "DEBIT" ? 1n : -1n;
  db.commissions.push({
    id: String(++db.seq.commission),
    brokerId: note.brokerId,
    noteId: note.id,
    noteNo: note.noteNo,
    policyId: note.policyId,
    base: s(share * sign),
    pct,
    amount: s(amount * sign),
    earnedOn: todayIso(),
    statementId: null,
  });
}

// ── certificate release ──
function releaseCertificate(note) {
  if (!note.certificateId) return;
  const cert = db.certificates.find((c) => c.id === note.certificateId);
  if (cert?.awaitingPayment) {
    cert.awaitingPayment = false;
    cert.releasedAt = nowIso();
    // A paid amendment replaces the version that stayed valid while it waited
    db.certificates
      .filter((x) => x.certNo === cert.certNo && x.version < cert.version && ["ISSUED", "PENDING"].includes(x.status))
      .forEach((x) => (x.status = "AMENDED"));
    audit("certificate", cert.id, `Premium paid (${note.noteNo}): certificate released`);
  }
}

function paymentErrors(b, { needAmount = true, max = null } = {}) {
  const e = [];
  if (needAmount) {
    if (!(money(b?.amount) > 0n)) e.push({ field: "amount", message: "Amount must be greater than 0" });
    else if (max !== null && money(b.amount) > max) e.push({ field: "amount", message: `At most ETB ${s(max)} is outstanding` });
  }
  if (!METHODS.includes(b?.method)) e.push({ field: "method", message: "Pick a payment method" });
  if (b?.method !== "CASH" && !String(b?.reference ?? "").trim()) e.push({ field: "reference", message: "Reference is required" });
  const date = b?.date;
  if (!date) e.push({ field: "date", message: "Date is required" });
  else if (date > todayIso()) e.push({ field: "date", message: "Date can't be in the future" });
  return e;
}

// ── premium receipts (debit notes) and refunds (credit notes) ──
on("get", "/finance/notes", ({ query }) => {
  canRead();
  const q = lc(query.q);
  const statuses = listParam(query.status);
  let items = db.notes.map(noteView);
  if (query.kind) items = items.filter((n) => n.kind === query.kind);
  if (statuses.length) items = items.filter((n) => statuses.includes(n.status));
  if (query.source) items = items.filter((n) => n.source === query.source);
  if (query.customerId) items = items.filter((n) => n.customerId === query.customerId);
  if (query.overdue === "true") items = items.filter((n) => n.overdue);
  if (q) items = items.filter((n) => lc(`${n.noteNo} ${n.customer?.name} ${n.policy?.policyNo} ${n.certificate?.certNo} ${n.openCover?.coverNo}`).includes(q));
  return page(items, query, { sortDefault: "issuedAt,desc" });
});

on("get", "/finance/notes/:id", ({ params }) => {
  canRead();
  return noteView(db.notes.find((n) => n.id === params.id) ?? fail(404, "Note not found"));
});

/** Outstanding debit notes by age since issue, in ETB. */
on("get", "/finance/ageing", () => {
  canRead();
  const buckets = { current: 0n, d31: 0n, d61: 0n, d90: 0n };
  const counts = { current: 0, d31: 0, d61: 0, d90: 0 };
  db.notes
    .filter((n) => n.kind === "DEBIT" && ["UNPAID", "PARTLY_PAID"].includes(n.status))
    .forEach((n) => {
      const d = ageDays(n);
      const k = d <= 30 ? "current" : d <= 60 ? "d31" : d <= 90 ? "d61" : "d90";
      buckets[k] += outstanding(n);
      counts[k]++;
    });
  const total = Object.values(buckets).reduce((a, b) => a + b, 0n);
  return { total: s(total), buckets: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, { amount: s(v), count: counts[k] }])) };
});

on("post", "/finance/receipts", ({ body }) => {
  canPost();
  const n = db.notes.find((x) => x.id === String(body?.noteId)) ?? fail(404, "Note not found");
  if (n.kind !== "DEBIT") fail(409, "Receipts are recorded against debit notes.", { code: "WRONG_STATE" });
  if (!["UNPAID", "PARTLY_PAID"].includes(n.status)) fail(409, `This note is ${lc(n.status).replace("_", " ")}.`, { code: "WRONG_STATE" });
  const e = paymentErrors(body, { max: outstanding(n) });
  if (e.length) invalid(e);
  const r = {
    id: String(++db.seq.receipt),
    receiptNo: `RC-${year()}-${String(db.seq.receipt).padStart(5, "0")}`,
    noteId: n.id,
    amount: s(money(body.amount)),
    method: body.method,
    reference: String(body.reference ?? "").trim(),
    bank: String(body.bank ?? "").trim(),
    date: body.date,
    recordedBy: actor(),
    recordedAt: nowIso(),
  };
  db.receipts.push(r);
  n.paid = s(money(n.paid) + money(r.amount));
  n.status = outstanding(n) === 0n ? "PAID" : "PARTLY_PAID";
  accrueCommission(n, money(r.amount));
  audit("note", n.id, `Receipt ${r.receiptNo}: ETB ${r.amount} by ${lc(r.method).replace("_", " ")}`);
  if (n.status === "PAID") {
    n.paidAt = nowIso();
    releaseCertificate(n);
  }
  return noteView(n);
});

on("post", "/finance/notes/:id/refund", ({ params, body }) => {
  canPost();
  const n = db.notes.find((x) => x.id === params.id) ?? fail(404, "Note not found");
  if (n.kind !== "CREDIT") fail(409, "Only credit notes are refunded.", { code: "WRONG_STATE" });
  if (n.status !== "UNPAID") fail(409, "This refund is already paid.", { code: "WRONG_STATE" });
  const e = paymentErrors(body, { needAmount: false });
  if (e.length) invalid(e);
  Object.assign(n, { status: "PAID", paid: n.total, paidAt: nowIso(), payment: { method: body.method, reference: String(body.reference ?? "").trim(), bank: String(body.bank ?? "").trim(), date: body.date, paidBy: actor() } });
  accrueCommission(n, money(n.total));
  audit("note", n.id, `Refund ${n.noteNo} paid: ETB ${n.total}`);
  return noteView(n);
});

// ── claim payments ──
export function requestClaimPayment(claim, { amount, payeeId, payeeNote }) {
  const v = {
    id: String(++db.seq.voucher),
    voucherNo: `PV-${year()}-${String(db.seq.voucher).padStart(5, "0")}`,
    claimId: claim.id,
    claimNo: claim.claimNo,
    currency: claim.currency,
    amount,
    rate: fxFor(claim.currency)?.rate ?? "1",
    payeeId,
    payeeNote: payeeNote ?? "",
    status: "REQUESTED",
    requestedBy: actor(),
    requestedAt: nowIso(),
  };
  v.amountEtb = s(multiply(amount, v.rate) ?? 0n);
  db.vouchers.push(v);
  return v;
}

export const voucherView = (v) => ({ ...v, payee: partyRef(v.payeeId), insured: claimInsured(v.claimId) });
function claimInsured(claimId) {
  const claim = db.claims.find((c) => c.id === claimId);
  const cert = db.certificates.find((c) => c.id === claim?.certificateId);
  const snap = cert?.snapshot ?? db.policies.find((p) => p.id === cert?.policyId)?.snapshot ?? {};
  return partyRef(snap.insuredId);
}

on("get", "/finance/vouchers", ({ query }) => {
  canRead();
  const q = lc(query.q);
  const statuses = listParam(query.status);
  let items = db.vouchers.map(voucherView);
  if (statuses.length) items = items.filter((v) => statuses.includes(v.status));
  if (q) items = items.filter((v) => lc(`${v.voucherNo} ${v.claimNo} ${v.payee?.name} ${v.insured?.name}`).includes(q));
  return page(items, query, { sortDefault: "requestedAt,desc" });
});

on("post", "/finance/vouchers/:id/pay", ({ params, body }) => {
  canPost();
  const v = db.vouchers.find((x) => x.id === params.id) ?? fail(404, "Payment request not found");
  if (v.status !== "REQUESTED") fail(409, "This payment request is already paid.", { code: "WRONG_STATE" });
  const e = paymentErrors(body, { needAmount: false });
  if (e.length) invalid(e);
  const claim = db.claims.find((c) => c.id === v.claimId);
  Object.assign(v, { status: "PAID", method: body.method, reference: String(body.reference ?? "").trim(), bank: String(body.bank ?? "").trim(), paidOn: body.date, paidBy: actor(), paidAt: nowIso() });
  claim.payments.push({
    id: String(++db.seq.payment),
    voucherId: v.id,
    amount: v.amount,
    payeeId: v.payeeId,
    payeeNote: v.payeeNote,
    paymentRef: v.reference || v.voucherNo,
    paidAt: nowIso(),
    paidBy: actor(),
    exportRef: v.voucherNo,
  });
  claim.payeeId = v.payeeId;
  claim.status = "PAID";
  claim.updatedAt = nowIso();
  claim.history.push({ at: nowIso(), by: actor(), action: "Status paid", note: `Finance paid ${claim.currency} ${v.amount} (${v.voucherNo}), reference ${v.reference || "cash"}` });
  audit("claim", claim.id, `Paid by Finance: ${v.voucherNo}`);
  return voucherView(v);
});

// ── carrier recoveries (money in on a claim) ──
const collectedOn = (claim) => (claim.recoveryReceipts ?? []).reduce((t, r) => t + money(r.amount), 0n);

on("get", "/finance/recoveries", () => {
  canRead();
  return db.claims
    .filter((c) => c.recovery && money(c.recovery.amountRecovered) > 0n)
    .map((c) => ({
      claimId: c.id,
      claimNo: c.claimNo,
      currency: c.currency,
      carrier: partyRef(c.recovery.carrierId),
      agreed: c.recovery.amountRecovered,
      collected: s(collectedOn(c)),
      toCollect: s(money(c.recovery.amountRecovered) - collectedOn(c)),
      receipts: c.recoveryReceipts ?? [],
    }));
});

on("post", "/finance/recoveries/:claimId/receipts", ({ params, body }) => {
  canPost();
  const claim = db.claims.find((c) => c.id === params.claimId) ?? fail(404, "Claim not found");
  if (!claim.recovery) fail(409, "This claim has no recovery.", { code: "WRONG_STATE" });
  const left = money(claim.recovery.amountRecovered) - collectedOn(claim);
  const e = paymentErrors(body, { max: left });
  if (e.length) invalid(e);
  claim.recoveryReceipts = claim.recoveryReceipts ?? [];
  const r = { id: String(++db.seq.receipt), receiptNo: `RC-${year()}-${String(db.seq.receipt).padStart(5, "0")}`, amount: s(money(body.amount)), method: body.method, reference: String(body.reference ?? "").trim(), date: body.date, recordedBy: actor(), recordedAt: nowIso() };
  claim.recoveryReceipts.push(r);
  claim.history.push({ at: nowIso(), by: actor(), action: "Recovery received", note: `${claim.currency} ${r.amount} (${r.receiptNo})` });
  audit("claim", claim.id, `Recovery received: ${claim.currency} ${r.amount}`);
  return { claimId: claim.id, collected: s(collectedOn(claim)), receipt: r };
});

// ── broker commission ──
on("get", "/finance/commission-rates", () => {
  canRead();
  const c = db.rules.commission;
  return { defaultPct: c.defaultPct, brokers: c.brokers.map((b) => ({ ...b, broker: partyRef(b.brokerId) })) };
});

on("put", "/finance/commission-rates", ({ body }) => {
  if (!hasRole("FINANCE", "ADMIN")) fail(403, "You don't have permission for this action.");
  const e = [];
  const pctOk = (v) => (parseDecimal(v) ?? -1n) >= 0n && (parseDecimal(v) ?? 0n) <= parseDecimal("50");
  if (!pctOk(body?.defaultPct)) e.push({ field: "defaultPct", message: "Default rate must be 0 to 50%" });
  const rows = Array.isArray(body?.brokers) ? body.brokers : [];
  const seen = new Set();
  rows.forEach((r, i) => {
    if (!r.brokerId) e.push({ field: `brokers.${i}.brokerId`, message: `Row ${i + 1}: pick a broker` });
    else if (seen.has(r.brokerId)) e.push({ field: `brokers.${i}.brokerId`, message: `Row ${i + 1}: this broker is listed twice` });
    seen.add(r.brokerId);
    if (!pctOk(r.pct)) e.push({ field: `brokers.${i}.pct`, message: `Row ${i + 1}: rate must be 0 to 50%` });
  });
  if (e.length) invalid(e);
  db.rules.commission = { defaultPct: String(body.defaultPct), brokers: rows.map((r) => ({ brokerId: r.brokerId, pct: String(r.pct) })) };
  audit("rules", "commission", "Commission rates updated");
  return db.rules.commission;
});

/** Commission earned and not yet on a statement, per broker. */
on("get", "/finance/commissions", ({ query }) => {
  canRead();
  let rows = db.commissions.filter((c) => !c.statementId);
  if (query.brokerId) rows = rows.filter((c) => c.brokerId === query.brokerId);
  const byBroker = {};
  rows.forEach((c) => {
    const b = (byBroker[c.brokerId] ??= { broker: partyRef(c.brokerId), lines: [], total: 0n, months: new Set() });
    b.lines.push({ ...c, policyNo: db.policies.find((p) => p.id === c.policyId)?.policyNo ?? null });
    b.total += money(c.amount);
    b.months.add(c.earnedOn.slice(0, 7));
  });
  return Object.values(byBroker).map((b) => ({ broker: b.broker, lines: b.lines, total: s(b.total), months: [...b.months].sort() }));
});

const statementView = (st) => ({ ...st, broker: partyRef(st.brokerId), lines: db.commissions.filter((c) => c.statementId === st.id).map((c) => ({ ...c, policyNo: db.policies.find((p) => p.id === c.policyId)?.policyNo ?? null })) });

on("get", "/finance/commission-statements", ({ query }) => {
  canRead();
  const statuses = listParam(query.status);
  let items = db.statements.map(statementView);
  if (statuses.length) items = items.filter((x) => statuses.includes(x.status));
  if (query.brokerId) items = items.filter((x) => x.brokerId === query.brokerId);
  return page(items, query, { sortDefault: "createdAt,desc" });
});

on("post", "/finance/commission-statements", ({ body }) => {
  canPost();
  const e = [];
  if (!body?.brokerId) e.push({ field: "brokerId", message: "Pick a broker" });
  if (!/^\d{4}-\d{2}$/.test(String(body?.month ?? ""))) e.push({ field: "month", message: "Pick a month" });
  else if (body.month > todayIso().slice(0, 7)) e.push({ field: "month", message: "The month can't be in the future" });
  if (e.length) invalid(e);
  // Everything earned up to the end of the month that isn't on a statement yet
  const lines = db.commissions.filter((c) => c.brokerId === body.brokerId && !c.statementId && c.earnedOn.slice(0, 7) <= body.month);
  if (!lines.length) fail(409, "No unbilled commission for this broker up to that month.", { code: "NOTHING_TO_BILL" });
  const st = {
    id: String(++db.seq.statement),
    statementNo: `CS-${year()}-${String(db.seq.statement).padStart(5, "0")}`,
    brokerId: body.brokerId,
    month: body.month,
    currency: "ETB",
    total: s(lines.reduce((t, c) => t + money(c.amount), 0n)),
    status: "OPEN",
    createdBy: actor(),
    createdAt: nowIso(),
  };
  if (money(st.total) <= 0n) fail(409, "Commission for this period is zero or negative, so there is nothing to pay.", { code: "NOTHING_TO_BILL" });
  lines.forEach((c) => (c.statementId = st.id));
  db.statements.push(st);
  audit("statement", st.id, `${st.statementNo} for ${partyRef(st.brokerId)?.name}, ${st.month}: ETB ${st.total}`);
  return statementView(st);
});

on("post", "/finance/commission-statements/:id/pay", ({ params, body }) => {
  canPost();
  const st = db.statements.find((x) => x.id === params.id) ?? fail(404, "Statement not found");
  if (st.status !== "OPEN") fail(409, "This statement is already paid.", { code: "WRONG_STATE" });
  const e = paymentErrors(body, { needAmount: false });
  if (e.length) invalid(e);
  Object.assign(st, { status: "PAID", method: body.method, reference: String(body.reference ?? "").trim(), paidOn: body.date, paidBy: actor(), paidAt: nowIso() });
  audit("statement", st.id, `${st.statementNo} paid`);
  return statementView(st);
});

// ── a customer's account ──
on("get", "/customers/:id/account", ({ params }) => {
  if (!hasRole("FINANCE", "ADMIN", "UNDERWRITER", "SENIOR_UNDERWRITER", "BROKER")) fail(403, "You don't have permission for this action.");
  const notes = db.notes.filter((n) => n.customerId === params.id).map(noteView).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const owed = notes.filter((n) => n.kind === "DEBIT" && ["UNPAID", "PARTLY_PAID"].includes(n.status)).reduce((t, n) => t + money(n.outstanding), 0n);
  const due = notes.filter((n) => n.kind === "CREDIT" && n.status === "UNPAID").reduce((t, n) => t + money(n.total), 0n);
  return {
    notes,
    receipts: notes.flatMap((n) => n.receipts.map((r) => ({ ...r, noteNo: n.noteNo }))).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
    owed: s(owed),
    refundsDue: s(due),
    balance: s(owed - due),
    paidToDate: s(notes.filter((n) => n.kind === "DEBIT").reduce((t, n) => t + money(n.paid), 0n)),
  };
});

export const financeTotals = () => ({
  unpaidPremiums: db.notes.filter((n) => n.kind === "DEBIT" && ["UNPAID", "PARTLY_PAID"].includes(n.status)),
  refundsToPay: db.notes.filter((n) => n.kind === "CREDIT" && n.status === "UNPAID"),
  claimPayments: db.vouchers.filter((v) => v.status === "REQUESTED"),
});
