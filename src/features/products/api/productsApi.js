import { call, pcHttp } from './http';

// Always the fixed /api/payer/property-casualty prefix: the per-module gateway route
// (/api/{moduleKey}) only appears ~30 s after a product is created.

/* ── Product definitions (the catalogue) ── */

export function listDefinitions({ includeRetired = false } = {}) {
  return call(pcHttp.get('/product-definitions', { params: { includeRetired } }));
}

export function getDefinition(key) {
  return call(pcHttp.get(`/product-definitions/${encodeURIComponent(key)}`));
}

export function createDefinition(body) {
  return call(pcHttp.post('/product-definitions', body));
}

/**
 * Filing has three cases on PUT: subcategoryKey omitted → unchanged, "" → cleared, "MOTOR" → filed.
 * Pass subcategoryKey (and categoryKey) only when the user changed the filing, or a rename
 * would silently unfile the product.
 */
export function updateDefinition(key, { name, description, sortOrder, subcategoryKey, categoryKey }) {
  const body = { name, description, sortOrder };
  if (subcategoryKey !== undefined) {
    body.subcategoryKey = subcategoryKey;
    if (subcategoryKey && categoryKey) body.categoryKey = categoryKey;
  }
  return call(pcHttp.put(`/product-definitions/${encodeURIComponent(key)}`, body));
}

export function setDefinitionStatus(key, status) {
  return call(pcHttp.patch(`/product-definitions/${encodeURIComponent(key)}/status`, null, { params: { status } }));
}

export function publishDefinitionPrivileges(key) {
  return call(pcHttp.post(`/product-definitions/${encodeURIComponent(key)}/publish-privileges`));
}

/* ── Product versions (form, covers, pricing) ── */

export function listVersions({ productClass, status, page = 1, limit = 25, sortBy = 'createdAt', sortDir = 'desc' } = {}) {
  const params = { page, limit, sortBy, sortDir };
  if (productClass) params.productClass = productClass;
  if (status) params.status = status;
  return call(pcHttp.get('/products', { params }));
}

export function getVersion(productUuid) {
  return call(pcHttp.get(`/products/${productUuid}`));
}

export function getPublishedVersion(productClass) {
  return call(pcHttp.get(`/products/published/${encodeURIComponent(productClass)}`));
}

export function createVersion(body) {
  return call(pcHttp.post('/products', body));
}

export function updateVersion(productUuid, body) {
  return call(pcHttp.put(`/products/${productUuid}`, body));
}

export function testRating(productUuid, body) {
  return call(pcHttp.post(`/products/${productUuid}/rating/test`, body));
}

export function publishVersion(productUuid) {
  return call(pcHttp.post(`/products/${productUuid}/publish`));
}

/** Edits the live form: the backend creates and publishes the next minor version. */
export function updateLiveSchema(productClass, schemaJson) {
  const payload = typeof schemaJson === 'string' ? schemaJson : JSON.stringify(schemaJson);
  return call(pcHttp.put(`/products/published/${encodeURIComponent(productClass)}/schema`, { schemaJson: payload }));
}

/* ── Proposals ── */

function listParams(query = {}) {
  const params = {
    page: query.page || 1,
    limit: query.limit || 25,
    sortBy: query.sortBy || 'createdAt',
    sortDir: query.sortDir || 'desc',
  };
  for (const key of ['productClass', 'status', 'search', 'proposalUuid']) {
    if (query[key]) params[key] = query[key];
  }
  return params;
}

export function listProposals(query) {
  return call(pcHttp.get('/proposals', { params: listParams(query) }));
}

export function getProposal(proposalUuid) {
  return call(pcHttp.get(`/proposals/${proposalUuid}`));
}

export function createProposal(body) {
  return call(pcHttp.post('/proposals', body));
}

export function updateProposal(proposalUuid, body) {
  return call(pcHttp.put(`/proposals/${proposalUuid}`, body));
}

export function setProposalPerils(proposalUuid, perilCodes) {
  return call(pcHttp.put(`/proposals/${proposalUuid}/perils`, { perilCodes }));
}

export function addProposalRiskItem(proposalUuid, item) {
  return call(pcHttp.post(`/proposals/${proposalUuid}/risk-items`, item));
}

export function submitProposal(proposalUuid) {
  return call(pcHttp.post(`/proposals/${proposalUuid}/submit`));
}

export function withdrawProposal(proposalUuid) {
  return call(pcHttp.post(`/proposals/${proposalUuid}/withdraw`));
}

/* ── Quotations ── */

export function previewQuotation(proposalUuid) {
  return call(pcHttp.post(`/quotations/preview/${proposalUuid}`));
}

export function issueQuotation(proposalUuid) {
  return call(pcHttp.post('/quotations', { proposalUuid }));
}

export function listQuotations(query) {
  return call(pcHttp.get('/quotations', { params: listParams(query) }));
}

export function getQuotation(quotationUuid) {
  return call(pcHttp.get(`/quotations/${quotationUuid}`));
}

export function acceptQuotation(quotationUuid) {
  return call(pcHttp.post(`/quotations/${quotationUuid}/accept`));
}

export function declineQuotation(quotationUuid) {
  return call(pcHttp.post(`/quotations/${quotationUuid}/decline`));
}

/* ── Policies ── */

export function listPolicies(query) {
  return call(pcHttp.get('/policies', { params: listParams(query) }));
}
