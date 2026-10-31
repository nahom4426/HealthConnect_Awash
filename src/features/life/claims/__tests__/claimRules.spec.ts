import { describe, expect, it } from "vitest";
import {
  claimActions, claimTimeline, formatFileSize, fromAssessment, missingDocuments, newClaimForm, paymentRows, toAssessmentRequest, toClaimRequest,
  toPayRequest, validateAssessment, validateAttachment, validateClaim, validateDecision, validatePayees, validatePayments,
} from "../claimRules";

describe("claim actions by status", () => {
  it("lets the agency edit and submit drafts and claims sent back for information", () => {
    expect(claimActions({ status: "SAVED" })).toMatchObject({ submit: true, documents: true, remove: true, register: false, reject: false });
    expect(claimActions({ status: "INFO_REQUESTED" })).toMatchObject({ submit: true, documents: true, remove: false });
  });

  it("moves desk claims one step at a time", () => {
    expect(claimActions({ status: "REQUESTED" })).toMatchObject({ register: true, review: false, requestInfo: true, reject: true });
    expect(claimActions({ status: "REGISTERED" })).toMatchObject({ review: true, assess: false });
    expect(claimActions({ status: "REVIEWED" })).toMatchObject({ assess: true, approve: false });
    expect(claimActions({ status: "REVIEWED", approvedAmount: 90000 })).toMatchObject({ assess: true, approve: true });
    expect(claimActions({ status: "APPROVED" })).toMatchObject({ authorize: true, requestInfo: false, reject: true });
    expect(claimActions({ status: "AUTHORIZED" })).toMatchObject({ pay: true, reject: false });
    expect(Object.values(claimActions({ status: "PAID" })).some(Boolean)).toBe(false);
    expect(Object.values(claimActions({ status: "REJECTED" })).some(Boolean)).toBe(false);
  });
});

describe("decisions", () => {
  it("needs a reason to reject or ask for information", () => {
    expect(validateDecision("reject", " ")).toBe("Give a reason");
    expect(validateDecision("requestInfo", "x")).toBe("At least 2 characters");
    expect(validateDecision("reject", "x".repeat(501))).toBe("At most 500 characters");
    expect(validateDecision("approve", "")).toBe("");
    expect(validateDecision("review", "x".repeat(1001))).toBe("At most 1000 characters");
  });
});

describe("new claim", () => {
  const cover = { sumAssured: 100000, coverStart: "2026-01-01", coverEnd: "2026-12-31" };
  const valid = { ...newClaimForm(), claimType: "DEATH", eventDate: "2026-10-20", causeOfEvent: "Heart attack", notifiedByName: "Almaz Bekele", notifiedByRelationship: "Spouse", claimedAmount: "100000" };

  it("validates the event, the notifier and the amount", () => {
    expect(validateClaim(valid, cover, "2026-10-31")).toEqual({});
    expect(validateClaim({ ...valid, claimType: "ACCIDENTAL_DEATH" }, cover, "2026-10-31")).toEqual({ riderUuid: "Choose the rider that pays this claim" });
    expect(validateClaim({ ...newClaimForm(), claimType: "MATURITY", eventDate: "2025-12-01", claimedAmount: "200000", notifiedByPhone: "12" }, cover, "2026-10-31")).toEqual({
      claimType: "Choose the claim type", eventDate: "Must be within the cover period", causeOfEvent: "Required", notifiedByName: "Required",
      notifiedByPhone: "9 to 13 digits, optionally starting with +", claimedAmount: "Can't be more than the sum assured",
    });
  });

  it("checks payee shares add up to 100", () => {
    expect(validatePayees([])).toBeNull();
    const p = { name: "A", bankName: "CBE", accountNumber: "1000" };
    expect(validatePayees([{ ...p, sharePercent: "33.33" }, { ...p, sharePercent: "33.33" }, { ...p, sharePercent: "33.34" }])).toBeNull();
    expect(validatePayees([{ ...p, sharePercent: "60" }, { ...p, name: "", sharePercent: "30" }])).toEqual({ rows: [{}, { name: "Required" }], share: "Shares add up to 90%; they must add up to 100%" });
  });

  it("sends LifeClaimRequest for the chosen member, with the rider only for rider claims", () => {
    expect(toClaimRequest(valid, { insuredPersonUuid: "m1" })).toEqual({
      insuredPersonUuid: "m1", claimType: "DEATH", eventDate: "2026-10-20", causeOfEvent: "Heart attack", suspectedSuicide: false,
      notifiedBy: { name: "Almaz Bekele", relationship: "Spouse" }, claimedAmount: 100000,
    });
    const rider = toClaimRequest({ ...valid, claimType: "CRITICAL_ILLNESS", riderUuid: "r1", payees: [{ name: " A ", sharePercent: "100", bankName: "CBE", accountNumber: "1000" }] }, { benefitUuid: "b1" });
    expect(rider).toMatchObject({ benefitUuid: "b1", riderUuid: "r1", payees: [{ name: "A", sharePercent: 100, bankName: "CBE", accountNumber: "1000" }] });
  });
});

