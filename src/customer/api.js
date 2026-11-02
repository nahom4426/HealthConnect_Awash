import axios from 'axios';
import { getToken, clearSession } from '@/customer/session';

// Same origin by default: the dev server and the production web server both forward /api to the
// gateway. Set VITE_CUSTOMER_API_HOST only when the API lives on another host.
const host = import.meta.env.VITE_CUSTOMER_API_HOST || '';
const authBase = `${host}/api/payer/auth/users`;
const motorBase = `${host}/api/payer/motor/digital-channel`;

function client(baseURL = motorBase) {
  const c = axios.create({ baseURL });
  c.interceptors.request.use((cfg) => {
    const token = getToken();
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
  });
  // An expired or revoked session: back to the sign-in page, once
  c.interceptors.response.use((r) => r, (e) => {
    if (e?.response?.status === 401 && getToken()) {
      clearSession();
      if (!location.pathname.startsWith('/login')) location.assign('/login?expired=1');
    }
    return Promise.reject(e);
  });
  return c;
}

/** One readable sentence out of the backend's problem body, or a fallback. */
export function describeError(e, fallback = 'Something went wrong. Please try again.') {
  const d = e?.response?.data;
  if (!e?.response) return 'We could not reach the server. Check your connection and try again.';
  const fields = Array.isArray(d?.fieldErrors) ? d.fieldErrors.map((f) => f.message).filter(Boolean) : [];
  if (fields.length) return fields.join(' ');
  return d?.detail || d?.message || d?.title || fallback;
}

/** Field errors keyed by field path, for highlighting inputs. */
export function fieldErrorMap(e) {
  const out = {};
  for (const f of e?.response?.data?.fieldErrors || []) if (f?.field) out[f.field] = f.message;
  return out;
}

/** Username is the email address or the mobile number. Returns the sign-in response body. */
export async function signIn(userName, password) {
  const { data } = await axios.post(`${authBase}/signIn`, { userName: userName.trim(), password });
  return data?.token ? data : (data?.data ?? data);
}

/**
 * The customer's vehicles with their policy, as the mobile app reads them (GET cars/clientCars).
 * Only the active ones, with a policy number, can be claimed against.
 */
export async function listMyPolicies(insuredUuid) {
  const { data } = await client().get('/cars/clientCars', { params: { insuredUuid } });
  const rows = Array.isArray(data?.clientCars) ? data.clientCars : (Array.isArray(data) ? data : []);
  return rows.filter((c) => c.policyNumber && String(c.status).toUpperCase() === 'ACTIVE');
}

/**
 * Looks one policy up. A policy that is not the caller's answers 403, and an unknown one comes back
 * with valid=false: a customer can only ever file against a policy that really is theirs.
 */
export async function verifyPolicy(policyNumber) {
  const { data } = await client().get('/policies/validate', {
    params: { policyNumber: policyNumber.trim(), productModule: 'motor' },
  });
  return data;
}

export async function createClaim(payload) {
  const { data } = await client().post('/claims', payload);
  return data;
}

export async function listMyClaims(userUuid) {
  const { data } = await client().get('/claims', { params: { insuredUuid: userUuid } });
  return Array.isArray(data) ? data : [];
}

export async function getClaim(claimUuid) {
  const { data } = await client().get(`/claims/${claimUuid}`);
  return data;
}

export async function getWorkflow() {
  const { data } = await client().get('/claims/workflow');
  return data;
}

export async function uploadClaimDocument(claimUuid, documentType, file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await client().post(`/claims/${claimUuid}/documents`, form, { params: { documentType } });
  return data;
}

/** Bytes of one claim document as a blob: URL (for photo previews); null when it cannot be read. */
export async function claimDocumentUrl(claimUuid, documentUuid) {
  try {
    const { data } = await client().get(`/claims/${claimUuid}/documents/${documentUuid}`, { responseType: 'blob' });
    return data && data.size ? URL.createObjectURL(data) : null;
  } catch (e) {
    return null;
  }
}
