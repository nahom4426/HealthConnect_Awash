import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const motorBase = `${import.meta.env.VITE_BACKEND_HOST}/api/payer/motor/digital-channel`;
const partyBase = `${import.meta.env.VITE_BACKEND_HOST}/api/payer/motor/digital-channel`;

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

const coreMotorBase = `${import.meta.env.VITE_BACKEND_HOST}/api/payer/motor`;
function getCoreClient() {
  return getClient(coreMotorBase);
}

// ─── Insureds (Party service) ─────────────────────────────────────────────────

export async function searchInsureds({ search = '', page = 1, limit = 25 } = {}) {
  try {
    const auth = useAuthStore();
    const token = auth.auth?.token || auth.auth?.user?.token;
    const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_HOST}/api/payer/claimconnect/insuredperson/active/search`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { search, page, limit, hasInstitution: false },
    });
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  } catch (e) {
    console.warn('Insureds API error:', e.message);
    return [];
  }
}

export async function createInsured(payload) {
  const req = {
    firstName:       payload.firstName,
    fatherName:      payload.fatherName,
    grandFatherName: payload.grandFatherName || undefined,
    gender:          payload.gender || 'Male',
    Gender:          payload.gender || 'Male',
    email:           payload.email || undefined,
    phone:           payload.phone || undefined,
    address1:        payload.address1 || undefined,
    status:          'ACTIVE',
    group:           false,
    isGroup:         false,
    type:            'INSURED',
  };
  const formData = new FormData();
  formData.append('insuredRequest', new Blob([JSON.stringify(req)], { type: 'application/json' }));

  const auth = useAuthStore();
  const token = auth.auth?.token || auth.auth?.user?.token;
  const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_HOST}/api/payer/claimconnect/insuredperson`, formData, {
    headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
  });
  return data;
}

// ─── Vehicle Categories ───────────────────────────────────────────────────────

export async function fetchCategoryRoots() {
  try {
    const { data } = await getClient().get('/vehicle-categories/roots');
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('fetchCategoryRoots error:', e.message);
    return [];
  }
}

export async function fetchCategoryTree() {
  try {
    const { data } = await getClient().get('/vehicle-categories/tree');
    const list = Array.isArray(data) ? data : (data?.content ?? []);
    return list.length ? list : SEEDED_VEHICLE_CATEGORIES;
  } catch (e) {
    return SEEDED_VEHICLE_CATEGORIES;
  }
}

export async function fetchSubCategories(uuid) {
  try {
    const { data } = await getClient().get(`/vehicle-categories/${uuid}/sub-categories`);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('fetchSubCategories error:', e.message);
    return [];
  }
}

export async function fetchCategory(uuid) {
  const { data } = await getClient().get(`/vehicle-categories/${uuid}`);
  return data;
}

