// Underwriting questionnaire rules. Fields follow QuestionRequest / QuestionResponse:
// questionType Text | Radio | Multiselect | Numeric; choice questions carry
// questionPossibleAnswers (PossibleAnswerBriefRequest), numeric ones carry ranges (RangeRequest).
// Weights score the answer; `critical` marks an answer that needs an underwriter's attention.
import { QuestionType } from "../constants/statuses";

export const QUESTION_TYPES = [
  { value: QuestionType.Radio, label: "Single choice", hint: "One answer from a list, e.g. Yes / No." },
  { value: QuestionType.Multiselect, label: "Multiple choice", hint: "Any number of answers from a list, e.g. conditions diagnosed." },
  { value: QuestionType.Numeric, label: "Number", hint: "A value scored by range, e.g. cigarettes per day or BMI." },
  { value: QuestionType.Text, label: "Free text", hint: "Written answer for the underwriter; not scored." },
];
export const isChoice = (t) => t === QuestionType.Radio || t === QuestionType.Multiselect;

/** Answer options of a choice question. `library` = PossibleAnswerResponse[] from the answer library. */
export function answerOptionSpec(library = []) {
  return {
    id: "question-answer",
    title: "Answer options",
    emptyTitle: "No answers yet",
    idField: "_option", // brief requests have no id of their own; every row is edited in place
    columns: [
      { key: "possibleAnswerUuid", label: "Answer", type: "select", wide: true, options: library.map((a) => ({ value: a.possibleAnswerUuid, label: a.answer })) },
      { key: "weight", label: "Score", type: "decimal", min: 0, hint: "Added to the applicant's risk score when chosen" },
      { key: "critical", label: "Critical", type: "bool", hint: "Choosing this answer needs an underwriter's review" },
      { key: "cascadedQuestion", label: "Follow-up question (optional)", type: "text", maxLength: 250, optional: true, wide: true },
    ],
    uniqueBy: (r) => r.possibleAnswerUuid || "",
    uniqueLabel: "answer",
    formatKey: (k) => library.find((a) => a.possibleAnswerUuid === k)?.answer || k,
  };
}

/** Scored ranges of a numeric question (RangeRequest). */
export const rangeSpec = {
  id: "question-range",
  title: "Score ranges",
  emptyTitle: "No ranges yet",
  idField: "_range",
  columns: [
    { key: "lower", label: "From", type: "decimal" },
    { key: "upper", label: "To", type: "decimal" },
    { key: "weight", label: "Score", type: "decimal", min: 0 },
    { key: "critical", label: "Critical", type: "bool" },
  ],
  uniqueBy: (r) => `${r.lower}-${r.upper}`,
  uniqueLabel: "range",
  rangePairs: [["lower", "upper", "from"]],
  noOverlap: { from: "lower", to: "upper", label: "Ranges" },
};

/** QuestionResponse → editor state */
export function fromQuestion(q = {}) {
  return {
    form: {
      question: q.question ?? "",
      category: q.category ?? "",
      questionType: q.questionType ?? "",
      status: q.status ?? "",
    },
    answers: (q.questionPossibleAnswer || []).filter((a) => !a.deleted).map((a) => ({
      possibleAnswerUuid: a.possibleAnswerUuid, weight: a.weight ?? 0, critical: !!a.critical, cascadedQuestion: a.cascadedQuestion ?? "",
    })),
    ranges: (q.ranges || []).filter((r) => !r.deleted).map((r) => ({ lower: r.lower, upper: r.upper, weight: r.weight ?? 0, critical: !!r.critical })),
  };
}

/** Editor state → QuestionRequest. Options or ranges are sent only for the type that uses them. */
export function toQuestionRequest(form, answers = [], ranges = [], status = form.status) {
  const body = {
    question: String(form.question || "").trim(),
    category: String(form.category || "").trim(),
    questionType: form.questionType,
    questionPossibleAnswers: [],
    ranges: [],
  };
  if (status) body.status = status;
  if (isChoice(form.questionType)) {
    body.questionPossibleAnswers = answers.map((a) => ({
      possibleAnswerUuid: a.possibleAnswerUuid,
      weight: Number(a.weight) || 0,
      critical: !!a.critical,
      cascadedQuestion: String(a.cascadedQuestion || "").trim() || null,
    }));
  }
  if (form.questionType === QuestionType.Numeric) {
    body.ranges = ranges.map((r) => ({ lower: Number(r.lower), upper: Number(r.upper), weight: Number(r.weight) || 0, critical: !!r.critical }));
  }
  return body;
}

/** Question-level checks (row-level checks are the grid specs above). */
export function validateQuestion(form, answers = [], ranges = []) {
  const e = {};
  const text = String(form.question || "").trim();
  if (!text) e.question = "Write the question";
  else if (text.length > 250) e.question = "At most 250 characters";
  if (String(form.category || "").length > 50) e.category = "At most 50 characters";
  if (!QUESTION_TYPES.some((t) => t.value === form.questionType)) e.questionType = "Choose how the question is answered";
  if (form.questionType === QuestionType.Radio && answers.length < 2) e.answers = "A single-choice question needs at least two answers";
  if (form.questionType === QuestionType.Multiselect && answers.length < 1) e.answers = "Add at least one answer";
  if (form.questionType === QuestionType.Numeric && ranges.length < 1) e.ranges = "Add at least one score range";
  return e;
}
