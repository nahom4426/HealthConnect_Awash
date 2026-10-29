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
    baseURL: pcBase,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

function apiError(e) {
  return e?.response?.data?.detail || e?.response?.data?.message || e.message || 'Request failed';
}

function listParams(query = {}) {
  const params = {
    page: query.page || 1,
    limit: query.limit || 25,
    sortBy: query.sortBy || 'createdAt',
    sortDir: query.sortDir || 'desc',
  };
  if (query.productClass) params.productClass = query.productClass;
  if (query.search) params.search = query.search;
  if (query.status) params.status = query.status;
  if (query.proposalUuid) params.proposalUuid = query.proposalUuid;
  if (query.quotationUuid) params.quotationUuid = query.quotationUuid;
  if (query.policyUuid) params.policyUuid = query.policyUuid;
  return params;
}

export async function fetchPublishedProduct(productClass = 'FIRE') {
  const { data } = await getClient().get(`/products/published/${productClass}`);
  return data;
}

export async function fetchPublishedFireProduct() {
  return fetchPublishedProduct('FIRE');
}

export async function updatePublishedFireSchema(schemaJson) {
  return updatePublishedSchema('FIRE', schemaJson);
}

export async function updatePublishedSchema(productClass, schemaJson) {
  const payload = typeof schemaJson === 'string' ? schemaJson : JSON.stringify(schemaJson);
  const { data } = await getClient().put(`/products/published/${productClass}/schema`, { schemaJson: payload });
  return data;
}

export async function fetchProducts(query = {}) {
  const { data } = await getClient().get('/products', { params: listParams(query) });
  return data;
}

export async function createProduct(payload) {
  const { data } = await getClient().post('/products', payload);
  return data;
}

export async function publishProduct(productUuid) {
  const { data } = await getClient().post(`/products/${productUuid}/publish`);
  return data;
}

export async function fetchProposals(query = {}) {
  const { data } = await getClient().get('/proposals', { params: listParams(query) });
  return data;
}

export async function fetchProposal(proposalUuid) {
  const { data } = await getClient().get(`/proposals/${proposalUuid}`);
  return data;
}

export async function createProposal(payload) {
  const { data } = await getClient().post('/proposals', payload);
  return data;
}

export async function updateProposal(proposalUuid, payload) {
  const { data } = await getClient().put(`/proposals/${proposalUuid}`, payload);
  return data;
}

export async function fetchProduct(productUuid) {
  const { data } = await getClient().get(`/products/${productUuid}`);
  return data;
}

export async function submitProposal(proposalUuid) {
  const { data } = await getClient().post(`/proposals/${proposalUuid}/submit`);
  return data;
}

export async function updatePremises(proposalUuid, premises) {
  const { data } = await getClient().put(`/proposals/${proposalUuid}/premises`, premises);
  return data;
}

export async function replacePerils(proposalUuid, perilCodes) {
  const { data } = await getClient().put(`/proposals/${proposalUuid}/perils`, { perilCodes });
  return data;
}

export async function addRiskItem(proposalUuid, item) {
  const { data } = await getClient().post(`/proposals/${proposalUuid}/risk-items`, item);
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

export async function previewQuote(proposalUuid) {
  const { data } = await getClient().post(`/quotations/preview/${proposalUuid}`);
  return data;
}

export async function issueQuote(proposalUuid) {
  const { data } = await getClient().post('/quotations', { proposalUuid });
  return data;
}

export async function acceptQuote(quotationUuid) {
  const { data } = await getClient().post(`/quotations/${quotationUuid}/accept`);
  return data;
}

export async function declineQuote(quotationUuid) {
  const { data } = await getClient().post(`/quotations/${quotationUuid}/decline`);
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

export async function issuePolicy(quotationUuid) {
  const { data } = await getClient().post('/policies', { quotationUuid });
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

export async function updateClaim(claimUuid, payload) {
  const { data } = await getClient().put(`/claims/${claimUuid}`, payload);
  return data;
}

export async function submitClaim(claimUuid) {
  const { data } = await getClient().post(`/claims/${claimUuid}/submit`);
  return data;
}

export async function assessClaim(claimUuid, payload) {
  const { data } = await getClient().post(`/claims/${claimUuid}/assess`, payload);
  return data;
}

export async function approveClaim(claimUuid) {
  const { data } = await getClient().post(`/claims/${claimUuid}/approve`);
  return data;
}

export async function rejectClaim(claimUuid, reason) {
  const { data } = await getClient().post(`/claims/${claimUuid}/reject`, { reason });
  return data;
}

export async function payClaim(claimUuid) {
  const { data } = await getClient().post(`/claims/${claimUuid}/pay`);
  return data;
}

export { apiError };
