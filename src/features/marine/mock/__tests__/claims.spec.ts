// Phase 4 in the mock backend: register, clause check, survey, recovery, documents, settle, close.
import { beforeEach, describe, expect, it } from "vitest";
import { handleRequest, resetMockDb } from "../server";
import { clauseCheck } from "../claims";
import { addDays, todayIso } from "../../utils/format";

const ALL = "SENIOR_UNDERWRITER,UNDERWRITER,CLAIMS_HANDLER,CLAIMS_MANAGER";
async function call(method: string, url: string, data?: unknown, roles = ALL) {
  try {
    const res = await handleRequest({ method, url, data: data instanceof FormData ? data : data === undefined ? undefined : JSON.stringify(data), headers: { "x-dev-roles": roles, "x-dev-user": "Tester" } } as any);
    return { status: res.status, data: res.data };
  } catch (e: any) {
    return { status: e.response.status, data: e.response.data };
  }
}
const upload = (claimId: string, kind: string, name = `${kind}.pdf`, size = 1000, type = "application/pdf") => {
  const fd = new FormData();
  fd.append("file", new File([new Uint8Array(size)], name, { type }));
  fd.append("kind", kind);
  return call("post", `/claims/${claimId}/documents`, fd);
};

async function issued(overrides = {}) {
  const q = (await call("post", "/quotes", {
    product: "SINGLE_SHIPMENT", insuredId: "1", insuredRole: "BUYER", incoterm: "FOB", mode: "SEA", vesselImo: "9074729", portOfLoading: "CNSHA",
    transshipmentPorts: [], portOfDischarge: "DJJIB", finalDestination: "Modjo", sailingDate: addDays(todayIso(), -10), hsCode: "520100",
    goodsDescription: "Cotton", currency: "USD", invoiceValue: "100000.00", freight: "5000.00", containers: [], clause: "ICC_A", warCover: false,
    strikesCover: false, lc: { enabled: true, number: "LC-1", bankId: "5", amount: "100000", expiry: addDays(todayIso(), 60) }, ...overrides,
  })).data;
  await call("post", `/quotes/${q.id}/rate`);
  return (await call("post", `/quotes/${q.id}/bind`)).data;
}

const LOSS = (certificateId: string, extra = {}) => ({
  certificateId, lossDate: addDays(todayIso(), -2), notifiedDate: todayIso(), deliveryDate: addDays(todayIso(), -1), type: "PARTICULAR_AVERAGE",
  cause: "WATER_DAMAGE", description: "Bales wet on arrival", lossLocation: "Djibouti port", affectedGoods: "Cotton bales", estimatedAmount: "12000.00", payeeId: "5", ...extra,
});

describe("phase 4 claims", () => {
  beforeEach(() => resetMockDb());

  it("checks the cause against the clause (FE-39)", () => {
    expect(clauseCheck("ICC_C", "THEFT")).toEqual({ result: "NOT_COVERED", message: "Not covered under ICC C: theft or non-delivery is not a named peril" });
    expect(clauseCheck("ICC_A", "THEFT").result).toBe("COVERED");
    expect(clauseCheck("ICC_B", "WATER_DAMAGE").result).toBe("COVERED");
  });

  it("won't register a claim on a cancelled certificate (FE-38)", async () => {
    const b = await issued();
    await call("post", `/certificates/${b.certificate.id}/cancel`, { reason: "ISSUED_IN_ERROR", note: "Duplicate" }, "UNDERWRITER");
    const res = await call("post", "/claims", LOSS(b.certificate.id));
    expect(res.status).toBe(422);
    expect(res.data.fields[0].field).toBe("certificate");
  });

  it("runs the full lifecycle from register to close (FE-45)", async () => {
    const b = await issued();
    const claim = (await call("post", "/claims", LOSS(b.certificate.id))).data;
    expect(claim.clauseCheck.result).toBe("COVERED");
    expect(claim.deadlines.map((d: any) => d.kind).sort()).toEqual(["CARRIER_NOTICE", "DOCUMENTS", "SUIT_TIME_BAR", "SURVEY"]);
    expect((await call("get", `/certificates/${b.certificate.id}`)).data.hasOpenClaim).toBe(true);

    // survey: appointing sets the due date; the report closes the deadline (FE-40)
    let c = (await call("post", `/claims/${claim.id}/tasks`, { kind: "SURVEY", surveyorId: "11", appointedDate: todayIso(), dueDate: addDays(todayIso(), 5) })).data;
    expect(c.deadlines.find((d: any) => d.kind === "SURVEY").dueDate).toBe(addDays(todayIso(), 5));
    c = (await upload(claim.id, "SURVEY_REPORT")).data;
    expect(c.status).toBe("SURVEYED");
    expect(c.deadlines.find((d: any) => d.kind === "SURVEY").status).toBe("MET");

    // recovery notice closes the carrier notice deadline (FE-42)
    c = (await call("post", `/claims/${claim.id}/tasks`, { kind: "RECOVERY", carrierId: "13", noticeSentDate: todayIso(), amountClaimed: "5000", amountRecovered: "0", status: "OPEN" })).data;
    expect(c.deadlines.find((d: any) => d.kind === "CARRIER_NOTICE").status).toBe("MET");

    // GA rolls into the money strip (FE-41)
    c = (await call("post", `/claims/${claim.id}/tasks`, { kind: "GA", declarationDate: todayIso(), adjusterId: "14", securityType: "GA_BOND", securityAmount: "3000", contributionAmount: "1500" })).data;
    expect(c.money.gaSalvage).toBe("1500.00");

    c = (await call("post", `/claims/${claim.id}/assess`, { covered: true, reserve: "11000" })).data;
    expect(c.status).toBe("APPROVED");

    // missing documents are listed (FE-44)
    const missing = await call("post", `/claims/${claim.id}/settle`, { amount: "10000", payeeId: "5", paymentRef: "TT-1" });
    expect(missing.status).toBe(422);
    expect(missing.data.message).toMatch(/Original certificate/);
    for (const k of ["CERTIFICATE", "BILL_OF_LADING", "INVOICE", "CARRIER_NOTICE"]) await upload(claim.id, k);
    expect((await call("post", `/claims/${claim.id}/settle`, { amount: "10000", payeeId: "5", paymentRef: "TT-1" }, "CLAIMS_HANDLER")).status).toBe(403);
    expect((await call("post", `/claims/${claim.id}/settle`, { amount: "10000", payeeId: "1", paymentRef: "TT-1" })).data.fields[0].field).toBe("payeeNote");
    c = (await call("post", `/claims/${claim.id}/settle`, { amount: "10000", payeeId: "5", paymentRef: "TT-1" })).data;
    expect(c.status).toBe("RECOVERY");
    expect(c.payee.name).toBe("Commercial Bank of Ethiopia");

    expect((await call("post", `/claims/${claim.id}/close`)).status).toBe(409);
    await call("post", `/claims/${claim.id}/tasks`, { kind: "RECOVERY", carrierId: "13", noticeSentDate: todayIso(), amountClaimed: "5000", amountRecovered: "4000", status: "PARTLY_RECOVERED" });
    c = (await call("post", `/claims/${claim.id}/close`)).data;
    expect(c.status).toBe("CLOSED");
    expect(c.money.net).toBe("7500.00"); // 10000 paid + 1500 GA - 4000 recovered
  });

  it("needs a note to mark a deadline met (FE-43)", async () => {
    const b = await issued();
    const claim = (await call("post", "/claims", LOSS(b.certificate.id))).data;
    const d = claim.deadlines[0];
    expect((await call("post", `/deadlines/${d.id}/met`, { note: "" })).status).toBe(422);
    expect((await call("post", `/deadlines/${d.id}/met`, { note: "Handled by phone" })).data.status).toBe("MET");
  });

  it("refuses files over 20 MB and other types (FE-36)", async () => {
    const b = await issued();
    const claim = (await call("post", "/claims", LOSS(b.certificate.id))).data;
    expect((await upload(claim.id, "INVOICE", "big.pdf", 21 * 1024 * 1024)).status).toBe(422);
    expect((await upload(claim.id, "INVOICE", "notes.txt", 10, "text/plain")).status).toBe(422);
  });

  it("pins the shipment and refuses a reserve above the handler ceiling", async () => {
    const b = await issued();
    const missing = await call("post", "/claims", LOSS(b.certificate.id, { lossLocation: " " }));
    expect(missing.status).toBe(422);
    const claim = (await call("post", "/claims", LOSS(b.certificate.id))).data;
    expect(claim.quoteNo).toBeTruthy();
    expect(claim.lossLocation).toBe("Djibouti port");
    expect(claim.affectedGoods).toBe("Cotton bales");
    expect(claim.coverageClause).toBe("ICC_A");
    expect((await call("post", `/claims/${claim.id}/assess`, { covered: true, reserve: "4000" }, "CLAIMS_HANDLER")).status).toBe(403);
    expect((await call("post", `/claims/${claim.id}/assess`, { covered: true, reserve: "1000" }, "CLAIMS_HANDLER")).status).toBe(200);
  });

  it("filters overdue claims (FE-37)", async () => {
    const b = await issued();
    await call("post", "/claims", LOSS(b.certificate.id, { lossDate: addDays(todayIso(), -40), notifiedDate: addDays(todayIso(), -39), deliveryDate: addDays(todayIso(), -39) }));
    await call("post", "/claims", LOSS(b.certificate.id));
    expect((await call("get", "/claims")).data.totalElements).toBe(2);
    expect((await call("get", "/claims", undefined)).data.content[0].nextDeadline.overdue).toBe(true);
    const overdue = await handleRequest({ method: "get", url: "/claims", params: { overdue: "true" }, headers: { "x-dev-roles": ALL } } as any);
    expect(overdue.data.totalElements).toBe(1);
  });
});
