import { toasted } from '@/utils/utils';
import ApiService from '@/service/ApiService';

const api = new ApiService();
const basePath = 'claimconnect/payer-provider-contract';

/**
 * Export services by categories for a given provider (Excel download).
 */
export const exportServicesByCategories = async (providerUuid, categories, providerName) => {
  try {
    const response = await api
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
/**
 * Get service categories for a provider
 */
export const getServiceCategories = async (providerUuid) => {
  try {
    const response = await api
      .addAuthenticationHeader()
      .get(`/healthConnectProvider/service/${providerUuid}/service-categories`);
    return response.data;
  } catch (error) {
    console.error('Error fetching service categories:', error);
    throw error;
  }
};
/**
 * Create a new payer-provider contract.
 */
export const createNewContract = (data) => {
  return api.addAuthenticationHeader().post(`${basePath}`, data);
};

/**
 * Get payer-provider contract by ID (with userType=payer).
 */
export const getPayerContractById = (id) => {
  return api.addAuthenticationHeader().get(`${basePath}/${id}`, {
    params: {
      userType: 'payer',
    },
  });
};
export const getActiveContracts = (page = 1, limit = 25) => {
  return api.addAuthenticationHeader().get(`${basePath}/provider/lists`, {
    params: {
      page,
      limit,
      status: 'ACTIVE'
    }
  });
};

export const getPendingContracts = (page = 1, limit = 25) => {
  return api.addAuthenticationHeader().get(`${basePath}/provider/lists`, {
    params: {
      page,
      limit,
      status: 'PENDING'
    }
  });
};
export const getSuspendedContracts = (page = 1, limit = 25) => {
  return api.addAuthenticationHeader().get(`${basePath}/provider/lists`, {
    params: {
      page,
      limit,
      status: 'SUSPENDED'
    }
  });
};


/**
 * Update existing payer-provider contract.
 */
export const updatePayerContract = (id, data) => {
  return api.addAuthenticationHeader().put(`${basePath}/${id}`, data);
};
