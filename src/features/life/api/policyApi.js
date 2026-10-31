// Generated from the Life Insurance OpenAPI document (operationId = function name).
// Group policies (issued from a paid quotation), individual term policies ("benefit")
// and the riders attached to them.
import { lifeApi } from "./lifeClient";

// ── policy ──
/** PUT /policy/issue/{quotationUuid} · body: PolicyRequest · returns: PolicyResponse */
export function issuePolicy(quotationUuid, data) {
  return lifeApi().put(`/policy/issue/${quotationUuid}`, data);
}
/** PUT /policy/generate/treaty-report/{quotationUuid} · returns: object */
export function generateTreatyReport(quotationUuid) {
  return lifeApi().put(`/policy/generate/treaty-report/${quotationUuid}`, undefined);
}
/** GET /policy/lists · query: page: integer, limit: integer, status*: string (ACTIVE | PENDING | MODIFIED | DISABLED | LAPSED | CANCELLED), search: string · returns: PolicyResponse[] */
export function getPolicies(params = {}) {
  return lifeApi().get(`/policy/lists`, { params });
}

// ── benefit (individual term policy) ──
/** GET /benefit/{benefitUuid} · returns: BenefitResponse */
export function getBenefit(benefitUuid) {
  return lifeApi().get(`/benefit/${benefitUuid}`);
}
/** PUT /benefit/{benefitUuid} · body: BenefitRequest · returns: BenefitResponse */
export function updateBenefit(benefitUuid, data) {
  return lifeApi().put(`/benefit/${benefitUuid}`, data);
}
/** DELETE /benefit/{benefitUuid} · returns: MessageResponse */
export function deleteBenefit(benefitUuid) {
  return lifeApi().delete(`/benefit/${benefitUuid}`);
}
/** POST /benefit · body: BenefitRequest · returns: BenefitResponse */
export function createBenefit(data) {
  return lifeApi().post(`/benefit`, data);
}
/** GET /benefit/benefits/{status} · status: ACTIVE | PENDING | RENEWED | DISABLED | LAPSED | CANCELLED · returns: BenefitResponse[] */
export function getBenefits(status) {
  return lifeApi().get(`/benefit/benefits/${status}`);
}

// ── individual-rider-benefit ──
/** GET /individual-rider-benefit/{individualRiderBenefitUuid} · returns: IndividualRiderBenefitResponse */
export function getIndividualRiderBenefit(individualRiderBenefitUuid) {
  return lifeApi().get(`/individual-rider-benefit/${individualRiderBenefitUuid}`);
}
/** PUT /individual-rider-benefit/{individualRiderBenefitUuid} · body: IndividualRiderBenefitRequest · returns: IndividualRiderBenefitResponse */
export function updateIndividualRiderBenefit(individualRiderBenefitUuid, data) {
  return lifeApi().put(`/individual-rider-benefit/${individualRiderBenefitUuid}`, data);
}
/** DELETE /individual-rider-benefit/{individualRiderBenefitUuid} · returns: MessageResponse */
export function deleteIndividualRiderBenefit(individualRiderBenefitUuid) {
  return lifeApi().delete(`/individual-rider-benefit/${individualRiderBenefitUuid}`);
}
/** POST /individual-rider-benefit · body: IndividualRiderBenefitRequest[] · returns: IndividualRiderBenefitResponse[] */
export function createIndividualRiderBenefit(data) {
  return lifeApi().post(`/individual-rider-benefit`, data);
}
/** GET /individual-rider-benefit/active/benefits · returns: IndividualRiderBenefitResponse[] */
export function getIndividualRiderBenefits() {
  return lifeApi().get(`/individual-rider-benefit/active/benefits`);
}
