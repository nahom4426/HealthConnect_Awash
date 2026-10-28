// The mock backend end to end: quote → rate → bind → certificate → public verify.
import { beforeEach, describe, expect, it } from "vitest";
import { handleRequest, resetMockDb } from "../server";
import { todayIso } from "../../utils/format";

async function call(method: string, url: string, data?: unknown, params?: Record<string, unknown>) {
  try {
    const res = await handleRequest({ method, url, data: data === undefined ? undefined : JSON.stringify(data), params } as any);
    return { status: res.status, data: res.data };
  } catch (e: any) {
    return { status: e.response.status, data: e.response.data };
  }
}

const QUOTE = {
  product: "SINGLE_SHIPMENT",
  insuredId: "1",
  insuredRole: "BUYER",
  incoterm: "FOB",
  mode: "SEA",
  vesselImo: "9074729",
  portOfLoading: "CNSHA",
  transshipmentPorts: [],
  portOfDischarge: "DJJIB",
  finalDestination: "Modjo dry port",
  sailingDate: todayIso(),
  hsCode: "520100",
  goodsDescription: "Raw cotton in bales",
  currency: "USD",
  invoiceValue: "100000.00",
  freight: "5000.00",
  containers: [],
  clause: "ICC_A",
  warCover: true,
  strikesCover: false,
  lc: { enabled: false },
};

describe("mock backend", () => {
  beforeEach(() => resetMockDb());

  it("quotes, rates, binds and verifies a shipment", async () => {
    const created = await call("post", "/quotes", QUOTE);
    expect(created.status).toBe(201);
    expect(created.data.status).toBe("DRAFT");

    const rated = await call("post", `/quotes/${created.data.id}/rate`);
    expect(rated.data.status).toBe("QUOTED");
    expect(rated.data.premium.sumInsured.total).toBe("115500.00");
    expect(Number(rated.data.premium.total)).toBeGreaterThan(0);

    const bound = await call("post", `/quotes/${created.data.id}/bind`);
    expect(bound.data.policy.policyNo).toMatch(/^P-\d{4}-00001$/);

    const cert = await call("get", `/certificates/${bound.data.certificate.id}`);
    expect(cert.data.status).toBe("PENDING");
    const verify = await call("get", `/public/verify/${cert.data.token}`);
    expect(verify.data.certNo).toBe(cert.data.certNo);
    expect(verify.data).not.toHaveProperty("premium");

    expect((await call("get", "/public/verify/not-a-token")).status).toBe(404);
  });

  it("refers a restricted commodity and refuses to bind it", async () => {
    const q = (await call("post", "/quotes", { ...QUOTE, hsCode: "360200" })).data;
    const rated = await call("post", `/quotes/${q.id}/rate`);
    expect(rated.data.status).toBe("REFERRED");
    expect(rated.data.referralReasons[0].code).toBe("COMMODITY");
    const bind = await call("post", `/quotes/${q.id}/bind`);
    expect(bind.status).toBe(409);
  });

  it("returns field errors as 422", async () => {
    const res = await call("post", "/vessels", { imo: "9074728", name: "", flag: "Panama", yearBuilt: 2000, classSociety: "DNV" });
    expect(res.status).toBe(422);
    expect(res.data.fields.map((f: any) => f.field)).toEqual(["imo", "name"]);
  });

  it("finds an unknown IMO as 404", async () => {
    expect((await call("get", "/vessels/9999993")).status).toBe(404);
  });

  it("refuses a second rate for the same currency and day", async () => {
    const today = todayIso();
    const res = await call("post", "/fx-rates", { currency: "USD", date: today, rate: "150" });
    expect(res.status).toBe(422);
    expect(res.data.fields[0].message).toBe("A rate for this day already exists.");
  });

  it("activating a new version retires the old one", async () => {
    const draft = (await call("post", "/rate-tables", { copyFrom: "1" })).data;
    const activated = await call("post", `/rate-tables/${draft.id}/activate`);
    expect(activated.data.status).toBe("ACTIVE");
    const old = await call("get", "/rate-tables/1");
    expect(old.data.status).toBe("RETIRED");
  });
});
