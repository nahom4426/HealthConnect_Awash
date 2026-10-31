// Generated from the Life Insurance OpenAPI document (operationId = function name).
// Health/underwriting questionnaire: questions, possible answers and recorded answers.
import { lifeApi } from "./lifeClient";

// ── question ──
/** GET /question/{questionUuid} · returns: QuestionResponse */
export function getQuestion(questionUuid) {
  return lifeApi().get(`/question/${questionUuid}`);
}
/** PUT /question/{questionUuid} · body: QuestionRequest · returns: QuestionResponse */
export function updateQuestion(questionUuid, data) {
  return lifeApi().put(`/question/${questionUuid}`, data);
}
/** PUT /question/{questionUuid}/status · query: status* (ACTIVE | PENDING | DISABLED) · contract 2026-10 #14 */
export function updateQuestionStatus(questionUuid, status) {
  return lifeApi().put(`/question/${questionUuid}/status`, undefined, { params: { status } });
}
/** DELETE /question/{questionUuid} · returns: MessageResponse */
export function deleteQuestion(questionUuid) {
  return lifeApi().delete(`/question/${questionUuid}`);
}
/** GET /question · query: page: integer, limit: integer, status*: string (ACTIVE | PENDING | DISABLED), search: string · returns: QuestionResponse[] */
export function getQuestions(params = {}) {
  return lifeApi().get(`/question`, { params });
}
/** POST /question · body: QuestionRequest · returns: QuestionResponse */
export function createQuestion(data) {
  return lifeApi().post(`/question`, data);
}

// ── possible-answer ──
/** PUT /possible-answer/{possibleAnswerUuid} · body: PossibleAnswerRequest · returns: PossibleAnswerResponse */
export function updatePossibleAnswer(possibleAnswerUuid, data) {
  return lifeApi().put(`/possible-answer/${possibleAnswerUuid}`, data);
}
/** DELETE /possible-answer/{possibleAnswerUuid} · returns: MessageResponse */
export function deletePossibleAnswer(possibleAnswerUuid) {
  return lifeApi().delete(`/possible-answer/${possibleAnswerUuid}`);
}
/** POST /possible-answer · body: PossibleAnswerRequest · returns: PossibleAnswerResponse */
export function createPossibleAnswer(data) {
  return lifeApi().post(`/possible-answer`, data);
}
/** GET /possible-answer/{answerUuid} · returns: PossibleAnswerResponse */
export function getPossibleAnswer(answerUuid) {
  return lifeApi().get(`/possible-answer/${answerUuid}`);
}
/** GET /possible-answer/active · returns: PossibleAnswerResponse[] */
export function getAllPossibleAnswers() {
  return lifeApi().get(`/possible-answer/active`);
}

// ── answer ──
/** GET /answer/{answerUuid} · returns: AnswerResponse */
export function getAnswer(answerUuid) {
  return lifeApi().get(`/answer/${answerUuid}`);
}
/** PUT /answer/{answerUuid} · body: AnswerRequest · returns: AnswerResponse */
export function updateAnswer(answerUuid, data) {
  return lifeApi().put(`/answer/${answerUuid}`, data);
}
/** DELETE /answer/{answerUuid} · returns: MessageResponse */
export function deleteAnswer(answerUuid) {
  return lifeApi().delete(`/answer/${answerUuid}`);
}
/** GET /answer · returns: AnswerResponse[] */
export function getAnswers() {
  return lifeApi().get(`/answer`);
}
/** POST /answer · body: AnswerRequest · returns: AnswerResponse */
export function createAnswer(data) {
  return lifeApi().post(`/answer`, data);
}
