import ApiService from "@/service/ApiService";

/**
 * Life Insurance backend (Spring Boot, OpenAPI at <host>/api/life/v3/api-docs).
 *
 * In dev the call goes through the Vite proxy (`/api/life` → VITE_LIFE_API_HOST, see
 * vite.config.ts) so the browser doesn't hit CORS; in other builds set v_API_LIFE_URI
 * to the full base URL.
 *
 * The api/*.js files in this folder are generated one-to-one from that OpenAPI document
 * (function name = operationId). Regenerate them rather than hand-editing when the
 * backend changes; see docs/life-insurance/03-backend-api-inventory.md.
 */
export const lifeApiBase = import.meta.env.v_API_LIFE_URI || "/api/life";

const service = new ApiService(lifeApiBase);

/** Authenticated client: every Life call sends the signed-in user's bearer token. */
export function lifeApi() {
  return service.addAuthenticationHeader();
}
