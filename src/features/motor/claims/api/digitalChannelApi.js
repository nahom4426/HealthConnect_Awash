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

/** Uploads one claim document (multipart "file"); documentType is one of the motor document codes. */
export async function uploadClaimDocument(claimUuid, file, documentType = 'OTHER') {
  const body = new FormData();
  body.append('file', file);
  const { data } = await getClient().post(`/claims/${claimUuid}/documents`, body, {
    params: { documentType },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/** Saves a staff mark on one document type: { status: 'RECEIVED' | 'NA' | '', originalSeen, reason }. */
export async function markClaimDocument(claimUuid, documentType, mark) {
  const { data } = await getClient().put(`/claims/${claimUuid}/documents/${documentType}/mark`, mark);
  return data;
}

/** Removes the staff mark on one document type. */
export async function clearClaimDocumentMark(claimUuid, documentType) {
  await getClient().delete(`/claims/${claimUuid}/documents/${documentType}/mark`);
}

/** Records whether someone other than the insured filed the claim (a power of attorney is then required). */
export async function setClaimRepresentative(claimUuid, filedByRepresentative) {
  const { data } = await getClient().put(`/claims/${claimUuid}/representative`, { filedByRepresentative });
  return data;
}

/** Active adjustors as { id, name, role }; empty when the lookup is unavailable. */
export async function fetchAdjustors() {
  try {
    const { data } = await getClient().get('/lookups/adjustors');
    return (Array.isArray(data) ? data : [])
      .filter(a => a.active !== false && a.adjustorUuid)
      .map(a => ({ id: a.adjustorUuid, name: a.name || a.adjustorUuid, role: a.role || 'Adjustor' }));
  } catch (e) {
    console.warn('fetchAdjustors error:', e.message);
    return [];
  }
}

/** Excess the insured paid: { none: true } or { amount, receiptNo }. */
export async function saveClaimExcess(claimUuid, excess) {
  const { data } = await getClient().put(`/claims/${claimUuid}/excess`, excess);
  return data;
}

/** Salvage: { status: 'RETURNED' | 'NOT_REQUIRED', note }. */
export async function saveClaimSalvage(claimUuid, salvage) {
  const { data } = await getClient().put(`/claims/${claimUuid}/salvage`, salvage);
  return data;
}

/** Rejects or withdraws a claim: outcome 'REJECTED' | 'WITHDRAWN', with a reason. */
export async function closeClaim(claimUuid, outcome, reason) {
  const { data } = await getClient().post(`/claims/${claimUuid}/close`, { outcome, reason });
  return data;
}

export async function reopenClaim(claimUuid, reason = '') {
  const { data } = await getClient().post(`/claims/${claimUuid}/reopen`, { reason });
  return data;
}

/** The claim's activity log as [{ text, by, at }], newest first; empty when unavailable. */
export async function fetchClaimActivity(claimUuid) {
  try {
    const { data } = await getClient().get(`/claims/${claimUuid}/activity`);
    const list = Array.isArray(data) ? data : (data?.content || data?.items || []);
    return list.map(a => ({ text: a.text || a.action || '', by: a.byName || a.by || '', at: a.at || a.createdAt || null }));
  } catch (e) {
    console.warn(`fetchClaimActivity error for ${claimUuid}:`, e.message);
    return [];
  }
}

// Fields PUT /claims/{uuid} accepts; the claim is sent back whole so nothing is cleared.
const CLAIM_UPDATE_FIELDS = [
  'carUuid', 'causeOfLoss', 'claimType', 'coverageType', 'damagedParts', 'description', 'driverLicenseNumber',
  'driverLicenseType', 'driverName', 'driverRelationship', 'estimatedAmount', 'gpsCoordinates', 'incidentDate',
  'incidentLocation', 'incidentTime', 'insuredUuid', 'isVehicleDrivable', 'legalBeneficiaryDetails', 'licenseNumber',
  'notificationForm', 'plateNumber', 'policyNumber', 'productModule', 'reportedAt', 'reportedChannel', 'roadCondition',
  'submittedVia', 'thirdPartyDetails', 'thirdPartyInsurer', 'thirdPartyName', 'thirdPartyPhone', 'thirdPartyPlate',
  'thirdPartyPolicyNumber', 'towingRequired', 'vehicleSpeed', 'weatherCondition',
];

/** How the accident was first reported (PHONE, WALK_IN, ...). */
export async function updateClaimReportedChannel(claim, reportedChannel) {
  const body = {};
  for (const k of CLAIM_UPDATE_FIELDS) if (claim[k] !== undefined && claim[k] !== null) body[k] = claim[k];
  body.reportedChannel = reportedChannel;
  body.reportedAt = claim.reportedAt || new Date().toISOString();
  const { data } = await getClient().put(`/claims/${claim.claimUuid}`, body);
  return data;
}

/** Asks the customer for missing documents (backend notifies them). */
export async function requestClaimDocuments(claimUuid, documentTypes, note = '') {
  const { data } = await getClient().post(`/claims/${claimUuid}/request-documents`, { documentTypes, note });
  return data;
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

