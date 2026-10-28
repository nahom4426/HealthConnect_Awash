// Generated from the Life Insurance OpenAPI document (operationId = function name).
// Reinsurance: reinsurers, treaties and their members, free-cover-limit (FCL) groups,
// medical parameters, FCL medical underwriting ranges/requirements, policy↔treaty mapping.
import { lifeApi } from "./lifeClient";

// ── reinsurer ──
/** GET /reinsurer/{reinsurerUuid} · returns: ReinsurerResponse */
export function getReinsurer(reinsurerUuid) {
  return lifeApi().get(`/reinsurer/${reinsurerUuid}`);
}
/** PUT /reinsurer/{reinsurerUuid} · body: ReinsurerRequest · returns: ReinsurerResponse */
export function updateReinsurer(reinsurerUuid, data) {
  return lifeApi().put(`/reinsurer/${reinsurerUuid}`, data);
}
/** DELETE /reinsurer/{reinsurerUuid} · returns: object */
export function deleteReinsurer(reinsurerUuid) {
  return lifeApi().delete(`/reinsurer/${reinsurerUuid}`);
}
/** PUT /reinsurer/update/status/{reinsurerUuid} · query: status*: string (ACTIVE | PENDING | DISABLED) · returns: ReinsurerResponse */
export function updateReinsurerStatus(reinsurerUuid, params = {}) {
  return lifeApi().put(`/reinsurer/update/status/${reinsurerUuid}`, undefined, { params });
}
/** POST /reinsurer · body: ReinsurerRequest · returns: ReinsurerResponse */
export function createReinsurer(data) {
  return lifeApi().post(`/reinsurer`, data);
}
/** GET /reinsurer/list · query: page: integer, limit: integer, status*: string (ACTIVE | PENDING | DISABLED), search: string · returns: ReinsurerResponse[] */
export function getReinsurers(params = {}) {
  return lifeApi().get(`/reinsurer/list`, { params });
}

// ── reinsurance-treaty ──
/** GET /reinsurance/treaty/{reinsuranceTreatyUuid} · returns: ReinsuranceTreatyResponse */
export function getReinsuranceTreaty(reinsuranceTreatyUuid) {
  return lifeApi().get(`/reinsurance/treaty/${reinsuranceTreatyUuid}`);
}
/** PUT /reinsurance/treaty/{reinsuranceTreatyUuid} · body: ReinsuranceTreatyRequest · returns: ReinsuranceTreatyResponse */
export function updateReinsuranceTreaty(reinsuranceTreatyUuid, data) {
  return lifeApi().put(`/reinsurance/treaty/${reinsuranceTreatyUuid}`, data);
}
/** DELETE /reinsurance/treaty/{reinsuranceTreatyUuid} · returns: object */
export function deleteReinsuranceTreaty(reinsuranceTreatyUuid) {
  return lifeApi().delete(`/reinsurance/treaty/${reinsuranceTreatyUuid}`);
}
/** PUT /reinsurance/treaty/update/status/{reinsuranceTreatyUuid} · query: status*: string (ACTIVE | PENDING | REVISED) · returns: ReinsuranceTreatyResponse */
export function updateReinsuranceTreatyStatus(reinsuranceTreatyUuid, params = {}) {
  return lifeApi().put(`/reinsurance/treaty/update/status/${reinsuranceTreatyUuid}`, undefined, { params });
}
/** POST /reinsurance/treaty · body: ReinsuranceTreatyRequest · returns: ReinsuranceTreatyResponse */
export function createReinsuranceTreaty(data) {
  return lifeApi().post(`/reinsurance/treaty`, data);
}
/** POST /reinsurance/treaty/all · body: TreatyRequest (treaty + members + FCL groups + medical ranges in one call) · returns: ReinsuranceTreaty */
export function createReinsuranceAllTreaty(data) {
  return lifeApi().post(`/reinsurance/treaty/all`, data);
}
/** GET /reinsurance/treaty/list · query: page: integer, limit: integer, status*: string (ACTIVE | PENDING | REVISED), search: string · returns: ReinsuranceTreatyResponse[] */
export function getReinsuranceTreatys(params = {}) {
  return lifeApi().get(`/reinsurance/treaty/list`, { params });
}

