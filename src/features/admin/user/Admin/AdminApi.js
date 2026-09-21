import ApiService from "@/service/ApiService";

// Must use AuthService base (same as Users), not digital-channel default.
const api = new ApiService(import.meta.env.v_API_AUTH_URI);
const path = "/users";

export function approveUser(id, status = true) {
  return api
    .addAuthenticationHeader()
    .patch(`${path}/approveUser/${id}?approved=${status}`);
}
