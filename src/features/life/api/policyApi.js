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
/** GET /policy/{quotationUuid} · policy detail: premiums, members, sum assured, schedule, outstanding premium, endorsements, underwriting (#20) */
export function getPolicy(quotationUuid) {
  return lifeApi().get(`/policy/${quotationUuid}`);
}
/** GET /policy/{quotationUuid}/history · oldest first (G13) */
export function getPolicyHistory(quotationUuid) {
  return lifeApi().get(`/policy/${quotationUuid}/history`);
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
/** GET /benefit/benefits/{status} · query: page, limit, search (all optional; without them every record) · status: ACTIVE | PENDING | RENEWED | DISABLED | LAPSED | CANCELLED · returns: BenefitResponse[] */
export function getBenefits(status, params = {}) {
  return lifeApi().get(`/benefit/benefits/${status}`, { params });
}
/** GET /benefit/quote · query: dateOfBirth, gender, beginDate, term, termBenefit, riders ("riderUuid:amount,…") · returns: { age, termRate, rateUnit, termPremium, riders[{ riderUuid, benefit, rate, rateUnit, premium }], totalPremium, totalBenefit } (#27) */
export function getBenefitQuote(params = {}) {
  return lifeApi().get(`/benefit/quote`, { params });
}
/** PUT /benefit/{benefitUuid}/issue · PENDING → ACTIVE; 409 unless pricing is complete, the customer's KYC is VERIFIED and underwriting is clear (G11) */
export function issueBenefit(benefitUuid) {
  return lifeApi().put(`/benefit/${benefitUuid}/issue`);
}
/** GET /benefit/{benefitUuid}/history · status changes and edits, oldest first (G13) */
export function getBenefitHistory(benefitUuid) {
  return lifeApi().get(`/benefit/${benefitUuid}/history`);
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
/** GET /individual-rider-benefit/active/benefits · query: benefitUuid (filters to one policy, #29) · returns: IndividualRiderBenefitResponse[] */
export function getIndividualRiderBenefits(params = {}) {
  return lifeApi().get(`/individual-rider-benefit/active/benefits`, { params });
}
