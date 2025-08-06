import ApiService from "@/service/ApiService";

const api = new ApiService();
const basePath = "/drugs";

export function getAllDrugs(providerUuid, query = {}) {
  return api
    .addAuthenticationHeader()
    .get(`${basePath}/search/${providerUuid}`, {
      params: query,
    });
}

// Function to get a service by ID
export function getDrugById(id) {
  return api.addAuthenticationHeader().get(`${basePath}/${id}`);
}

// Function to create a new service
export function createDrug(id, data) {
  return api.addAuthenticationHeader().post(`${basePath}/${id}`, data);
}

// Function to update a service
export async function updateDrug(uuid, data) {
  return api.addAuthenticationHeader().put(`${basePath}/${uuid}`, data);
}

// Function to delete a service
export function removeDrug(id) {
  return api.addAuthenticationHeader().delete(`${basePath}/${id}`);
}

// Function to import services
export function importDrug(id, data, config) {
  return api
    .addAuthenticationHeader()
    .post(`${basePath}/import?branchUuid=${id}`, data, {
      ...config,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
}