// ── treaty-member ──
/** PUT /reinsurance/treaty/member/{reinsuranceTreatyUuid} · body: TreatyMemberUpdateRequest[] · returns: TreatyMemberResponse[] */
export function updateTreatyMember(reinsuranceTreatyUuid, data) {
  return lifeApi().put(`/reinsurance/treaty/member/${reinsuranceTreatyUuid}`, data);
}
/** PUT /reinsurance/treaty/member/update/status/{treatyMemberUuid} · query: status*: string (ACTIVE | PENDING | REVISED) · returns: TreatyMemberResponse */
export function updateTreatyMemberStatus(treatyMemberUuid, params = {}) {
  return lifeApi().put(`/reinsurance/treaty/member/update/status/${treatyMemberUuid}`, undefined, { params });
}
/** POST /reinsurance/treaty/member · body: TreatyMemberRequest · returns: TreatyMemberResponse */
export function createTreatyMember(data) {
  return lifeApi().post(`/reinsurance/treaty/member`, data);
}
/** GET /reinsurance/treaty/member/{treatyMemberUuid} · returns: TreatyMemberResponse */
export function getTreatyMember(treatyMemberUuid) {
  return lifeApi().get(`/reinsurance/treaty/member/${treatyMemberUuid}`);
}
/** DELETE /reinsurance/treaty/member/{treatyMemberUuid} · returns: object */
export function deleteTreatyMember(treatyMemberUuid) {
  return lifeApi().delete(`/reinsurance/treaty/member/${treatyMemberUuid}`);
}
/** GET /reinsurance/treaty/member/list/{reinsuranceTreatyUuid} · query: status*: string (ACTIVE | PENDING | REVISED) · returns: TreatyMemberResponse[] */
export function getTreatyMembers(reinsuranceTreatyUuid, params = {}) {
  return lifeApi().get(`/reinsurance/treaty/member/list/${reinsuranceTreatyUuid}`, { params });
}

// ── fcl-group ──
/** PUT /reinsurance/fcl-group/{reinsuranceTreatyUuid} · body: FclGroupUpdateRequest[] · returns: FclGroupResponse[] */
export function updateFclGroup(reinsuranceTreatyUuid, data) {
  return lifeApi().put(`/reinsurance/fcl-group/${reinsuranceTreatyUuid}`, data);
}
/** POST /reinsurance/fcl-group · body: FclGroupRequest[] · returns: FclGroupResponse[] */
export function createFclGroup(data) {
  return lifeApi().post(`/reinsurance/fcl-group`, data);
}
/** GET /reinsurance/fcl-group/{fclGroupUuid} · returns: FclGroupResponse */
export function getFclGroup(fclGroupUuid) {
  return lifeApi().get(`/reinsurance/fcl-group/${fclGroupUuid}`);
}
/** DELETE /reinsurance/fcl-group/{fclGroupUuid} · returns: object */
export function deleteFclGroup(fclGroupUuid) {
  return lifeApi().delete(`/reinsurance/fcl-group/${fclGroupUuid}`);
}
/** GET /reinsurance/fcl-group/list/{reinsuranceTreatyUuid} · query: status*: string (ACTIVE | PENDING | REVISED) · returns: FclGroupResponse[] */
export function getFclGroups(reinsuranceTreatyUuid, params = {}) {
  return lifeApi().get(`/reinsurance/fcl-group/list/${reinsuranceTreatyUuid}`, { params });
}

// ── fcl-medical-parameter ──
/** GET /reinsurance/medical-parameter/{FclMedicalParameterUuid} · returns: FclMedicalParameterResponse */
export function getFclMedicalParameter(FclMedicalParameterUuid) {
  return lifeApi().get(`/reinsurance/medical-parameter/${FclMedicalParameterUuid}`);
}
/** PUT /reinsurance/medical-parameter/{FclMedicalParameterUuid} · body: FclMedicalParameterRequest · returns: FclMedicalParameterResponse */
export function updateFclMedicalParameter(FclMedicalParameterUuid, data) {
  return lifeApi().put(`/reinsurance/medical-parameter/${FclMedicalParameterUuid}`, data);
}
/** DELETE /reinsurance/medical-parameter/{FclMedicalParameterUuid} · returns: object */
export function deleteFclMedicalParameter(FclMedicalParameterUuid) {
  return lifeApi().delete(`/reinsurance/medical-parameter/${FclMedicalParameterUuid}`);
}
/** PUT /reinsurance/medical-parameter/update/status/{FclMedicalParameterUuid} · query: status*: string (ACTIVE | PENDING | REVISED) · returns: FclMedicalParameterResponse */
export function updateFclMedicalParameterStatus(FclMedicalParameterUuid, params = {}) {
  return lifeApi().put(`/reinsurance/medical-parameter/update/status/${FclMedicalParameterUuid}`, undefined, { params });
}
/** POST /reinsurance/medical-parameter · body: FclMedicalParameterRequest · returns: FclMedicalParameterResponse */
export function createFclMedicalParameter(data) {
  return lifeApi().post(`/reinsurance/medical-parameter`, data);
}
/** GET /reinsurance/medical-parameter/list · query: page: integer, limit: integer, status*: string (ACTIVE | PENDING | REVISED), search: string · returns: FclMedicalParameterResponse[] */
export function getFclMedicalParameters(params = {}) {
  return lifeApi().get(`/reinsurance/medical-parameter/list`, { params });
}

