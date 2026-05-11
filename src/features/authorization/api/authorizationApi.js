import ApiService from "@/service/ApiService";

const api = new ApiService();
const basePath = "/claimconnect/authorization";

export function getAuthorization(authorizationUuid) {
  return api
    .addAuthenticationHeader()
    .get(`${basePath}/${authorizationUuid}`);
}

export function getAuthorizations(query = {}) {
  return api.addAuthenticationHeader().get(`${basePath}/all`, {
    params: query,
  });
}

export function changeAuthorizationStatus(
  authorizationUuid,
  { status, endDate, activeDays } = {}
) {
  return api.addAuthenticationHeader().put(
    `${basePath}/changeStatus/${authorizationUuid}`,
    {},
    {
      params: { status, endDate, activeDays },
    }
  );
}
