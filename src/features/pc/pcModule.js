import { computed } from 'vue';
import { useRoute } from 'vue-router';

export const PC_MODULES = {
  fire: {
    id: 'fire',
    productClass: 'FIRE',
    basePath: '/fire',
    label: 'Fire',
    kicker: 'Fire',
    rateTitle: 'Fire rates & perils',
    rateSub: 'Construction × occupancy grid, loadings, and additional perils from the published Fire product. Quotation uses this snapshot.',
    axis1: 'Construction',
    axis2: 'Occupancy',
    formBuilderPath: '/form-builder/fire',
    productPath: '/fire/product',
    publishLabel: 'Publish to Fire proposal',
  },
  burglary: {
    id: 'burglary',
    productClass: 'BURGLARY',
    basePath: '/burglary',
    label: 'Burglary & Theft',
    kicker: 'Burglary & Theft',
    rateTitle: 'Burglary rates & covers',
    rateSub: 'Security grade × occupancy grid, loadings, and theft extensions from the published Burglary product. Quotation uses this snapshot.',
    axis1: 'Security grade',
    axis2: 'Occupancy',
    formBuilderPath: '/form-builder/burglary',
    productPath: '/burglary/product',
    publishLabel: 'Publish to Burglary proposal',
  },
  marine: {
    id: 'marine',
    productClass: 'MARINE',
    basePath: '/marine',
    label: 'Marine & Cargo',
    kicker: 'Marine & Cargo',
    rateTitle: 'Marine cargo rates & perils',
    rateSub: 'Commodity class × conveyance grid, loadings, and Institute Cargo Clauses from the published Marine product. Quotation uses this snapshot.',
    axis1: 'Commodity class',
    axis2: 'Conveyance',
    formBuilderPath: '/form-builder/marine',
    productPath: '/marine/product',
    publishLabel: 'Publish to Marine proposal',
  },
  liability: {
    id: 'liability',
    productClass: 'LIABILITY',
    basePath: '/liability',
    label: 'Liability',
    kicker: 'Liability',
    rateTitle: 'Liability rates & extensions',
    rateSub: 'Risk class × business activity grid, loadings, and liability extensions from the published Liability product. Quotation uses this snapshot.',
    axis1: 'Risk class',
    axis2: 'Business activity',
    formBuilderPath: '/form-builder/liability',
    productPath: '/liability/product',
    publishLabel: 'Publish to Liability proposal',
  },
};

export function usePcModule() {
  const route = useRoute();
  return computed(() => PC_MODULES[route.meta?.pcModule] || PC_MODULES.fire);
}

export function isPcProduct(productId) {
  return Boolean(PC_MODULES[productId]);
}

