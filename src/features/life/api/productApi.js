// Generated from the Life Insurance OpenAPI document (operationId = function name).
// Products & rate tables: riders, individual/group rider rates, individual/group term rates.
import { lifeApi } from "./lifeClient";

// ── rider ──
/** GET /rider/{riderUuid} · returns: RiderResponse */
export function getRider(riderUuid) {
  return lifeApi().get(`/rider/${riderUuid}`);
}
/** PUT /rider/{riderUuid} · body: RiderRequest · returns: RiderResponse */
export function updateRider(riderUuid, data) {
  return lifeApi().put(`/rider/${riderUuid}`, data);
}
/** DELETE /rider/{riderUuid} · returns: MessageResponse */
export function deleteRider(riderUuid) {
  return lifeApi().delete(`/rider/${riderUuid}`);
}
/** PUT /rider/activate/{riderUuid} · returns: RiderResponse */
export function activateRider(riderUuid) {
  return lifeApi().put(`/rider/activate/${riderUuid}`, undefined);
}
/** POST /rider · body: RiderRequest · returns: RiderResponse */
export function createRider(data) {
  return lifeApi().post(`/rider`, data);
}
/** POST /rider/replicate/{riderUuid} · returns: RiderResponse */
export function modifyRider(riderUuid) {
  return lifeApi().post(`/rider/replicate/${riderUuid}`, undefined);
}
/** GET /rider/rates/byage · query: age*: integer · returns: RiderResponse[] */
export function getRiderRatesByAge(params = {}) {
  return lifeApi().get(`/rider/rates/byage`, { params });
}
/** GET /rider/pending · returns: RiderResponse[] */
export function getPendingRiders() {
  return lifeApi().get(`/rider/pending`);
}
/** GET /rider/modified · returns: RiderResponse[] */
export function getModifiedRiders() {
  return lifeApi().get(`/rider/modified`);
}
/** GET /rider/active · returns: RiderResponse[] */
export function getRiders() {
  return lifeApi().get(`/rider/active`);
}
/** GET /rider/active/lists · returns: RiderListResponse[] */
export function getRiderList() {
  return lifeApi().get(`/rider/active/lists`);
}

// ── individual-rider ──
/** GET /individual-rider/{individualRiderUuid} · returns: IndividualRiderResponse */
export function getIndividualRider(individualRiderUuid) {
  return lifeApi().get(`/individual-rider/${individualRiderUuid}`);
}
/** PUT /individual-rider/{individualRiderUuid} · body: IndividualRiderRequest · returns: IndividualRiderResponse */
export function updateIndividualRider(individualRiderUuid, data) {
  return lifeApi().put(`/individual-rider/${individualRiderUuid}`, data);
}
/** DELETE /individual-rider/{individualRiderUuid} · returns: MessageResponse */
export function deleteIndividualRider(individualRiderUuid) {
  return lifeApi().delete(`/individual-rider/${individualRiderUuid}`);
}
/** PUT /individual-rider/create-update · body: IndividualRiderRequest[] · returns: IndividualRiderResponse[] */
export function updateIndividualRiders(data) {
  return lifeApi().put(`/individual-rider/create-update`, data);
}
/** POST /individual-rider · body: IndividualRiderRequest · returns: IndividualRiderResponse */
export function createIndividualRider(data) {
  return lifeApi().post(`/individual-rider`, data);
}
/** POST /individual-rider/import · query: riderUuid*: string · body: multipart/form-data · returns: IndividualRiderResponse[] */
export function importData(formData, params = {}) {
  return lifeApi().post(`/individual-rider/import`, formData, { params, headers: { 'Content-Type': 'multipart/form-data' } });
}
/** GET /individual-rider/rate · query: age*: integer, riderUuid*: string · returns: IndividualRiderResponse[] */
export function getIndividualRiderRate(params = {}) {
  return lifeApi().get(`/individual-rider/rate`, { params });
}
/** GET /individual-rider/active · returns: IndividualRiderResponse[] */
export function getIndividualRiders() {
  return lifeApi().get(`/individual-rider/active`);
}

