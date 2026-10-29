// Phase 2 in the mock backend: screening, referrals, authority, amend and cancel.
import { beforeEach, describe, expect, it } from "vitest";
import { handleRequest, resetMockDb } from "../server";
import { matchScore } from "../underwriting";
import { todayIso } from "../../utils/format";

async function call(method: string, url: string, data?: unknown, roles = "SENIOR_UNDERWRITER,UNDERWRITER,ADMIN", user = "Tester") {
  const headers = { "x-dev-roles": roles, "x-dev-user": user };
  try {
    const res = await handleRequest({ method, url, data: data === undefined ? undefined : JSON.stringify(data), headers } as any);
    return { status: res.status, data: res.data };
  } catch (e: any) {
    return { status: e.response.status, data: e.response.data };
  }
}

const QUOTE = {
  product: "SINGLE_SHIPMENT", insuredId: "1", insuredRole: "BUYER", incoterm: "FOB", mode: "SEA", vesselImo: "9074729",
  portOfLoading: "CNSHA", transshipmentPorts: [], portOfDischarge: "DJJIB", finalDestination: "Modjo", sailingDate: todayIso(),
  hsCode: "520100", goodsDescription: "Cotton", currency: "USD", invoiceValue: "100000.00", freight: "5000.00", containers: [],
  clause: "ICC_A", warCover: false, strikesCover: false, lc: { enabled: false },
};

const pay = (noteId: string, amount: string) =>
  call("post", "/finance/receipts", { noteId, amount, method: "BANK_TRANSFER", reference: "TT-9", date: todayIso() }, "FINANCE");

async function rated(overrides = {}) {
  const q = (await call("post", "/quotes", { ...QUOTE, ...overrides })).data;
  return (await call("post", `/quotes/${q.id}/rate`)).data;
}

