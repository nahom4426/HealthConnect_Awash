// Generated from the Life Insurance OpenAPI document (operationId = function name).
// Claims: agency (preparer) and insurance (review → approve → authorize → pay) work queues,
// logs and attachments.
import { lifeApi } from "./lifeClient";

// ── claim ──
/** GET /claim/{claimUuid} · returns: ClaimResponse */
export function getClaim(claimUuid) {
  return lifeApi().get(`/claim/${claimUuid}`);
}
/** PUT /claim/{claimUuid} · body: ClaimRequest · returns: object */
export function updateClaim(claimUuid, data) {
  return lifeApi().put(`/claim/${claimUuid}`, data);
}
/** DELETE /claim/{claimUuid} · returns: object */
export function deleteClaim(claimUuid) {
  return lifeApi().delete(`/claim/${claimUuid}`);
}
/** PUT /claim/insurance/review · body: ClaimRequest · returns: object */
export function setInsuranceApproveRevieweBy(data) {
  return lifeApi().put(`/claim/insurance/review`, data);
}
/** PUT /claim/insurance/approve · body: ClaimRequest · returns: object */
export function setInsuranceApproveApprovedBy(data) {
  return lifeApi().put(`/claim/insurance/approve`, data);
}
/** PUT /claim/{claimUuid}/deny · body: { comment } (2–500 characters) · contract 2026-10 #26 */
export function rejectClaim(claimUuid, comment) {
  return lifeApi().put(`/claim/${claimUuid}/deny`, { comment });
}
/** @deprecated query-string form; use rejectClaim. PUT /claim/deny · query: claimUuid*, comment* */
export function denyClaim(params = {}) {
  return lifeApi().put(`/claim/deny`, undefined, { params });
}
/** PUT /claim/agency/request · body: ClaimRequest · returns: object */
export function setProviderApprovePreparedBy(data) {
  return lifeApi().put(`/claim/agency/request`, data);
}
/** POST /claim · query: insuredPersonUuid*: string · returns: string (the new claimUuid) */
export function createClaim(params = {}) {
  return lifeApi().post(`/claim`, undefined, { params });
}
/** GET /claim/logs · query: claimUuid*: string, search: string, page: integer, limit: integer · returns: ClaimLogsResponse[] */
export function getClaimLogs(params = {}) {
  return lifeApi().get(`/claim/logs`, { params });
}
/** GET /claim/insurance/reviewed/list · query: search: string, page: integer, limit: integer · returns: ClaimListResponse[] */
export function getReviewedClaimsByPayer(params = {}) {
  return lifeApi().get(`/claim/insurance/reviewed/list`, { params });
}
/** GET /claim/insurance/requested/list · query: search: string, page: integer, limit: integer · returns: ClaimListResponse[] */
export function getRequestedClaims(params = {}) {
  return lifeApi().get(`/claim/insurance/requested/list`, { params });
}
/** GET /claim/insurance/rejected/list · query: search: string, page: integer, limit: integer · returns: ClaimListResponse[] */
export function getRejectedClaimsByPayer(params = {}) {
  return lifeApi().get(`/claim/insurance/rejected/list`, { params });
}
/** GET /claim/insurance/registered/list · query: search: string, page: integer, limit: integer · returns: ClaimListResponse[] */
export function getRegisteredClaims(params = {}) {
  return lifeApi().get(`/claim/insurance/registered/list`, { params });
}
/** GET /claim/insurance/paid/list · query: search: string, page: integer, limit: integer · returns: ClaimListResponse[] */
export function getInsurancePaidClaims(params = {}) {
  return lifeApi().get(`/claim/insurance/paid/list`, { params });
}
/** GET /claim/insurance/for-authorization/list · query: search: string, page: integer, limit: integer · returns: ClaimListResponse[] */
export function getClaimsForAuthorization(params = {}) {
  return lifeApi().get(`/claim/insurance/for-authorization/list`, { params });
}
/** GET /claim/insurance/authorized/list · query: search: string, page: integer, limit: integer · returns: ClaimListResponse[] */
export function getAuthorizedClaimsByInsurance(params = {}) {
  return lifeApi().get(`/claim/insurance/authorized/list`, { params });
}
/** GET /claim/insurance/approved/list · query: search: string, page: integer, limit: integer · returns: ClaimListResponse[] */
export function getAuditedClaimsByPayer(params = {}) {
  return lifeApi().get(`/claim/insurance/approved/list`, { params });
}
/** GET /claim/details/{claimUuid} · returns: ClaimListResponse */
export function getClaimDetails(claimUuid) {
  return lifeApi().get(`/claim/details/${claimUuid}`);
}
/** GET /claim/claim-approver-details · query: claimUuid*: string · returns: ClaimApproverResponse[] */
export function getClaimApproverResponse(params = {}) {
  return lifeApi().get(`/claim/claim-approver-details`, { params });
}
/** GET /claim/agency/saved/list · query: search: string, page: integer, limit: integer · returns: ClaimListResponse[] */
export function getSavedClaims(params = {}) {
  return lifeApi().get(`/claim/agency/saved/list`, { params });
}
/** GET /claim/agency/requested/list · query: search: string, page: integer, limit: integer · returns: ClaimListResponse[] */
export function getAgencyRequestedClaims(params = {}) {
  return lifeApi().get(`/claim/agency/requested/list`, { params });
}
/** GET /claim/agency/rejected/list · query: search: string, page: integer, limit: integer · returns: ClaimListResponse[] */
export function getAgencyRejectedClaims(params = {}) {
  return lifeApi().get(`/claim/agency/rejected/list`, { params });
}
/** GET /claim/agency/paid/list · query: search: string, page: integer, limit: integer · returns: ClaimListResponse[] */
export function getAgencyPaidClaims(params = {}) {
  return lifeApi().get(`/claim/agency/paid/list`, { params });
}
/** GET /claim/agency/approved/list · query: search: string, page: integer, limit: integer · returns: ClaimListResponse[] */
export function getAgencyApprovedClaims(params = {}) {
  return lifeApi().get(`/claim/agency/approved/list`, { params });
}

