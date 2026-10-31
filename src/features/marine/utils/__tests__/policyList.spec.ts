import { describe, expect, it } from "vitest";
import { policyTypeLabel, productLabel } from "../../constants";

describe("policy type labels", () => {
  it("labels Open Cover distinctly from single shipment", () => {
    expect(policyTypeLabel("OPEN_COVER")).toBe("Open Cover");
    expect(policyTypeLabel("SINGLE_SHIPMENT")).toBe("Single shipment");
    expect(productLabel("OPEN_COVER")).toBe("Open Cover");
  });
});

describe("open cover policy list routing", () => {
  it("routes Open Cover rows to the open-cover detail, not a duplicate policy page", () => {
    const row = { policyType: "OPEN_COVER", openCoverId: "3", id: "oc-3" };
    const href = row.policyType === "OPEN_COVER" && row.openCoverId
      ? `/marine/open-covers/${row.openCoverId}`
      : `/marine/policies/${row.id}`;
    expect(href).toBe("/marine/open-covers/3");
  });
});
