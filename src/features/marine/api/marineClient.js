import ApiService from "@/service/ApiService";
import { useToast } from "vue-toastification";
import { marineMockEnabled } from "./mockMode";
import { rememberCorrelationId } from "../utils/errorReporting";

/**
 * Marine & Cargo backend client.
 *
 * One base path: `/api/marine/v1`. The API gateway rewrites that onto the property-casualty
 * service at `/api/payer/property-casualty/marine/v1`. Do not call the service context path from
 * this client. `v_API_MARINE_URI` overrides the base only when a deployment serves that same
 * gateway prefix under another host; leave it unset to use `/api/marine/v1`.
 *
 * Set VITE_MARINE_MOCK=false to send calls to that path. In development the Vite `/api` proxy
 * forwards it to the gateway. While the mock is on, the in-browser backend in ../mock answers.
 *
 * Calls never throw. They resolve to { ok: true, data, headers } or { ok: false, error: ApiError },
 * the shape plan section 1 ("Error handling") gives every screen.
 */
export const marineApiBase = import.meta.env.v_API_MARINE_URI || "/api/marine/v1";

export { marineMockEnabled };

// ApiService's axios instance already adds the bearer token and refreshes an expired one
const http = new ApiService(marineApiBase).api;
http.defaults.validateStatus = (s) => s >= 200 && s < 300;
if (marineMockEnabled) {
  // Loaded on first call so the mock never ships in a build that doesn't use it
  http.defaults.adapter = async (config) => (await import("../mock/server")).handleRequest(config);
  // The mock has no tokens to read, so it learns who is calling from these headers
  http.interceptors.request.use(async (config) => {
    const { useMarineRoles, mockIdentity } = await import("../composables/useCan");
    const roles = useMarineRoles().value;
    const me = mockIdentity(roles);
    config.headers["x-dev-roles"] = roles.join(",");
    config.headers["x-dev-user"] = encodeURIComponent(me.name);
    if (me.brokerPartyId) config.headers["x-dev-broker-party"] = me.brokerPartyId;
    return config;
  });
}

export class ApiError {
  constructor({ status = 0, code = "", message = "", fields = [], correlationId = "" } = {}) {
    this.status = status;
    this.code = code;
    this.message = message;
    this.fields = fields;
    this.correlationId = correlationId;
  }

  /** { fieldName: message } for mapping a 422 onto form fields. */
  fieldMap() {
    return Object.fromEntries(this.fields.map((f) => [f.field, f.message]));
  }
}

function toApiError(e) {
  if (!e?.response) {
    return new ApiError({ status: 0, code: "NETWORK", message: "The Marine service could not be reached. Check your connection." });
  }
  let body = e.response.data;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = { message: body };
    }
  }
  const status = e.response.status;
  const fields = Array.isArray(body?.fields)
    ? body.fields
    : Array.isArray(body?.fieldErrors)
      ? body.fieldErrors.map((f) => ({ field: f.field, message: f.message || f.defaultMessage }))
      : [];
  return new ApiError({
    status,
    code: body?.code || body?.type || "",
    message: body?.message || body?.detail || defaultMessage(status),
    fields,
    correlationId: body?.correlationId || e.response.headers?.["x-correlation-id"] || "",
  });
}

function defaultMessage(status) {
  if (status === 403) return "You don't have permission for this action.";
  if (status === 404) return "We couldn't find that record.";
  if (status === 409) return "This record changed. Reloaded the latest version.";
  if (status === 422) return "Some fields need attention.";
  if (status === 429) return "Too many requests. Try again in a minute.";
  return "Something went wrong on the server.";
}

export async function request(method, url, { params, data, responseType, headers, onUploadProgress } = {}) {
  try {
    const res = await http.request({ method, url, params, data, responseType, headers, onUploadProgress });
    rememberCorrelationId(res.headers?.["x-correlation-id"]);
    return { ok: true, data: res.data, headers: res.headers };
  } catch (e) {
    const error = toApiError(e);
    rememberCorrelationId(error.correlationId);
    return { ok: false, error };
  }
}

export const get = (url, params, opts) => request("get", url, { params, ...opts });
export const post = (url, data, opts) => request("post", url, { data, ...opts });
export const put = (url, data, opts) => request("put", url, { data, ...opts });
export const del = (url, opts) => request("delete", url, opts);

/**
 * Shows the standard toast for an error (plan section 3, "Standard UI states").
 * 422s are left to the form, which shows them on the fields and in its banner.
 * Pass onRetry to put a Retry button on network and server errors; onStale refetches after a 409.
 */
export function notifyError(error, { onRetry, onStale } = {}) {
  if (!error) return;
  const toast = useToast();
  if (error.status === 422) return;
  if (error.status === 409) {
    toast.warning("This record changed. Reloaded the latest version.");
    onStale?.();
    return;
  }
  if (error.status === 403) {
    toast.error("You don't have permission for this action.");
    return;
  }
  const ref = error.correlationId ? ` (ref ${error.correlationId})` : "";
  const msg = `${error.message}${ref}`;
  if (onRetry && (error.status === 0 || error.status >= 500)) {
    toast.error(`${msg} Click to retry.`, { onClick: onRetry, timeout: 10000 });
  } else {
    toast.error(msg);
  }
}
