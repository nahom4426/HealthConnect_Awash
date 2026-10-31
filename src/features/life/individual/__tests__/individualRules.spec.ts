import { describe, expect, it } from "vitest";
import { benefitActions, fromBenefit, pageOf, quoteParams, toBenefitRequest, toRiderBenefitRequest, validateBenefit, validateRiderBenefit } from "../individualRules";

const valid = { firstName: "Liya", fatherName: "Mekonnen", grandFatherName: "Alemu", gender: "Female", personPhone: "+251911223344", dateOfBirth: "1990-06-15", beginDate: "2026-11-01", insuranceTerm: "10", termBenefit: "500000" };

describe("individual policy", () => {
  it("only lets drafts be changed", () => {
    expect(benefitActions({ status: "PENDING" })).toEqual({ edit: true, remove: true, riders: true });
    expect(benefitActions({ status: "ACTIVE" })).toEqual({ edit: false, remove: false, riders: false });
  });

  it("asks the backend for a quote only once every pricing input is there", () => {
    expect(quoteParams({ ...valid, gender: "" })).toBeNull();
    expect(quoteParams({ ...valid, termBenefit: "" })).toBeNull();
    expect(quoteParams(valid)).toEqual({ dateOfBirth: "1990-06-15", gender: "Female", beginDate: "2026-11-01", term: 10, termBenefit: 500000 });
    expect(quoteParams(valid, [{ riderUuid: "r1", benefits: "200000" }, { riderUuid: "", benefits: "5" }, { riderUuid: "r2", benefits: "" }]).riders).toBe("r1:200000");
  });

  it("validates the person and cover", () => {
    expect(validateBenefit(valid, "2026-10-29")).toEqual({});
    expect(validateBenefit({ ...valid, firstName: "", gender: "x", dateOfBirth: "2027-01-01", insuranceTerm: "0", termBenefit: "-5" }, "2026-10-29")).toEqual({
      firstName: "Required", gender: "Choose", dateOfBirth: "Must be in the past", beginDate: "Must be after the date of birth", insuranceTerm: "Whole number of years, at least 1", termBenefit: "Must be more than 0",
    });
  });

  it("sends no premium and round-trips the response", () => {
    const body = toBenefitRequest(valid);
    expect(body).toEqual({ firstName: "Liya", fatherName: "Mekonnen", grandFatherName: "Alemu", gender: "Female", personPhone: "+251911223344", dateOfBirth: "1990-06-15T00:00:00", beginDate: "2026-11-01T00:00:00", insuranceTerm: 10, termBenefit: 500000 });
    expect(body).not.toHaveProperty("termPremium");
    expect(fromBenefit({ ...body, termPremium: 2100 })).toEqual({ ...valid, insuranceTerm: 10, termBenefit: 500000 });
  });
});

describe("rider on an individual policy", () => {
  const rider = { riderUuid: "r1", minLimit: 50000, maxLimit: 1000000 };
  it("keeps the benefit inside the rider's limits", () => {
    expect(validateRiderBenefit({ riderUuid: "", benefits: "" }, null)).toEqual({ riderUuid: "Choose a rider", benefits: "Required" });
    expect(validateRiderBenefit({ riderUuid: "r1", benefits: "20000" }, rider)).toEqual({ benefits: "Between 50000 and 1000000" });
    expect(validateRiderBenefit({ riderUuid: "r1", benefits: "200000" }, rider)).toEqual({});
  });
  it("sends no premium", () => {
    expect(toRiderBenefitRequest({ riderUuid: "r1", benefits: "200000" }, "b1", "PENDING")).toEqual({ benefitUuid: "b1", riderUuid: "r1", benefits: 200000, status: "PENDING" });
  });
});

describe("client paging", () => {
  it("slices and clamps", () => {
    const rows = Array.from({ length: 25 }, (_, i) => i);
    expect(pageOf(rows, 3, 10)).toEqual({ rows: [20, 21, 22, 23, 24], totalPages: 3, page: 3 });
    expect(pageOf(rows, 9, 10).page).toBe(3);
    expect(pageOf([], 1, 10)).toEqual({ rows: [], totalPages: 1, page: 1 });
  });
});
