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

/**
 * Get all available dynamic reports list
 */
export function getReportsList() {
  return api.addAuthenticationHeader().get('/claimconnect/reports').then(response => {
    return response.data || response;
  });
}

/**
 * Execute a dynamic report by UUID
 * @param {string} reportUuid - The report UUID
 * @param {Object} params - Report parameters (key-value map)
 * @param {number} page - Page number (0-indexed)
 * @param {number} pageSize - Page size
 */
export function executeReport(reportUuid, params = {}, page = 0, pageSize = 20) {
  return api.addAuthenticationHeader().post(
    `/claimconnect/reports/${reportUuid}/execute`,
    { params, page, pageSize }
  ).then(response => {
    return response.data || response;
  });
}
