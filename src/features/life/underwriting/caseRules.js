// Underwriting case rules (UnderwritingCaseResponse / UnderwritingDecisionRequest, contract 2026-10 G4).
// Scores, reasons, requirements and the maximum loading come from the backend; the loaded premium is
// the backend's too. These rules only decide what to offer and stop incomplete input.
const blank = (v) => v === null || v === undefined || String(v).trim() === "";

export const CASE_STATUSES = [
  { value: "PENDING_UNDERWRITING", label: "To decide" },
  { value: "REQUIREMENTS_OUTSTANDING", label: "Waiting for medical results" },
  { value: "DECIDED", label: "Decided" },
];
export const caseStatusLabel = (v) => CASE_STATUSES.find((s) => s.value === v)?.label || v || "";

export const DECISIONS = [
  { value: "STANDARD", label: "Accept at standard terms" },
  { value: "LOADED", label: "Accept with extra premium (loading)" },
  { value: "EXCLUSION", label: "Accept with exclusions" },
  { value: "POSTPONED", label: "Postpone" },
  { value: "DECLINED", label: "Decline" },
];
export const decisionLabel = (v) => DECISIONS.find((d) => d.value === v)?.label || v || "";

export const REQUIREMENT_STATUSES = [
  { value: "OUTSTANDING", label: "Outstanding" },
  { value: "RECEIVED", label: "Received" },
  { value: "WAIVED", label: "Waived" },
];

export const outstandingRequirements = (c = {}) => (c.requirements || []).filter((r) => r.status === "OUTSTANDING");

/** What the case allows (the decision is refused while medical requirements are outstanding) */
export function caseActions(c = {}) {
  const open = c.status && c.status !== "DECIDED";
  return { requirements: !!open, decide: !!open && !outstandingRequirements(c).length, redecide: c.status === "DECIDED" };
}

export function fromDecision(c = {}) {
  return {
    decision: c.decision ?? "",
    loadingPercent: c.loadingPercent ?? "",
    exclusions: (c.exclusions || []).join("\n"),
    postponeUntil: c.postponeUntil ?? "",
    note: c.note ?? "",
  };
}

export function validateDecision(f, c = {}, today = new Date().toISOString().slice(0, 10)) {
  const e = {};
  if (!DECISIONS.some((d) => d.value === f.decision)) e.decision = "Choose a decision";
  if (f.decision === "LOADED") {
    if (blank(f.loadingPercent)) e.loadingPercent = "Required";
    else if (!(Number(f.loadingPercent) > 0)) e.loadingPercent = "Must be more than 0";
    else if (c.maxLoadPercent != null && Number(f.loadingPercent) > Number(c.maxLoadPercent)) e.loadingPercent = `At most ${c.maxLoadPercent}%`;
  }
  if (f.decision === "EXCLUSION" && !exclusionList(f.exclusions).length) e.exclusions = "List at least one exclusion";
  if (f.decision === "POSTPONED") {
    if (!f.postponeUntil) e.postponeUntil = "Required";
    else if (f.postponeUntil <= today) e.postponeUntil = "Must be a future date";
  }
  if (blank(f.note)) e.note = "Explain the decision";
  else if (String(f.note).trim().length > 1000) e.note = "At most 1000 characters";
  return e;
}

const exclusionList = (text) => String(text || "").split("\n").map((s) => s.trim()).filter(Boolean);

export function toDecisionRequest(f) {
  const body = { decision: f.decision, note: String(f.note).trim() };
  if (f.decision === "LOADED") body.loadingPercent = Number(f.loadingPercent);
  if (f.decision === "EXCLUSION") body.exclusions = exclusionList(f.exclusions);
  if (f.decision === "POSTPONED") body.postponeUntil = f.postponeUntil;
  return body;
}

export function validateRequirement(f, today = new Date().toISOString().slice(0, 10)) {
  const e = {};
  if (!REQUIREMENT_STATUSES.some((s) => s.value === f.status)) e.status = "Choose";
  if (f.status === "RECEIVED") {
    if (!f.receivedDate) e.receivedDate = "Required";
    else if (f.receivedDate > today) e.receivedDate = "Can't be in the future";
  }
  if (String(f.result || "").trim().length > 1000) e.result = "At most 1000 characters";
  return e;
}

export function toRequirementRequest(f) {
  const body = { status: f.status };
  if (f.status === "RECEIVED") body.receivedDate = f.receivedDate;
  if (!blank(f.result)) body.result = String(f.result).trim();
  return body;
}

// ── health questionnaire (AnswerRequest with benefitUuid) ──
/** The options to choose from for a question: QuestionResponse.questionPossibleAnswer (with weights) */
export const questionOptions = (q = {}) => (q.questionPossibleAnswer || []).filter((o) => !o.deleted).map((o) => ({ value: o.possibleAnswerUuid, label: o.possibleAnswer, followUp: o.cascadedQuestion || "" }));

/** One form row per active question, prefilled from saved answers (AnswerResponse[]) */
export function questionnaireForm(questions = [], answers = []) {
  return questions.map((q) => {
    const saved = answers.find((a) => a.questionUuid === q.questionUuid);
    return { questionUuid: q.questionUuid, answerUuid: saved?.answerUuid ?? "", possibleAnswerUuid: saved?.possibleAnswerUuid ?? "", answer: saved?.answer ?? "", cascadedAnswer: saved?.cascadedAnswer ?? "" };
  });
}

export function validateQuestionnaire(rows, questions = []) {
  const errors = rows.map((r) => {
    const q = questions.find((x) => x.questionUuid === r.questionUuid) || {};
    const e = {};
    if (q.questionType === "Radio" || q.questionType === "Multiselect") { if (!r.possibleAnswerUuid) e.answer = "Choose an answer"; }
    else if (blank(r.answer)) e.answer = "Required";
    else if (q.questionType === "Numeric" && Number.isNaN(Number(r.answer))) e.answer = "Enter a number";
    if (String(r.cascadedAnswer || "").trim().length > 500) e.cascadedAnswer = "At most 500 characters";
    return e;
  });
  return errors.some((e) => Object.keys(e).length) ? errors : null;
}

/** AnswerRequest for one row; the option's text is sent as the answer for choice questions */
export function toAnswerRequest(row, q = {}, benefitUuid) {
  const option = questionOptions(q).find((o) => o.value === row.possibleAnswerUuid);
  const body = { questionUuid: row.questionUuid, benefitUuid, answer: option ? option.label : String(row.answer).trim() };
  if (option) body.possibleAnswerUuid = option.value;
  if (!blank(row.cascadedAnswer)) body.cascadedAnswer = String(row.cascadedAnswer).trim();
  return body;
}
