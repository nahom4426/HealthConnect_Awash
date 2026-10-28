import { describe, expect, it } from "vitest";
import { coverErrors, partiesErrors, shipmentErrors } from "../quoteRules";
import { incotermWarning } from "../../constants";
import { emptyDraft, toPayload } from "../../store/quoteDraft";

describe("quote wizard rules", () => {
  it("warns when the insured buyer is on a CIF shipment (FE-13)", () => {
    expect(incotermWarning("CIF", "BUYER")).toBe("Under CIF the seller normally insures.");
    expect(incotermWarning("FOB", "BUYER")).toBe("");
    expect(incotermWarning("FOB", "SELLER")).toBe("Under FOB the buyer normally insures.");
  });

  it("refuses an LC expiry on or before the sailing date (FE-14)", () => {
    const d = { ...emptyDraft(), clause: "ICC_A", sailingDate: "2026-11-10" };
    d.lc = { enabled: true, number: "LC-1", bank: { id: "5" }, amount: "100", expiry: "2026-11-01" };
    expect(coverErrors(d)["lc.expiry"]).toBe("LC expiry must be after the sailing date");
    d.lc.expiry = "2026-11-11";
    expect(coverErrors(d)["lc.expiry"]).toBeUndefined();
  });

  it("requires the vessel only for sea modes and different ports", () => {
    const d = { ...emptyDraft(), mode: "AIR", loadingPort: { code: "DJJIB" }, dischargePort: { code: "DJJIB" } };
    const e = shipmentErrors(d, "2026-10-28");
    expect(e.vessel).toBeUndefined();
    expect(e.dischargePort).toMatch(/differ/);
    expect(shipmentErrors({ ...d, mode: "SEA" }, "2026-10-28").vessel).toBeDefined();
  });

  it("refuses a sailing date more than 30 days back", () => {
    const d = { ...emptyDraft(), sailingDate: "2026-09-27" };
    expect(shipmentErrors(d, "2026-10-28").sailingDate).toMatch(/30 days/);
    expect(shipmentErrors({ ...d, sailingDate: "2026-09-28" }, "2026-10-28").sailingDate).toBeUndefined();
  });

  it("needs insured, role and incoterm on step 1", () => {
    expect(Object.keys(partiesErrors(emptyDraft())).sort()).toEqual(["incoterm", "insured", "insuredRole"]);
  });

  it("sends only ids to the API and drops the vessel for air", () => {
    const d = { ...emptyDraft(), mode: "AIR", insured: { id: "1", name: "X" }, vessel: { imo: "9074729" } };
    const body = toPayload(d);
    expect(body.insuredId).toBe("1");
    expect(body.vesselImo).toBeNull();
    expect(body.lc).toEqual({ enabled: false });
  });
});
