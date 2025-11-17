import ApiService from "@/service/ApiService";
import { getQueryFormObject } from "@/utils/utils";

const api = new ApiService();
const path = "/dependant";
const path1 = "/claimconnect/insured-service";

export function addServiceToGroup(id, data) {
  return api
    .addAuthenticationHeader()
    .put(`${path1}/addServicesToGroup/${id}`, data);
}

export function getGroup(id, query = {}) {
  return api.addAuthenticationHeader().get(`${path1}/contract/${id}`, {
    params: query,
  });
}
export function createCoverage(data) {
  return api.addAuthenticationHeader().post(`${path1}`, {
    payerInstitutionContractUuid: data.payerInstitutionContractUuid,
    packageUuids: data.packageUuids,
    maxBenefitForEmployee: data.maxBenefitForEmployee,
    maxBenefitForSpouse: data.maxBenefitForSpouse,
    maxBenefitForChildren: data.maxBenefitForChildren,
    familyPoolBenefit: data.familyPoolBenefit,
    maxAllowedDependants: data.maxAllowedDependants,
    maxAllowedDependantAge: data.maxAllowedDependantAge,
    planType: data.planType || 'Individual_Plan',
    status: data.status || 'ACTIVE',
    excessAllowed: data.excessAllowed !== undefined ? data.excessAllowed : true
  });
}

export function updateCoverage(id, data) {
  return api.addAuthenticationHeader().put(`${path1}/${id}`, data);
}
export function getGroupInsured(id, data) {
  return api
    .addAuthenticationHeader()
    .get(`${path1}/membersAndServices/${id}`, data);
}

export function addMembersToGroup(id, data) {
  return api
    .addAuthenticationHeader()
    .put(`${path1}/mapInsureds/${id}`, data);
}
