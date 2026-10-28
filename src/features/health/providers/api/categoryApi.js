import ApiService from "@/service/ApiService";

const api = new ApiService();
export function getAllServiceCategories(contractUuid, query = {}) {
  return api
    .addAuthenticationHeader()
    .get(`/claimconnect/eligible-service/serviceCategory/${contractUuid}`, {
      params: query,
    });
}

// Fetch categories that are marked as NOT eligible for a given contract + policy
export function getNotEligibleCategories(contractUuid, policyUuid) {
  return api
    .addAuthenticationHeader()
    .get(
      `/claimconnect/notEligibleCategory/getNotEligibleCategories/${contractUuid}`,
      {
        params: { policyUuid },
      }
    );
}

export function addNotEligibleCategory({ contractUuid, policyUuid, categoryUuid }) {
  return api
    .addAuthenticationHeader()
    .post(
      `/claimconnect/notEligibleCategory/addNotEligibleCategory`,
      null,
      {
        params: {
          contractUuid,
          policyUUid: policyUuid,
          policyUuid: policyUuid,
          categoryUuid,
        },
      }
    );
}
export function removeNotEligibleCategory(notEligibleCategoryUuid) {
  return api
    .addAuthenticationHeader()
    .put(
      `/claimconnect/notEligibleCategory/removeNotEligibleCategory/${notEligibleCategoryUuid}`,
      null
    );
}
