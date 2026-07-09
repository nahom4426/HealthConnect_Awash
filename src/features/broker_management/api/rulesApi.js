import ApiService from "@/service/ApiService";

const api = new ApiService();
const path = "/claimconnect";

// Create commission rule
export function createRule(data) {
  return api
    .addAuthenticationHeader()
    .post(`${path}/stakeholder/commission/rule`, data);
}

// Get commission rule
export function getRule(ruleUuid) {
  return api
    .addAuthenticationHeader()
    .get(`${path}/stakeholder/commission/rule/${ruleUuid}`);
}

// Update commission rule
export function updateRule(ruleUuid, data) {
  return api
    .addAuthenticationHeader()
    .put(`${path}/stakeholder/commission/rule/${ruleUuid}`, data);
}

// Delete commission rule
export function deleteRule(ruleUuid) {
  return api
    .addAuthenticationHeader()
    .delete(`${path}/stakeholder/commission/rule/${ruleUuid}`);
}

// Activate rule
export function activateRule(ruleUuid) {
  return api
    .addAuthenticationHeader()
    .put(`${path}/stakeholder/commission/rule/${ruleUuid}/activate`);
}

// Deactivate rule
export function deactivateRule(ruleUuid) {
  return api
    .addAuthenticationHeader()
    .put(`${path}/stakeholder/commission/rule/${ruleUuid}/deactivate`);
}

// List all rules
export function getRules(params = { stakeholderType: 'BROKER', policyType: 'GENERAL', status: 'ACTIVE' }) {
  return api
    .addAuthenticationHeader()
    .get(`${path}/stakeholder/commission/rules`, { params });
}

// Calculate commission
export function calculateCommission(data) {
  return api
    .addAuthenticationHeader()
    .post(`${path}/stakeholder/commission/calculate`, data);
}