// ── fcl-medical-underwriting-range ──
/** PUT /reinsurance/fcl/underwriting-range/{reinsuranceTreatyUuid} · body: FclUnderwritingRangeWithMedicalParametersRequest[] · returns: FclWithMedicalParameterResponse[] */
export function updateFclMedicalUnderwritingRange(reinsuranceTreatyUuid, data) {
  return lifeApi().put(`/reinsurance/fcl/underwriting-range/${reinsuranceTreatyUuid}`, data);
}
/** PUT /reinsurance/fcl/underwriting-range/update/status/{fclMedicalUnderwritingRangeUuid} · query: status*: string (ACTIVE | PENDING | REVISED) · returns: FclMedicalUnderwritingRangeResponse */
export function updateFclMedicalUnderwritingRangeStatus(fclMedicalUnderwritingRangeUuid, params = {}) {
  return lifeApi().put(`/reinsurance/fcl/underwriting-range/update/status/${fclMedicalUnderwritingRangeUuid}`, undefined, { params });
}
/** POST /reinsurance/fcl/underwriting-range · body: FclMedicalUnderwritingRangeRequest · returns: FclMedicalUnderwritingRangeResponse */
export function createFclMedicalUnderwritingRange(data) {
  return lifeApi().post(`/reinsurance/fcl/underwriting-range`, data);
}
/** GET /reinsurance/fcl/underwriting-range/{fclMedicalUnderwritingRangeUuid} · returns: FclMedicalUnderwritingRangeResponse */
export function getFclMedicalUnderwritingRange(fclMedicalUnderwritingRangeUuid) {
  return lifeApi().get(`/reinsurance/fcl/underwriting-range/${fclMedicalUnderwritingRangeUuid}`);
}
/** DELETE /reinsurance/fcl/underwriting-range/{fclMedicalUnderwritingRangeUuid} · returns: object */
export function deleteFclMedicalUnderwritingRange(fclMedicalUnderwritingRangeUuid) {
  return lifeApi().delete(`/reinsurance/fcl/underwriting-range/${fclMedicalUnderwritingRangeUuid}`);
}
/** GET /reinsurance/fcl/underwriting-range/list/{reinsuranceTreatyUuid} · query: status*: string (ACTIVE | PENDING | REVISED) · returns: FclMedicalUnderwritingRangeResponse[] */
export function getFclMedicalUnderwritingRanges(reinsuranceTreatyUuid, params = {}) {
  return lifeApi().get(`/reinsurance/fcl/underwriting-range/list/${reinsuranceTreatyUuid}`, { params });
}
/** GET /reinsurance/fcl/underwriting-range/list/with-medical/parameters/{reinsuranceTreatyUuid} · query: status*: string (ACTIVE | PENDING | REVISED) · returns: FclWithMedicalParameterResponse[] */
export function getFclMedicalUnderwritingRangesWithMedicalParameters(reinsuranceTreatyUuid, params = {}) {
  return lifeApi().get(`/reinsurance/fcl/underwriting-range/list/with-medical/parameters/${reinsuranceTreatyUuid}`, { params });
}

