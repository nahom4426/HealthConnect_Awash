import { beforeEach, describe, expect, it, vi } from "vitest";

// Record what each generated function asks ApiService to do, without any network.
const { calls, auth } = vi.hoisted(() => ({ calls: [] as any[], auth: { count: 0 } }));
vi.mock("@/service/ApiService", () => ({
  default: class {
    baseURL: string;
    constructor(baseURL: string) { this.baseURL = baseURL; }
    addAuthenticationHeader() { auth.count++; return this; }
    get(url: string, config?: any) { calls.push({ method: "get", base: this.baseURL, url, config }); return Promise.resolve({ success: true }); }
    post(url: string, data?: any, config?: any) { calls.push({ method: "post", base: this.baseURL, url, data, config }); return Promise.resolve({ success: true }); }
    put(url: string, data?: any, config?: any) { calls.push({ method: "put", base: this.baseURL, url, data, config }); return Promise.resolve({ success: true }); }
    delete(url: string, config?: any) { calls.push({ method: "delete", base: this.baseURL, url, config }); return Promise.resolve({ success: true }); }
  },
}));

import * as product from "../productApi";
import * as quotation from "../quotationApi";
import * as policy from "../policyApi";
import * as underwriting from "../underwritingApi";
import * as claim from "../claimApi";
import * as reinsurance from "../reinsuranceApi";
import * as customer from "../customerApi";

const last = () => calls[calls.length - 1];

beforeEach(() => { calls.length = 0; auth.count = 0; });

describe("Life API client", () => {
  // 169 operations generated from the OpenAPI document + 9 added from the backend contract of
  // 2026-10 (docs/life-insurance/10-backend-prompt.md) + 7 customer/KYC operations (G2)
  it("covers the 169 generated operations plus the 16 contract additions, once each", () => {
    const names = [product, quotation, policy, underwriting, claim, reinsurance, customer].flatMap((m) => Object.keys(m));
    expect(names).toHaveLength(185);
    expect(new Set(names).size).toBe(185);
  });

  it("uses the JSON bodies of the 2026-10 contract", async () => {
    await quotation.recordQuotationPayment("q-1", { receiptNumber: "R-1", receiptDate: "2026-10-28" });
    expect(last()).toMatchObject({ method: "put", url: "/quotation/q-1/pay", data: { receiptNumber: "R-1", receiptDate: "2026-10-28" } });
    await claim.rejectClaim("c-1", "Event before cover");
    expect(last()).toMatchObject({ method: "put", url: "/claim/c-1/deny", data: { comment: "Event before cover" } });
    await underwriting.updateQuestionStatus("qn-1", "DISABLED");
    expect(last()).toMatchObject({ method: "put", url: "/question/qn-1/status", config: { params: { status: "DISABLED" } } });
    await policy.getBenefitQuote({ term: 10 });
    expect(last()).toMatchObject({ method: "get", url: "/benefit/quote", config: { params: { term: 10 } } });
    await customer.decideCustomerKyc("cu-1", { kycStatus: "VERIFIED", note: "ID seen" });
    expect(last()).toMatchObject({ method: "put", url: "/customer/cu-1/kyc", data: { kycStatus: "VERIFIED", note: "ID seen" } });
    await customer.getCustomers({ type: "INDIVIDUAL", search: "Liya" });
    expect(last()).toMatchObject({ method: "get", url: "/customer/list", config: { params: { type: "INDIVIDUAL", search: "Liya" } } });
    await policy.getIndividualRiderBenefits({ benefitUuid: "b-1" });
    expect(last()).toMatchObject({ url: "/individual-rider-benefit/active/benefits", config: { params: { benefitUuid: "b-1" } } });
  });

  it("targets the Life service through /api/life and always authenticates", async () => {
    await product.getRiders();
    expect(last()).toMatchObject({ method: "get", base: "/api/life", url: "/rider/active" });
    expect(auth.count).toBe(1);
  });

  it("puts path params in the URL and list filters in the query string", async () => {
    await quotation.getQuotations({ status: "PENDING", page: 1, limit: 10, search: "abc" });
    expect(last()).toMatchObject({ method: "get", url: "/quotation/list", config: { params: { status: "PENDING", page: 1, limit: 10, search: "abc" } } });

    await quotation.getInsuredPersons("q-1", { page: 2, limit: 25 });
    expect(last()).toMatchObject({ url: "/insuredperson/list/q-1", config: { params: { page: 2, limit: 25 } } });
  });

  it("sends JSON bodies for create/update", async () => {
    const body = { institutionUuid: "i-1", term: 1, contactPhone: "0911000000" };
    await quotation.createQuotation(body);
    expect(last()).toMatchObject({ method: "post", url: "/quotation", data: body });

    await policy.issuePolicy("q-1", { beginDate: "2026-11-01T00:00:00Z", endDate: "2027-10-31T00:00:00Z" });
    expect(last()).toMatchObject({ method: "put", url: "/policy/issue/q-1", data: { beginDate: "2026-11-01T00:00:00Z" } });
  });

  it("passes payment figures as query params exactly as the backend expects", async () => {
    const pay = { receiptNumber: "R-1", withHoldingTax: 20, revenueStamp: 5, netPremium: 975, receiptDate: "2026-10-28", requestedPremium: 1000 };
    await quotation.payQuotation("q-1", pay);
    expect(last()).toMatchObject({ method: "put", url: "/quotation/pay/q-1", data: undefined, config: { params: pay } });
  });

  it("uploads files as multipart with their required query params", async () => {
    const fd = new FormData();
    await quotation.importInsuredPerson(fd, { institutionUuid: "i-1", qutoationUuid: "q-1" });
    expect(last()).toMatchObject({
      method: "post",
      url: "/insuredperson/import-insured-person",
      data: fd,
      config: { params: { institutionUuid: "i-1", qutoationUuid: "q-1" }, headers: { "Content-Type": "multipart/form-data" } },
    });
  });

  it("downloads binary responses as blobs", async () => {
    await quotation.exportInsuredPersonSample();
    expect(last().config).toMatchObject({ responseType: "blob" });
    await claim.getAttachment({ claimAttachmentUuid: "a-1" });
    expect(last().config).toMatchObject({ params: { claimAttachmentUuid: "a-1" }, responseType: "blob" });
  });

  it("maps claim actions and status-filtered admin calls", async () => {
    await claim.denyClaim({ claimUuid: "c-1", comment: "Outside cover period" });
    expect(last()).toMatchObject({ method: "put", url: "/claim/deny", config: { params: { claimUuid: "c-1", comment: "Outside cover period" } } });

    await reinsurance.updateReinsuranceTreatyStatus("t-1", { status: "ACTIVE" });
    expect(last()).toMatchObject({ method: "put", url: "/reinsurance/treaty/update/status/t-1", config: { params: { status: "ACTIVE" } } });

    await underwriting.getQuestions({ status: "ACTIVE" });
    expect(last()).toMatchObject({ url: "/question", config: { params: { status: "ACTIVE" } } });
  });
});
