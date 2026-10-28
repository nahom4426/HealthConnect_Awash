import ApiService from "@/service/ApiService";
import { getQueryFormObject } from "@/utils/utils.js";

// Must use AuthService base (same as Users), not digital-channel default.
const api = new ApiService(import.meta.env.v_API_AUTH_URI);
const path = "/users/privilege";

export function getAllPrivilege(query = {}) {
  const qr = getQueryFormObject(query);
  return api.addAuthenticationHeader().get(`${path}/list${qr}`);
}
export function createPrivilege(data) {
  return api.addAuthenticationHeader().post(`${path}/add`, data);
}

export function deletePrivilege(id) {
  return api.addAuthenticationHeader().delete(`${path}/${id}`);
}
export function getPrivilegeById(id) {
  return api.addAuthenticationHeader().get(`${path}/${id}`);
}
export function updatePrivilege(id, data) {
  return api.addAuthenticationHeader().put(`${path}/${id}`, data);
}

export function changePrivilegeStatus(privilegeId, status) {
  return api
    .addAuthenticationHeader()
    .put(`${path}/${privilegeId}/status`, null, {
      params: { status },
    });
}