// ── fcl-underwriting-range-medical-requirement ──
/** GET /reinsurance/treaty/medical-requirement/{fclUnderwritingRangeMedicalRequirementUuid} · returns: FclUnderwritingRangeMedicalRequirementResponse */
export function getFclUnderwritingRangeMedicalRequirement(fclUnderwritingRangeMedicalRequirementUuid) {
  return lifeApi().get(`/reinsurance/treaty/medical-requirement/${fclUnderwritingRangeMedicalRequirementUuid}`);
}
/** PUT /reinsurance/treaty/medical-requirement/{fclUnderwritingRangeMedicalRequirementUuid} · body: FclUnderwritingRangeMedicalRequirementRequest · returns: FclUnderwritingRangeMedicalRequirementResponse */
export function updateFclUnderwritingRangeMedicalRequirement(fclUnderwritingRangeMedicalRequirementUuid, data) {
  return lifeApi().put(`/reinsurance/treaty/medical-requirement/${fclUnderwritingRangeMedicalRequirementUuid}`, data);
}
/** DELETE /reinsurance/treaty/medical-requirement/{fclUnderwritingRangeMedicalRequirementUuid} · returns: object */
export function deleteFclUnderwritingRangeMedicalRequirement(fclUnderwritingRangeMedicalRequirementUuid) {
  return lifeApi().delete(`/reinsurance/treaty/medical-requirement/${fclUnderwritingRangeMedicalRequirementUuid}`);
}
/** PUT /reinsurance/treaty/medical-requirement/update/status/{fclUnderwritingRangeMedicalRequirementUuid} · query: status*: string (ACTIVE | PENDING | REVISED) · returns: FclUnderwritingRangeMedicalRequirementResponse */
export function updateFclUnderwritingRangeMedicalRequirementStatus(fclUnderwritingRangeMedicalRequirementUuid, params = {}) {
  return lifeApi().put(`/reinsurance/treaty/medical-requirement/update/status/${fclUnderwritingRangeMedicalRequirementUuid}`, undefined, { params });
}
/** POST /reinsurance/treaty/medical-requirement · body: FclUnderwritingRangeMedicalRequirementRequest · returns: FclUnderwritingRangeMedicalRequirementResponse */
export function createFclUnderwritingRangeMedicalRequirement(data) {
  return lifeApi().post(`/reinsurance/treaty/medical-requirement`, data);
}
/** GET /reinsurance/treaty/medical-requirement/list/{fclMedicalUnderwritingRangeUuid} · query: status*: string (ACTIVE | PENDING | REVISED) · returns: FclUnderwritingRangeMedicalRequirementResponse[] */
export function getFclUnderwritingRangeMedicalRequirements(fclMedicalUnderwritingRangeUuid, params = {}) {
  return lifeApi().get(`/reinsurance/treaty/medical-requirement/list/${fclMedicalUnderwritingRangeUuid}`, { params });
}

// ── policy-treaty-mapping ──
/** GET /policy-treaty/mapping/{policyTreatyMappingUuid} · returns: PolicyTreatyMappingResponse */
export function getPolicyTreatyMapping(policyTreatyMappingUuid) {
  return lifeApi().get(`/policy-treaty/mapping/${policyTreatyMappingUuid}`);
}
/** PUT /policy-treaty/mapping/{policyTreatyMappingUuid} · body: PolicyTreatyMappingRequest · returns: PolicyTreatyMappingResponse */
export function updatePolicyTreatyMapping(policyTreatyMappingUuid, data) {
  return lifeApi().put(`/policy-treaty/mapping/${policyTreatyMappingUuid}`, data);
}
/** DELETE /policy-treaty/mapping/{policyTreatyMappingUuid} · returns: object */
export function deletePolicyTreatyMapping(policyTreatyMappingUuid) {
  return lifeApi().delete(`/policy-treaty/mapping/${policyTreatyMappingUuid}`);
}
/** PUT /policy-treaty/mapping/update/status/{policyTreatyMappingUuid} · query: status*: string (ACTIVE | PENDING | REVISED) · returns: PolicyTreatyMappingResponse */
export function updatePolicyTreatyMappingStatus(policyTreatyMappingUuid, params = {}) {
  return lifeApi().put(`/policy-treaty/mapping/update/status/${policyTreatyMappingUuid}`, undefined, { params });
}
/** POST /policy-treaty/mapping · body: PolicyTreatyMappingRequest · returns: PolicyTreatyMappingResponse */
export function createPolicyTreatyMapping(data) {
  return lifeApi().post(`/policy-treaty/mapping`, data);
}
/** GET /policy-treaty/mapping/list/{quotationUuid} · returns: PolicyTreatyMappingResponse (as documented; a list is likely) */
export function getPolicyTreatyMappingList(quotationUuid) {
  return lifeApi().get(`/policy-treaty/mapping/list/${quotationUuid}`);
}
