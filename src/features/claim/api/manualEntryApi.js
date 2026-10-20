import ApiService from "@/service/ApiService";

const api = new ApiService();

// Provider services available within a benefit package (eligibility), searchable
export function searchPackageServices(packageUuid, { payerProviderContractUuid, search = "", page = 1, limit = 25 } = {}) {
  return api.addAuthenticationHeader().get(`/claimconnect/package/packageServices/${packageUuid}`, {
    params: { payerProviderContractUuid, search: search || undefined, page, limit },
  });
}

// Provider contract services search (paginated list of provider contracts with their services)
export function searchProviderContractServices(search, { page = 1, size = 25 } = {}) {
  return api.addAuthenticationHeader().get(`/claimconnect/payer-provider-contract/provider/lists`, {
    params: { search: search || undefined, page, size, direction: "desc", sort: "id", status: "ACTIVE" },
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
