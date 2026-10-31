import { describe, expect, it } from "vitest";
import { validateRateRows } from "../../rates/rateTables";
import { fclGroupSpec, memberSpec, overlappingRanges, validateRange, validateTreaty } from "../treatyRules";

const reinsurers = [{ reinsurerUuid: "re1", name: "Ethiopian Re" }, { reinsurerUuid: "re2", name: "ZEP-RE" }];
const member = (key: string, v: Record<string, unknown>) => ({ _key: key, participationType: "Follower", reinsurnaceCommission: 20, profitCommission: 10, status: "ACTIVE", ...v });

describe("treaty members", () => {
  const spec = memberSpec(reinsurers);

  it("accepts one leader and shares adding to 100 % with no warnings", () => {
    const res = validateRateRows(spec, [member("a", { reinsurerUuid: "re1", participationType: "Leader", share: 60 }), member("b", { reinsurerUuid: "re2", share: 40 })]);
    expect(res.valid).toBe(true);
    expect(res.warnings).toEqual([]);
  });

  it("warns (without blocking) when shares miss 100 % or there is no leader", () => {
    const res = validateRateRows(spec, [member("a", { reinsurerUuid: "re1", share: 50 }), member("b", { reinsurerUuid: "re2", share: 30 })]);
    expect(res.valid).toBe(true);
    expect(res.warnings).toEqual(["Member shares add up to 80 %, not 100 %.", "No member is marked Leader."]);
  });

  it("ignores revised members in the share total", () => {
    const res = validateRateRows(spec, [
      member("a", { reinsurerUuid: "re1", participationType: "Leader", share: 100 }),
      member("b", { reinsurerUuid: "re2", share: 50, status: "REVISED" }),
    ]);
    expect(res.warnings).toEqual([]);
  });

  it("blocks a missing reinsurer, shares over 100 and the same reinsurer twice", () => {
    const res = validateRateRows(spec, [
      member("a", { reinsurerUuid: "", share: 120 }),
      member("b", { reinsurerUuid: "re1", share: 10 }),
      member("c", { reinsurerUuid: "re1", share: 10 }),
    ]);
    expect(res.valid).toBe(false);
    expect(res.fieldErrors.a).toMatchObject({ reinsurerUuid: "Required", share: "Max 100" });
    expect(res.tableErrors).toContain("Two rows have the same reinsurer (Ethiopian Re).");
  });
});

describe("group FCL bands", () => {
  const band = (key: string, v: Record<string, unknown>) => ({ _key: key, averageSumassuredMultiplier: 3, mfcl: 500000, status: "ACTIVE", ...v });
  it("rejects inverted and overlapping group-size bands", () => {
    const res = validateRateRows(fclGroupSpec, [band("a", { minLives: 10, maxLives: 49 }), band("b", { minLives: 40, maxLives: 99 }), band("c", { minLives: 200, maxLives: 100 })]);
    expect(res.fieldErrors.c.maxLives).toBe("Must be ≥ from lives");
    expect(res.tableErrors).toContain("Group size bands 10–49 and 40–99 overlap.");
  });
});

describe("treaty and range forms", () => {
  const treaty = { treatyType: "Surplus", treatyCode: "SUR-2026", treatyDescription: "", reinsuranceCoverage: "Term_And_Riders", retationLimit: 500000, riderRetentionLimit: 200000, policyCession: 50, beginDate: "2026-01-01", endDate: "2026-12-31" };

  it("accepts a complete treaty and checks dates, codes and percentages", () => {
    expect(validateTreaty(treaty)).toEqual({});
    expect(validateTreaty({ ...treaty, treatyCode: "", endDate: "2025-12-31", policyCession: 120, retationLimit: -1 })).toEqual({
      treatyCode: "Treaty code is required",
      endDate: "Must be after the start date",
      policyCession: "At most 100 %",
      retationLimit: "Cannot be negative",
    });
  });

  it("checks medical range bands", () => {
    expect(validateRange({ minAge: 18, maxAge: 45, lowerLimit: 0, upperLimit: 1000000 })).toEqual({});
    expect(validateRange({ minAge: 50, maxAge: 40, lowerLimit: 2000000, upperLimit: 1000000 })).toEqual({ maxAge: "Must be ≥ from age", upperLimit: "Must be ≥ from sum assured" });
  });

  it("finds ranges of the same type that overlap on both age and sum assured", () => {
    const a = { insuranceType: "Group", minAge: 18, maxAge: 45, lowerLimit: 0, upperLimit: 1000000 };
    const b = { insuranceType: "Group", minAge: 40, maxAge: 60, lowerLimit: 500000, upperLimit: 2000000 };
    const c = { insuranceType: "Group", minAge: 46, maxAge: 60, lowerLimit: 0, upperLimit: 1000000 };
    const d = { insuranceType: "Individual", minAge: 18, maxAge: 45, lowerLimit: 0, upperLimit: 1000000 };
    expect(overlappingRanges([a, b, c, d])).toEqual([[a, b], [b, c]]);
  });
});