export function parseAnswers(json) {
  if (!json) return {};
  if (typeof json === 'object') return json;
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

const MONEY_ANSWER_KEYS = new Set([
  'estimatedAnnualValue',
  'maxShipmentValue',
  'invoiceValue',
  'freight',
]);

/** Readable label for a stored proposal answer id. */
export function answerFieldLabel(fieldId) {
  const labels = {
    insuranceArrangement: 'Insurance arrangement',
    marineProduct: 'Marine product',
    proposerName: 'Proposer name',
    proposerPhone: 'Proposer phone',
    proposerAddress: 'Proposer address',
    occupation: 'Occupation',
    riskAddress: 'Risk address',
    periodFrom: 'Period from',
    periodTo: 'Period to',
    insuredParty: 'Insured',
    insuredRole: 'Insured is the',
    consignee: 'Consignee',
    broker: 'Broker',
    incoterm: 'Incoterm',
    conveyanceMode: 'Conveyance',
    conveyanceModes: 'Conveyances',
    conveyanceTypes: 'Conveyances',
    vessel: 'Vessel',
    vesselName: 'Vessel name',
    vesselImo: 'Vessel IMO',
    vesselImoNumber: 'Vessel IMO',
    vesselYearBuilt: 'Vessel year built',
    voyageNumber: 'Voyage number',
    containers: 'Containers',
    portOfLoading: 'Port of loading',
    portOfDischarge: 'Port of discharge',
    transshipmentPorts: 'Transshipment ports',
    finalDestination: 'Final destination',
    sailingDate: 'Sailing date',
    commodity: 'Commodity',
    hsCode: 'HS code',
    commodityClass: 'Commodity class',
    commodityCategories: 'Commodity categories',
    goodsDescription: 'Goods description',
    packing: 'Packing',
    packingType: 'Packing',
    invoiceValue: 'Invoice value',
    freight: 'Freight',
    invoiceNo: 'Invoice number',
    invoiceNumber: 'Invoice number',
    blNo: 'Bill of lading / AWB',
    billOfLadingNumber: 'Bill of lading / AWB',
    letterOfCreditNumber: 'Letter of credit',
    lossPayee: 'Loss payee',
    shipmentFrequency: 'Shipment frequency',
    estimatedAnnualValue: 'Estimated annual value',
    maxShipmentValue: 'Maximum per shipment',
    tradingRoutes: 'Trading routes',
    supportingDocumentsNote: 'Supporting documents',
    selectedPerils: 'Selected covers',
    soleOccupancy: 'Sole occupancy',
    hazardousCargo: 'Hazardous cargo',
    hazardousCargoDetails: 'Hazardous cargo details',
    temperatureControlled: 'Temperature controlled',
    transshipment: 'Transshipment',
    deckCargo: 'Deck cargo',
    surveyRequired: 'Survey required',
    priorMarineLoss: 'Prior marine loss',
    priorMarineLossDetails: 'Prior loss details',
    declarationAccepted: 'Declaration accepted',
    liabilityLine: 'Liability line',
    constructionClass: 'Risk class',
    occupancyCode: 'Business activity',
    yearsInBusiness: 'Years in business',
    estimatedAnnualTurnover: 'Estimated annual turnover',
    employeeCount: 'Employees',
    limitAnyOneOccurrence: 'Limit any one occurrence',
    limitAggregate: 'Aggregate limit',
    deductible: 'Deductible',
    workAwayFromPremises: 'Work away from premises',
    workAwayDetails: 'Work away details',
    usesSubcontractors: 'Uses subcontractors',
    subcontractorDetails: 'Subcontractor details',
    handlesHazardousMaterials: 'Hazardous materials',
    hazardousMaterialsDetails: 'Hazardous materials details',
    exportsProducts: 'Products exported',
    territorialScope: 'Territorial scope',
    previousLoss: 'Prior liability claims',
    previousLossDetails: 'Prior claim details',
    previousInsurance: 'Previous liability insurance',
    previousInsurer: 'Previous insurer',
    insurerRefused: 'Insurer refused / special terms',
    insurerRefusedDetails: 'Refusal / special terms details',
  };
  if (labels[fieldId]) return labels[fieldId];
  return String(fieldId || '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

const ANSWER_CODE_LABELS = {
  OPEN_COVER: 'Open Cover',
  SINGLE_SHIPMENT: 'Single Shipment',
  ICC_A: 'Institute Cargo Clauses (A)',
  ICC_B: 'Institute Cargo Clauses (B)',
  ICC_C: 'Institute Cargo Clauses (C)',
  WAR: 'War',
  STRIKES: 'Strikes',
  SEA: 'Sea',
  AIR: 'Air',
  ROAD: 'Road',
  RAIL: 'Rail',
  SHIPPER: 'Shipper',
  CONSIGNEE: 'Consignee',
  BUYER: 'Buyer',
  SELLER: 'Seller',
  MONTHLY: 'Monthly',
  WEEKLY: 'Weekly',
  DAILY: 'Daily',
  QUARTERLY: 'Quarterly',
  ANNUAL: 'Annual',
  AS_REQUIRED: 'As required',
  BAGS: 'Bags',
  CARTONS: 'Cartons',
  CONTAINER: 'Container',
  BULK: 'Bulk',
  CRATES: 'Crates',
  GENERAL_MERCHANDISE: 'General merchandise',
  PHARMACEUTICALS: 'Pharmaceuticals',
  MACHINERY_EQUIPMENT: 'Machinery & equipment',
  ELECTRONICS: 'Electronics',
  FOODSTUFFS: 'Foodstuffs',
  CHEMICALS: 'Chemicals',
  CARGO_VALUE: 'Cargo value',
};

function formatMoneyAmount(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `ETB ${amount.toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

/** Format a proposal answer for read-only display (parties, ports, vessels, commodities). */
export function formatAnswerValue(value, fieldId) {
  if (value == null || value === '') return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    if (!value.length) return '';
    return value.map((item) => formatAnswerValue(item, fieldId)).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    if (value.name && value.code) return `${value.name} (${value.code})`;
    if (value.name && value.imo) return `${value.name} · IMO ${value.imo}`;
    if (value.name) {
      const extras = [value.tin, value.phone, value.email].filter(Boolean);
      return extras.length ? `${value.name} · ${extras.join(' · ')}` : value.name;
    }
    if (value.hsCode) {
      const desc = value.description || value.name;
      return desc ? `${value.hsCode} · ${desc}` : value.hsCode;
    }
    if (value.code) return ANSWER_CODE_LABELS[value.code] || value.code;
    if (value.imo) return `IMO ${value.imo}`;
    if (value.label) return value.label;
    return '';
  }
  if (fieldId && MONEY_ANSWER_KEYS.has(fieldId)) return formatMoneyAmount(value);
  const text = String(value).trim();
  if (!text) return '';
  return ANSWER_CODE_LABELS[text] || text;
}

function isAnswerEmpty(raw) {
  if (raw == null || raw === '') return true;
  if (typeof raw === 'boolean') return raw === false;
  if (Array.isArray(raw)) return !raw.length;
  if (typeof raw === 'object') {
    return !formatAnswerValue(raw);
  }
  return String(raw).trim() === '';
}

/** Ordered answer rows for proposal detail, skipping empty technical noise. */
export function proposalAnswerRows(answers, { prefer = [], keys = null, skipFalseBooleans = true } = {}) {
  const data = answers && typeof answers === 'object' ? answers : {};
  const skip = new Set(['riskItems', 'selectedPerils']);
  const ordered = keys
    || [
      ...prefer.filter((key) => key in data),
      ...Object.keys(data).filter((key) => !prefer.includes(key) && !skip.has(key)),
    ];
  return ordered
    .filter((key) => key in data && !skip.has(key))
    .filter((key) => {
      const raw = data[key];
      if (skipFalseBooleans && raw === false) return false;
      return !isAnswerEmpty(raw);
    })
    .map((key) => ({ key, label: answerFieldLabel(key), value: formatAnswerValue(data[key], key) }))
    .filter((row) => row.value !== '');
}

export const MARINE_ANSWER_SECTIONS = [
  {
    id: 'arrangement',
    title: 'Arrangement & period',
    keys: ['insuranceArrangement', 'marineProduct', 'periodFrom', 'periodTo', 'shipmentFrequency', 'soleOccupancy'],
  },
  {
    id: 'parties',
    title: 'Parties',
    keys: [
      'proposerName',
      'proposerPhone',
      'proposerAddress',
      'occupation',
      'insuredParty',
      'insuredRole',
      'consignee',
      'broker',
      'lossPayee',
    ],
  },
  {
    id: 'trading',
    title: 'Trading profile',
    keys: [
      'tradingRoutes',
      'conveyanceTypes',
      'conveyanceModes',
      'conveyanceMode',
      'commodityCategories',
      'estimatedAnnualValue',
      'maxShipmentValue',
      'supportingDocumentsNote',
    ],
  },
  {
    id: 'cargo',
    title: 'Cargo',
    keys: [
      'goodsDescription',
      'commodityClass',
      'commodity',
      'hsCode',
      'packingType',
      'packing',
      'invoiceValue',
      'invoiceNumber',
      'invoiceNo',
      'hazardousCargo',
      'hazardousCargoDetails',
      'temperatureControlled',
      'deckCargo',
    ],
  },
  {
    id: 'voyage',
    title: 'Voyage',
    keys: [
      'portOfLoading',
      'portOfDischarge',
      'finalDestination',
      'transshipmentPorts',
      'sailingDate',
      'vessel',
      'vesselName',
      'vesselImoNumber',
      'vesselImo',
      'vesselYearBuilt',
      'voyageNumber',
      'containers',
      'incoterm',
      'billOfLadingNumber',
      'blNo',
      'letterOfCreditNumber',
      'transshipment',
      'surveyRequired',
    ],
  },
  {
    id: 'declaration',
    title: 'Declaration',
    keys: ['priorMarineLoss', 'priorMarineLossDetails', 'declarationAccepted', 'riskAddress'],
  },
];

/** Group filled marine answers into titled sections for the detail page. */
export function proposalAnswerSections(answers, sections = MARINE_ANSWER_SECTIONS) {
  const data = answers && typeof answers === 'object' ? answers : {};
  const used = new Set();
  const grouped = sections
    .map((section) => {
      const keys = section.keys.filter((key) => !used.has(key));
      const rows = proposalAnswerRows(data, { keys });
      rows.forEach((row) => used.add(row.key));
      return { ...section, rows };
    })
    .filter((section) => section.rows.length);

  const leftoverKeys = Object.keys(data).filter((key) => !used.has(key));
  const otherRows = proposalAnswerRows(data, { keys: leftoverKeys });
  if (otherRows.length) {
    grouped.push({ id: 'other', title: 'Other details', rows: otherRows });
  }
  return grouped;
}

export function ratingAxes(row) {
  const answers = parseAnswers(row?.answersJson);
  const openCover = answers.insuranceArrangement === 'OPEN_COVER';
  const commodity =
    row?.marineShipment?.commodityClass ||
    answers.commodityClass ||
    formatAnswerValue(answers.commodity) ||
    formatAnswerValue(answers.commodityCategories) ||
    (openCover ? formatAnswerValue(answers.shipmentFrequency) || 'Open Cover' : null);
  const conveyance =
    row?.marineShipment?.conveyanceMode ||
    answers.conveyanceMode ||
    formatAnswerValue(answers.conveyanceTypes) ||
    formatAnswerValue(answers.conveyanceModes) ||
    (openCover ? formatAnswerValue(answers.insuranceArrangement) : null);
  return {
    axis1: row?.premises?.constructionClass || commodity || answers.securityGrade || answers.constructionClass || answers.ratingClass || '—',
    axis2: row?.premises?.occupancyCode || conveyance || answers.occupancyCode || '—',
  };
}
