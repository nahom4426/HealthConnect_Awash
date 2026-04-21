import ApiService from "@/service/ApiService";
import { getQueryFormObject } from "@/utils/utils";

const api = new ApiService();
const path = "/dependant";
const path1 = "/claimconnect/insured-service";
const path2 = "/claimconnect/serviceQuoted";

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

export function createServiceQuotedBenefits(payerInstitutionContractUuid, data) {
  return api
    .addAuthenticationHeader()
    .post(`${path2}/benefit`, data, {
      params: { payerInstitutionContractUuid },
    });
}

export function updateServiceQuotedBenefit(serviceQuotedUuid, payerInstitutionContractUuid, data) {
  return api
    .addAuthenticationHeader()
    .put(`${path2}/benefit/${serviceQuotedUuid}`, data, {
      params: { payerInstitutionContractUuid },
    });
}

export function getAllServiceQuoted(payerInstitutionContractUuid, query = {}) {
  return api.addAuthenticationHeader().get(`${path2}/all`, {
    params: {
      payerInstitutionContractUuid,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
      search: query.search,
    },
  });
}

export function getServiceQuotedByUuid(serviceQuotedUuid) {
  return api.addAuthenticationHeader().get(`${path2}/${serviceQuotedUuid}`);
}

export function addInsuredsToServiceQuotedBenefit(serviceQuotedUuid, data) {
  return api
    .addAuthenticationHeader()
    .put(`${path2}/benefit/addInsureds${serviceQuotedUuid}`, data);
}

export function getMappedInsuredsForServiceQuotedBenefit(serviceQuotedUuid, query = {}) {
  return api.addAuthenticationHeader().get(`${path2}/getAllInsureds/${serviceQuotedUuid}`, {
    params: {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    },
  });
}