// ── claims v2 (contract 2026-10, G3): SAVED → REQUESTED → REGISTERED → REVIEWED → APPROVED → AUTHORIZED → PAID ──
/** POST /claim/v2 · body: LifeClaimRequest · returns: LifeClaimResponse (SAVED) */
export function registerLifeClaim(data) {
  return lifeApi().post(`/claim/v2`, data);
}
/** GET /claim/v2/{claimUuid} · returns: LifeClaimResponse (also for claims made before v2) */
export function getLifeClaim(claimUuid) {
  return lifeApi().get(`/claim/v2/${claimUuid}`);
}
/** GET /claim/v2/list · query: status*: LifeClaimStatus, search, page, limit · returns: { content: LifeClaimResponse[], page, limit, totalPages, totalElements } */
export function getLifeClaims(params = {}) {
  return lifeApi().get(`/claim/v2/list`, { params });
}
/** GET /claim/required-documents · query: claimType* · returns: { documentType, description }[] */
export function getRequiredClaimDocuments(params = {}) {
  return lifeApi().get(`/claim/required-documents`, { params });
}
/** PUT /claim/insurance/register · body: ClaimRequest { claimUuid, comment } · REQUESTED → REGISTERED, assigns claimNumberCode */
export function registerClaim(data) {
  return lifeApi().put(`/claim/insurance/register`, data);
}
/** PUT /claim/{claimUuid}/assessment · body: ClaimAssessmentRequest · on REVIEWED */
export function assessClaim(claimUuid, data) {
  return lifeApi().put(`/claim/${claimUuid}/assessment`, data);
}
/** PUT /claim/insurance/authorize · body: ClaimRequest · APPROVED → AUTHORIZED */
export function authorizeClaim(data) {
  return lifeApi().put(`/claim/insurance/authorize`, data);
}
/** PUT /claim/insurance/pay · body: ClaimPayRequest { claimUuid, payments[] } · PAID once every payee is paid */
export function payClaim(data) {
  return lifeApi().put(`/claim/insurance/pay`, data);
}
/** PUT /claim/{claimUuid}/request-info · body: { comment } · back to the agency (INFO_REQUESTED) */
export function requestClaimInfo(claimUuid, comment) {
  return lifeApi().put(`/claim/${claimUuid}/request-info`, { comment });
}
/** PUT /claim/{claimUuid}/reject · body: { comment } · REJECTED (final) */
export function rejectLifeClaim(claimUuid, comment) {
  return lifeApi().put(`/claim/${claimUuid}/reject`, { comment });
}

// ── claim-logs ──
/** GET /claim-log/{claimUuid} · returns: ClaimLogsResponse[] (same data as getClaimLogs, unpaged) */
export function getClaimLogs_1(claimUuid) {
  return lifeApi().get(`/claim-log/${claimUuid}`);
}

// ── claim-attachment ──
/** PUT /claim-attachment/{claimAttachmentUuid} · query: fileNames*: string · body: multipart/form-data · returns: object */
export function updateClaimAttachment(claimAttachmentUuid, formData, params = {}) {
  return lifeApi().put(`/claim-attachment/${claimAttachmentUuid}`, formData, { params, headers: { 'Content-Type': 'multipart/form-data' } });
}
/** DELETE /claim-attachment/{claimAttachmentUuid} · returns: object */
export function deleteClaimAttachment(claimAttachmentUuid) {
  return lifeApi().delete(`/claim-attachment/${claimAttachmentUuid}`);
}
/** POST /claim-attachment · query: claimUuid*: string, fileNames*: string (this file's label), documentType: string (checklist item) · body: multipart/form-data · returns: object */
export function createClaimAttachment(formData, params = {}) {
  return lifeApi().post(`/claim-attachment`, formData, { params, headers: { 'Content-Type': 'multipart/form-data' } });
}
/** GET /claim-attachment/{claimUuid} · returns: ClaimAttachmentResponse[] */
export function getClaimAttachments(claimUuid) {
  return lifeApi().get(`/claim-attachment/${claimUuid}`);
}
/** GET /claim-attachment/open · query: claimAttachmentUuid*: string · returns: file */
export function getAttachment(params = {}) {
  return lifeApi().get(`/claim-attachment/open`, { params, responseType: 'blob' });
}
