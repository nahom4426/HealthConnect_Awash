import { describe, expect, it } from "vitest";
import { isAmountColumn, isHiddenColumn, periodFor, statusBreakdown, totalOf, validatePeriod } from "../reportRules";

describe("dashboard and reports", () => {
  const today = new Date(Date.UTC(2026, 10, 1)); // 1 Nov 2026

  it("works out the preset periods", () => {
    expect(periodFor("year", today)).toEqual({ from: "2026-01-01", to: "2026-11-01" });
    expect(periodFor("month", today)).toEqual({ from: "2026-11-01", to: "2026-11-01" });
    expect(periodFor("quarter", today)).toEqual({ from: "2026-10-01", to: "2026-11-01" });
    expect(periodFor("last12", today)).toEqual({ from: "2025-11-02", to: "2026-11-01" });
    expect(validatePeriod({ from: "2026-11-02", to: "2026-11-01" })).toBe("The start date must be before the end date");
  });

  it("lays out counts by status, largest first", () => {
    expect(statusBreakdown({ PENDING: 2, PAID: 4, ISSUED: 0 })).toEqual([
      { status: "PAID", label: "Paid", count: 4, share: 4 / 6 },
      { status: "PENDING", label: "Pending", count: 2, share: 2 / 6 },
    ]);
    expect(statusBreakdown(undefined)).toEqual([]);
    expect(totalOf({ ACTIVE: 2, CANCELLED: 1 })).toBe(3);
  });

  it("formats amount columns and hides UUIDs", () => {
    expect(["Gross", "Amount due", "Net payable", "Cession premium", "Reassured SA"].every(isAmountColumn)).toBe(true);
    expect(["Due date", "Receipt number", "Installment", "Policy number", "Status"].some(isAmountColumn)).toBe(false);
    expect(isHiddenColumn("Claim UUID")).toBe(true);
  });
});
