import { call, pcHttp } from './http';

// Browse taxonomy over the product catalogue: category → subcategory (class of business) →
// product definition. A presentation grouping only; it is not ProductFamily.
// Nodes are retired, never deleted. A category or subcategory key is only read on create.

const enc = encodeURIComponent;

/** Categories with their subcategories, in sortOrder. */
export function listCategories({ includeRetired = false } = {}) {
  return call(pcHttp.get('/product-categories', { params: { includeRetired } }));
}

export function getCategory(categoryKey, { includeRetired = false } = {}) {
  return call(pcHttp.get(`/product-categories/${enc(categoryKey)}`, { params: { includeRetired } }));
}

export function createCategory(body) {
  return call(pcHttp.post('/product-categories', body));
}

export function updateCategory(categoryKey, body) {
  return call(pcHttp.put(`/product-categories/${enc(categoryKey)}`, body));
}

export function setCategoryStatus(categoryKey, status) {
  return call(pcHttp.patch(`/product-categories/${enc(categoryKey)}/status`, null, { params: { status } }));
}

export function listSubcategories(categoryKey) {
  return call(pcHttp.get(`/product-categories/${enc(categoryKey)}/subcategories`));
}

export function createSubcategory(categoryKey, body) {
  return call(pcHttp.post(`/product-categories/${enc(categoryKey)}/subcategories`, body));
}

export function updateSubcategory(categoryKey, subcategoryKey, body) {
  return call(pcHttp.put(`/product-categories/${enc(categoryKey)}/subcategories/${enc(subcategoryKey)}`, body));
}

export function setSubcategoryStatus(categoryKey, subcategoryKey, status) {
  return call(
    pcHttp.patch(`/product-categories/${enc(categoryKey)}/subcategories/${enc(subcategoryKey)}/status`, null, { params: { status } }),
  );
}
