import ApiService from "@/service/ApiService";

const api = new ApiService();

const ratePath = "/claimconnect/benefitRange";
const path = "/claimconnect/quotation";
const paymentPath = "/claimconnect";

// Fetch rate for a package/plan/familySize combination
export function getPackageRate(query) {
  const { packageUuid, planType, familySize } = query;
  const url = `${ratePath}/getRate/${packageUuid}`;

  return api.addAuthenticationHeader().get(url, {
    params: { planType, familySize },
  });
}


// Save quotation as draft
export function saveQuotationDraft(data) {
  return api.addAuthenticationHeader().post(`${path}`, data);
}

// Get quotation by id (draft or issued)
export function getQuotationById(id) {
  return api.addAuthenticationHeader().get(`${path}/${id}`);
}

// Get quotations with optional status & search
export function getQuotationsByStatus(params) {
  return api.addAuthenticationHeader().get(`${path}`, { params });
}

// Issue quotation
export function issueQuotation(data) {
  return api.addAuthenticationHeader().post(`${path}/issue`, data);
}

// Accept quotation
export function acceptQuotation(quotationUuid, data) {
  return api
    .addAuthenticationHeader()
    .put(`${path}/accept/${quotationUuid}`, data);
}

// Issue saved quotation
export function savedIssueQuotation(quotationUuid, data) {
  return api
    .addAuthenticationHeader()
    .put(`${path}/issueSavedQuotation/${quotationUuid}`, data);
}

// Issue premium advice
export function issuePremiumAdvice(quotationUuid, data) {
  return api
    .addAuthenticationHeader()
    .put(`${path}/issue-premium-advice/${quotationUuid}`, data);
}

// Create payer institution contract
export function payerInstitutionContract(data) {
  return api
    .addAuthenticationHeader()
    .post(`/claimconnect/payer-institution-contract`, data);
}

// Get issued policy quotation
export function issuedPolicyQuotation(policyUuid, config) {
  return api
    .addAuthenticationHeader()
    .get(`${path}/policyQuotations/${policyUuid}`, config);
}

// Update saved quotation
export function saveSavedQuotation(quotationUuid, data) {
  return api
    .addAuthenticationHeader()
    .put(`${path}/${quotationUuid}`, data);
}

// Stage exclusion - POST array of exclusion strings for a policy (policyUuid)
export function stageExclusion(policyUuid, exclusions) {
  return api
    .addAuthenticationHeader()
    .post(`${path}/policy/${policyUuid}/stage-exclusion`, exclusions);
}

// Get active insured persons by contract UUID
export function getActiveInsuredByContract(payerInstitutionContractUuid, params = {}) {
  return api
    .addAuthenticationHeader()
    .get(`/claimconnect/insuredperson/active/search/${payerInstitutionContractUuid}`, { params });
}

// View quotation attachment
export function viewQuotationAttachment(fileName) {
  return api
    .addAuthenticationHeader()
    .get(`${paymentPath}/files/download`, {
      params: {
        fileName,
        action: 'view',
      },
      responseType: "blob",
    });
}

// Download quotation attachment
export function downloadQuotationAttachment(fileName) {
  return api
    .addAuthenticationHeader()
    .get(`${paymentPath}/files/download`, {
      params: {
        fileName,
      },
      responseType: "blob",
    });
}

// Create inclusion/exclusion quotation
export function createInclusionExclusionQuotation(data) {
  return api
    .addAuthenticationHeader()
    .post(`${path}`, data);
}
// In your quotationApi.ts file, add logging to createInclusionExclusionQuotation:
