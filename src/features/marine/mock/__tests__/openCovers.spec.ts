// Phase 3 in the mock backend: open covers, declarations, year-end adjustment, inland transit.
import { beforeEach, describe, expect, it } from "vitest";
import { handleRequest, resetMockDb } from "../server";
import { addDays, todayIso } from "../../utils/format";

async function call(method: string, url: string, data?: unknown, roles = "SENIOR_UNDERWRITER,UNDERWRITER,FINANCE,ADMIN") {
  try {
    const res = await handleRequest({ method, url, data: data === undefined ? undefined : JSON.stringify(data), headers: { "x-dev-roles": roles, "x-dev-user": "Tester" } } as any);
    return { status: res.status, data: res.data };
  } catch (e: any) {
    return { status: e.response.status, data: e.response.data };
  }
}

const SHIPMENT = {
  insuredRole: "BUYER", incoterm: "FOB", mode: "SEA", vesselImo: "9074729", portOfLoading: "CNSHA", transshipmentPorts: [],
  portOfDischarge: "DJJIB", finalDestination: "Modjo", sailingDate: todayIso(), hsCode: "520100", goodsDescription: "Cotton",
  invoiceValue: "100000.00", freight: "5000.00", containers: [], lc: { enabled: false },
};

describe("phase 3 open covers", () => {
  beforeEach(() => resetMockDb());

  it("refuses a per-conveyance limit above the annual limit (FE-30)", async () => {
    const res = await call("post", "/open-covers", {
      insuredId: "1", periodFrom: "2026-01-01", periodTo: "2026-12-31", currency: "USD", annualLimit: "100000", perConveyanceLimit: "200000",
      declarationDays: 7, clause: "ICC_A", commodities: [{ hsCode: "520100", ratePct: "0.2" }], provisionalPremium: "0",
    });
    expect(res.status).toBe(422);
    expect(res.data.fields.map((f: any) => f.field)).toContain("perConveyanceLimit");
  });

  it("declares at the agreed rate and reduces the balance (FE-31)", async () => {
    const q = (await call("post", "/open-covers/1/declarations", { ...SHIPMENT, clause: "ICC_C", brokerId: "9" })).data;
    expect(q.clause).toBe("ICC_A"); // locked to the cover
    expect(q.brokerId).toBe("8");
    const rated = (await call("post", `/quotes/${q.id}/rate`)).data;
    expect(rated.status).toBe("QUOTED");
    expect(rated.premium.lines[0].label).toMatch(/Agreed rate/);
    expect(rated.limits.remainingAfter).toBe("4884500.00");
    await call("post", `/quotes/${q.id}/bind`);
    const cover = (await call("get", "/open-covers/1")).data;
    expect(cover.used).toBe("115500.00");
    expect(cover.remaining).toBe("4884500.00");
    expect(cover.declarations[0].policyNo).toMatch(/^P-/);
  });

  it("refers a declaration over the per-conveyance limit and flags a late one (FE-32)", async () => {
    const q = (await call("post", "/open-covers/1/declarations", { ...SHIPMENT, invoiceValue: "600000.00", sailingDate: addDays(todayIso(), -10) })).data;
    const rated = (await call("post", `/quotes/${q.id}/rate`)).data;
    expect(rated.status).toBe("REFERRED");
    expect(rated.referralReasons.map((r: any) => r.code)).toContain("DECLARATION_LIMIT");
    expect(rated.late).toBe(true);
  });

  it("posts the year-end adjustment once (FE-33)", async () => {
    const preview = (await call("post", "/open-covers/2/adjustment", { dryRun: true })).data;
    expect(preview.direction).toBe("REFUND_TO_INSURED");
    expect((await call("post", "/open-covers/2/adjustment", {})).data.status).toBe("ADJUSTED");
    const again = await call("post", "/open-covers/2/adjustment", {});
    expect(again.status).toBe(409);
    expect(again.data.message).toBe("Already adjusted.");
    expect((await call("post", "/open-covers/1/adjustment", {})).status).toBe(409);
  });

  it("issues an inland transit certificate with the truck plate (FE-34)", async () => {
    const q = (await call("post", "/quotes", {
      product: "INLAND_TRANSIT", insuredId: "1", insuredRole: "BUYER", incoterm: "DAP", sailingDate: todayIso(), hsCode: "310530",
      goodsDescription: "DAP fertiliser", currency: "USD", invoiceValue: "50000.00", freight: "2000.00", clause: "ICC_A", lc: { enabled: false },
      inland: { from: "DJJIB", to: "ETMJO", truckPlate: "ET-3-A12345", driverName: "Abebe Kebede", convoyRef: "CNV-77" },
    })).data;
    const rated = (await call("post", `/quotes/${q.id}/rate`)).data;
    expect(rated.status).toBe("QUOTED");
    expect(rated.checks.inland.vehicleLimit).toBe("15000000");
    const bound = (await call("post", `/quotes/${q.id}/bind`)).data;
    const cert = (await call("get", `/certificates/${bound.certificate.id}`)).data;
    expect(cert.inland.truckPlate).toBe("ET-3-A12345");
    expect(cert.inland.toName).toBe("Modjo dry port");
  });

  it("shows a broker only their own covers", async () => {
    const res = await handleRequest({ method: "get", url: "/open-covers", headers: { "x-dev-roles": "BROKER", "x-dev-broker-party": "9" } } as any);
    expect(res.data.totalElements).toBe(0);
  });
});
