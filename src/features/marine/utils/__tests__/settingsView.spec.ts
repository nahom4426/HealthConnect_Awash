import { describe, expect, it } from "vitest";
import { pageRows, rateTableStage, settingsFacts } from "../settingsView";

describe("marine settings facts", () => {
  it("stays on ETB and manual FX when config has not arrived", () => {
    const facts = settingsFacts(null);
    expect(facts.base).toBe("ETB");
    expect(facts.allowed).toEqual(["ETB"]);
    expect(facts.foreign).toEqual([]);
    expect(facts.source).toBe("MANUAL");
    expect(facts.rateType).toBe("MID");
    expect(facts.maxRateAgeDays).toBe(1);
    expect(facts.allowHistoricalRates).toBe(true);
    expect(facts.rolesEnforce).toBe(false);
  });

  it("uses the currencies and switches the server returned", () => {
    const facts = settingsFacts({
      currencies: ["ETB", "USD"],
      baseCurrency: "ETB",
      fxSource: "MANUAL",
      fxRateType: "MID",
      fxMaxRateAgeDays: 1,
      fxAllowHistoricalRates: true,
      rolesEnforce: false,
    });
    expect(facts.foreign).toEqual(["USD"]);
    expect(facts.rolesEnforce).toBe(false);
  });

  it("reads a list page or a bare array", () => {
    expect(pageRows({ content: [{ id: "1" }] })).toEqual([{ id: "1" }]);
    expect(pageRows([{ id: "2" }])).toEqual([{ id: "2" }]);
    expect(pageRows(null)).toEqual([]);
  });

  it("does not treat activation as tariff approval", () => {
    expect(rateTableStage("DRAFT")).toMatch(/not an approval/);
    expect(rateTableStage("ACTIVE")).toMatch(/No approval/);
    expect(rateTableStage("RETIRED")).toMatch(/no longer uses/);
  });
});
