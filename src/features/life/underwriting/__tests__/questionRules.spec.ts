import { describe, expect, it } from "vitest";
import { validateRateRows } from "../../rates/rateTables";
import { answerOptionSpec, fromQuestion, rangeSpec, toQuestionRequest, validateQuestion } from "../questionRules";

const library = [{ possibleAnswerUuid: "pa-yes", answer: "Yes" }, { possibleAnswerUuid: "pa-no", answer: "No" }];

describe("question form", () => {
  it("requires text and a type, and enough answers or ranges for the type", () => {
    expect(validateQuestion({ question: "", questionType: "" })).toEqual({ question: "Write the question", questionType: "Choose how the question is answered" });
    expect(validateQuestion({ question: "Do you smoke?", questionType: "Radio" }, [{}])).toEqual({ answers: "A single-choice question needs at least two answers" });
    expect(validateQuestion({ question: "Conditions?", questionType: "Multiselect" }, [])).toEqual({ answers: "Add at least one answer" });
    expect(validateQuestion({ question: "Cigarettes a day?", questionType: "Numeric" }, [], [])).toEqual({ ranges: "Add at least one score range" });
    expect(validateQuestion({ question: "Anything else?", questionType: "Text" })).toEqual({});
  });

  it("sends only the options or ranges the type uses", () => {
    const answers = [{ possibleAnswerUuid: "pa-yes", weight: "5", critical: true, cascadedQuestion: " How many per day? " }, { possibleAnswerUuid: "pa-no", weight: "", critical: false, cascadedQuestion: "" }];
    const ranges = [{ lower: "0", upper: "10", weight: "2", critical: false }];
    expect(toQuestionRequest({ question: " Do you smoke? ", category: "Lifestyle", questionType: "Radio" }, answers, ranges, "PENDING")).toEqual({
      question: "Do you smoke?",
      category: "Lifestyle",
      questionType: "Radio",
      status: "PENDING",
      ranges: [],
      questionPossibleAnswers: [
        { possibleAnswerUuid: "pa-yes", weight: 5, critical: true, cascadedQuestion: "How many per day?" },
        { possibleAnswerUuid: "pa-no", weight: 0, critical: false, cascadedQuestion: null },
      ],
    });
    expect(toQuestionRequest({ question: "Cigarettes a day?", questionType: "Numeric" }, answers, ranges).ranges).toEqual([{ lower: 0, upper: 10, weight: 2, critical: false }]);
    expect(toQuestionRequest({ question: "Notes", questionType: "Text" }, answers, ranges)).toMatchObject({ questionPossibleAnswers: [], ranges: [] });
  });

  it("round-trips a QuestionResponse, dropping deleted rows", () => {
    const { form, answers, ranges } = fromQuestion({
      question: "Do you smoke?", category: "Lifestyle", questionType: "Radio", status: "ACTIVE",
      questionPossibleAnswer: [{ possibleAnswerUuid: "pa-yes", weight: 5, critical: true, cascadedQuestion: "How many?" }, { possibleAnswerUuid: "pa-old", deleted: true }],
      ranges: [{ lower: 1, upper: 2, weight: 1, critical: false, deleted: true }],
    });
    expect(form).toEqual({ question: "Do you smoke?", category: "Lifestyle", questionType: "Radio", status: "ACTIVE" });
    expect(answers).toEqual([{ possibleAnswerUuid: "pa-yes", weight: 5, critical: true, cascadedQuestion: "How many?" }]);
    expect(ranges).toEqual([]);
  });
});

describe("answer and range grids", () => {
  it("rejects the same library answer twice and an over-long follow-up question", () => {
    const res = validateRateRows(answerOptionSpec(library), [
      { _key: "a", possibleAnswerUuid: "pa-yes", weight: 1, critical: false, cascadedQuestion: "x".repeat(251) },
      { _key: "b", possibleAnswerUuid: "pa-yes", weight: 0, critical: false, cascadedQuestion: "" },
    ]);
    expect(res.fieldErrors.a.cascadedQuestion).toBe("At most 250 characters");
    expect(res.tableErrors).toContain("Two rows have the same answer (Yes).");
  });

  it("accepts an empty optional follow-up and a zero score", () => {
    const res = validateRateRows(answerOptionSpec(library), [{ _key: "a", possibleAnswerUuid: "pa-no", weight: "0", critical: false, cascadedQuestion: "" }]);
    expect(res.valid).toBe(true);
  });

  it("orders and separates numeric ranges", () => {
    const row = (k: string, lower: number, upper: number) => ({ _key: k, lower, upper, weight: 1, critical: false });
    const res = validateRateRows(rangeSpec, [row("a", 0, 10), row("b", 10, 20), row("c", 30, 25)]);
    expect(res.fieldErrors.c.upper).toBe("Must be ≥ from");
    expect(res.tableErrors).toContain("Ranges 0–10 and 10–20 overlap.");
  });
});
