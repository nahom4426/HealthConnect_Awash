import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { PC_MODULES } from '@/features/pc/pcModule.js';

const apiBase = `${import.meta.env.VITE_BACKEND_HOST}/api/payer/motor/digital-channel`;

function authHeaders() {
  const auth = useAuthStore();
  let token = auth.auth?.token || auth.auth?.user?.token;
  if (!token) {
    try {
      const stored = JSON.parse(localStorage.getItem('userDetail') || '{}');
      token = stored.token || stored.user?.token;
    } catch {
      token = null;
    }
  }
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function pcClass(productId) {
  return PC_MODULES[productId]?.productClass;
}

function pcClient() {
  return axios.create({
    baseURL: '/api/payer/property-casualty',
    headers: authHeaders(),
  });
}

function toFormSchema(productId, product) {
  return {
    formUuid: product.productUuid,
    formId: `${productId}_proposal`,
    productId,
    version: product.version,
    status: product.status,
    schemaJson: product.schemaJson,
    updatedAt: product.publishedAt,
  };
}

function getClient() {
  return axios.create({
    baseURL: apiBase,
    headers: authHeaders(),
  });
}

// ── LocalStorage Helpers ──────────────────────────────────────────────────
const LOCAL_FORMS_KEY = 'standard_sdui_form_schemas';
const LOCAL_RATES_KEY = 'standard_sdui_rate_configs';

function getLocal(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function setLocal(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.error(e); }
}

// ── Form Schemas API ───────────────────────────────────────────────────────

export async function fetchFormSchemas(productId) {
  const productClass = pcClass(productId);
  if (productClass) {
    try {
      const { data } = await pcClient().get(`/products/published/${productClass}`);
      if (data?.productUuid) return [toFormSchema(productId, data)];
    } catch (e) {
      console.warn('Property-casualty form schema unavailable, using local storage fallback:', e.message);
    }
    const all = getLocal(LOCAL_FORMS_KEY);
    return all.filter(f => f.productId === productId && !f.isDeleted);
  }
  try {
    const { data } = await getClient().get(`/forms/product/${productId}`);
    if (Array.isArray(data) && data.length) return data;
  } catch (e) {
    console.warn('Backend API unavailable, using local storage fallback for forms:', e.message);
  }
  const all = getLocal(LOCAL_FORMS_KEY);
  return all.filter(f => f.productId === productId && !f.isDeleted);
}

export async function fetchFormSchema(formUuid) {
  try {
    const { data } = await pcClient().get(`/products/${formUuid}`);
    if (data?.productClass) {
      const productId = String(data.productClass).toLowerCase();
      return toFormSchema(PC_MODULES[productId] ? productId : 'fire', data);
    }
  } catch (e) {
    /* not a PC product uuid; fall through to motor / local */
  }
  try {
    const { data } = await getClient().get(`/forms/${formUuid}`);
    if (data) return data;
  } catch (e) {
    console.warn('Backend API unavailable, using local storage fallback:', e.message);
  }
  const all = getLocal(LOCAL_FORMS_KEY);
  return all.find(f => f.formUuid === formUuid);
}

export async function saveFormSchema(payload) {
  // payload: { formUuid, formId, productId, version, schemaJson }
  const productClass = pcClass(payload.productId);
  if (productClass) {
    try {
      const schemaJson = typeof payload.schemaJson === 'string'
        ? payload.schemaJson
        : JSON.stringify(payload.schemaJson);
      const { data } = await pcClient().put(`/products/published/${productClass}/schema`, { schemaJson });
      return toFormSchema(payload.productId, data);
    } catch (e) {
      console.warn('Property-casualty schema save failed, using local storage:', e.message);
    }
  } else {
    try {
      if (payload.formUuid) {
        const { data } = await getClient().put(`/forms/${payload.formUuid}`, payload);
        return data;
      } else {
        const { data } = await getClient().post('/forms', payload);
        return data;
      }
    } catch (e) {
      console.warn('Backend API error/offline, saving to local storage:', e.message);
    }
  }

  // Fallback
  const all = getLocal(LOCAL_FORMS_KEY);
  const now = new Date().toISOString();
  let schemaObj;
  if (payload.formUuid) {
    const idx = all.findIndex(f => f.formUuid === payload.formUuid);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...payload, updatedAt: now };
      schemaObj = all[idx];
    }
  }
  if (!schemaObj) {
    schemaObj = {
      formUuid: 'local-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      formId: payload.formId || `${payload.productId}_proposal`,
      productId: payload.productId,
      version: payload.version || '1.0',
      status: 'DRAFT',
      schemaJson: payload.schemaJson,
      createdAt: now,
      updatedAt: now,
    };
    all.unshift(schemaObj);
  }
  setLocal(LOCAL_FORMS_KEY, all);
  return schemaObj;
}