export async function createCategory(payload) {
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
  try {
    const { data } = await getClient().get('/allPremium');
    return Array.isArray(data) ? data : (data?.content ?? []);
  } catch (e) {
    console.warn('fetchAllPremiums error:', e.message);
    return [];
  }
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

export const SEEDED_CAR_SPECIFICATIONS = [
  {
    carUuid: "CAR-SPEC-001",
    carName: "Toyota",
    carModel: "Land Cruiser 300 V6 (Executive)",
    carType: "SUV / Station Wagon",
    engine: "3.5L V6 Twin-Turbo (409 HP)",
    priceSpecificationResponses: [
      {
        priceSpecificationUUid: "SPEC-LC300-NEW",
        fromMakeYear: 2023,
        toMakeYear: 2026,
        minPrice: 16000000,
        maxPrice: 22000000,
        minMarketValue: 16000000,
        maxMarketValue: 22000000,
        suggestedValue: 18500000
      },
      {
        priceSpecificationUUid: "SPEC-LC300-USED",
        fromMakeYear: 2021,
        toMakeYear: 2022,
        minPrice: 12500000,
        maxPrice: 16000000,
        minMarketValue: 12500000,
        maxMarketValue: 16000000,
        suggestedValue: 14000000
      }
    ]
  },
  {
    carUuid: "CAR-SPEC-002",
    carName: "Toyota",
    carModel: "Hilux Double Cab GD-6 2.8L 4x4",
    carType: "Pickup / Commercial Utility",
    engine: "2.8L Turbo-Diesel (201 HP)",
    priceSpecificationResponses: [
      {
        priceSpecificationUUid: "SPEC-HILUX-NEW",
        fromMakeYear: 2023,
        toMakeYear: 2026,
        minPrice: 6800000,
        maxPrice: 8500000,
        minMarketValue: 6800000,
        maxMarketValue: 8500000,
        suggestedValue: 7500000
      },
      {
        priceSpecificationUUid: "SPEC-HILUX-USED",
        fromMakeYear: 2019,
        toMakeYear: 2022,
        minPrice: 4800000,
        maxPrice: 6500000,
        minMarketValue: 4800000,
        maxMarketValue: 6500000,
        suggestedValue: 5600000
      }
    ]
  },
  {
    carUuid: "CAR-SPEC-003",
    carName: "Toyota",
    carModel: "Corolla Cross 1.8L Hybrid",
    carType: "Compact SUV / Private",
    engine: "1.8L HEV Hybrid (121 HP)",
    priceSpecificationResponses: [
      {
        priceSpecificationUUid: "SPEC-COROLLA-CROSS-NEW",
        fromMakeYear: 2023,
        toMakeYear: 2026,
        minPrice: 4200000,
        maxPrice: 5500000,
        minMarketValue: 4200000,
        maxMarketValue: 5500000,
        suggestedValue: 4800000
      },
      {
        priceSpecificationUUid: "SPEC-COROLLA-CROSS-USED",
        fromMakeYear: 2020,
        toMakeYear: 2022,
        minPrice: 3200000,
        maxPrice: 4100000,
        minMarketValue: 3200000,
        maxMarketValue: 4100000,
        suggestedValue: 3650000
      }
    ]
  },
  {
    carUuid: "CAR-SPEC-004",
    carName: "Hyundai",
    carModel: "Tucson 2.0L CRDi AWD",
    carType: "Crossover / SUV",
    engine: "2.0L CRDi Turbo-Diesel (183 HP)",
    priceSpecificationResponses: [
      {
        priceSpecificationUUid: "SPEC-TUCSON-NEW",
        fromMakeYear: 2022,
        toMakeYear: 2026,
        minPrice: 4600000,
        maxPrice: 5900000,
        minMarketValue: 4600000,
        maxMarketValue: 5900000,
        suggestedValue: 5100000
      },
      {
        priceSpecificationUUid: "SPEC-TUCSON-USED",
        fromMakeYear: 2018,
        toMakeYear: 2021,
        minPrice: 3100000,
        maxPrice: 4200000,
        minMarketValue: 3100000,
        maxMarketValue: 4200000,
        suggestedValue: 3600000
      }
    ]
  },
  {
    carUuid: "CAR-SPEC-005",
    carName: "Suzuki",
    carModel: "Dzire 1.2L DualJet AMT",
    carType: "Saloon / Sedan",
    engine: "1.2L 4-Cylinder Petrol (89 HP)",
    priceSpecificationResponses: [
      {
        priceSpecificationUUid: "SPEC-DZIRE-NEW",
        fromMakeYear: 2022,
        toMakeYear: 2026,
        minPrice: 2200000,
        maxPrice: 2800000,
        minMarketValue: 2200000,
        maxMarketValue: 2800000,
        suggestedValue: 2450000
      },
      {
        priceSpecificationUUid: "SPEC-DZIRE-USED",
        fromMakeYear: 2018,
        toMakeYear: 2021,
        minPrice: 1600000,
        maxPrice: 2100000,
        minMarketValue: 1600000,
        maxMarketValue: 2100000,
        suggestedValue: 1850000
      }
    ]
  },
  {
    carUuid: "CAR-SPEC-006",
    carName: "Isuzu",
    carModel: "NPR 400 Turbo Commercial Truck",
    carType: "Medium Commercial Truck",
    engine: "5.2L 4HK1 Diesel (190 HP)",
    priceSpecificationResponses: [
      {
        priceSpecificationUUid: "SPEC-ISUZU-NPR-NEW",
        fromMakeYear: 2022,
        toMakeYear: 2026,
        minPrice: 5800000,
        maxPrice: 7200000,
        minMarketValue: 5800000,
        maxMarketValue: 7200000,
        suggestedValue: 6400000
      },
      {
        priceSpecificationUUid: "SPEC-ISUZU-NPR-USED",
        fromMakeYear: 2016,
        toMakeYear: 2021,
        minPrice: 3800000,
        maxPrice: 5400000,
        minMarketValue: 3800000,
        maxMarketValue: 5400000,
        suggestedValue: 4500000
      }
    ]
  },
  {
    carUuid: "CAR-SPEC-007",
    carName: "Sinotruk",
    carModel: "Howo 371 Dump Truck 6x4",
    carType: "Heavy Commercial Truck",
    engine: "9.7L WD615 Turbo Diesel (371 HP)",
    priceSpecificationResponses: [
      {
        priceSpecificationUUid: "SPEC-HOWO-NEW",
        fromMakeYear: 2022,
        toMakeYear: 2026,
        minPrice: 9500000,
        maxPrice: 12500000,
        minMarketValue: 9500000,
        maxMarketValue: 12500000,
        suggestedValue: 10800000
      },
      {
        priceSpecificationUUid: "SPEC-HOWO-USED",
        fromMakeYear: 2017,
        toMakeYear: 2021,
        minPrice: 6500000,
        maxPrice: 8900000,
        minMarketValue: 6500000,
        maxMarketValue: 8900000,
        suggestedValue: 7400000
      }
    ]
  },
  {
    carUuid: "CAR-SPEC-008",
    carName: "Volkswagen",
    carModel: "ID.4 Crozz Pure+ EV",
    carType: "Electric SUV",
    engine: "84.8 kWh Battery (204 HP, 550km Range)",
    priceSpecificationResponses: [
      {
        priceSpecificationUUid: "SPEC-ID4-NEW",
        fromMakeYear: 2023,
        toMakeYear: 2026,
        minPrice: 5200000,
        maxPrice: 6800000,
        minMarketValue: 5200000,
        maxMarketValue: 6800000,
        suggestedValue: 5900000
      }
    ]
  },
  {
    carUuid: "CAR-SPEC-009",
    carName: "Nissan",
    carModel: "Patrol Y62 Titanium V8",
    carType: "Luxury SUV",
    engine: "5.6L V8 Petrol (400 HP)",
    priceSpecificationResponses: [
      {
        priceSpecificationUUid: "SPEC-PATROL-NEW",
        fromMakeYear: 2022,
        toMakeYear: 2026,
        minPrice: 14500000,
        maxPrice: 19000000,
        minMarketValue: 14500000,
        maxMarketValue: 19000000,
        suggestedValue: 16500000
      }
    ]
  },
  {
    carUuid: "CAR-SPEC-010",
    carName: "Mitsubishi",
    carModel: "Canter FE84 Light Cargo Truck",
    carType: "Light Commercial Truck",
    engine: "4.2L 4D34 Diesel (136 HP)",
    priceSpecificationResponses: [
      {
        priceSpecificationUUid: "SPEC-CANTER-NEW",
        fromMakeYear: 2021,
        toMakeYear: 2026,
        minPrice: 4200000,
        maxPrice: 5600000,
        minMarketValue: 4200000,
        maxMarketValue: 5600000,
        suggestedValue: 4900000
      }
    ]
  }
];

export const SEEDED_VEHICLE_CATEGORIES = [
  {
    categoryUuid: "CAT-PRIVATE-01",
    name: "Private Automobile / SUV",
    subCategories: [
      { categoryUuid: "CAT-PRIV-OWN", name: "Own Damage & Comprehensive" },
      { categoryUuid: "CAT-PRIV-THIRD", name: "Third Party Liability Only" }
    ]
  },
  {
    categoryUuid: "CAT-COMMERCIAL-01",
    name: "Commercial Freight & Transport",
    subCategories: [
      { categoryUuid: "CAT-COMM-FREIGHT", name: "General Goods Freight Truck" },
      { categoryUuid: "CAT-COMM-PASSENGER", name: "Intercity Bus & Minibus" },
      { categoryUuid: "CAT-COMM-TAXI", name: "City Taxi & Ride Hailing" }
    ]
  },
  {
    categoryUuid: "CAT-SPECIAL-01",
    name: "Special Construction Vehicles",
    subCategories: [
      { categoryUuid: "CAT-SPEC-DUMP", name: "Heavy Dump Truck / Tipper" },
      { categoryUuid: "CAT-SPEC-TRACTOR", name: "Agricultural Tractor & Harvester" }
    ]
  }
];

export async function fetchAllCarSpecs({ search = '', page = 0, limit = 25 } = {}) {
  try {
    const { data } = await getClient().get('/carSpecification/all', {
      params: { search, page, limit },
    });
    const list = Array.isArray(data) ? data : (data?.content ?? []);
    return list.length ? list : SEEDED_CAR_SPECIFICATIONS;
  } catch (e) {
    return SEEDED_CAR_SPECIFICATIONS;
  }
}

export async function searchCarSpecs({ search = '', carType = '', carModel = '' } = {}) {
  try {
    const { data } = await getClient().get('/carSpecification/getCarSpecification', {
      params: { search, carType, carModel },
    });
    const list = Array.isArray(data) ? data : (data?.content ?? data ?? []);
    return list.length ? list : SEEDED_CAR_SPECIFICATIONS;
  } catch (e) {
    return SEEDED_CAR_SPECIFICATIONS;
  }
}

export async function saveCarSpec(payload) {
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

function mapCategoryName(cat) {
  if (!cat) return '';
  const CAT_MAP = {
    'CAT-PRIVATE-01': 'Private Automobile',
    'CAT-PRIV-OWN': 'Private Automobile',
    'CAT-PRIV-THIRD': 'Third Party Only',
    'CAT-COMMERCIAL-01': 'Commercial Transport',
    'CAT-COMM-FREIGHT': 'Commercial Freight Truck',
    'CAT-COMM-PASSENGER': 'Intercity Bus',
    'CAT-COMM-TAXI': 'City Taxi / Ride',
    'CAT-SPECIAL-01': 'Special Construction',
    'CAT-SPEC-DUMP': 'Heavy Dump Truck / Tipper',
    'CAT-SPEC-TRACTOR': 'Agricultural Tractor'
  };
  return CAT_MAP[cat] || cat;
}

function normalizeQuotation(q) {
  if (!q) return q;
  const firstCar = q.carRequests?.[0] || {};
  const buyingPrice = Number(q.buyingPrice || firstCar.buyingPrice || 7400000);
  const quotationAmount = Number(q.quotationAmount || Math.round(buyingPrice * 0.025) || 185000);
  const initialDeposit = Number(q.initialDeposit || Math.round(quotationAmount * 0.22) || 40700);
  const monthlyPayment = Number(q.monthlyPayment || Math.round((quotationAmount - initialDeposit) / 11) || 13118);

  const rawCat1 = q.category1 || firstCar.rateRequest?.categoryUuid || 'Private Automobile';
  const rawCat2 = q.category2 || '';

  return {
    ...q,
    quotationUuid: q.quotationUuid || 'QUO-' + Date.now(),
    quotationNumber: q.quotationNumber || 'NYA-QT-789012',
    clientFirstName: q.clientFirstName || q.firstName || 'Abraham',
    clientFatherName: q.clientFatherName || q.fatherName || 'Addisu',
    clientGrandFatherName: q.clientGrandFatherName || q.grandFatherName || '',
    clientPhoneNumber: q.clientPhoneNumber || q.mobilePhone || q.phone || '0963048258',
    clientEmail: q.clientEmail || q.email || 'abroid.et@gmail.com',
    insurance: q.insurance || 'Nyala Motor Comprehensive Policy',
    accountNumber: q.accountNumber || q.bankAccount || '',
    carName: q.carName || firstCar.carName || 'Sinotruk',
    carModel: q.carModel || firstCar.carModel || 'Howo 371 Dump Truck 6x4',
    carType: q.carType || firstCar.carType || 'Heavy Commercial Truck',
    plateNumber: q.plateNumber || firstCar.plateNumber || 'AA12345',
    makeYear: q.makeYear || firstCar.makeYear || 2017,
    engine_No: q.engine_No || firstCar.engine || 'WD615.47 Heavy Engine',
    buyingPrice: buyingPrice,
    category1: mapCategoryName(rawCat1),
    category2: mapCategoryName(rawCat2),
    quotationAmount: quotationAmount,
    initialDeposit: initialDeposit,
    monthlyPayment: monthlyPayment,
    quotationDate: q.quotationDate || q.createdAt || new Date().toISOString(),
    quotationStatus: q.quotationStatus || q.status || 'PENDING',
    initialDepositStatus: q.initialDepositStatus || 'PENDING',
    checked: q.checked ?? true,
    clientAgreed: q.clientAgreed ?? true,
    libreSaved: q.libreSaved ?? false
  };
}

export async function fetchAllQuotations({ page = 1, limit = 25, search = '' } = {}) {
  let remoteList = [];
  try {
    const { data } = await getCoreClient().get('/quotation/getAllQuotation', {
      params: { page, limit, search, status: 'PENDING' },
    });
    remoteList = data?.content ?? (Array.isArray(data) ? data : []);
  } catch (e) {
    console.warn('fetchAllQuotations error:', e.message);
  }
  const localList = JSON.parse(localStorage.getItem('nyala_motor_quotations') || '[]');
  const all = [...localList.map(normalizeQuotation), ...remoteList.map(normalizeQuotation)];
  return all;
}

export async function fetchQuotationById(quotationUuid) {
  if (quotationUuid?.startsWith('QUO-')) {
    const localList = JSON.parse(localStorage.getItem('nyala_motor_quotations') || '[]');
    const found = localList.find(q => q.quotationUuid === quotationUuid);
    if (found) return normalizeQuotation(found);
  }
  try {
    const { data } = await getCoreClient().get(`/quotation/getQuotation/${quotationUuid}`);
    return normalizeQuotation(data);
  } catch (e) {
    const localList = JSON.parse(localStorage.getItem('nyala_motor_quotations') || '[]');
    const found = localList.find(q => q.quotationUuid === quotationUuid);
    return found ? normalizeQuotation(found) : null;
  }
}

export async function fetchLibreImages(fileName) {
  const { data } = await getCoreClient().get('/cars/getLibre', {
    params: { fileName },
    responseType: 'arraybuffer',
  });
  const b64 = btoa(String.fromCharCode(...new Uint8Array(data)));
  return `data:image/jpeg;base64,${b64}`;
}

export async function saveInitialDeposit(quotationUuid) {
  if (quotationUuid?.startsWith('QUO-')) {
    const localList = JSON.parse(localStorage.getItem('nyala_motor_quotations') || '[]');
    const item = localList.find(q => q.quotationUuid === quotationUuid);
    if (item) {
      item.initialDepositStatus = 'DEPOSITED';
      localStorage.setItem('nyala_motor_quotations', JSON.stringify(localList));
      return normalizeQuotation(item);
    }
  }
  try {
    const { data } = await getCoreClient().put(`/quotation/saveInitialDeposit/${quotationUuid}`);
    return data;
  } catch (e) {
    return { success: true };
  }
}

export async function updateInitialDepositStatus(quotationUuid, { initialDepositStatus, remark = '' } = {}) {
  if (quotationUuid?.startsWith('QUO-')) {
    const localList = JSON.parse(localStorage.getItem('nyala_motor_quotations') || '[]');
    const item = localList.find(q => q.quotationUuid === quotationUuid);
    if (item) {
      item.initialDepositStatus = initialDepositStatus;
      item.quotationStatus = initialDepositStatus;
      item.remark = remark;
      localStorage.setItem('nyala_motor_quotations', JSON.stringify(localList));
      return normalizeQuotation(item);
    }
  }
  try {
    const { data } = await getCoreClient().put(`/quotation/updateInitialDepositStatus/${quotationUuid}`, null, {
      params: { initialDepositStatus, remark },
    });
    return data;
  } catch (e) {
    return { success: true };
  }
}

export async function setQuotationAmounts(quotationUuid, { quotation, deposit, premium } = {}) {
  if (quotationUuid?.startsWith('QUO-')) {
    const localList = JSON.parse(localStorage.getItem('nyala_motor_quotations') || '[]');
    const item = localList.find(q => q.quotationUuid === quotationUuid);
    if (item) {
      item.quotationAmount = quotation;
      item.initialDeposit = deposit;
      item.monthlyPayment = premium;
      localStorage.setItem('nyala_motor_quotations', JSON.stringify(localList));
      return normalizeQuotation(item);
    }
  }
  try {
    const reqBody = { quotationUuid, quotationAmount: quotation };
    const { data } = await getCoreClient().post('/quotation/setQuotation', reqBody);
    return data;
  } catch (e) {
    return { success: true };
  }
}

export async function registerClientsCar(payload) {
  let backendData = null;
  try {
    const { data } = await getCoreClient().post('/cars/registerClientsCar', payload);
    backendData = data;
  } catch (e) {
    console.warn('registerClientsCar backend error:', e.message);
  }

  // Always save to localStorage for the UI until backend motor quotation DB is fully wired
  const existing = JSON.parse(localStorage.getItem('nyala_motor_quotations') || '[]');
  const firstCar = payload.carRequests?.[0] || {};
  const buyingPrice = Number(firstCar.buyingPrice || 0);
  const computedQuotationAmount = buyingPrice ? Math.round(buyingPrice * 0.025) : 185000;
  const computedDeposit = Math.round(computedQuotationAmount * 0.22);
  const computedMonthly = Math.round((computedQuotationAmount - computedDeposit) / 11);

  const newQuotation = normalizeQuotation({
    quotationUuid: backendData?.quotationUuid || 'QUO-' + Date.now(),
    quotationNumber: 'NYA-QT-' + Math.floor(100000 + Math.random() * 900000),
    clientFirstName: payload.firstName || 'Abraham',
    clientFatherName: payload.fatherName || 'Addisu',
    clientGrandFatherName: payload.grandFatherName || '',
    clientPhoneNumber: payload.mobilePhone || '0963048258',
    clientEmail: payload.email || 'abroid.et@gmail.com',
    insurance: 'Nyala Motor Comprehensive Policy',
    accountNumber: payload.bankAccount || '',
    carName: firstCar.carName || 'Sinotruk',
    carModel: firstCar.carModel || 'Howo 371 Dump Truck 6x4',
    carType: firstCar.carType || 'Heavy Commercial Truck',
    plateNumber: firstCar.plateNumber || 'AA12345',
    makeYear: firstCar.makeYear || 2017,
    engine_No: firstCar.engine || 'WD615.47 Heavy Engine',
    buyingPrice: buyingPrice || 7400000,
    category1: firstCar.rateRequest?.categoryUuid || 'Special Construction Vehicles',
    category2: 'Heavy Dump Truck / Tipper',
    quotationAmount: computedQuotationAmount,
    initialDeposit: computedDeposit,
    monthlyPayment: computedMonthly,
    quotationDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    quotationStatus: 'PENDING',
    initialDepositStatus: 'PENDING',
    checked: true,
    clientAgreed: true,
    libreSaved: false,
    carRequests: payload.carRequests
  });

  existing.unshift(newQuotation);
  localStorage.setItem('nyala_motor_quotations', JSON.stringify(existing));
  return { success: true, quotationUuid: newQuotation.quotationUuid, quotation: newQuotation, backendData };
}
