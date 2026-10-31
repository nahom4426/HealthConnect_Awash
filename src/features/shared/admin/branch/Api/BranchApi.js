import ApiService from "@/service/ApiService";

// Branch directory lives in AuthService. Reads need a signed-in user; writes need branch.manage.
const api = new ApiService(import.meta.env.v_API_AUTH_URI);
const path = "/branches";

// GET /branches?includeInactive=true|false (plain list, not paged)
export function getAllBranches(includeInactive = false) {
  return api
    .addAuthenticationHeader()
    .get(path, { params: { includeInactive } });
}
export function getBranchById(branchUuid) {
  return api.addAuthenticationHeader().get(`${path}/${branchUuid}`);
}
// body: { code, name, region, address, phone }
export function createBranch(data) {
  return api.addAuthenticationHeader().post(path, data);
}
export function updateBranch(branchUuid, data) {
  return api.addAuthenticationHeader().put(`${path}/${branchUuid}`, data);
}
// PATCH /branches/{branchUuid}/status?status=ACTIVE|INACTIVE
export function changeBranchStatus(branchUuid, status) {
  return api
    .addAuthenticationHeader()
    .patch(`${path}/${branchUuid}/status`, null, { params: { status } });
}
