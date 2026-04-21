import ApiService from "@/service/ApiService";

const api = new ApiService();

const ratePath = '/claimconnect/benefitRange'
const path = '/claimconnect/quotation'

// Fetch rate for a package/plan/familySize combination
// Adjust the path if your backend uses a different endpoint
export function getPackageRate(query: {
  packageUuid: string;
  planType: string | number;
  familySize: number;
})
 {
  const { packageUuid, planType, familySize } = query;
  const url = `${ratePath}/getRate/${packageUuid}`;
  return api.addAuthenticationHeader().get(url, {
    params: { planType, familySize },
  });
}

// Save quotation as draft
export function saveQuotationDraft(data: any) {
  return api.addAuthenticationHeader().post(`${path}`, data);
}

// Get quotation by id (draft or issued)
export function getQuotationById(id: string) {
  return api.addAuthenticationHeader().get(`${path}/${id}`);
}

export function getQuotationsByStatus(params: { page: number; limit: number; status?: string; search?: string }) {
  return api.addAuthenticationHeader().get(`${path}`, { params });
}

// Issue quotation
export function issueQuotation(data: any) {
  return api.addAuthenticationHeader().post(`${path}/issue`, data);
}
export function acceptQuotation(quotationUuid: string, data: any) {
  return api.addAuthenticationHeader().put(`${path}/accept/${quotationUuid}`, data);
}

export function savedIssueQuotation(quotationUuid: string, data: any) {
  return api.addAuthenticationHeader().put(`${path}/issueSavedQuotation/${quotationUuid}`, data);
}
export function issuePremiumAdvice(quotationUuid: string, data: any) {
  return api.addAuthenticationHeader().put(`${path}/issue-premium-advice/${quotationUuid}`, data);
}
export function payerInstitutionContract(quotationUuid: string, data: any) {
  return api.addAuthenticationHeader().post(`/claimconnect/payer-institution-contract`, data);
}
export function issuedPolicyQuotation(policyUuid: string, data: any) {
  return api.addAuthenticationHeader().get(`${path}/policyQuotations/${policyUuid}`, data);
}
export function saveSavedQuotation(quotationUuid: string, data: any) {
  return api.addAuthenticationHeader().put(`${path}/${quotationUuid}`, data);
}
