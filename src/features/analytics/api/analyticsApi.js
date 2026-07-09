import ApiService from "@/service/ApiService";

const api = new ApiService();

/**
 * Get Provider Credit Services Report
 * @param {Object} query - Query parameters (institutionUuid, providerUuid, fromDate, toDate)
 */
export function getProviderCreditServicesReport(query = {}) {
  return api.addAuthenticationHeader().get('/claimconnect/reports/provider-credit-services', {
    params: query,
  }).then(response => {
    return response.data || response;
  });
}
