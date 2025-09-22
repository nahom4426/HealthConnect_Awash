import ApiService from "@/service/ApiService";
import ApiServiceProvider from "@/service/ApiServiceProvider";
import { getQueryFormObject } from "@/utils/utils.js";

const api = new ApiService();
const api1 =new ApiServiceProvider();
const basePath = "/claimconnect/eligible-service";

export function getAllServices(providerUuid, query = {}) {
  return api
    .addAuthenticationHeader()
    .get(`${basePath}/contract/${providerUuid}`, {
      params: query,
    });
}
export const getServiceCategories = async (providerUuid) => {
  try {
    const response = await api1
      .addAuthenticationHeader()
      .get(`/healthConnectProvider/service/${providerUuid}/service-categories`);
    return response.data;
  } catch (error) {
    console.error('Error fetching service categories:', error);
    throw error;
  }
};
export const exportServicesByCategories = async (providerUuid, categories, providerName) => {
  try {
    const response = await api1
      .addAuthenticationHeader()
      .post(
        `/healthConnectProvider/service/${providerUuid}/services/export`,
        { categories },
        { responseType: 'blob' }
      );

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Sanitize provider name for filename
    const sanitizedName = (providerName || 'services')
      .replace(/[^a-z0-9]/gi, '_')  // Replace special chars with underscore
      .toLowerCase();
    
    const filename = `services_${sanitizedName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      link.remove();
      window.URL.revokeObjectURL(url);
    }, 100);

    return true;
  } catch (error) {
    console.error('Export error:', error);
    toasted(false, "Failed to export services", error.message || 'Export failed');
    return false;
  }
};

// Function to get a service by ID
export function getServiceByid(id) {
  return api.addAuthenticationHeader().get(`${basePath}/${id}`);
}

// Function to create a new service
export function createService(id, data) {
  return api.addAuthenticationHeader().post(`${basePath}/add/${id}`, data);
}

// Function to update a service
export function updateService(payerProviderContractUuid, data) {
  return api.addAuthenticationHeader().put(`${basePath}/edit-eligible-services?payerProviderContractUuid=${payerProviderContractUuid}`, data);
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
