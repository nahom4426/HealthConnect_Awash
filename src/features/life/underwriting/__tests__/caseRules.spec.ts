import { describe, expect, it } from "vitest";
import {
  caseActions, questionnaireForm, toAnswerRequest, toDecisionRequest, toRequirementRequest, validateDecision, validateQuestionnaire, validateRequirement,
} from "../caseRules";
import { fromDesignation, isMinor, newBeneficiary, toDesignationRequest, validateDesignation } from "../beneficiaryRules";

describe("underwriting case", () => {
  it("decides only once no medical requirement is outstanding", () => {
    expect(caseActions({ status: "REQUIREMENTS_OUTSTANDING", requirements: [{ status: "OUTSTANDING" }] })).toEqual({ requirements: true, decide: false, redecide: false });
    expect(caseActions({ status: "PENDING_UNDERWRITING", requirements: [{ status: "WAIVED" }] })).toEqual({ requirements: true, decide: true, redecide: false });
    expect(caseActions({ status: "DECIDED" })).toEqual({ requirements: false, decide: false, redecide: true });
  });

  it("checks each decision's own fields", () => {
    const c = { maxLoadPercent: 150 };
    expect(validateDecision({ decision: "", note: "" }, c)).toEqual({ decision: "Choose a decision", note: "Explain the decision" });
    expect(validateDecision({ decision: "LOADED", loadingPercent: "200", note: "BP" }, c)).toEqual({ loadingPercent: "At most 150%" });
    expect(validateDecision({ decision: "EXCLUSION", exclusions: " \n ", note: "x" }, c)).toEqual({ exclusions: "List at least one exclusion" });
    expect(validateDecision({ decision: "POSTPONED", postponeUntil: "2026-11-01", note: "x" }, c, "2026-11-01")).toEqual({ postponeUntil: "Must be a future date" });
    expect(toDecisionRequest({ decision: "EXCLUSION", exclusions: "Hazardous sports\n\n Aviation ", loadingPercent: "50", note: " ok " })).toEqual({ decision: "EXCLUSION", exclusions: ["Hazardous sports", "Aviation"], note: "ok" });
    expect(toDecisionRequest({ decision: "LOADED", loadingPercent: "50", note: "BP" })).toEqual({ decision: "LOADED", loadingPercent: 50, note: "BP" });
  });

  it("records a medical requirement", () => {
    expect(validateRequirement({ status: "RECEIVED", receivedDate: "" })).toEqual({ receivedDate: "Required" });
    expect(toRequirementRequest({ status: "WAIVED", receivedDate: "2026-10-01", result: "" })).toEqual({ status: "WAIVED" });
    expect(toRequirementRequest({ status: "RECEIVED", receivedDate: "2026-10-01", result: " Normal " })).toEqual({ status: "RECEIVED", receivedDate: "2026-10-01", result: "Normal" });
  });
});

describe("health questionnaire", () => {
  const questions = [
    { questionUuid: "q1", questionType: "Radio", questionPossibleAnswer: [{ possibleAnswerUuid: "yes", possibleAnswer: "Yes", cascadedQuestion: "Give details" }, { possibleAnswerUuid: "no", possibleAnswer: "No" }] },
    { questionUuid: "q2", questionType: "Numeric" },
  ];
  it("prefills saved answers and requires every question", () => {
    const rows = questionnaireForm(questions, [{ answerUuid: "a1", questionUuid: "q1", possibleAnswerUuid: "yes", answer: "Yes", cascadedAnswer: "Asthma" }]);
    expect(rows[0]).toEqual({ questionUuid: "q1", answerUuid: "a1", possibleAnswerUuid: "yes", answer: "Yes", cascadedAnswer: "Asthma" });
    expect(validateQuestionnaire(rows, questions)).toEqual([{}, { answer: "Required" }]);
    rows[1].answer = "abc";
    expect(validateQuestionnaire(rows, questions)).toEqual([{}, { answer: "Enter a number" }]);
  });
  it("sends the chosen option with its text", () => {
    expect(toAnswerRequest({ questionUuid: "q1", possibleAnswerUuid: "yes", answer: "", cascadedAnswer: " Asthma " }, questions[0], "b1")).toEqual({ questionUuid: "q1", benefitUuid: "b1", answer: "Yes", possibleAnswerUuid: "yes", cascadedAnswer: "Asthma" });
    expect(toAnswerRequest({ questionUuid: "q2", possibleAnswerUuid: "", answer: " 82 ", cascadedAnswer: "" }, questions[1], "b1")).toEqual({ questionUuid: "q2", benefitUuid: "b1", answer: "82" });
  });
});

describe("beneficiaries", () => {
  const adult = { ...newBeneficiary(), firstName: "Almaz", fatherName: "Bekele", relationship: "SPOUSE", dateOfBirth: "1990-01-01", sharePercent: "100" };

  it("needs a primary beneficiary and shares of 100 per type", () => {
    expect(validateDesignation({ statutoryDefault: false, beneficiaries: [adult] }, "2026-11-01")).toEqual({});
    expect(validateDesignation({ statutoryDefault: true, beneficiaries: [] }, "2026-11-01")).toEqual({});
    expect(validateDesignation({ statutoryDefault: false, beneficiaries: [{ ...adult, type: "CONTINGENT", sharePercent: "60" }] }, "2026-11-01")).toEqual({
      primary: "Add at least one primary beneficiary, or pay the statutory heirs",
      shares: "Contingent shares add up to 60%. Each type must add up to 100%.",
    });
  });

  it("asks for a guardian for anyone under 18", () => {
    expect(isMinor("2010-11-02", "2028-11-01")).toBe(true);
    expect(isMinor("2010-11-01", "2028-11-01")).toBe(false);
    const child = { ...adult, relationship: "CHILD", dateOfBirth: "2015-05-05" };
    expect(validateDesignation({ beneficiaries: [child] }, "2026-11-01").rows).toEqual([{ guardianName: "Required for a minor", guardianPhone: "Required for a minor" }]);
  });

  it("round-trips the active designation and sends only filled fields", () => {
    const f = fromDesignation({ statutoryDefault: false, beneficiaries: [{ ...adult, beneficiaryUuid: "b1", status: "ACTIVE" }, { ...adult, status: "SUPERSEDED" }] });
    expect(f.beneficiaries).toHaveLength(1);
    expect(toDesignationRequest(f, { benefitUuid: "p1" })).toEqual({
      benefitUuid: "p1", statutoryDefault: false,
      beneficiaries: [{ beneficiaryUuid: "b1", type: "PRIMARY", firstName: "Almaz", fatherName: "Bekele", relationship: "SPOUSE", dateOfBirth: "1990-01-01", sharePercent: 100 }],
    });
    expect(fromDesignation({ version: 0, statutoryDefault: true, beneficiaries: [] }).statutoryDefault).toBe(false);
    expect(fromDesignation({ version: 2, statutoryDefault: true, beneficiaries: [] }).statutoryDefault).toBe(true);
    expect(toDesignationRequest({ statutoryDefault: true, beneficiaries: [adult], note: "Heirs" }, { insuredUuid: "m1" })).toEqual({ insuredUuid: "m1", statutoryDefault: true, beneficiaries: [], note: "Heirs" });
  });
});
