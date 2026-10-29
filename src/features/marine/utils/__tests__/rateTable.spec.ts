import { describe, expect, it } from "vitest";
import { ageBandErrors, validateRateTable } from "../rateTable";
import { createSeed } from "../../mock/seed";

describe("rate table validation (FE-20)", () => {
  it("accepts the seeded active table", () => {
    expect(validateRateTable(createSeed().rateTables[0])).toEqual([]);
  });

  it("refuses overlapping age bands", () => {
    const e = ageBandErrors([
      { fromAge: 0, toAge: 20, loadingPct: "0", action: "LOAD" },
      { fromAge: 15, toAge: 99, loadingPct: "10", action: "LOAD" },
    ]);
    expect(e[0].message).toMatch(/overlap/);
  });

  it("refuses gaps and bands that stop short of 99", () => {
    const e = ageBandErrors([
      { fromAge: 0, toAge: 10, loadingPct: "0", action: "LOAD" },
      { fromAge: 15, toAge: 90, loadingPct: "0", action: "REFER" },
    ]);
    expect(e.map((x) => x.message)).toEqual(["Ages 11–14 are not covered", "Age bands must reach 99"]);
  });

  it("refuses duplicate route rows and zero factors", () => {
    const t = createSeed().rateTables[0];
    t.routeFactors.push({ ...t.routeFactors[0] });
    t.clauseFactors.ICC_B = "0";
    const paths = validateRateTable(t).map((e) => e.path);
    expect(paths).toContain(`routeFactors.${t.routeFactors.length - 1}.originRegion`);
    expect(paths).toContain("clauseFactors.ICC_B");
  });
});
