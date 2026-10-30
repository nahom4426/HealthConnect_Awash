import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { fetchImageObjectUrl } from '@/utils/imageBlob';

const apiBase = `${import.meta.env.VITE_BACKEND_HOST}/api/payer/motor/digital-channel`;

function getClient() {
  const auth = useAuthStore();
  const token = auth.auth?.token || auth.auth?.user?.token;
  // The backend authorises from the bearer token's privileges only. The dev "Acting as"
  // role switcher changes what the UI shows; it is never sent to the API.
  return axios.create({
    baseURL: apiBase,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

function isGatewayDown(e) {
  const status = e?.response?.status;
  return status === 502 || status === 503 || status === 504 || !e?.response;
}

// ─── USER & ROLE MANAGEMENT API (SUPER ADMIN) ─────────────────────────────────

export async function fetchUserRoles() {
  try {
    const { data } = await getClient().get('/admin/user-roles');
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('fetchUserRoles error, returning local fallback:', e.message);
    return [
      { id: 1, username: 'admin_underwriter', fullName: 'Underwriter Solomon Tadesse', email: 'underwriter@standardinsurance.com', role: 'ROLE_UNDERWRITER', status: 'ACTIVE' },
      { id: 2, username: 'claim_manager', fullName: 'Claim Manager Tigist Worku', email: 'claim.manager@standardinsurance.com', role: 'ROLE_CLAIM_MANAGER', status: 'ACTIVE' },
      { id: 3, username: 'product_manager', fullName: 'Product Manager Abebe Kebede', email: 'product.manager@standardinsurance.com', role: 'ROLE_PRODUCT_MANAGER', status: 'ACTIVE' },
      { id: 4, username: 'adjustor_dawit', fullName: 'Adjustor Dawit Tesfaye', email: 'adjustor.dawit@standardinsurance.com', role: 'ROLE_ADJUSTOR', status: 'ACTIVE' },
      { id: 5, username: 'customer_biruk', fullName: 'Biruk Hagoss', email: 'biruk.hagos@gmail.com', role: 'ROLE_CUSTOMER', status: 'ACTIVE' },
      { id: 6, username: 'super_admin', fullName: 'System Super Admin', email: 'admin@standardinsurance.com', role: 'ROLE_SUPER_ADMIN', status: 'ACTIVE' }
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
    if (isGatewayDown(e)) {
      throw new Error(
        'Motor service unavailable (502). Claims cannot be submitted until motor digital-channel is healthy.'
      );
    }
    console.warn('submitClaim error:', e.message);
    throw e;
  }
}

export async function fetchClaimByUuid(claimUuid) {
  try {
    const { data } = await getClient().get(`/claims/${claimUuid}`);
    if (data) return data;
  } catch (e) {
    console.warn('fetchClaimByUuid error:', e.message);
  }
  const local = JSON.parse(localStorage.getItem('standard_claims') || '[]');
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
  const local = JSON.parse(localStorage.getItem('standard_claims') || '[]');
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
  const local = JSON.parse(localStorage.getItem('standard_claims') || '[]');
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
    // Do not fake success on train 502 — that hides a broken motor service.
    if (isGatewayDown(e)) {
      throw new Error(
        'Motor service unavailable (502). Proposals cannot be saved until Abrsh redeploys motor digital-channel.'
      );
    }
    console.warn('submitMotorProposal error:', e.message);
    throw e;
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
  const { data } = await getClient().get('/motor/proposals', {
    params: { page, limit, status }
  });
  const backendList = Array.isArray(data) ? data : (data?.content ?? []);
  return dedupeProposals(backendList);
}

export async function fetchMotorProposalDetail(proposalUuid) {
  const { data } = await getClient().get(`/motor/proposals/${proposalUuid}`);
  return data;
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
    // Motor errors use the ApiError envelope: { type, status, detail, properties: { errorCode? } }
    errorCode: body?.properties?.errorCode || body?.errorCode || body?.type,
    message: body?.detail || body?.message || e?.message || fallback,
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

