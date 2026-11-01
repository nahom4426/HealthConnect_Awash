import { describe, expect, it } from "vitest";
import {
  endorsementTypes, groupDocuments, newEndorsementMember, payable, servicingActions, toEndorsementRequest, toPremiumPayment, toServicingRequest,
  validateEndorsement, validatePremiumPayment, validateServicing,
} from "../servicingRules";

describe("servicing", () => {
  it("offers only what the status allows", () => {
    expect(servicingActions("ACTIVE")).toEqual({ cancel: true, lapse: true, reinstate: false, renew: true });
    expect(servicingActions("LAPSED")).toEqual({ cancel: true, lapse: false, reinstate: true, renew: false });
    expect(servicingActions("EXPIRED")).toEqual({ cancel: false, lapse: false, reinstate: false, renew: true });
    expect(Object.values(servicingActions("CANCELLED")).some(Boolean)).toBe(false);
  });

  it("needs a date and a reason, and sends health evidence only to reinstate", () => {
    expect(validateServicing("cancel", { effectiveDate: "", reason: " " })).toEqual({ effectiveDate: "Required", reason: "Give a reason" });
    const f = { effectiveDate: "2026-11-01", reason: " Client request ", note: "", healthEvidenceReceived: true };
    expect(toServicingRequest("cancel", f)).toEqual({ effectiveDate: "2026-11-01", reason: "Client request" });
    expect(toServicingRequest("reinstate", f)).toEqual({ effectiveDate: "2026-11-01", reason: "Client request", healthEvidenceReceived: true });
  });
});

describe("endorsements", () => {
  it("allows only a sum assured change on an individual policy", () => {
    expect(endorsementTypes("benefit").map((t) => t.value)).toEqual(["CHANGE_SUM_ASSURED"]);
    expect(endorsementTypes("policy")).toHaveLength(3);
  });

  it("checks each type's member fields", () => {
    expect(validateEndorsement({ type: "ADD_MEMBER", effectiveDate: "2026-11-01", insured: [newEndorsementMember()] }, "policy").rows).toEqual([
      { firstName: "Required", fatherName: "Required", gender: "Choose", birthDate: "Required", sumAssured: "Required" },
    ]);
    expect(validateEndorsement({ type: "REMOVE_MEMBER", effectiveDate: "2026-11-01", insured: [{ insuredUuid: "m1" }] }, "policy")).toEqual({});
    expect(validateEndorsement({ type: "CHANGE_SUM_ASSURED", effectiveDate: "2026-11-01", insured: [] }, "benefit")).toEqual({ insured: "Enter the new sum assured" });
  });

  it("sends only the fields each type uses", () => {
    expect(toEndorsementRequest({ type: "REMOVE_MEMBER", effectiveDate: "2026-11-01", note: "", insured: [{ ...newEndorsementMember(), insuredUuid: "m1", sumAssured: "5" }] })).toEqual({
      type: "REMOVE_MEMBER", effectiveDate: "2026-11-01", insured: [{ insuredUuid: "m1" }],
    });
    expect(toEndorsementRequest({ type: "CHANGE_SUM_ASSURED", effectiveDate: "2026-11-01", insured: [{ ...newEndorsementMember(), sumAssured: "200000" }] }).insured).toEqual([{ sumAssured: 200000 }]);
  });
});

describe("premiums and documents", () => {
  it("pays the item's amount due", () => {
    expect(payable({ status: "OVERDUE" })).toBe(true);
    expect(payable({ status: "PAID" })).toBe(false);
    expect(validatePremiumPayment({ receiptNumber: "", receiptDate: "2999-01-01", method: "X" })).toEqual({ receiptNumber: "Enter the receipt number", receiptDate: "Can't be in the future", method: "Choose" });
    expect(toPremiumPayment({ receiptNumber: " R-9 ", receiptDate: "2026-11-01", method: "CASH", reference: "" }, { scheduleItemUuid: "s1", amountDue: 1250.5 })).toEqual({
      scheduleItemUuid: "s1", amount: 1250.5, receiptNumber: "R-9", receiptDate: "2026-11-01", method: "CASH",
    });
  });

  it("groups document versions by type, latest first", () => {
    const g = groupDocuments([
      { documentUuid: "a", documentType: "ID_COPY", version: 1, latest: false },
      { documentUuid: "b", documentType: "ID_COPY", version: 2, latest: true },
      { documentUuid: "c", documentType: "OTHER", version: 1, latest: true },
    ]);
    expect(g.map((x) => [x.type, x.latest.documentUuid, x.older.map((o) => o.documentUuid)])).toEqual([["ID_COPY", "b", ["a"]], ["OTHER", "c", []]]);
  });
});
