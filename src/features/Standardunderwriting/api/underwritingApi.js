import ApiService from "@/service/ApiService";

const api = new ApiService();
const path = '/claimconnect/underwriting';

// Institution methods
export function getInstitution(institutionUuid) {
  return api.addAuthenticationHeader().get(`/claimconnect/institution/${institutionUuid}`);
}

export function getInstitutions(query = {}) {
  return api.addAuthenticationHeader().get(`${path}/institutions`, {
    params: query,
  });
}

export function createInstitution(data) {
  return api.addAuthenticationHeader().post(`${path}/institution`, data);
}

// Contract methods
export function getInstitutionContracts(institutionUuid, query = {}) {
  return api.addAuthenticationHeader().get(`/claimconnect/payer-institution-contract/lists/${institutionUuid}`, {
    params: query,
  });
}
export function getIssuedContracts(query = {}) {
  return api.addAuthenticationHeader().get(`/claimconnect/payer-institution-contract/policies`, {
    params: query,
  });
}

export function createInstitutionContract(data) {
  return api.addAuthenticationHeader().post('/claimconnect/payer-institution-contract', data);
}

export function updateInstitutionContract(contractUuid, data) {
  return api.addAuthenticationHeader().put(`/claimconnect/payer-institution-contract/${contractUuid}`, data);
}

export function deleteInstitutionContract(contractUuid) {
  return api.addAuthenticationHeader().delete(`/claimconnect/payer-institution-contract/${contractUuid}`);
}

