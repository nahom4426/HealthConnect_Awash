import ApiService from "@/service/ApiService";

const api = new ApiService();
const path = "/claimconnect/package";
export function getPackages(query = {}) {
  return api.addAuthenticationHeader().get(`${path}`, {
    params: query,
  });
}

export function getPackage(packageUuid) {
  return api.addAuthenticationHeader().get(`${path}/${packageUuid}`);
}
export function getEligiblePackage(packageUuid,payerProviderContractUuid) {
  return api.addAuthenticationHeader().get(`${path}/packageServices/${packageUuid}?payerProviderContractUuid=${payerProviderContractUuid}`);
}
export function createPackage(data) {
  return api.addAuthenticationHeader().post(`${path}`, data);
}

export function updatePackage(packageUuid, data) {
  return api.addAuthenticationHeader().put(`${path}/${packageUuid}`, data);
}

export function deletePackage(packageUuid) {
  return api.addAuthenticationHeader().delete(`${path}/${packageUuid}`);
}

export function addEligibleServices(packageUuid, payload) {
  return api
    .addAuthenticationHeader()
    .put(`${path}/addEligibleServices/${packageUuid}`, payload);
}

export function getFamilyLevelPackages() {
  return api.addAuthenticationHeader().get('${path}/familyLevelPackages');
}

export function getActivePackages() {
  return api.addAuthenticationHeader().get('${path}/active/list');
}

export function createFamilyLevelPackage(data) {
  return api.addAuthenticationHeader().post('${path}/createFamilyLevelPackage', data);
}

export function getPackageDropdown(insuredPersonUuid, dependantUuid = null) {
  let url = `${path}/dropdown/${insuredPersonUuid}`;
  if (dependantUuid) {
    url += `?dependantUuid=${dependantUuid}`;
  }
  return api.addAuthenticationHeader().get(url);
}
export function createPackages(query, payload) {
  return api
    .addAuthenticationHeader()
    .post(`/claimconnect/serviceQuoted/benefit`, payload, { params: query });
}
export function addPackages(query, payload) {
  const { payerInstitutionContractUuid, ...params } = query || {};
  return api
    .addAuthenticationHeader()
    .post(
      `/claimconnect/benefit/createBenefitUsage/${payerInstitutionContractUuid}`,
      payload,
      { params }
    );
}

export function createBenefitsForAllInsured(institutionUuid, payload) {
  return api
    .addAuthenticationHeader()
    .post(
      `/claimconnect/benefit/createBenefitsForAllInsured/${institutionUuid}`,
      payload
    );
}