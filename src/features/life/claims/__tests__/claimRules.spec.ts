import { describe, expect, it } from "vitest";
import { approvalTrail, claimActions, formatFileSize, queueFromStatus, validateAttachment, validateDecision } from "../claimRules";

describe("claim actions per queue", () => {
  it("lets the agency submit and edit only its drafts", () => {
    expect(claimActions("agency", "saved")).toMatchObject({ submit: true, remove: true, documents: true, review: false, reject: false });
    expect(claimActions("agency", "requested")).toMatchObject({ submit: false, documents: false });
  });

  it("moves insurance claims one step at a time and rejects only before authorization", () => {
    expect(claimActions("insurance", "registered")).toMatchObject({ review: true, approve: false, reject: true });
    expect(claimActions("insurance", "reviewed")).toMatchObject({ review: false, approve: true, reject: true });
    expect(claimActions("insurance", "requested")).toMatchObject({ review: false, reject: true });
    expect(claimActions("insurance", "authorized")).toMatchObject({ review: false, approve: false, reject: false });
  });
});

describe("claim helpers", () => {
  it("maps loose status strings to queues", () => {
    expect(queueFromStatus("REGISTERED")).toBe("registered");
    expect(queueFromStatus("FOR_AUTHORIZATION")).toBe("for-authorization");
    expect(queueFromStatus("Authorized")).toBe("authorized");
    expect(queueFromStatus("DENIED")).toBe("rejected");
    expect(queueFromStatus("")).toBe("");
  });

  it("requires a reason only to reject", () => {
    expect(validateDecision("reject", " ")).toBe("Give a reason");
    expect(validateDecision("approve", "")).toBe("");
    expect(validateDecision("review", "x".repeat(1001))).toBe("At most 1000 characters");
    expect(validateDecision("reject", "x")).toBe("At least 2 characters");
    expect(validateDecision("reject", "x".repeat(501))).toBe("At most 500 characters");
  });

  it("checks a document upload", () => {
    expect(validateAttachment(null, "")).toEqual({ file: "Choose a file", name: "Name the document, e.g. Death certificate" });
    expect(validateAttachment({}, "Death certificate")).toEqual({});
  });

  it("formats sizes and the approval trail", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(3 * 1024 * 1024)).toBe("3.0 MB");
    const trail = approvalTrail({ reviewedByFirstName: "Abel", reviewedByFatherName: "Tesfaye", reviewedDate: "2026-10-01T00:00:00" });
    expect(trail[0]).toEqual({ label: "Reviewed", by: "Abel Tesfaye", date: "2026-10-01T00:00:00" });
    expect(trail[1]).toEqual({ label: "Approved", by: "", date: undefined });
  });
});
