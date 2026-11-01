// Underwriting cases (contract 2026-10, G4). {subjectUuid} is an insuredUuid (group member) or a
// benefitUuid (individual policy). Health questionnaire answers for an individual policy are on
// underwritingApi (GET/POST /answer with benefitUuid).
import { lifeApi } from "./lifeClient";

/** POST /underwriting/evaluate · query: quotationUuid | benefitUuid · opens cases · returns: UnderwritingCaseResponse[] */
export function evaluateUnderwriting(params = {}) {
  return lifeApi().post(`/underwriting/evaluate`, undefined, { params });
}
/** GET /underwriting/queue · query: quotationUuid, benefitUuid, status (PENDING_UNDERWRITING | REQUIREMENTS_OUTSTANDING | DECIDED) · returns: UnderwritingCaseResponse[] */
export function getUnderwritingQueue(params = {}) {
  return lifeApi().get(`/underwriting/queue`, { params });
}
/** GET /underwriting/{subjectUuid} · returns: UnderwritingCaseResponse (answers with weights, score, reasons, requirements, decision) */
export function getUnderwritingCase(subjectUuid) {
  return lifeApi().get(`/underwriting/${subjectUuid}`);
}
/** PUT /underwriting/{subjectUuid}/decision · body: UnderwritingDecisionRequest · 409 while requirements are outstanding */
export function decideUnderwriting(subjectUuid, data) {
  return lifeApi().put(`/underwriting/${subjectUuid}/decision`, data);
}
/** PUT /underwriting/{subjectUuid}/medical-requirement/{requirementUuid} · body: RequirementUpdateRequest */
export function updateMedicalRequirement(subjectUuid, requirementUuid, data) {
  return lifeApi().put(`/underwriting/${subjectUuid}/medical-requirement/${requirementUuid}`, data);
}
