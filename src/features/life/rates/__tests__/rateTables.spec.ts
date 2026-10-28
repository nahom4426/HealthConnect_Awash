import { describe, expect, it } from "vitest";
import { groupRiderSpec, groupTermSpec, individualTermSpec, toSavePayload, validateRateRows } from "../rateTables";

const row = (key: string, values: Record<string, unknown>) => ({ _key: key, ...values });

describe("validateRateRows", () => {
  it("accepts a complete group term table", () => {
    const rows = [
      row("a", { age: "30", maleRate: "1.2", femaleRate: "1.1", rateUnit: "1000", status: "ACTIVE" }),
      row("b", { age: "31", maleRate: "1.3", femaleRate: "1.2", rateUnit: "1000", status: "ACTIVE" }),
    ];
    expect(validateRateRows(groupTermSpec, rows).valid).toBe(true);
  });

  it("flags blanks, negative rates, non-integer ages and a zero rate unit", () => {
    const { fieldErrors, valid } = validateRateRows(groupTermSpec, [
      row("a", { age: "30.5", maleRate: "", femaleRate: "-1", rateUnit: "0", status: "ACTIVE" }),
    ]);
    expect(valid).toBe(false);
    expect(fieldErrors.a).toEqual({ age: "Whole number", maleRate: "Required", femaleRate: "Min 0", rateUnit: "Min 1" });
  });

  it("rejects statuses the backend enum doesn't have", () => {
    const { fieldErrors } = validateRateRows(groupTermSpec, [row("a", { age: 1, maleRate: 1, femaleRate: 1, rateUnit: 1, status: "LAPSED" })]);
    expect(fieldErrors.a.status).toBe("Pick a status");
  });

  it("detects duplicate ages, and duplicate age+term for individual term", () => {
    const g = validateRateRows(groupTermSpec, [
      row("a", { age: 30, maleRate: 1, femaleRate: 1, rateUnit: 1000, status: "ACTIVE" }),
      row("b", { age: "30", maleRate: 2, femaleRate: 2, rateUnit: 1000, status: "ACTIVE" }),
    ]);
    expect(g.tableErrors[0]).toContain("same age (30)");

    const base = { maleRate: 1, femaleRate: 1, rateUnit: 1000, maxDiscount: 0, maxLoad: 0, status: "ACTIVE" };
    const i = validateRateRows(individualTermSpec, [row("a", { age: 30, term: 10, ...base }), row("b", { age: 30, term: 15, ...base })]);
    expect(i.valid).toBe(true);
    const dup = validateRateRows(individualTermSpec, [row("a", { age: 30, term: 10, ...base }), row("b", { age: 30, term: 10, ...base })]);
    expect(dup.tableErrors[0]).toContain("age and term (30 / 10)");
  });

  it("checks group rider age ranges for order and overlap", () => {
    const base = { maleRate: 1, femaleRate: 1, rateUnit: 1000, status: "ACTIVE" };
    const inverted = validateRateRows(groupRiderSpec, [row("a", { minAge: 40, maxAge: 30, ...base })]);
    expect(inverted.fieldErrors.a.maxAge).toBe("Must be ≥ from age");

    const overlap = validateRateRows(groupRiderSpec, [row("a", { minAge: 18, maxAge: 40, ...base }), row("b", { minAge: 40, maxAge: 60, ...base })]);
    expect(overlap.tableErrors[0]).toBe("Age ranges 18–40 and 40–60 overlap.");

    const ok = validateRateRows(groupRiderSpec, [row("a", { minAge: 18, maxAge: 39, ...base }), row("b", { minAge: 40, maxAge: 60, ...base })]);
    expect(ok.valid).toBe(true);
  });
});

describe("toSavePayload", () => {
  const original = [
    { groupTermUuid: "g1", age: 30, maleRate: 1.2, femaleRate: 1.1, rateUnit: 1000, status: "ACTIVE", audit: {} },
    { groupTermUuid: "g2", age: 31, maleRate: 1.3, femaleRate: 1.2, rateUnit: 1000, status: "ACTIVE", audit: {} },
  ];

  it("sends only new and changed rows, as numbers, with their uuid and no editor fields", () => {
    const rows = [
      { _key: "g1", groupTermUuid: "g1", age: 30, maleRate: "1.2", femaleRate: "1.1", rateUnit: "1000", status: "ACTIVE" }, // unchanged
      { _key: "g2", groupTermUuid: "g2", age: 31, maleRate: "1.35", femaleRate: "1.2", rateUnit: "1000", status: "ACTIVE" }, // changed
      { _key: "n1", age: "32", maleRate: "1.4", femaleRate: "1.3", rateUnit: "1000", status: "PENDING" }, // new
    ];
    expect(toSavePayload(groupTermSpec, rows, original)).toEqual([
      { groupTermUuid: "g2", age: 31, maleRate: 1.35, femaleRate: 1.2, rateUnit: 1000, status: "ACTIVE" },
      { age: 32, maleRate: 1.4, femaleRate: 1.3, rateUnit: 1000, status: "PENDING" },
    ]);
  });

  it("adds fixed fields such as riderUuid to every row", () => {
    const rows = [{ _key: "n", minAge: "18", maxAge: "40", maleRate: "2", femaleRate: "2", rateUnit: "1000", status: "ACTIVE" }];
    expect(toSavePayload(groupRiderSpec, rows, [], { riderUuid: "r1" })).toEqual([
      { riderUuid: "r1", minAge: 18, maxAge: 40, maleRate: 2, femaleRate: 2, rateUnit: 1000, status: "ACTIVE" },
    ]);
  });
});