describe("assessment and payment", () => {
  it("starts from the claim and checks the amounts against the cover", () => {
    const c = { claimedAmount: 100000, sumAssured: 100000, outstandingPremium: 250 };
    const f = fromAssessment(c);
    expect(f).toMatchObject({ eligibleAmount: 100000, outstandingPremiumDeducted: 250, deductions: [] });
    expect(validateAssessment({ ...f, approvedAmount: "120000", decisionNote: "" }, c)).toEqual({ approvedAmount: "Approved amount can't be more than the sum assured", decisionNote: "Explain the decision" });
    expect(validateAssessment({ ...f, approvedAmount: "90000", deductions: [{ reason: "", amount: "0" }], decisionNote: "Covered" }, c)).toEqual({ deductions: [{ reason: "Required", amount: "Must be more than 0" }] });
    expect(toAssessmentRequest({ ...f, approvedAmount: "90000", deductions: [{ reason: " Loan ", amount: "500" }], decisionNote: "Covered" })).toEqual({
      eligibleAmount: 100000, approvedAmount: 90000, deductions: [{ reason: "Loan", amount: 500 }], outstandingPremiumDeducted: 250, decisionNote: "Covered",
    });
  });

  it("pays each unpaid payee their own amount", () => {
    const c = { payees: [{ payeeUuid: "p1", amount: 60000, paid: false }, { payeeUuid: "p2", amount: 40000, paid: true }] };
    const rows = paymentRows(c, "2026-10-31");
    expect(rows).toEqual([{ payeeUuid: "p1", paymentVoucherNumber: "", paymentOrderNumber: "", paymentDate: "2026-10-31", bankTransactionCode: "" }]);
    expect(validatePayments(rows, "2026-10-31")).toEqual([{ paymentVoucherNumber: "Required" }]);
    rows[0].paymentVoucherNumber = "PV-1";
    expect(validatePayments(rows, "2026-10-31")).toBeNull();
    expect(toPayRequest("c1", rows, c.payees)).toEqual({ claimUuid: "c1", payments: [{ payeeUuid: "p1", amount: 60000, paymentVoucherNumber: "PV-1", paymentDate: "2026-10-31" }] });
  });
});

describe("claim helpers", () => {
  it("lists the steps done and the documents still missing", () => {
    const t = claimTimeline({ requestedDate: "2026-10-01T09:00:00", agencyComment: "Urgent" });
    expect(t[0]).toEqual({ label: "Submitted", date: "2026-10-01T09:00:00", comment: "Urgent" });
    expect(t[1]).toEqual({ label: "Registered", date: null, comment: "" });
    expect(missingDocuments({ documents: [{ documentType: "CLAIM_FORM", received: true }, { documentType: "DEATH_CERTIFICATE", received: false }] })).toEqual([{ documentType: "DEATH_CERTIFICATE", received: false }]);
  });

  it("checks a document upload", () => {
    expect(validateAttachment(null, "", "", true)).toEqual({ file: "Choose a file", documentType: "Choose which document this is", name: "Name the document, e.g. Death certificate" });
    expect(validateAttachment({}, "Death certificate")).toEqual({});
    expect(formatFileSize(2048)).toBe("2 KB");
  });
});
