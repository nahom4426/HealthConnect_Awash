import { authHttp, call } from './http';

/** Modules the signed-in user belongs to, with their role and privileges in each. */
export function fetchMyModules() {
  return call(authHttp.get('/modules/me'));
}

export function fetchModules({ includeInactive = true } = {}) {
  return call(authHttp.get('/modules', { params: { includeInactive } }));
}

export function fetchModule(key) {
  return call(authHttp.get(`/modules/${encodeURIComponent(key)}`));
}

export function updateModule(key, { name, description, sortOrder }) {
  return call(authHttp.put(`/modules/${encodeURIComponent(key)}`, { name, description, sortOrder }));
}

export function setModuleStatus(key, status) {
  return call(authHttp.patch(`/modules/${encodeURIComponent(key)}/status`, null, { params: { status } }));
}
