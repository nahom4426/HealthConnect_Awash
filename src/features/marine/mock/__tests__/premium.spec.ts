import { beforeEach, describe, expect, it } from "vitest";
import { handleRequest, resetMockDb } from "../server";
import { addDays, todayIso } from "../../utils/format";

const ALL = "SENIOR_UNDERWRITER,UNDERWRITER,BROKER";
async function call(method: string, url: string, data?: unknown) {
  try {
    const res = await handleRequest({ method, url, data: data === undefined ? undefined : JSON.stringify(data), headers: { "x-dev-roles": ALL, "x-dev-user": "Tester" } } as any);
    return { status: res.status, data: res.data };
  } catch (e: any) {
    return { status: e.response.status, data: e.response.data };
  }
}

describe("premium collection", () => {
  beforeEach(() => resetMockDb());

  it("starts a pending payment once and does not confirm it", async () => {
    const quote = (await call("post", "/quotes", {
      product: "SINGLE_SHIPMENT", insuredId: "1", insuredRole: "BUYER", incoterm: "FOB", mode: "SEA", vesselImo: "9074729", portOfLoading: "CNSHA",
      transshipmentPorts: [], portOfDischarge: "DJJIB", finalDestination: "Modjo", sailingDate: addDays(todayIso(), 7), hsCode: "520100",
      goodsDescription: "Cotton", currency: "USD", invoiceValue: "100000.00", freight: "5000.00", containers: [], clause: "ICC_A", warCover: false,
      strikesCover: false, lc: { enabled: false }, paymentRef: "TYPED-REF",
    })).data;
    await call("post", `/quotes/${quote.id}/rate`);
    const first = await call("post", `/quotes/${quote.id}/premium-payments`, { idempotencyKey: "quote-key-1" });
    const again = await call("post", `/quotes/${quote.id}/premium-payments`, { idempotencyKey: "quote-key-1" });
    const otherKey = await call("post", `/quotes/${quote.id}/premium-payments`, { idempotencyKey: "quote-key-2" });
    expect(first.data.status).toBe("PENDING");
    expect(first.data.provider).toBeNull();
    expect(again.data.id).toBe(first.data.id);
    expect(otherKey.data.id).toBe(first.data.id);
    expect((await call("get", `/quotes/${quote.id}`)).data.paymentRef).toBeNull();
    const refund = await call("post", `/quotes/${quote.id}/premium-payments/${first.data.id}/refund`);
    expect(refund.status).toBe(409);
    const bound = await call("post", `/quotes/${quote.id}/bind`);
    expect(bound.status).toBe(200);
  });
});
