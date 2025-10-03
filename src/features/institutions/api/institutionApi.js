import ApiService from "@/service/ApiService";
import { getQueryFormObject } from "@/utils/utils";

const api = new ApiService();

const path = "/claimconnect/institution";

export function getInstitutionsPolicyByStatus(query = {}) {
  return api.addAuthenticationHeader().get(`${path}/list`, {
    params: query,
  });
}

export function getActiveInstitutions(query = {}) {
  return api.addAuthenticationHeader().get(`${path}/list`, {
    params: query,
  });
}

export function createInstitution(data) {
  return api.addAuthenticationHeader().post(`${path}`, data);
}

export function getInstitutionsByStatus(query = {}) {
  return api.addAuthenticationHeader().get(`${path}/list`, {
    params: query,
  });
}

export function getInstitutionsById(id) {
  return api.addAuthenticationHeader().get(`${path}/${id}`);
}

export function updateInstitutionById(id, data) {
  return api.addAuthenticationHeader().put(`${path}/${id}`, data);
}
