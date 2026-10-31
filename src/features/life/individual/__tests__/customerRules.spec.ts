import { describe, expect, it } from "vitest";
import { customerFromBenefit, duplicateParams, fromCustomer, kycMissing, toCustomerRequest, validateCustomer } from "../customerRules";

const valid = { ...fromCustomer({}), firstName: "Liya", fatherName: "Mekonnen", gender: "Female", dateOfBirth: "1990-06-15", idType: "NATIONAL_ID", idNumber: "FAN-123", phone: "+251911223344" };

describe("policyholder", () => {
  it("prefills a new customer from the insured person", () => {
    const f = customerFromBenefit({ firstName: "Liya", fatherName: "Mekonnen", grandFatherName: "Alemu", gender: "FEMALE", dateOfBirth: "1990-06-15T00:00:00", personPhone: "0911223344" });
    expect(f).toMatchObject({ firstName: "Liya", grandFatherName: "Alemu", gender: "Female", dateOfBirth: "1990-06-15", phone: "0911223344", nationality: "Ethiopian", idType: "" });
  });

  it("needs the identity fields to register, not the KYC ones", () => {
    expect(validateCustomer(valid, "2026-10-31")).toEqual({});
    expect(validateCustomer({ ...valid, firstName: "", idType: "", idNumber: " ", phone: "0911", email: "x", dateOfBirth: "2027-01-01" }, "2026-10-31")).toEqual({
      firstName: "Required", idType: "Choose", idNumber: "Required", phone: "9 to 13 digits, optionally starting with +", email: "Enter a valid email", dateOfBirth: "Must be in the past",
    });
  });

  it("sends a plain-date INDIVIDUAL request without blank optional fields", () => {
    const body = toCustomerRequest({ ...valid, occupation: " Teacher ", zone: "" });
    expect(body).toEqual({ type: "INDIVIDUAL", firstName: "Liya", fatherName: "Mekonnen", gender: "Female", dateOfBirth: "1990-06-15", idType: "NATIONAL_ID", idNumber: "FAN-123", phone: "+251911223344", occupation: "Teacher" });
  });

  it("lists the due-diligence fields KYC still needs", () => {
    expect(kycMissing({ nationality: "Ethiopian", occupation: "", region: "Addis Ababa" })).toEqual(["Occupation", "Source of income"]);
    expect(kycMissing({ nationality: "a", occupation: "b", sourceOfIncome: "c", region: "d" })).toEqual([]);
  });

  it("checks duplicates only on what is filled", () => {
    expect(duplicateParams({ idNumber: "", phone: " 0911 ", dateOfBirth: "1990-06-15" })).toEqual({ phone: "0911", dateOfBirth: "1990-06-15" });
  });
});
