import { describe, expect, it } from "vitest";
import { daysUntil, formatAmount, remainingLabel } from "../labels";

describe("life labels", () => {
  it("counts whole days to a cover end date", () => {
    const now = new Date("2026-10-28T15:00:00Z");
    expect(daysUntil("2026-10-31T00:00:00", now)).toBe(3);
    expect(daysUntil("2026-10-28T00:00:00", now)).toBe(0);
    expect(daysUntil("2026-10-20T00:00:00", now)).toBe(-8);
    expect(daysUntil(null, now)).toBeNull();
  });

  it("describes what is left", () => {
    expect(remainingLabel(1)).toBe("1 day left");
    expect(remainingLabel(0)).toBe("Ends today");
    expect(remainingLabel(-2)).toBe("Ended 2 days ago");
    expect(remainingLabel(null)).toBe("—");
  });

  it("formats backend amounts without changing them", () => {
    expect(formatAmount(1234.5)).toBe("1,234.50");
    expect(formatAmount(null)).toBe("—");
  });
});