export async function publishFormSchema(formUuid, productId) {
  const productClass = pcClass(productId);
  if (productClass) {
    const current = await fetchFormSchema(formUuid);
    if (current?.schemaJson) {
      return saveFormSchema({
        productId,
        formUuid,
        schemaJson: current.schemaJson,
      });
    }
  }
  try {
    if (formUuid && formUuid.startsWith('local-')) {
      const all = getLocal(LOCAL_FORMS_KEY);
      const target = all.find(f => f.formUuid === formUuid);
      if (target) {
        const saved = await saveFormSchema({
          productId: target.productId || 'motor',
          formId: target.formId || 'motor_proposal',
          version: target.version || '1.0',
          schemaJson: target.schemaJson,
        });
        if (saved && saved.formUuid) {
          formUuid = saved.formUuid;
        }
      }
    }
    const { data } = await getClient().put(`/forms/${formUuid}/publish`);
    return data;
  } catch (e) {
    console.warn('Backend API error/offline, publishing locally:', e.message);
  }

  const all = getLocal(LOCAL_FORMS_KEY);
  const target = all.find(f => f.formUuid === formUuid);
  if (target) {
    all.filter(f => f.productId === target.productId && f.status === 'PUBLISHED').forEach(f => f.status = 'ARCHIVED');
    target.status = 'PUBLISHED';
    target.updatedAt = new Date().toISOString();
    setLocal(LOCAL_FORMS_KEY, all);
    return target;
  }
  return null;
}

export async function deleteFormSchema(formUuid) {
  try {
    await getClient().delete(`/forms/${formUuid}`);
    return true;
  } catch (e) {
    console.warn('Backend API error/offline, deleting locally:', e.message);
  }

  const all = getLocal(LOCAL_FORMS_KEY).filter(f => f.formUuid !== formUuid);
  setLocal(LOCAL_FORMS_KEY, all);
  return true;
}

// ── Rate Config API ───────────────────────────────────────────────────────

export async function fetchRateConfigs(productId) {
  try {
    const { data } = await getClient().get(`/rates/product/${productId}`);
    if (Array.isArray(data) && data.length) return data;
  } catch (e) {
    console.warn('Backend API unavailable, using local storage fallback for rates:', e.message);
  }
  const all = getLocal(LOCAL_RATES_KEY);
  return all.filter(r => r.productId === productId && !r.isDeleted);
}

export async function saveRateConfig(payload) {
  try {
    if (payload.rateUuid) {
      const { data } = await getClient().put(`/rates/${payload.rateUuid}`, payload);
      return data;
    } else {
      const { data } = await getClient().post('/rates', payload);
      return data;
    }
  } catch (e) {
    console.warn('Backend API error/offline, saving rates locally:', e.message);
  }

  const all = getLocal(LOCAL_RATES_KEY);
  const now = new Date().toISOString();
  let rateObj;
  if (payload.rateUuid) {
    const idx = all.findIndex(r => r.rateUuid === payload.rateUuid);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...payload, updatedAt: now };
      rateObj = all[idx];
    }
  }
  if (!rateObj) {
    rateObj = {
      rateUuid: 'local-rate-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
      productId: payload.productId,
      version: payload.version || '1.0',
      status: 'DRAFT',
      ratesJson: payload.ratesJson,
      createdAt: now,
      updatedAt: now,
    };
    all.unshift(rateObj);
  }
  setLocal(LOCAL_RATES_KEY, all);
  return rateObj;
}

export async function publishRateConfig(rateUuid) {
  try {
    const { data } = await getClient().put(`/rates/${rateUuid}/publish`);
    return data;
  } catch (e) {
    console.warn('Backend API error/offline, publishing rate locally:', e.message);
  }

  const all = getLocal(LOCAL_RATES_KEY);
  const target = all.find(r => r.rateUuid === rateUuid);
  if (target) {
    all.filter(r => r.productId === target.productId && r.status === 'PUBLISHED').forEach(r => r.status = 'ARCHIVED');
    target.status = 'PUBLISHED';
    target.updatedAt = new Date().toISOString();
    setLocal(LOCAL_RATES_KEY, all);
    return target;
  }
  return null;
}
