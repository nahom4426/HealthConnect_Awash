import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const motorBase  = import.meta.env.v_API_MOTOR_URI  || 'http://192.168.100.178:8888/api/payer/motor';
const partyBase  = import.meta.env.v_API_PARTY_URI  || 'http://192.168.100.178:8888/api/payer/party';

function getClient(base = motorBase) {
  const auth = useAuthStore();
  const token = auth.auth?.token || auth.auth?.user?.token;
  return axios.create({
    baseURL: base,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// ─── Insureds (Party service) ─────────────────────────────────────────────────

export async function searchInsureds({ search = '', page = 1, limit = 25 } = {}) {
  const { data } = await getClient(partyBase).get('/insureds/search', {
    params: { search, page, limit, sortBy: 'id', sortDirection: 'desc' },
    paramsSerializer: params => {
      return Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
    },
  });
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export async function createInsured(payload) {
  const { data } = await getClient(partyBase).post('/insureds', {
    firstName:       payload.firstName,
    fatherName:      payload.fatherName,
    grandFatherName: payload.grandFatherName || undefined,
    gender:          payload.gender          || undefined,
    email:           payload.email           || undefined,
    title:           payload.title           || undefined,
    birthDate:       payload.birthDate       || undefined,
    phone:           payload.phone           || undefined,
    address1:        payload.address1        || undefined,
    idNumber:        undefined,
    insuranceId:     undefined,
    status:          'ACTIVE',
    type:            'INSURED',
    relationship:    'Employee',
  });
  return data;
}

// ─── Vehicle Categories ───────────────────────────────────────────────────────

export async function fetchCategoryRoots() {
  const { data } = await getClient().get('/vehicle-categories/roots');
  return data;
}

export async function fetchCategoryTree() {
  const { data } = await getClient().get('/vehicle-categories/tree');
  return data;
}

export async function fetchSubCategories(uuid) {
  const { data } = await getClient().get(`/vehicle-categories/${uuid}/sub-categories`);
  return data;
}

export async function fetchCategory(uuid) {
  const { data } = await getClient().get(`/vehicle-categories/${uuid}`);
  return data;
}

export async function createCategory(payload) {
  // payload: { name, description, code, parentUuid }
  const { data } = await getClient().post('/vehicle-categories', payload);
  return data;
}

export async function updateCategory(uuid, payload) {
  const { data } = await getClient().put(`/vehicle-categories/${uuid}`, payload);
  return data;
}

export async function deleteCategory(uuid) {
  const { data } = await getClient().delete(`/vehicle-categories/${uuid}`);
  return data;
}

// ─── Premiums ─────────────────────────────────────────────────────────────────

export async function fetchAllPremiums() {
  const { data } = await getClient().get('/allPremium');
  // API returns a paginated wrapper: { content: [...], totalElements, ... }
  return Array.isArray(data) ? data : (data?.content ?? []);
}

export async function savePremium(categoryUuid, rate) {
  const { data } = await getClient().post('/savePremium', null, {
    params: { categoryUuid, rate },
  });
  return data;
}

export async function updatePremium(uuid, categoryUuid, rate) {
  const { data } = await getClient().put(`/updatePremium/${uuid}`, null, {
    params: { categoryUuid, rate },
  });
  return data;
}

export async function deletePremium(uuid) {
  const { data } = await getClient().delete(`/deletePremium/${uuid}`);
  return data;
}

// ─── Car Specifications ───────────────────────────────────────────────────────

export async function fetchAllCarSpecs({ search = '', page = 0, limit = 25 } = {}) {
  const { data } = await getClient().get('/carSpecification/all', {
    params: { search, page, limit },
  });
  return Array.isArray(data) ? data : (data?.content ?? []);
}

export async function searchCarSpecs({ search = '', carType = '', carModel = '' } = {}) {
  const { data } = await getClient().get('/carSpecification/getCarSpecification', {
    params: { search, carType, carModel },
  });
  return Array.isArray(data) ? data : (data?.content ?? data ?? []);
}

export async function saveCarSpec(payload) {
  // payload: { categoryUuid, carType, carModel, engineCapacity, seats, yearOfManufacture, ... }
  const { data } = await getClient().post('/carSpecification/saveCArSpecification', payload);
  return data;
}

export async function updateCarSpec(uuid, payload) {
  const { data } = await getClient().put(`/carSpecification/update/${uuid}`, payload);
  return data;
}

export async function deleteCarSpec(uuid) {
  const { data } = await getClient().delete(`/carSpecification/delete/${uuid}`);
  return data;
}

// ─── Quotations ───────────────────────────────────────────────────────────────

export async function fetchAllQuotations({ page = 1, limit = 25, search = '' } = {}) {
  const { data } = await getClient().get('/quotation/getAllQuotation', {
    params: { page, limit, search },
  });
  return data?.content ?? (Array.isArray(data) ? data : []);
}

export async function fetchQuotationById(quotationUuid) {
  const { data } = await getClient().get(`/quotation/getQuotation/${quotationUuid}`);
  return data;
}

export async function fetchLibreImages(fileName) {
  const { data } = await getClient().get('/cars/getLibre', {
    params: { fileName },
    responseType: 'arraybuffer',
  });
  const b64 = btoa(String.fromCharCode(...new Uint8Array(data)));
  return `data:image/jpeg;base64,${b64}`;
}

export async function saveInitialDeposit(quotationUuid) {
  const { data } = await getClient().put(`/quotation/saveInitialDeposit/${quotationUuid}`);
  return data;
}

export async function updateInitialDepositStatus(quotationUuid, { initialDepositStatus, remark = '' } = {}) {
  const { data } = await getClient().put(`/quotation/updateInitialDepositStatus/${quotationUuid}`, null, {
    params: { initialDepositStatus, remark },
  });
  return data;
}

export async function setQuotationAmounts(quotationUuid, { quotation, deposit, premium } = {}) {
  const { data } = await getClient().post(`/quotation/setQuotation/${quotationUuid}`, null, {
    params: { quotation, deposit, premium },
  });
  return data;
}

export async function registerClientsCar(payload) {
  const { data } = await getClient().post('/cars/registerClientsCar', payload);
  return data;
}
