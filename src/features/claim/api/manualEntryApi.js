import ApiService from "@/service/ApiService";

const api = new ApiService();

// Provider services available within a benefit package (eligibility), searchable
export function searchPackageServices(packageUuid, { payerProviderContractUuid, search = "", page = 1, limit = 25 } = {}) {
  return api.addAuthenticationHeader().get(`/claimconnect/package/packageServices/${packageUuid}`, {
    params: { payerProviderContractUuid, search: search || undefined, page, limit },
  });
}

// Typeahead search of active drugs by name or code (min 2 characters)
export function searchDrugLibrary(q, { category, limit = 20 } = {}) {
  return api.addAuthenticationHeader().get(`/claimconnect/drugLibrary/search`, {
    params: { q, category: category || undefined, limit },
  });
}
