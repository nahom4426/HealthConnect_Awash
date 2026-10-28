import { describe, expect, it } from "vitest";
import { deadlineTone } from "../deadlines";
import { fileError } from "../files";
import { addDays } from "../format";

describe("claims helpers (FE-36)", () => {
  const today = "2026-10-28";
  it("colours deadlines at 8, 7 and -1 days", () => {
    expect(deadlineTone(addDays(today, 8), "OPEN", today)).toBe("open");
    expect(deadlineTone(addDays(today, 7), "OPEN", today)).toBe("due");
    expect(deadlineTone(addDays(today, -1), "OPEN", today)).toBe("overdue");
    expect(deadlineTone(addDays(today, -1), "MET", today)).toBe("met");
  });

  it("refuses a 21 MB file and other types", () => {
    expect(fileError({ name: "a.pdf", type: "application/pdf", size: 21 * 1024 * 1024 })).toMatch(/20 MB/);
    expect(fileError({ name: "a.txt", type: "text/plain", size: 10 })).toMatch(/PDF, JPG and PNG/);
    expect(fileError({ name: "a.png", type: "image/png", size: 10 })).toBe("");
  });
});
