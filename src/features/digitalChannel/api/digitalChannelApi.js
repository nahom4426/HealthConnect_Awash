import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { fetchImageObjectUrl } from '@/utils/imageBlob';

const apiBase = `${import.meta.env.VITE_BACKEND_HOST}/api/payer/motor/digital-channel`;

function getClient() {
  const auth = useAuthStore();
  const token = auth.auth?.token || auth.auth?.user?.token;
  const activeRole = localStorage.getItem('nyala_active_testing_role') || 'ROLE_UNDERWRITER';
  return axios.create({
    baseURL: apiBase,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': activeRole,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// ─── USER & ROLE MANAGEMENT API (SUPER ADMIN) ─────────────────────────────────

export async function fetchUserRoles() {
  try {
    const { data } = await getClient().get('/admin/user-roles');
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('fetchUserRoles error, returning local fallback:', e.message);
    return [
      { id: 1, username: 'admin_underwriter', fullName: 'Underwriter Solomon Tadesse', email: 'underwriter@nyalainsurance.com', role: 'ROLE_UNDERWRITER', status: 'ACTIVE' },
      { id: 2, username: 'claim_manager', fullName: 'Claim Manager Tigist Worku', email: 'claim.manager@nyalainsurance.com', role: 'ROLE_CLAIM_MANAGER', status: 'ACTIVE' },
      { id: 3, username: 'product_manager', fullName: 'Product Manager Abebe Kebede', email: 'product.manager@nyalainsurance.com', role: 'ROLE_PRODUCT_MANAGER', status: 'ACTIVE' },
      { id: 4, username: 'adjustor_dawit', fullName: 'Adjustor Dawit Tesfaye', email: 'adjustor.dawit@nyalainsurance.com', role: 'ROLE_ADJUSTOR', status: 'ACTIVE' },
      { id: 5, username: 'customer_biruk', fullName: 'Biruk Hagoss', email: 'biruk.hagos@gmail.com', role: 'ROLE_CUSTOMER', status: 'ACTIVE' },
      { id: 6, username: 'super_admin', fullName: 'System Super Admin', email: 'admin@nyalainsurance.com', role: 'ROLE_SUPER_ADMIN', status: 'ACTIVE' }
    ];
  }
}

export async function createUserRole(payload) {
  const { data } = await getClient().post('/admin/user-roles', payload);
  return data;
}

export async function updateUserRole(id, payload) {
  const { data } = await getClient().put(`/admin/user-roles/${id}`, payload);
  return data;
}

export async function deleteUserRole(id) {
  await getClient().delete(`/admin/user-roles/${id}`);
  return true;
}

// ─── CLAIMS API (ALL 8 MODULES) ────────────────────────────────────────────────

export async function submitClaim(payload) {
  try {
    const { data } = await getClient().post('/claims', payload);
    return data;
  } catch (e) {
    console.warn('submitClaim error, returning fallback:', e.message);
    const mock = {
      claimUuid: 'MOCK-CLM-' + Date.now(),
      claimNumber: 'NYA-CLM-' + Math.floor(100000 + Math.random() * 900000),
      policyNumber: payload.policyNumber || 'NYA-POL-12345',
      productModule: payload.productModule || 'motor',
      coverageType: payload.coverageType || 'COMPREHENSIVE',
      causeOfLoss: payload.causeOfLoss || 'COLLISION',
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      description: payload.description || 'Fallback Mock Claim',
      estimatedAmount: payload.estimatedAmount || 0,
    };
    const local = JSON.parse(localStorage.getItem('nyala_claims') || '[]');
    local.unshift(mock);
    localStorage.setItem('nyala_claims', JSON.stringify(local));
    return mock;
  }
}

export async function fetchClaimByUuid(claimUuid) {
  try {
    const { data } = await getClient().get(`/claims/${claimUuid}`);
    if (data) return data;
  } catch (e) {
    console.warn('fetchClaimByUuid error:', e.message);
  }
  const local = JSON.parse(localStorage.getItem('nyala_claims') || '[]');
  return local.find(c => c.claimUuid === claimUuid) || null;
}

/** Authenticated primary accident photo of a claim. Resolves to a blob: URL, or null when none exists. */
export async function fetchClaimImage(claimUuid) {
  return fetchImageObjectUrl(getClient(), `/claims/${claimUuid}/image`);
}

/** Metadata of every document attached to a claim (photos, police report, ...). */
export async function fetchClaimDocuments(claimUuid) {
  try {
    const { data } = await getClient().get(`/claims/${claimUuid}/documents`);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn(`fetchClaimDocuments error for ${claimUuid}:`, e.message);
    return [];
  }
}

/** Authenticated bytes of one claim document as a blob: URL (null if missing). */
export async function fetchClaimDocumentUrl(claimUuid, documentUuid) {
  return fetchImageObjectUrl(getClient(), `/claims/${claimUuid}/documents/${documentUuid}`);
}

export async function fetchClaimsByModule(productModule) {
  let backendList = [];
  try {
    const { data } = await getClient().get(`/claims/module/${productModule}`);
    backendList = Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn(`fetchClaimsByModule (${productModule}) error:`, e.message);
  }
  const local = JSON.parse(localStorage.getItem('nyala_claims') || '[]');
  const localFiltered = local.filter(c => c.productModule === productModule);
  return [...localFiltered, ...backendList];
}

export async function fetchAllClaims() {
  let backendList = [];
  try {
    const { data } = await getClient().get('/claims');
    backendList = Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('fetchAllClaims error:', e.message);
  }
  const local = JSON.parse(localStorage.getItem('nyala_claims') || '[]');
  return [...local, ...backendList];
}

export async function updateClaimStatus(claimUuid, status, approvedAmount = null) {
  const params = { status };
  if (approvedAmount) params.approvedAmount = approvedAmount;
  const { data } = await getClient().put(`/claims/${claimUuid}/status`, null, { params });
  return data;
}

export async function assignClaimAdjustor(claimUuid, adjustorUuid) {
  const { data } = await getClient().put(`/claims/${claimUuid}/assign-adjustor`, { adjustorUuid });
  return data;
}

export async function assignClaimGarage(claimUuid, garageUuid) {
  const { data } = await getClient().put(`/claims/${claimUuid}/assign-garage`, { garageUuid });
  return data;
}

// ─── MOTOR SPECIFIC WORKFLOW (SURVEY, BIDDING, SUBROGATION) ────────────────────

export async function recordSpotSurvey(payload) {
  const { data } = await getClient().post('/motor/spot-survey', payload);
  return data;
}

export async function submitGarageBid(payload) {
  const { data } = await getClient().post('/motor/garage-bids', payload);
  return data;
}

export async function fetchGarageBids(claimUuid) {
  try {
    const { data } = await getClient().get(`/motor/garage-bids/${claimUuid}`);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('fetchGarageBids error:', e.message);
    return [];
  }
}

export async function selectWinningGarageBid(bidUuid) {
  const { data } = await getClient().put(`/motor/garage-bids/${bidUuid}/select`);
  return data;
}

export async function initiateSubrogation(payload) {
  const { data } = await getClient().post('/motor/subrogation', payload);
  return data;
}

// ─── MOTOR PROPOSAL & PAYMENT API ──────────────────────────────────────────

export async function submitMotorProposal(payload) {
  try {
    const { data } = await getClient().post('/motor/proposals', payload);
    return data;
  } catch (e) {
    console.warn('submitMotorProposal error:', e.message);
    const mock = {
      proposalUuid: 'PROP-' + Date.now(),
      proposalNumber: 'NYA-PROP-' + Math.floor(100000 + Math.random() * 900000),
      insuredName: payload.insuredName || 'Abraham Addisu',
      vehiclePlateNumber: payload.vehiclePlateNumber || '3-A98123',
      coverageType: payload.coverageType || 'COMPREHENSIVE',
      totalPremiumAmount: payload.totalPremiumAmount || 18875.00,
      tpPremiumAmount: 1250.00,
      odPremiumAmount: 17625.00,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString()
    };
    const local = JSON.parse(localStorage.getItem('nyala_motor_proposals') || '[]');
    local.unshift(mock);
    localStorage.setItem('nyala_motor_proposals', JSON.stringify(local));
    return mock;
  }
}

function dedupeProposals(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.proposalNumber || item.proposalUuid || (item.vehiclePlateNumber ? `${item.vehiclePlateNumber}-${item.status}` : item.id);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchMotorProposals({ page = 0, limit = 20, status = '' } = {}) {
  try {
    const { data } = await getClient().get('/motor/proposals', {
      params: { page, limit, status }
    });
    const backendList = Array.isArray(data) ? data : (data?.content ?? []);
    if (backendList.length > 0) {
      return dedupeProposals(backendList);
    }
  } catch (e) {
    console.warn('fetchMotorProposals error:', e.message);
  }
  const local = JSON.parse(localStorage.getItem('nyala_motor_proposals') || '[]');
  return local.length ? dedupeProposals(local) : dedupeProposals(SEEDED_MOTOR_PROPOSALS);
}

export async function fetchMotorProposalDetail(proposalUuid) {
  try {
    const { data } = await getClient().get(`/motor/proposals/${proposalUuid}`);
    if (data) return data;
  } catch (e) {
    console.warn('fetchMotorProposalDetail error:', e.message);
  }
  const local = JSON.parse(localStorage.getItem('nyala_motor_proposals') || '[]');
  const found = local.find(p => p.proposalUuid === proposalUuid);
  return found || SEEDED_MOTOR_PROPOSALS.find(p => p.proposalUuid === proposalUuid) || SEEDED_MOTOR_PROPOSALS[0];
}

export async function assignProposalAdjustor(proposalUuid, { adjustorUuid, adjustorName }) {
  try {
    const { data } = await getClient().put(`/motor/proposals/${proposalUuid}/assign-adjustor`, {
      adjustorUuid, adjustorName
    });
    return data;
  } catch (e) {
    return { success: true, status: 'ADJUSTOR_ASSIGNED' };
  }
}

function errorResult(e, fallback) {
  const body = e?.response?.data;
  return {
    success: false,
    status: e?.response?.status,
    errorCode: body?.errorCode,
    message: body?.message || e?.message || fallback,
  };
}

/** Adjustor/underwriter inspection finding: PASSED → APPROVED, FAILED → REJECTED. Errors are returned, not faked. */
export async function submitProposalInspection(proposalUuid, { status, notes }) {
  try {
    const { data } = await getClient().post(`/motor/proposals/${proposalUuid}/inspection`, { status, notes });
    return { success: true, ...data };
  } catch (e) {
    return errorResult(e, 'Failed to record the inspection');
  }
}

/** Underwriter approval (SUBMITTED → APPROVED). */
export async function approveProposal(proposalUuid, notes = '') {
  try {
    const { data } = await getClient().post(`/motor/proposals/${proposalUuid}/approve`, { notes });
    return { success: true, ...data };
  } catch (e) {
    return errorResult(e, 'Failed to approve the proposal');
  }
}

/** Underwriter rejection (→ REJECTED). */
export async function rejectProposal(proposalUuid, reason = '') {
  try {
    const { data } = await getClient().post(`/motor/proposals/${proposalUuid}/reject`, { reason });
    return { success: true, ...data };
  } catch (e) {
    return errorResult(e, 'Failed to reject the proposal');
  }
}

/** Latest payment attempt + history for the proposal (read-only for the dashboard). */
export async function fetchProposalPayment(proposalUuid) {
  try {
    const { data } = await getClient().get(`/motor/proposals/${proposalUuid}/payment`);
    return data;
  } catch (e) {
    return null;
  }
}

/** @deprecated the customer pays on mobile; kept for the legacy simulation buttons. */
export async function payTpEthioTelecom(proposalUuid) {
  try {
    const { data } = await getClient().post(`/motor/proposals/${proposalUuid}/pay-tp-ethiotelecom`);
    return { success: true, ...data };
  } catch (e) {
    return errorResult(e, 'TP payment failed');
  }
}

/** @deprecated the customer pays on mobile; kept for the legacy simulation buttons. */
export async function payOdEthiSwitch(proposalUuid, { bankCode = 'CBE', paymentMethod = 'ACCOUNT_TRANSFER' } = {}) {
  try {
    const { data } = await getClient().post(`/motor/proposals/${proposalUuid}/pay-od-ethiswitch`, { bankCode, paymentMethod });
    return { success: true, ...data };
  } catch (e) {
    return errorResult(e, 'OD payment failed');
  }
}

/** Issue the policy contract & certificate. Backend requires status PAID; the real error is returned. */
export async function issueProposalContract(proposalUuid) {
  try {
    const { data } = await getClient().post(`/motor/proposals/${proposalUuid}/issue-contract`);
    return { success: true, ...data };
  } catch (e) {
    return errorResult(e, 'Failed to issue the contract');
  }
}

export const SEEDED_MOTOR_PROPOSALS = [
  {
    proposalUuid: 'PROP-2026-001',
    proposalNumber: 'NYA-PROP-881293',
    insuredUuid: 'INS-881201',
    insuredName: 'Abraham Addisu',
    insuredPhone: '0963048258',
    insuredEmail: 'abroid.et@gmail.com',
    vehiclePlateNumber: '3-A98123',
    chassisNumber: 'CHAS-881923091',
    engineNumber: 'ENG-WD615-9921',
    carName: 'Toyota',
    carModel: 'Land Cruiser 300 V6',
    carType: 'SUV / Station Wagon',
    makeYear: 2023,
    sumInsured: 18500000.00,
    coverageType: 'COMPREHENSIVE',
    endorsementsJson: '["FLOOD_COVER", "BATTERY_ENDORSEMENT", "RADIO_STEREO"]',
    tpPremiumAmount: 1250.00,
    odPremiumAmount: 407000.00,
    totalPremiumAmount: 408250.00,
    tpPaymentStatus: 'PAID',
    tpPaymentRef: 'ETHIO-TP-881923',
    odPaymentStatus: 'PAID',
    odPaymentRef: 'ETHISWITCH-OD-771290',
    assignedAdjustorUuid: 'ADJ-101',
    assignedAdjustorName: 'Dawit Tesfaye (Senior Adjustor)',
    inspectionStatus: 'PASSED',
    inspectionNotes: 'Vehicle pre-inspection clean. Body and glass in perfect condition. Approved for comprehensive endorsement.',
    status: 'CONTRACT_ISSUED',
    createdAt: '2026-08-06T10:15:00Z'
  },
  {
    proposalUuid: 'PROP-2026-002',
    proposalNumber: 'NYA-PROP-772910',
    insuredUuid: 'INS-772102',
    insuredName: 'Kebede Michael',
    insuredPhone: '0911223344',
    insuredEmail: 'kebede@example.com',
    vehiclePlateNumber: '3-B44120',
    chassisNumber: 'CHAS-771920192',
    engineNumber: 'ENG-4HK1-0021',
    carName: 'Isuzu',
    carModel: 'NPR 400 Light Truck',
    carType: 'Commercial Freight Truck',
    makeYear: 2022,
    sumInsured: 6400000.00,
    coverageType: 'COMPREHENSIVE',
    endorsementsJson: '["FLOOD_COVER"]',
    tpPremiumAmount: 2500.00,
    odPremiumAmount: 140800.00,
    totalPremiumAmount: 143300.00,
    tpPaymentStatus: 'PAID',
    tpPaymentRef: 'ETHIO-TP-771201',
    odPaymentStatus: 'PENDING',
    odPaymentRef: null,
    assignedAdjustorUuid: 'ADJ-102',
    assignedAdjustorName: 'Almaz Wolde (Adjustor)',
    inspectionStatus: 'PASSED',
    inspectionNotes: 'Commercial truck physical check passed.',
    status: 'INSPECTION_DONE',
    createdAt: '2026-08-06T11:40:00Z'
  },
  {
    proposalUuid: 'PROP-2026-003',
    proposalNumber: 'NYA-PROP-554109',
    insuredUuid: 'INS-554003',
    insuredName: 'Tigist Bekele',
    insuredPhone: '0922334455',
    insuredEmail: 'tigist@example.com',
    vehiclePlateNumber: '2-C11902',
    chassisNumber: 'CHAS-554109281',
    engineNumber: 'ENG-1.2L-DZIRE',
    carName: 'Suzuki',
    carModel: 'Dzire Sedan',
    carType: 'Private Saloon',
    makeYear: 2023,
    sumInsured: 2450000.00,
    coverageType: 'THIRD_PARTY',
    endorsementsJson: '[]',
    tpPremiumAmount: 1250.00,
    odPremiumAmount: 0.00,
    totalPremiumAmount: 1250.00,
    tpPaymentStatus: 'PAID',
    tpPaymentRef: 'ETHIO-TP-554109',
    odPaymentStatus: 'N/A',
    odPaymentRef: null,
    assignedAdjustorUuid: null,
    assignedAdjustorName: null,
    inspectionStatus: 'NOT_REQUIRED',
    inspectionNotes: 'Third Party mandatory coverage only - no physical inspection required under Reg 554/2024.',
    status: 'TP_PAID',
    createdAt: '2026-08-06T14:10:00Z'
  }
];

// ─── POLICY VALIDATION API ──────────────────────────────────────────────────

export async function validatePolicyCoverage(policyNumber, productModule = 'motor', causeOfLoss = '') {
  try {
    const { data } = await getClient().get('/policies/validate', {
      params: { policyNumber, productModule, causeOfLoss },
    });
    return data;
  } catch (e) {
    console.warn('validatePolicyCoverage error:', e.message);
    return {
      isValid: true,
      policyNumber,
      productModule,
      status: 'ACTIVE',
      validationMessage: 'Fallback local validation active.',
    };
  }
}

