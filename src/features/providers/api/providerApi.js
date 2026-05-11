import ApiService from "@/service/ApiService";

const api = new ApiService();
const path = '/claimconnect/provider';

export function getProviders(query = {}) {
  return api.addAuthenticationHeader().get(`${path}/list/fetchFromProvider`, {
    params: query,
  });
}

export function getMappedActiveProviders(payerInstitutionContractUuid ,query = {}) {
  return api.addAuthenticationHeader().get(`/claimconnect/map_contract/providers-for-mapping-contracts?payerInstitutionContractUuid=${payerInstitutionContractUuid}`, {
    params: query,
  });
}
export function getAlreadyMappedActiveProviders(payerInstitutionContractUuid ,query = {}) {
  return api.addAuthenticationHeader().get(`/claimconnect/map_contract/providers-mapped-to-contracts/${payerInstitutionContractUuid}`, {
    params: query,
  });
}

/**
 * Remove a mapped contract
 * @param {string} mapContractUuid - The UUID of the map contract to remove
 * @returns {Promise} Response from delete operation
 */
export function removeMapContract(mapContractUuid) {
  return api.addAuthenticationHeader().delete(`/claimconnect/map_contract/${mapContractUuid}`);
}
export function getActiveProviders(query = {}) {
  return api.addAuthenticationHeader().get(`${path}/list`, {
    params: query,
  });
}
export function getActiveProvidersForContract(query = {}) {
  return api.addAuthenticationHeader().get(`${path}/toSignContract`, {
    params: query,
  });
}
export function getInactiveProviders(query = {}) {
  return api.addAuthenticationHeader().get(`${path}/list`, {
    params: query,
  });
}
export function createProvider(data) {
  return api.addAuthenticationHeader().post(`${path}`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
export function changeProviderStatus(providerId, status) {
  return api.addAuthenticationHeader().put(`${path}/updateStatus/${providerId}`, null, {
    params: { status }
  });
}

// ✅ Safer and matches backend behavior
export async function updateProvider(data) {
  try {
    const response = await api.addAuthenticationHeader().put(`${path}/${data.providerUuid}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return {
      success: response.status >= 200 && response.status < 300,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    console.error('Update provider error:', error);
    return {
      success: false,
      error: error?.response?.data?.message || error.message || 'Unknown error',
      status: error?.response?.status
    };
  }
}

/**
 * Map provider contracts to institution contracts
 * Return AsyncResponse from ApiService.post so callers get { success, data, error }
 */
export const mapContracts = (contractMappings) => {
  return api
    .addAuthenticationHeader()
    .post('/claimconnect/map_contract', contractMappings);
};
export const deleteMapContract = (mapContractUuid) => {
  return api
    .addAuthenticationHeader()
    .delete(`/claimconnect/map_contract/${mapContractUuid}`);
};
