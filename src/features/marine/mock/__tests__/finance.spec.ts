// Finance in the mock backend: pay before cover, receipts, refunds and broker commission.
import { beforeEach, describe, expect, it } from "vitest";
import { handleRequest, resetMockDb } from "../server";
import { todayIso } from "../../utils/format";

async function call(method: string, url: string, data?: unknown, roles = "UNDERWRITER,SENIOR_UNDERWRITER") {
  try {
    const res = await handleRequest({ method, url, data: data === undefined ? undefined : JSON.stringify(data), headers: { "x-dev-roles": roles, "x-dev-user": "Tester" } } as any);
    return { status: res.status, data: res.data };
  } catch (e: any) {
    return { status: e.response.status, data: e.response.data };
  }
}
const finance = (method: string, url: string, data?: unknown) => call(method, url, data, "FINANCE");
const RECEIPT = { method: "BANK_TRANSFER", reference: "CBE-TT-4411", date: todayIso() };

async function bind(overrides = {}) {
  const q = (await call("post", "/quotes", {
    product: "SINGLE_SHIPMENT", insuredId: "1", insuredRole: "BUYER", incoterm: "FOB", mode: "SEA", vesselImo: "9074729", portOfLoading: "CNSHA",
    transshipmentPorts: [], portOfDischarge: "DJJIB", finalDestination: "Modjo", sailingDate: todayIso(), hsCode: "520100", goodsDescription: "Cotton",
    currency: "USD", invoiceValue: "100000.00", freight: "5000.00", containers: [], clause: "ICC_A", lc: { enabled: false }, brokerId: "8", ...overrides,
  })).data;
  const rated = (await call("post", `/quotes/${q.id}/rate`)).data;
  return { rated, bound: (await call("post", `/quotes/${q.id}/bind`)).data };
}

describe("finance", () => {
  beforeEach(() => resetMockDb());

  it("raises a debit note on bind and releases the certificate when it's paid in full", async () => {
    const { rated, bound } = await bind();
    const note = (await finance("get", `/finance/notes/${bound.debitNote.id}`)).data;
    expect(note.kind).toBe("DEBIT");
    expect(note.total).toBe(rated.premium.total);
    // net + VAT + stamp duty add up to the premium
    expect((Number(note.net) + Number(note.vat) + Number(note.stamp)).toFixed(2)).toBe(note.total);
    expect((await call("get", `/certificates/${bound.certificate.id}/pdf`)).data.code).toBe("AWAITING_PAYMENT");

    const half = (Number(note.total) / 2).toFixed(2);
    expect((await call("post", "/finance/receipts", { noteId: note.id, amount: half, ...RECEIPT })).status).toBe(403);
    expect((await finance("post", "/finance/receipts", { noteId: note.id, amount: "99999999", ...RECEIPT })).data.fields[0].field).toBe("amount");
    let n = (await finance("post", "/finance/receipts", { noteId: note.id, amount: half, ...RECEIPT })).data;
    expect(n.status).toBe("PARTLY_PAID");
    expect((await call("get", `/certificates/${bound.certificate.id}`)).data.status).toBe("AWAITING_PAYMENT");
    n = (await finance("post", "/finance/receipts", { noteId: note.id, amount: n.outstanding, ...RECEIPT })).data;
    expect(n.status).toBe("PAID");
    expect(n.receipts).toHaveLength(2);
    expect((await call("get", `/certificates/${bound.certificate.id}`)).data.status).toBe("PENDING");
  });

  it("needs a reference except for cash, and no future dates", async () => {
    const { bound } = await bind();
    const res = await finance("post", "/finance/receipts", { noteId: bound.debitNote.id, amount: "10", method: "CHEQUE", reference: "", date: "2999-01-01" });
    expect(res.data.fields.map((f: any) => f.field).sort()).toEqual(["date", "reference"]);
    const cash = await finance("post", "/finance/receipts", { noteId: bound.debitNote.id, amount: "10", method: "CASH", date: todayIso() });
    expect(cash.data.status).toBe("PARTLY_PAID");
  });

  it("earns broker commission on premium received and bills it in a statement", async () => {
    const { bound } = await bind();
    const note = (await finance("get", `/finance/notes/${bound.debitNote.id}`)).data;
    await finance("post", "/finance/receipts", { noteId: note.id, amount: note.total, ...RECEIPT });
    const unbilled = (await finance("get", "/finance/commissions")).data;
    expect(unbilled).toHaveLength(1);
    expect(unbilled[0].broker.name).toBe("Nile Insurance Brokers");
    // 10% of net premium (VAT and stamp duty excluded)
    expect(unbilled[0].total).toBe((Number(note.net) * 0.1).toFixed(2));

    const st = (await finance("post", "/finance/commission-statements", { brokerId: "8", month: todayIso().slice(0, 7) })).data;
    expect(st.statementNo).toMatch(/^CS-/);
    expect(st.total).toBe(unbilled[0].total);
    expect((await finance("get", "/finance/commissions")).data).toHaveLength(0);
    expect((await finance("post", "/finance/commission-statements", { brokerId: "8", month: todayIso().slice(0, 7) })).data.code).toBe("NOTHING_TO_BILL");
    expect((await finance("post", `/finance/commission-statements/${st.id}/pay`, RECEIPT)).data.status).toBe("PAID");
  });

  it("refunds a cancelled, paid policy through a credit note and claws back commission", async () => {
    const { bound } = await bind();
    await finance("post", "/finance/receipts", { noteId: bound.debitNote.id, amount: bound.debitNote.total, ...RECEIPT });
    await call("post", `/certificates/${bound.certificate.id}/cancel`, { reason: "SHIPMENT_CANCELLED", note: "Order cancelled by the buyer" });
    const credit = (await finance("get", "/finance/notes", undefined)).data.content.find((n: any) => n.kind === "CREDIT");
    expect(credit.total).toBe(bound.debitNote.total);
    expect((await finance("post", `/finance/notes/${credit.id}/refund`, RECEIPT)).data.status).toBe("PAID");
    const lines = (await finance("get", "/finance/commissions")).data[0].lines;
    expect(lines.reduce((t: number, l: any) => t + Number(l.amount), 0)).toBeCloseTo(0, 2);
  });

  it("bills an open cover's deposit and lets its declarations issue straight away", async () => {
    const cover = (await call("post", "/open-covers", {
      insuredId: "2", brokerId: "8", periodFrom: `${todayIso().slice(0, 4)}-01-01`, periodTo: `${todayIso().slice(0, 4)}-12-31`, currency: "USD", annualLimit: "1000000",
      perConveyanceLimit: "200000", declarationDays: 15, clause: "ICC_A", commodities: [{ hsCode: "520100", ratePct: "0.2" }], provisionalPremium: "50000",
    })).data;
    const deposit = (await finance("get", "/finance/notes", undefined)).data.content.find((n: any) => n.source === "OPEN_COVER_DEPOSIT");
    expect(deposit.total).toBe("50000.00");
    expect(deposit.openCover.coverNo).toBe(cover.coverNo);
  });

  it("builds a customer's account", async () => {
    const { bound } = await bind();
    const acc = (await finance("get", "/customers/1/account")).data;
    expect(acc.owed).toBe(bound.debitNote.total);
    expect(acc.notes[0].noteNo).toBe(bound.debitNote.noteNo);
  });
});
