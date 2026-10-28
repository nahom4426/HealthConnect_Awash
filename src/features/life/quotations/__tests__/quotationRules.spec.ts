import { describe, expect, it } from "vitest";
import { validateRateRows } from "../../rates/rateTables";
import {
  fromInsured, quotationActions, quotedRiderSpec, riderChanges, toInsuredRequest, toPaymentParams, toQuotationRequest,
  validateInsured, validatePayment, validatePolicyDates, validateQuotation,
} from "../quotationRules";

describe("quotation status actions", () => {
  it("allows each step only from the status before it", () => {
    expect(quotationActions({ quotationStatus: "PENDING" })).toMatchObject({ edit: true, issue: true, accept: false, pay: false });
    expect(quotationActions({ quotationStatus: "ISSUED" })).toMatchObject({ edit: false, accept: true, pay: false });
    expect(quotationActions({ quotationStatus: "ACCEPTED" })).toMatchObject({ pay: true, issuePolicy: false });
    expect(quotationActions({ quotationStatus: "PAID" })).toMatchObject({ issuePolicy: true, revise: false });
    expect(quotationActions({ quotationStatus: "PAID", policyIssuedDate: "2026-10-01T00:00:00" })).toMatchObject({ issuePolicy: false, revise: true });
  });
});

describe("quotation details", () => {
  it("needs an institution and a whole-year term", () => {
    expect(validateQuotation({ institutionUuid: "", term: "" })).toEqual({ institutionUuid: "Choose the institution", term: "Enter the term" });
    expect(validateQuotation({ institutionUuid: "i1", term: "1.5" }).term).toBe("Whole number of years, at least 1");
    expect(validateQuotation({ institutionUuid: "i1", term: 1, contactPhone: "09-11" }).contactPhone).toBeTruthy();
    expect(validateQuotation({ institutionUuid: "i1", term: 1, contactPhone: "+251911223344" })).toEqual({});
  });

  it("records who prepared it", () => {
    const body = toQuotationRequest({ institutionUuid: "i1", institutionName: "Acme", term: "1", contactPersonFullName: " Abebe ", contactPhone: "0911" }, { userUuid: "u1", firstName: "Sara", fatherName: "Kebede" }, "PENDING");
    expect(body).toEqual({ institutionUuid: "i1", institutionName: "Acme", term: 1, contactPersonFullName: "Abebe", contactPhone: "0911", quotedByUuid: "u1", quotedByFullName: "Sara Kebede", quotationStatus: "PENDING" });
  });
});

describe("insured person", () => {
  const valid = {
    ...fromInsured({}), title: "Mr", firstName: "Abebe", fatherName: "Kebede", grandFatherName: "Tesfaye", phone: "0911223344",
    address1: "Bole", address2: "Woreda 3", address3: "H.No 12", state: "Addis Ababa", country: "Ethiopia", birthDate: "1990-05-01", gender: "Male", sumAssured: "250000",
  };

  it("accepts a complete member and sends no premium", () => {
    expect(validateInsured(valid)).toEqual({});
    const body = toInsuredRequest(valid, { institutionUuid: "i1", quotationUuid: "q1" });
    expect(body).toMatchObject({ institutionUuid: "i1", quotationUuid: "q1", birthDate: "1990-05-01T00:00:00", sumAssured: 250000, gender: "Male" });
    expect(body).not.toHaveProperty("premium");
    expect(body).not.toHaveProperty("email");
  });

  it("flags missing, too long and invalid fields", () => {
    const e = validateInsured({ ...valid, firstName: "", fatherName: "x".repeat(26), email: "nope", birthDate: "2999-01-01", gender: "", sumAssured: "0" });
    expect(e).toEqual({ firstName: "Required", fatherName: "At most 25 characters", email: "Enter a valid email", birthDate: "Must be in the past", gender: "Choose", sumAssured: "Must be more than 0" });
  });
});

describe("quoted riders", () => {
  const riders = [{ riderUuid: "r-adb", riderName: "Accidental death", minLimit: 50000, maxLimit: 1000000 }];

  it("keeps sums assured inside the rider's limits", () => {
    const res = validateRateRows(quotedRiderSpec(riders), [{ _key: "a", riderUuid: "r-adb", sumAssured: "2000000" }]);
    expect(res.tableErrors).toEqual(["Accidental death: sum assured must be between 50000 and 1000000."]);
    expect(validateRateRows(quotedRiderSpec(riders), [{ _key: "a", riderUuid: "r-adb", sumAssured: "100000" }]).valid).toBe(true);
  });

  it("creates new rows and updates only changed sums", () => {
    const original = [{ quotedRiderUuid: "qr1", riderUuid: "r-adb", sumAssured: 100000 }, { quotedRiderUuid: "qr2", riderUuid: "r-tpd", sumAssured: 50000 }];
    const rows = [{ quotedRiderUuid: "qr1", riderUuid: "r-adb", sumAssured: "100000" }, { quotedRiderUuid: "qr2", riderUuid: "r-tpd", sumAssured: "75000" }, { riderUuid: "r-ci", sumAssured: "60000" }];
    expect(riderChanges(rows, original, "q1")).toEqual({
      create: [{ riderUuid: "r-ci", quotationUuid: "q1", sumAssured: 60000 }],
      update: [{ quotedRiderUuid: "qr2", sumAssured: 75000 }],
    });
  });
});

describe("payment and policy dates", () => {
  it("requires the receipt and every amount, without computing any", () => {
    expect(validatePayment({ receiptNumber: "", receiptDate: "", requestedPremium: "", withHoldingTax: "-1", revenueStamp: "5", netPremium: "x" })).toEqual({
      receiptNumber: "Enter the receipt number", receiptDate: "Required", requestedPremium: "Required", withHoldingTax: "Must be 0 or more", netPremium: "Must be 0 or more",
    });
    expect(toPaymentParams({ receiptNumber: " R-1 ", receiptDate: "2026-10-01", requestedPremium: "1000", withHoldingTax: "20", revenueStamp: "5", netPremium: "975" })).toEqual({
      receiptNumber: "R-1", receiptDate: "2026-10-01T00:00:00", requestedPremium: 1000, withHoldingTax: 20, revenueStamp: 5, netPremium: 975,
    });
  });

  it("orders policy dates", () => {
    expect(validatePolicyDates({ beginDate: "2026-11-01", endDate: "2026-11-01" })).toEqual({ endDate: "Must be after the start date" });
    expect(validatePolicyDates({ beginDate: "2026-11-01", endDate: "2027-10-31" })).toEqual({});
  });
});
