import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const pcBase = '/api/payer/property-casualty';

function getToken() {
  const auth = useAuthStore();
  const fromStore = auth.auth?.token || auth.auth?.user?.token;
  if (fromStore) return fromStore;
  try {
    const stored = JSON.parse(localStorage.getItem('userDetail') || '{}');
    return stored.token || stored.user?.token || null;
  } catch {
    return null;
  }
}

function getClient() {
  const token = getToken();
  return axios.create({
    baseURL: `${pcBase}/liability`,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export function apiError(e) {
  const body = e?.response?.data;
  if (Array.isArray(body?.fieldErrors) && body.fieldErrors.length) {
    return body.fieldErrors.map((f) => f.message || f.defaultMessage).filter(Boolean).join(' ')
      || body.message
      || 'Validation failed';
  }
  return body?.detail || body?.message || e.message || 'Request failed';
}

export function fieldErrors(e) {
  const rows = e?.response?.data?.fieldErrors;
  if (!Array.isArray(rows)) return {};
  return Object.fromEntries(rows.map((f) => [f.field, f.message || f.defaultMessage || 'Invalid']));
}

function listParams(query = {}) {
  const params = {};
  if (query.page != null) params.page = query.page;
  if (query.size != null) params.size = query.size;
  if (query.status) params.status = query.status;
  if (query.search) params.search = query.search;
  if (query.line) params.line = query.line;
  return params;
}

export async function fetchDashboardSummary() {
  const { data } = await getClient().get('/dashboard/summary');
  return data;
}

export async function fetchProducts(query = {}) {
  const { data } = await getClient().get('/products', { params: listParams(query) });
  return data;
}

export async function fetchProduct(productUuid) {
  const { data } = await getClient().get(`/products/${productUuid}`);
  return data;
}

export async function previewPremium(productUuid, payload) {
  const { data } = await getClient().post(`/products/${productUuid}/premium`, payload);
  return data;
}

export async function fetchQuotations(query = {}) {
  const { data } = await getClient().get('/quotations', { params: listParams(query) });
  return data;
}

export async function fetchQuotation(quotationUuid) {
  const { data } = await getClient().get(`/quotations/${quotationUuid}`);
  return data;
}

export async function createQuotation(payload) {
  const { data } = await getClient().post('/quotations', payload);
  return data;
}

export async function updateQuotation(quotationUuid, payload) {
  const { data } = await getClient().put(`/quotations/${quotationUuid}`, payload);
  return data;
}

export async function submitQuotation(quotationUuid, note = '') {
  const { data } = await getClient().put(`/quotations/${quotationUuid}/submit`, { note });
  return data;
}

export async function underwriteQuotation(quotationUuid, payload) {
  const { data } = await getClient().put(`/quotations/${quotationUuid}/underwrite`, payload);
  return data;
}

export async function acceptQuotation(quotationUuid, note = '') {
  const { data } = await getClient().put(`/quotations/${quotationUuid}/accept`, { note });
  return data;
}

export async function issuePolicy(quotationUuid, payload) {
  const { data } = await getClient().put(`/quotations/${quotationUuid}/issue-policy`, payload);
  return data;
}

export async function fetchPolicies(query = {}) {
  const { data } = await getClient().get('/policies', { params: listParams(query) });
  return data;
}

export async function fetchPolicy(policyUuid) {
  const { data } = await getClient().get(`/policies/${policyUuid}`);
  return data;
}

export async function validatePolicy(policyNumber, incidentDate) {
  const { data } = await getClient().get('/policies/validate', { params: { policyNumber, incidentDate } });
  return data;
}

export async function fetchClaims(query = {}) {
  const { data } = await getClient().get('/claims', { params: listParams(query) });
  return data;
}

export async function fetchClaim(claimUuid) {
  const { data } = await getClient().get(`/claims/${claimUuid}`);
  return data;
}

export async function createClaim(payload) {
  const { data } = await getClient().post('/claims', payload);
  return data;
}

export async function registerClaim(claimUuid, payload) {
  const { data } = await getClient().put(`/claims/${claimUuid}/register`, payload);
  return data;
}

export async function assignClaim(claimUuid, payload) {
  const { data } = await getClient().put(`/claims/${claimUuid}/assign`, payload);
  return data;
}

export async function assessClaim(claimUuid, payload) {
  const { data } = await getClient().put(`/claims/${claimUuid}/assess`, payload);
  return data;
}

export async function approveClaim(claimUuid, payload) {
  const { data } = await getClient().put(`/claims/${claimUuid}/approve`, payload);
  return data;
}

export async function settleClaim(claimUuid, payload) {
  const { data } = await getClient().put(`/claims/${claimUuid}/settle`, payload);
  return data;
}

export async function rejectClaim(claimUuid, payload) {
  const { data } = await getClient().put(`/claims/${claimUuid}/reject`, payload);
  return data;
}
