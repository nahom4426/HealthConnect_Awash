import ApiService from "@/service/ApiService";

const api = new ApiService();
const path = "/claimconnect";

export function createBroker(data) {
  return api
    .addAuthenticationHeader()
    .post(`${path}/stakeholder`, data);
}

export function getBrokers(
  params = {
    page: 0,
    size: 10,
    sortBy: "createdAt",
    sortDir: "DESC",
  }
) {
  return api
    .addAuthenticationHeader()
    .get(`${path}/stakeholder`, { params });
}

export function getBroker(id) {
  return api
    .addAuthenticationHeader()
    .get(`${path}/stakeholder/${id}`);
}

export function updateBroker(id, data) {
  return api
    .addAuthenticationHeader()
    .put(`${path}/stakeholder/${id}`, data);
}

export function deleteBroker(id) {
  return api
    .addAuthenticationHeader()
    .delete(`${path}/stakeholder/${id}`);
}

export function updateBrokerStatus(id, status) {
  return api
    .addAuthenticationHeader()
    .put(`${path}/stakeholder/${id}/status/${status}`);
}