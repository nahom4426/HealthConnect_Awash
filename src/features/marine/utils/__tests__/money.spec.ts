import { describe, expect, it } from "vitest";
import { add, formatMoney, sumInsured, toEtb, toFixedString } from "../money";
import { isValidImo, imoError, isValidContainerNo } from "../imo";

describe("money (FE-09)", () => {
  it("adds 0.1 and 0.2 to exactly 0.30", () => {
    expect(toFixedString(add("0.1", "0.2"))).toBe("0.30");
  });

  it.each([
    ["100000", "5000", "115500.00"],
    ["0.01", "0", "0.01"],
    ["1234.56", "65.44", "1430.00"],
    ["999999.99", "0.01", "1100000.00"],
    ["120000", "8500.50", "141350.55"],
  ])("sum insured of %s + %s freight with 10%% uplift is %s (FE-12)", (invoice, freight, total) => {
    expect(sumInsured(invoice, freight, "10").total).toBe(total);
  });

  it("formats with the currency code and thousands separators", () => {
    expect(formatMoney("120000", "USD")).toBe("USD 120,000.00");
    expect(formatMoney("", "USD")).toBe("—");
  });

  it("converts to ETB at a 4-decimal rate", () => {
    expect(toEtb("1000.00", "156.0412")).toBe("156041.20");
  });
});

describe("IMO numbers (FE-09)", () => {
  it("accepts 9074729 and refuses 9074728", () => {
    expect(isValidImo("9074729")).toBe(true);
    expect(isValidImo("9074728")).toBe(false);
    expect(imoError("9074728")).toMatch(/check digit/);
    expect(imoError("123")).toMatch(/7 digits/);
  });

  it("checks container number shape", () => {
    expect(isValidContainerNo("MSCU1234567")).toBe(true);
    expect(isValidContainerNo("MSC1234567")).toBe(false);
  });
});
