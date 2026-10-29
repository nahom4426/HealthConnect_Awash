// Customer registration in the mock backend: validation, duplicates, approval and the insured check.
import { beforeEach, describe, expect, it } from "vitest";
import { handleRequest, resetMockDb } from "../server";
import { addDays, todayIso } from "../../utils/format";

async function call(method: string, url: string, data?: unknown, roles = "UNDERWRITER", user = "Tester") {
  try {
    const res = await handleRequest({ method, url, data: data instanceof FormData ? data : data === undefined ? undefined : JSON.stringify(data), headers: { "x-dev-roles": roles, "x-dev-user": user, "x-dev-broker-party": roles === "BROKER" ? "8" : "" } } as any);
    return { status: res.status, data: res.data };
  } catch (e: any) {
    return { status: e.response.status, data: e.response.data };
  }
}
const upload = (id: string, kind: string) => {
  const fd = new FormData();
  fd.append("file", new File([new Uint8Array(500)], `${kind}.pdf`, { type: "application/pdf" }));
  fd.append("kind", kind);
  return call("post", `/customers/${id}/documents`, fd);
};

const COMPANY = {
  kind: "COMPANY", name: "Lalibela Textiles PLC", tin: "0099887766", tradeLicenceNo: "AM/05/1/0099887", tradeLicenceExpiry: addDays(todayIso(), 200),
  businessType: "IMPORTER", contactPerson: "Selamawit Tadesse", phone: "+251 58 220 1100", email: "info@lalibela.example",
  addressParts: { region: "Amhara", city: "Bahir Dar", subCity: "", woreda: "", houseNo: "" },
};
const INDIVIDUAL = {
  kind: "INDIVIDUAL", firstName: "Abebe", fatherName: "Kebede", grandfatherName: "Tesfaye", idType: "NATIONAL_ID", idNumber: "FAN-1234-5678",
  phone: "0911223344", addressParts: { region: "Addis Ababa", city: "Addis Ababa" },
};

describe("customer registration", () => {
  beforeEach(() => resetMockDb());

  it("registers a company as pending and refuses a duplicate TIN", async () => {
    const res = await call("post", "/customers", COMPANY);
    expect(res.status).toBe(201);
    expect(res.data.status).toBe("PENDING_APPROVAL");
    expect(res.data.customerNo).toMatch(/^CU-\d{4}-\d{5}$/);
    expect(res.data.missingDocuments).toEqual(["Trade licence", "TIN certificate"]);
    const dup = await call("post", "/customers", { ...COMPANY, name: "Other PLC", tradeLicenceNo: "X-1" });
    expect(dup.status).toBe(422);
    expect(dup.data.fields.map((f: any) => f.field)).toContain("tin");
  });

  it("checks the company and individual fields", async () => {
    const res = await call("post", "/customers", { kind: "COMPANY", tin: "123", tradeLicenceExpiry: addDays(todayIso(), -1), addressParts: {} });
    const fields = res.data.fields.map((f: any) => f.field);
    expect(fields).toEqual(expect.arrayContaining(["name", "tin", "tradeLicenceNo", "tradeLicenceExpiry", "businessType", "contactPerson", "phone", "addressParts.region", "addressParts.city"]));
    const person = await call("post", "/customers", INDIVIDUAL);
    expect(person.data.name).toBe("Abebe Kebede Tesfaye");
  });

  it("approves only with the mandatory documents, and only approvers can", async () => {
    const c = (await call("post", "/customers", COMPANY)).data;
    const missing = await call("post", `/customers/${c.id}/approve`);
    expect(missing.status).toBe(422);
    expect(missing.data.code).toBe("MISSING_DOCUMENTS");
    await upload(c.id, "TRADE_LICENCE");
    await upload(c.id, "TIN_CERTIFICATE");
    expect((await call("post", `/customers/${c.id}/approve`, {}, "BROKER")).status).toBe(403);
    expect((await call("post", `/customers/${c.id}/approve`)).data.status).toBe("APPROVED");
  });

  it("won't rate a quote for a customer who isn't approved", async () => {
    const pending = (await call("post", "/customers", COMPANY)).data;
    const q = (await call("post", "/quotes", {
      product: "SINGLE_SHIPMENT", insuredId: pending.id, insuredRole: "BUYER", incoterm: "FOB", mode: "SEA", vesselImo: "9074729", portOfLoading: "CNSHA",
      transshipmentPorts: [], portOfDischarge: "DJJIB", finalDestination: "Modjo", sailingDate: todayIso(), hsCode: "520100", goodsDescription: "Cotton",
      currency: "USD", invoiceValue: "100000.00", freight: "5000.00", containers: [], clause: "ICC_A", lc: { enabled: false },
    })).data;
    const rated = await call("post", `/quotes/${q.id}/rate`);
    expect(rated.status).toBe(422);
    expect(rated.data.fields.find((f: any) => f.field === "insuredId").message).toMatch(/waiting for approval/);
  });

  it("sends an approved customer back for approval when its identity changes", async () => {
    const c = (await call("get", "/customers/1")).data;
    expect(c.status).toBe("APPROVED");
    expect((await call("put", "/customers/1", { ...c, phone: "+251 11 551 2201" })).data.status).toBe("APPROVED");
    expect((await call("put", "/customers/1", { ...c, tin: "0012345600" })).data.status).toBe("PENDING_APPROVAL");
  });

  it("shows a broker only the customers they registered", async () => {
    await call("post", "/customers", COMPANY, "BROKER");
    const list = (await call("get", "/customers", undefined, "BROKER")).data.content;
    expect(list.map((c: any) => c.name).sort()).toEqual(["Lalibela Textiles PLC", "Tsehay Coffee Exporters PLC"]);
  });
});
