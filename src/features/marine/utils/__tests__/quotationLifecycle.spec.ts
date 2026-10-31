import { describe, expect, it } from "vitest";
import { bindingEligibility, declarationPremiumNote, isDeclarationQuote, quotationIssued } from "../quotationView";

describe("bindingEligibility", () => {
  it("keeps a declined quotation out of binding", () => {
    expect(bindingEligibility({ status: "DECLINED", premium: { total: "10" } })).toMatch(/declined/i);
  });

  it("does not treat a referred quotation as payable into approval", () => {
    expect(bindingEligibility({ status: "REFERRED", premium: { total: "10" }, payment: { status: "CONFIRMED" } }))
      .toMatch(/underwriting/i);
  });

  it("still requires sanctions after an automatic quote", () => {
    expect(bindingEligibility({ status: "QUOTED", premium: { total: "10" } })).toMatch(/sanctions/i);
  });

  it("treats an issued quotation as underwriting acceptance, not customer acceptance", () => {
    expect(quotationIssued({ status: "APPROVED", premium: { total: "10" } })).toMatch(/no separate customer-acceptance/i);
    expect(quotationIssued({ status: "QUOTED" })).toMatch(/does not mean the premium was collected/i);
  });

  it("treats a shipment under an open cover as a declaration, not as the cover quotation", () => {
    expect(isDeclarationQuote({ openCover: { id: "9" }, arrangement: "SINGLE_SHIPMENT" })).toBe(true);
    expect(isDeclarationQuote({ openCover: { id: "9" }, arrangement: "OPEN_COVER" })).toBe(false);
    expect(declarationPremiumNote({
      openCover: { id: "9" },
      arrangement: "SINGLE_SHIPMENT",
      premium: { agreedRate: true },
    })).toMatch(/sum insured/);
  });

  it("does not bind an open cover quotation as a shipment policy", () => {
    expect(bindingEligibility({ arrangement: "OPEN_COVER", status: "DRAFT" })).toMatch(/Open Cover/);
  });
});