// ── group-rider ──
/** GET /group-rider/{groupRiderUuid} · returns: GroupRiderResponse */
export function getGroupRider(groupRiderUuid) {
  return lifeApi().get(`/group-rider/${groupRiderUuid}`);
}
/** PUT /group-rider/{groupRiderUuid} · body: GroupRiderRequest · returns: GroupRiderResponse */
export function updateGroupRider(groupRiderUuid, data) {
  return lifeApi().put(`/group-rider/${groupRiderUuid}`, data);
}
/** DELETE /group-rider/{groupRiderUuid} · returns: MessageResponse */
export function deleteGroupRider(groupRiderUuid) {
  return lifeApi().delete(`/group-rider/${groupRiderUuid}`);
}
/** PUT /group-rider/create-update · body: GroupRiderRequest[] · returns: GroupRiderResponse[] */
export function updateGroupRiders(data) {
  return lifeApi().put(`/group-rider/create-update`, data);
}
/** POST /group-rider · body: GroupRiderRequest · returns: GroupRiderResponse */
export function createGroupRider(data) {
  return lifeApi().post(`/group-rider`, data);
}
/** POST /group-rider/import · query: riderUuid*: string · body: multipart/form-data · returns: GroupRiderResponse[] */
export function importGroupRiderData(formData, params = {}) {
  return lifeApi().post(`/group-rider/import`, formData, { params, headers: { 'Content-Type': 'multipart/form-data' } });
}
/** GET /group-rider/active · returns: GroupRiderResponse[] */
export function getGroupRiders() {
  return lifeApi().get(`/group-rider/active`);
}

// ── individual-term ──
/** GET /insurance-term/{insuranceTermUuid} · returns: IndividualTermResponse */
export function getInsuranceTerm(insuranceTermUuid) {
  return lifeApi().get(`/insurance-term/${insuranceTermUuid}`);
}
/** PUT /insurance-term/{insuranceTermUuid} · body: IndividualTermRequest · returns: IndividualTermResponse */
export function updateInsuranceTerm(insuranceTermUuid, data) {
  return lifeApi().put(`/insurance-term/${insuranceTermUuid}`, data);
}
/** DELETE /insurance-term/{insuranceTermUuid} · returns: MessageResponse */
export function deleteInsuranceTerm(insuranceTermUuid) {
  return lifeApi().delete(`/insurance-term/${insuranceTermUuid}`);
}
/** PUT /insurance-term/create-update · body: IndividualTermRequest[] · returns: IndividualTermResponse[] */
export function updateInsuranceTerms(data) {
  return lifeApi().put(`/insurance-term/create-update`, data);
}
/** POST /insurance-term · body: IndividualTermRequest · returns: IndividualTermResponse */
export function createInsuranceTerm(data) {
  return lifeApi().post(`/insurance-term`, data);
}
/** GET /insurance-term/calculate-term-premium · query: age*: integer, term*: integer · returns: IndividualTermResponse */
export function geTermPremium(params = {}) {
  return lifeApi().get(`/insurance-term/calculate-term-premium`, { params });
}
/** GET /insurance-term/active · returns: IndividualTermResponse[] */
export function getInsuranceTerms() {
  return lifeApi().get(`/insurance-term/active`);
}

// ── group-term ──
/** GET /group-term/{groupTermUuid} · returns: GroupTermResponse */
export function getGroupTerm(groupTermUuid) {
  return lifeApi().get(`/group-term/${groupTermUuid}`);
}
/** PUT /group-term/{groupTermUuid} · body: GroupTermRequest · returns: GroupTermResponse */
export function updateGroupTerm(groupTermUuid, data) {
  return lifeApi().put(`/group-term/${groupTermUuid}`, data);
}
/** DELETE /group-term/{groupTermUuid} · returns: MessageResponse */
export function deleteGroupTerm(groupTermUuid) {
  return lifeApi().delete(`/group-term/${groupTermUuid}`);
}
/** PUT /group-term/update · body: GroupTermRequest[] · returns: GroupTermResponse[] */
export function updateGroupTerms(data) {
  return lifeApi().put(`/group-term/update`, data);
}
/** POST /group-term · body: GroupTermRequest · returns: GroupTermResponse */
export function createGroupTerm(data) {
  return lifeApi().post(`/group-term`, data);
}
/** POST /group-term/import · body: multipart/form-data · returns: MessageResponse */
export function importTerm(formData) {
  return lifeApi().post(`/group-term/import`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}
/** GET /group-term/list · query: status*: string (ACTIVE | PENDING | DISABLED) · returns: GroupTermResponse[] */
export function getGroupTerms(params = {}) {
  return lifeApi().get(`/group-term/list`, { params });
}
