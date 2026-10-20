import ApiService from "@/service/ApiService";

const api = new ApiService();

// Provider services available within a benefit package (eligibility), searchable
export function searchPackageServices(packageUuid, { payerProviderContractUuid, search = "", page = 1, limit = 25 } = {}) {
  return api.addAuthenticationHeader().get(`/claimconnect/package/packageServices/${packageUuid}`, {
    params: { payerProviderContractUuid, search: search || undefined, page, limit },
  });
}

// Services on a provider's contract, searchable by name or code
// (payer-provider-contract/provider/lists only returns the contracts themselves)
export function searchContractServices(payerProviderContractUuid, search, { page = 1, limit = 50 } = {}) {
  return api.addAuthenticationHeader().get(`/claimconnect/eligible-service/contract/${payerProviderContractUuid}`, {
    params: { search: search || undefined, page, limit },
  });
}

// Make one contract service eligible under a benefit package
export function addServiceToPackage(packageUuid, eligibleServiceUuid) {
  return api
    .addAuthenticationHeader()
    .post(`/claimconnect/package/${packageUuid}/eligible-services/${eligibleServiceUuid}`);
}

// Typeahead search of active drugs by name or code (min 2 characters)
export function searchDrugLibrary(q, { category, limit = 20 } = {}) {
  return api.addAuthenticationHeader().get(`/claimconnect/drugLibrary/search`, {
    params: { q, category: category || undefined, limit },
  });
}
