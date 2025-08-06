import ApiService from "@/service/ApiService";
import { getQueryFormObject } from "@/utils/utils.js";

const api = new ApiService();
const basePath = "/claimconnect/eligible-service";

export function getAllServices(providerUuid, query = {}) {
  return api
    .addAuthenticationHeader()
    .get(`${basePath}/contract/${providerUuid}`, {
      params: query,
    });
}

// Function to get a service by ID
export function getServiceByid(id) {
  return api.addAuthenticationHeader().get(`${basePath}/${id}`);
}

// Function to create a new service
export function createService(id, data) {
  return api.addAuthenticationHeader().post(`${basePath}/add/${id}`, data);
}

// Function to update a service
export async function updateService(uuid, formData) {
  try {
    const response = await api.put(`${basePath}/${uuid}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error?.response?.data?.message || error.message || "Unknown error",
    };
  }
}

// Function to delete a service
export function removeService(id) {
  return api.addAuthenticationHeader().delete(`${basePath}/${id}`);
}

// Function to import services
export function importServices(id = {}, data, config) {
  const qr = getQueryFormObject(id);
  return api.addAuthenticationHeader().post(`${basePath}/import-eligible-services${qr}`, data, {
    ...config,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

// Function to download a service template
export function downloadServiceTemplate() {
  return api.addAuthenticationHeader().get(`${basePath}/template`, {
    responseType: "blob",
  });
}
