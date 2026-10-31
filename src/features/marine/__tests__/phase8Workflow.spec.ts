import { describe, expect, it } from "vitest";
import { fieldRequired, fieldVisible, validateAnswers } from "../../fire/schemaForm";
import {
  bindingEligibility,
  declarationPremiumNote,
  isDeclarationQuote,
  quotationIssued,
} from "../utils/quotationView";
import { settingsFacts, rateTableStage } from "../utils/settingsView";
import { demoPaymentVisible } from "../utils/demoPayment";
import marineNavs from "../navs";

describe("phase 8 single shipment and open cover proposal", () => {
  const arrangement = { id: "insuranceArrangement", type: "arrangement", label: "Arrangement", required: true };
  const voyage = { id: "portOfLoading", label: "Loading", required: true, visibleWhen: { field: "insuranceArrangement", equals: "SINGLE_SHIPMENT" } };
  const trading = { id: "tradingRoutes", label: "Routes", required: true, visibleWhen: { field: "insuranceArrangement", equals: "OPEN_COVER" } };
  const annual = { id: "estimatedAnnualValue", label: "Estimated annual", required: true, visibleWhen: { field: "insuranceArrangement", equals: "OPEN_COVER" } };

  it("uses one proposal form for both arrangements", () => {
    expect(fieldVisible(voyage, { insuranceArrangement: "SINGLE_SHIPMENT" })).toBe(true);
    expect(fieldVisible(trading, { insuranceArrangement: "SINGLE_SHIPMENT" })).toBe(false);
    expect(fieldVisible(voyage, { insuranceArrangement: "OPEN_COVER" })).toBe(false);
    expect(fieldRequired(trading, { insuranceArrangement: "OPEN_COVER" })).toBe(true);
    expect(fieldRequired(annual, { insuranceArrangement: "OPEN_COVER" })).toBe(true);
  });

  it("accepts a complete open cover proposal without voyage fields", () => {
    const steps = [
      { fields: [arrangement] },
      { visibleWhen: { field: "insuranceArrangement", equals: "SINGLE_SHIPMENT" }, fields: [voyage] },
      { visibleWhen: { field: "insuranceArrangement", equals: "OPEN_COVER" }, fields: [trading, annual] },
    ];
    const answers = {
      insuranceArrangement: "OPEN_COVER",
      tradingRoutes: "Shanghai to Djibouti",
      estimatedAnnualValue: "5000000",
    };
    expect(validateAnswers(steps.filter((step) => fieldVisible(step, answers)), answers)).toBe("");
  });
});

describe("phase 8 quotation underwriting and binding", () => {
  it("keeps underwriting on the quotation and treats approval as underwriter acceptance", () => {
    expect(quotationIssued({ status: "APPROVED", premium: { total: "10" } })).toMatch(/no separate customer-acceptance/i);
    expect(bindingEligibility({ status: "REFERRED", premium: { total: "10" }, payment: { status: "CONFIRMED" } }))
      .toMatch(/underwriting/i);
    expect(bindingEligibility({ status: "DECLINED", premium: { total: "10" } })).toMatch(/declined/i);
  });

  it("does not bind an open cover quotation as a shipment", () => {
    expect(bindingEligibility({ arrangement: "OPEN_COVER", status: "APPROVED", premium: { total: "10" } })).toMatch(/Open Cover/);
  });

  it("labels a declaration under an open cover and separates its premium from provisional premium", () => {
    expect(isDeclarationQuote({ openCover: { id: "11" }, arrangement: "SINGLE_SHIPMENT" })).toBe(true);
    expect(isDeclarationQuote({ openCover: { id: "11" }, arrangement: "OPEN_COVER" })).toBe(false);
    expect(declarationPremiumNote({
      openCover: { id: "11" },
      arrangement: "SINGLE_SHIPMENT",
      premium: { agreedRate: true },
    })).toMatch(/sum insured/);
  });
});

describe("phase 8 navigation and settings safeguards", () => {
  it("keeps operations first and does not restore an underwriting queue", () => {
    expect(marineNavs.map((item) => item.name)).toEqual([
      "Dashboard",
      "Proposals",
      "Quotations",
      "Open covers",
      "Declarations",
      "Policies",
      "Certificates",
      "Marine claims",
      "Marine Settings",
    ]);
    expect(marineNavs.some((item) => item.path === "/marine/underwriting")).toBe(false);
    expect(marineNavs.some((item) => item.path === "/marine/open-cover-applications")).toBe(false);
  });

  it("stays on ETB, manual FX, and draft tariffs that are not approvals", () => {
    const facts = settingsFacts({
      currencies: ["ETB"],
      baseCurrency: "ETB",
      fxSource: "MANUAL",
      fxRateType: "MID",
      fxMaxRateAgeDays: 1,
      rolesEnforce: false,
    });
    expect(facts.foreign).toEqual([]);
    expect(facts.source).toBe("MANUAL");
    expect(facts.rolesEnforce).toBe(false);
    expect(rateTableStage("DRAFT")).toMatch(/not an approval/);
  });

  it("keeps demo payment off outside the local development database", () => {
    expect(demoPaymentVisible({ demoPayment: false }, { premium: { total: "10" } })).toBe(false);
  });
});