describe("phase 2 underwriting", () => {
  beforeEach(() => resetMockDb());

  it("scores name matches", () => {
    expect(matchScore("Horn Coastal Trading PLC", "Horn Coastal Trading")).toBe(1);
    expect(matchScore("Abyssinia Agro Industries", "Horn Coastal Trading")).toBe(0);
  });

  it("refers a potential sanctions match and blocks approval until reviewed (FE-24)", async () => {
    const q = await rated({ consigneeId: "12" });
    expect(q.status).toBe("REFERRED");
    const potential = q.checks.screenings.find((s: any) => s.result === "POTENTIAL");
    expect(potential.name).toBe("Horn Coastal Trading PLC");
    const ref = (await call("get", "/referrals?status=OPEN")).data.content[0];
    expect((await call("post", `/referrals/${ref.id}/decide`, { decision: "APPROVE", note: "fine" })).status).toBe(409);

    await call("post", `/screenings/${potential.id}/review`, { decision: "CONFIRM", note: "Same entity as UN listing" });
    const after = (await call("get", `/quotes/${q.id}`)).data;
    expect(after.sanctionsConfirmed).toBe(true);
    expect((await call("post", `/quotes/${q.id}/bind`)).status).toBe(409);
  });

  it("clearing a false positive with nothing else to refer returns the quote to Quoted", async () => {
    const q = await rated({ consigneeId: "12" });
    const potential = q.checks.screenings.find((s: any) => s.result === "POTENTIAL");
    await call("post", `/screenings/${potential.id}/review`, { decision: "CLEAR", note: "Different company, different TIN" });
    expect((await call("get", `/quotes/${q.id}`)).data.status).toBe("QUOTED");
  });

  it("needs a senior underwriter above the underwriter's authority (FE-23)", async () => {
    const q = await rated({ invoiceValue: "400000.00" }); // ~ ETB 69M: over the high-value rule and UW authority
    expect(q.referralReasons.map((r: any) => r.code)).toContain("VALUE");
    const ref = (await call("get", "/referrals")).data.content[0];
    expect(ref.authorityNeeded).toBe("SENIOR_UNDERWRITER");
    const asUw = await call("post", `/referrals/${ref.id}/decide`, { decision: "APPROVE", note: "ok" }, "UNDERWRITER");
    expect(asUw.status).toBe(403);
    expect((await call("post", `/referrals/${ref.id}/decide`, { decision: "DECLINE", note: "short" })).status).toBe(422);
    const ok = await call("post", `/referrals/${ref.id}/decide`, { decision: "APPROVE", note: "Known shipper", rateOverridePct: "0.15" });
    expect(ok.data.status).toBe("APPROVED");
    const approved = (await call("get", `/quotes/${q.id}`)).data;
    expect(approved.status).toBe("APPROVED");
    expect(approved.premium.lines[0].label).toMatch(/override/);
    expect((await call("post", `/quotes/${q.id}/bind`)).status).toBe(200);
  });

  it("assigns a referral to the caller", async () => {
    await rated({ invoiceValue: "400000.00" });
    const ref = (await call("get", "/referrals")).data.content[0];
    await call("post", `/referrals/${ref.id}/assign`, undefined, "UNDERWRITER", "Hanna Girma");
    const mine = (await call("get", "/referrals?assignee=me", undefined, "UNDERWRITER", "Hanna Girma")).data;
    expect(mine.totalElements).toBe(1);
    const dash = (await call("get", "/dashboard", undefined, "UNDERWRITER", "Hanna Girma")).data;
    expect(dash.bell).toBe(1);
  });

  it("amends a certificate to version 2 and supersedes the old QR (FE-25)", async () => {
    const q = await rated();
    const bound = (await call("post", `/quotes/${q.id}/bind`)).data;
    await pay(bound.debitNote.id, bound.debitNote.total);
    const certId = bound.certificate.id;
    const preview = (await call("post", `/certificates/${certId}/amend`, { dryRun: true, changes: { invoiceValue: "120000.00" } })).data;
    expect(Number(preview.newPremium)).toBeGreaterThan(Number(preview.oldPremium));
    const res = await call("post", `/certificates/${certId}/amend`, { changes: { invoiceValue: "120000.00" }, reason: "Final commercial invoice received" });
    expect(res.data.version).toBe(2);
    // Extra premium: version 2 waits for payment and version 1 stays valid meanwhile
    expect(res.data.awaitingPayment).toBe(true);
    expect((await call("get", `/certificates/${certId}`)).data.status).not.toBe("AMENDED");
    const notes = (await call("get", "/finance/notes", undefined, "FINANCE")).data.content;
    const endorsement = notes.find((n: any) => n.source === "ENDORSEMENT");
    expect(endorsement.kind).toBe("DEBIT");
    await pay(endorsement.id, endorsement.total);
    const old = (await call("get", `/certificates/${certId}`)).data;
    expect(old.status).toBe("AMENDED");
    expect((await call("get", `/public/verify/${old.token}`)).data.status).toBe("SUPERSEDED");
  });

  it("cancels a certificate with a refund line", async () => {
    const q = await rated();
    const bound = (await call("post", `/quotes/${q.id}/bind`)).data;
    await pay(bound.debitNote.id, bound.debitNote.total);
    expect((await call("post", `/certificates/${bound.certificate.id}/cancel`, { reason: "SHIPMENT_CANCELLED" })).status).toBe(422);
    const c = await call("post", `/certificates/${bound.certificate.id}/cancel`, { reason: "SHIPMENT_CANCELLED", note: "Buyer cancelled the order" });
    expect(c.data.status).toBe("CANCELLED");
    const p = (await call("get", `/policies/${bound.policy.id}`)).data;
    expect(p.refund.amount).toBe(q.premium.total);
    expect(p.status).toBe("CANCELLED");
    expect(p.billing.find((n: any) => n.kind === "CREDIT").total).toBe(q.premium.total);
  });

  it("cancelling before payment cancels the debit note and refunds nothing", async () => {
    const q = await rated();
    const bound = (await call("post", `/quotes/${q.id}/bind`)).data;
    expect((await call("get", `/certificates/${bound.certificate.id}`)).data.status).toBe("AWAITING_PAYMENT");
    await call("post", `/certificates/${bound.certificate.id}/cancel`, { reason: "ISSUED_IN_ERROR", note: "Wrong insured picked" });
    const p = (await call("get", `/policies/${bound.policy.id}`)).data;
    expect(p.refund.amount).toBe("0.00");
    expect(p.billing.map((n: any) => n.status)).toEqual(["CANCELLED"]);
  });

  it("refuses a hard accumulation limit below the soft one (FE-28)", async () => {
    const res = await call("put", "/rules/accumulation", { data: { softLimit: "100", hardLimit: "50" }, note: "test" });
    expect(res.status).toBe(422);
    expect(res.data.fields[0].field).toBe("hardLimit");
  });

  it("hides another broker's quote from a broker (FE-35)", async () => {
    const q = (await call("post", "/quotes", { ...QUOTE, brokerId: "9" })).data;
    const asBroker = await handleRequest({ method: "get", url: `/quotes/${q.id}`, headers: { "x-dev-roles": "BROKER", "x-dev-broker-party": "8" } } as any).catch((e: any) => e.response);
    expect(asBroker.status).toBe(404);
  });
});
