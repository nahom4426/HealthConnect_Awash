import ApiService from '@/service/ApiService';

// ApiService's axios instances carry the bearer token and the expired-token refresh. We call them
// directly (not through ApiService.get/post) so errors keep the backend's field and type, which
// responseHandler flattens into one toasted string.
export const pcHttp = new ApiService('/api/payer/property-casualty').api;
export const authHttp = new ApiService(import.meta.env.v_API_AUTH_URI).api;

/**
 * One error shape for both backends.
 * AuthService: { status, error, message, path }
 * Property-casualty: { type, title, status, detail, properties: { field }, fieldErrors: [{ field, message }] }
 */
export class ApiError extends Error {
  constructor({ status, type, message, field, fieldErrors }) {
    super(message);
    this.status = status;
    this.type = type || '';
    this.field = field || '';
    this.fieldErrors = fieldErrors || {};
  }

  /** Message for one input, from fieldErrors or the single highlighted field. */
  for(name) {
    if (this.fieldErrors[name]) return this.fieldErrors[name];
    return this.field === name ? this.message : '';
  }
}

export function toApiError(e) {
  if (e instanceof ApiError) return e;
  let data = e?.response?.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      data = { message: data };
    }
  }
  const fieldErrors = {};
  for (const fe of Array.isArray(data?.fieldErrors) ? data.fieldErrors : []) {
    if (fe?.field) fieldErrors[fe.field] = fe.message || 'Invalid value';
  }
  const listed = Object.entries(fieldErrors).map(([field, msg]) => `${field}: ${msg}`).join('; ');
  const message = data?.detail || data?.message || listed || data?.title || data?.error || e?.message || 'Request failed';
  return new ApiError({
    status: e?.response?.status ?? 0,
    type: data?.type,
    message,
    field: data?.properties?.field,
    fieldErrors,
  });
}

/** Await an axios call and return its body, throwing ApiError on failure. */
export async function call(request) {
  try {
    const { data } = await request;
    return data;
  } catch (e) {
    throw toApiError(e);
  }
}
