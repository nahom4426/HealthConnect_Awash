<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from '@/components/Button.vue';
import { revokeObjectUrls } from '@/utils/imageBlob';
import {
  fetchQuotationById,
  fetchLibreImages,
  listCarImages,
  fetchCarImageByUuid,
  saveInitialDeposit,
  updateInitialDepositStatus,
  setQuotationAmounts,
} from '../api/motorApi.js';
import { submitMotorProposal } from '@/features/motor/claims/api/digitalChannelApi';

const route  = useRoute();
const router = useRouter();
const uuid   = route.params.quotationUuid;

// ── state ─────────────────────────────────────────────────────────────────────
const q           = ref(null);
const loading     = ref(false);
const error       = ref('');
const success     = ref('');
const saving      = ref(false);

// ── libre images ──────────────────────────────────────────────────────────────
const libreFront   = ref(null);
const libreBack    = ref(null);
const libreLoading = ref(false);
const showLibreModal = ref(false);
const libreModalSrc  = ref('');
const libreModalTitle = ref('');

// ── car images ────────────────────────────────────────────────────────────────
const carImages = ref([]);
const carImagesLoading = ref(false);

// ── quotation amount editing ───────────────────────────────────────────────────
const editingAmount = ref(false);
const editAmount    = ref('');

// ── status action modal ───────────────────────────────────────────────────────
const showStatusModal    = ref(false);
const statusModalAction  = ref('');   // 'saveDeposit' | 'updateStatus'
const selectedStatus     = ref('');
const statusRemark       = ref('');

const DEPOSIT_STATUSES = ['PENDING', 'CHECKED', 'REQUESTED', 'DEPOSITED', 'DECLINED', 'DISPERSED'];

// ── load ──────────────────────────────────────────────────────────────────────
async function loadQuotation() {
  loading.value = true;
  error.value = '';
  try {
    const data = await fetchQuotationById(uuid);
    q.value = data;
    editAmount.value = data?.quotationAmount ?? '';
    if (data?.carUuid) {
      loadLibre(data.carUuid);
      loadCarImages(data.carUuid);
    }
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Failed to load quotation';
  } finally {
    loading.value = false;
  }
}

async function loadLibre(carUuid) {
  libreLoading.value = true;
  try {
    const [front, back] = await Promise.allSettled([
      fetchLibreImages(`${carUuid}_front`),
      fetchLibreImages(`${carUuid}_back`),
    ]);
    libreFront.value = front.status === 'fulfilled' ? front.value : null;
    libreBack.value  = back.status  === 'fulfilled' ? back.value  : null;
  } catch (_) {
    // libre images optional
  } finally {
    libreLoading.value = false;
  }
}

async function loadCarImages(carUuid) {
  carImagesLoading.value = true;
  try {
    const list = await listCarImages(carUuid);
    const loadedImages = [];
    for (const img of list) {
      if (img.imageUuid) {
        const src = await fetchCarImageByUuid(img.imageUuid);
        if (src) {
          loadedImages.push({
            name: img.imageName || 'Car Image',
            src: src
          });
        }
      }
    }
    carImages.value = loadedImages;
  } catch (e) {
    console.warn('Failed to load car images');
  } finally {
    carImagesLoading.value = false;
  }
}

onMounted(loadQuotation);
onBeforeUnmount(() => {
  revokeObjectUrls([libreFront.value, libreBack.value, ...carImages.value.map(i => i.src)]);
});

// ── helpers ───────────────────────────────────────────────────────────────────
function statusMeta(status) {
  const map = {
    PENDING:    { cls: 'qd-st-pending',   label: 'Pending'   },
    CHECKED:    { cls: 'qd-st-checked',   label: 'Checked'   },
    REQUESTED:  { cls: 'qd-st-requested', label: 'Requested' },
    DEPOSITED:  { cls: 'qd-st-deposited', label: 'Deposited' },
    DECLINED:   { cls: 'qd-st-declined',  label: 'Declined'  },
    DISPERSED:  { cls: 'qd-st-dispersed', label: 'Dispersed' },
  };
  return map[status] || { cls: 'qd-st-default', label: status || '—' };
}

function fmt(val) {
  if (val == null) return '—';
  return 'ETB ' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function fullName(item) {
  return [item?.clientFirstName, item?.clientFatherName, item?.clientGrandFatherName].filter(Boolean).join(' ');
}

function categoryPath(item) {
  return [item?.category1, item?.category2, item?.category3, item?.category4].filter(Boolean).join(' › ');
}

const deposit  = computed(() => q.value ? q.value.quotationAmount * 0.22 : 0);
const monthly  = computed(() => q.value ? q.value.quotationAmount / 12  : 0);
const isPending = computed(() => q.value?.quotationStatus === 'PENDING');

// ── quotation amount save ─────────────────────────────────────────────────────
async function saveAmount() {
  const amount = parseFloat(editAmount.value);
  if (isNaN(amount) || amount <= 0) { error.value = 'Enter a valid amount'; return; }
  saving.value = true;
  error.value = '';
  success.value = '';
  try {
    await setQuotationAmounts(uuid, {
      quotation: amount,
      deposit:   amount * 0.22,
      premium:   amount / 12,
    });
    q.value.quotationAmount = amount;
    editingAmount.value = false;
    success.value = 'Quotation amount updated';
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Update failed';
  } finally {
    saving.value = false;
  }
}

// ── deposit actions ───────────────────────────────────────────────────────────
function openSaveDeposit() {
  statusModalAction.value = 'saveDeposit';
  showStatusModal.value = true;
}

function openUpdateStatus() {
  statusModalAction.value = 'updateStatus';
  selectedStatus.value = '';
  statusRemark.value = '';
  showStatusModal.value = true;
}

async function confirmStatusAction() {
  saving.value = true;
  error.value = '';
  success.value = '';
  try {
    if (statusModalAction.value === 'saveDeposit') {
      await saveInitialDeposit(uuid);
      success.value = 'Initial deposit saved successfully';
    } else {
      if (!selectedStatus.value) { error.value = 'Select a status'; saving.value = false; return; }
      await updateInitialDepositStatus(uuid, {
        initialDepositStatus: selectedStatus.value,
        remark: statusRemark.value,
      });
      success.value = `Status updated to ${selectedStatus.value}`;
    }
    showStatusModal.value = false;
    await loadQuotation();
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Action failed';
  } finally {
    saving.value = false;
  }
}

async function convertToProposal() {
  saving.value = true;
  error.value = '';
  success.value = '';
  try {
    const payload = {
      insuredName: fullName(q.value),
      vehiclePlateNumber: q.value.plateNumber,
      coverageType: 'COMPREHENSIVE',
      totalPremiumAmount: q.value.quotationAmount,
    };
    const res = await submitMotorProposal(payload);
    success.value = 'Quotation converted to proposal successfully!';
    setTimeout(() => router.push(`/motor/proposals/${res.proposalUuid}`), 1500);
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Failed to convert to proposal';
  } finally {
    saving.value = false;
  }
}

// ── libre viewer ──────────────────────────────────────────────────────────────
function viewImage(title, src) {
  libreModalTitle.value = title;
  libreModalSrc.value   = src;
  showLibreModal.value  = true;
}
</script>

<template>
  <div class="qd-root">

    <!-- Back + header -->
    <div class="qd-topbar">
      <button class="qd-back-btn" @click="router.push('/motor/quotation')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        Back
      </button>
      <div v-if="q" class="qd-breadcrumb">
        <span class="qd-bc-dim">Quotations</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px;color:#94a3b8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        <span class="qd-bc-cur">{{ fullName(q) || q.quotationUuid }}</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="qd-center">
      <svg class="qd-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:28px;height:28px;color:#6366f1"><path stroke-linecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
    </div>

    <!-- Error -->
    <div v-else-if="error && !q" class="qd-center qd-err-text">{{ error }}</div>

    <template v-if="q">

      <!-- Page header (All in one horizontal row) -->
      <div class="qd-page-header">
        <div class="qd-header-left">
          <div class="qd-avatar-lg">{{ (q.clientFirstName || '?')[0].toUpperCase() }}</div>
          <div class="qd-header-title-box">
            <div class="qd-header-name-row">
              <h1 class="qd-client-name">{{ fullName(q) }}</h1>
              <span :class="['qd-status-badge', statusMeta(q.quotationStatus).cls]">
                {{ statusMeta(q.quotationStatus).label }}
              </span>
            </div>
            <div class="qd-client-meta">
              <span>{{ q.clientEmail || '' }}</span>
              <span v-if="q.clientEmail && q.clientPhoneNumber">·</span>
              <span>{{ q.clientPhoneNumber || '' }}</span>
            </div>
          </div>
        </div>

        <div class="qd-header-actions">
          <button v-if="isPending" class="qd-btn qd-btn-deposit" @click="openSaveDeposit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Save Deposit
          </button>
          <button class="qd-btn qd-btn-status" @click="openUpdateStatus">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Update Status
          </button>
          <button class="qd-btn qd-btn-confirm" @click="convertToProposal" :disabled="saving">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Convert to Proposal
          </button>
        </div>
      </div>

      <!-- Alerts -->
      <div v-if="error" class="qd-alert qd-alert-err">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v4m0 4h.01"/></svg>
        {{ error }}
        <button class="qd-alert-close" @click="error = ''">×</button>
      </div>
      <div v-if="success" class="qd-alert qd-alert-ok">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        {{ success }}
        <button class="qd-alert-close" @click="success = ''">×</button>
      </div>

      <!-- Main grid -->
      <div class="qd-grid">

        <!-- LEFT: Client + Vehicle -->
        <div class="qd-col qd-col-left">

          <!-- Client Info Card -->
          <div class="qd-card">
            <div class="qd-card-head">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;color:#2563eb"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              <span>Client Information</span>
            </div>
            <div class="qd-card-body">
              <div class="qd-spec-table">
                <div class="qd-spec-row">
                  <span class="qd-spec-lbl">First Name</span>
                  <span class="qd-spec-val font-bold">{{ q.clientFirstName || '—' }}</span>
                </div>
                <div class="qd-spec-row">
                  <span class="qd-spec-lbl">Father Name</span>
                  <span class="qd-spec-val font-bold">{{ q.clientFatherName || '—' }}</span>
                </div>
                <div class="qd-spec-row">
                  <span class="qd-spec-lbl">Grand Father</span>
                  <span class="qd-spec-val">{{ q.clientGrandFatherName || '—' }}</span>
                </div>
                <div class="qd-spec-row">
                  <span class="qd-spec-lbl">Phone Number</span>
                  <span class="qd-spec-val font-mono">{{ q.clientPhoneNumber || '—' }}</span>
                </div>
                <div class="qd-spec-row">
                  <span class="qd-spec-lbl">Email Address</span>
                  <span class="qd-spec-val qd-break">{{ q.clientEmail || '—' }}</span>
                </div>
                <div class="qd-spec-row">
                  <span class="qd-spec-lbl">Insurance Policy</span>
                  <span class="qd-spec-val">
                    <span class="qd-plan-chip">{{ q.insurance || 'Standard Motor Comprehensive Policy' }}</span>
                  </span>
                </div>
                <div v-if="q.accountNumber" class="qd-spec-row">
                  <span class="qd-spec-lbl">Account No.</span>
                  <span class="qd-spec-val font-mono">{{ q.accountNumber }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Vehicle Details Card -->
          <div class="qd-card">
            <div class="qd-card-head">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;color:#0284c7"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM4 17H3v-4l3-5h10l3 5v4h-1M9 17h6"/></svg>
              <span>Vehicle Details</span>
            </div>
            <div class="qd-card-body">
              <div class="qd-spec-table">
                <div class="qd-spec-row">
                  <span class="qd-spec-lbl">Car Name</span>
                  <span class="qd-spec-val font-bold text-blue">{{ q.carName || '—' }}</span>
                </div>
                <div class="qd-spec-row">
                  <span class="qd-spec-lbl">Body Type</span>
                  <span class="qd-spec-val">
                    <span class="qd-type-chip">{{ q.carType || '—' }}</span>
                  </span>
                </div>
                <div class="qd-spec-row">
                  <span class="qd-spec-lbl">Model Spec</span>
                  <span class="qd-spec-val">{{ q.carModel || '—' }}</span>
                </div>
                <div class="qd-spec-row">
                  <span class="qd-spec-lbl">Make Year</span>
                  <span class="qd-spec-val font-bold">{{ q.makeYear || '—' }}</span>
                </div>
                <div v-if="q.engine_No" class="qd-spec-row">
                  <span class="qd-spec-lbl">Engine No.</span>
                  <span class="qd-spec-val font-mono">{{ q.engine_No }}</span>
                </div>
              </div>

              <div v-if="categoryPath(q)" class="qd-cat-strip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/></svg>
                <span>{{ categoryPath(q) }}</span>
              </div>
            </div>
          </div>

        </div>

        <!-- RIGHT: Quotation + Libre -->
        <div class="qd-col qd-col-right">

          <!-- Quotation Details -->
          <div class="qd-card">
            <div class="qd-card-head">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:#10b981"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Quotation Details
            </div>
            <div class="qd-card-body">
              <!-- Amount row -->
              <div class="qd-amount-row">
                <span class="qd-amount-label">Quotation Amount</span>
                <div v-if="!editingAmount" class="qd-amount-display">
                  <span class="qd-amount-val">{{ fmt(q.quotationAmount) }}</span>
                  <button v-if="isPending" class="qd-edit-btn" @click="editingAmount = true; editAmount = q.quotationAmount">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                </div>
                <div v-else class="qd-amount-edit">
                  <span class="qd-currency">ETB</span>
                  <input v-model="editAmount" type="number" class="qd-amount-input" />
                  <button class="qd-save-btn" :disabled="saving" @click="saveAmount">{{ saving ? '…' : 'Save' }}</button>
                  <button class="qd-cancel-btn" @click="editingAmount = false">✕</button>
                </div>
              </div>

              <div class="qd-divider"></div>

              <div class="qd-fin-row">
                <div class="qd-fin-item qd-fin-deposit">
                  <div class="qd-fin-lbl">Initial Deposit (22%)</div>
                  <div class="qd-fin-val">{{ fmt(deposit) }}</div>
                </div>
                <div class="qd-fin-item qd-fin-monthly">
                  <div class="qd-fin-lbl">Monthly Payment</div>
                  <div class="qd-fin-val">{{ fmt(monthly) }}</div>
                </div>
              </div>

              <div class="qd-divider"></div>

              <div class="qd-info-grid">
                <div class="qd-info-label">Quotation Date</div>
                <div class="qd-info-val">{{ fmtDate(q.quotationDate) }}</div>
                <div class="qd-info-label">Deposit Status</div>
                <div class="qd-info-val">
                  <span v-if="q.initialDepositStatus" :class="['qd-status-sm', statusMeta(q.initialDepositStatus).cls]">
                    {{ statusMeta(q.initialDepositStatus).label }}
                  </span>
                  <span v-else class="qd-muted">—</span>
                </div>
                <div class="qd-info-label">Deposit Amount</div>
                <div class="qd-info-val">{{ fmt(q.initialDeposit) }}</div>
                <div v-if="q.declineReason" class="qd-info-label">Decline Reason</div>
                <div v-if="q.declineReason" class="qd-info-val qd-text-red">{{ q.declineReason }}</div>
                <div v-if="q.updatedQuotationAmount" class="qd-info-label">Updated Amount</div>
                <div v-if="q.updatedQuotationAmount" class="qd-info-val">{{ fmt(q.updatedQuotationAmount) }}</div>
              </div>

              <!-- Approve flags -->
              <div class="qd-flags">
                <div :class="['qd-flag', q.checked ? 'qd-flag-on' : 'qd-flag-off']">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                  Checked
                </div>
                <div :class="['qd-flag', q.clientAgreed ? 'qd-flag-on' : 'qd-flag-off']">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                  Client Agreed
                </div>
                <div :class="['qd-flag', q.libreSaved ? 'qd-flag-on' : 'qd-flag-off']">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                  Libre Saved
                </div>
              </div>
            </div>
          </div>

          <!-- Libre Documents -->
          <div class="qd-card">
            <div class="qd-card-head">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:#f59e0b"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Libre Documents
            </div>
            <div class="qd-card-body">
              <div v-if="libreLoading" class="qd-libre-loading">
                <svg class="qd-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;color:#94a3b8"><path stroke-linecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Loading libre images…
              </div>
              <div v-else class="qd-libre-grid">
                <!-- Front -->
                <div class="qd-libre-item">
                  <div class="qd-libre-label">Front Page</div>
                  <div v-if="libreFront" class="qd-libre-img-wrap" @click="viewImage('Front Page', libreFront)">
                    <img :src="libreFront" class="qd-libre-img" alt="Front libre" />
                    <div class="qd-libre-overlay">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;color:#fff"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </div>
                  </div>
                  <div v-else class="qd-libre-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:28px;height:28px;color:#cbd5e1"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    <span>No front page</span>
                  </div>
                </div>
                <!-- Back -->
                <div class="qd-libre-item">
                  <div class="qd-libre-label">Back Page</div>
                  <div v-if="libreBack" class="qd-libre-img-wrap" @click="viewImage('Back Page', libreBack)">
                    <img :src="libreBack" class="qd-libre-img" alt="Back libre" />
                    <div class="qd-libre-overlay">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;color:#fff"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </div>
                  </div>
                  <div v-else class="qd-libre-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:28px;height:28px;color:#cbd5e1"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    <span>No back page</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Car Images -->
          <div class="qd-card">
            <div class="qd-card-head">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:#10b981"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              Vehicle Pre-Inspection Photos
            </div>
            <div class="qd-card-body">
              <div v-if="carImagesLoading" class="qd-libre-loading">
                <svg class="qd-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;color:#94a3b8"><path stroke-linecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Loading car images…
              </div>
              <div v-else-if="carImages.length > 0" class="qd-libre-grid">
                <div v-for="img in carImages" :key="img.name" class="qd-libre-item">
                  <div class="qd-libre-label">{{ img.name }}</div>
                  <div class="qd-libre-img-wrap" @click="viewImage(img.name, img.src)">
                    <img :src="img.src" class="qd-libre-img" :alt="img.name" />
                    <div class="qd-libre-overlay">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;color:#fff"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="qd-libre-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:28px;height:28px;color:#cbd5e1"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <span>No car photos uploaded</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </template>

    <!-- ── Status Action Modal ── -->
    <Teleport to="body">
      <Transition name="qd-modal">
        <div v-if="showStatusModal" class="qd-overlay" @click.self="showStatusModal = false">
          <div class="qd-modal">
            <div class="qd-modal-head">
              <h3>{{ statusModalAction === 'saveDeposit' ? 'Save Initial Deposit' : 'Update Deposit Status' }}</h3>
              <button class="qd-modal-close" @click="showStatusModal = false">×</button>
            </div>
            <div class="qd-modal-body">
              <template v-if="statusModalAction === 'saveDeposit'">
                <p class="qd-modal-desc">
                  This will mark the initial deposit as saved for quotation <strong>{{ q?.quotationUuid }}</strong>.
                </p>
                <div class="qd-modal-info">
                  <div class="qd-modal-info-row">
                    <span>Client</span><strong>{{ fullName(q) }}</strong>
                  </div>
                  <div class="qd-modal-info-row">
                    <span>Amount</span><strong>{{ fmt(q?.quotationAmount) }}</strong>
                  </div>
                  <div class="qd-modal-info-row">
                    <span>Deposit (22%)</span><strong>{{ fmt(deposit) }}</strong>
                  </div>
                </div>
              </template>
              <template v-else>
                <p class="qd-modal-desc">Select the new deposit status:</p>
                <div class="qd-status-grid">
                  <button
                    v-for="s in DEPOSIT_STATUSES"
                    :key="s"
                    :class="['qd-status-opt', selectedStatus === s ? 'qd-status-opt-sel' : '']"
                    @click="selectedStatus = s"
                  >
                    {{ s }}
                  </button>
                </div>
                <div class="qd-field" style="margin-top:0.85rem">
                  <label class="qd-field-label">Remark (optional)</label>
                  <textarea v-model="statusRemark" class="qd-textarea" rows="2" placeholder="Add a remark…"></textarea>
                </div>
              </template>
            </div>
            <div class="qd-modal-foot">
              <button class="qd-btn qd-btn-cancel" @click="showStatusModal = false">Cancel</button>
              <button class="qd-btn qd-btn-confirm" :disabled="saving" @click="confirmStatusAction">
                {{ saving ? 'Processing…' : (statusModalAction === 'saveDeposit' ? 'Confirm Deposit' : 'Update Status') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Libre Image Viewer Modal ── -->
    <Teleport to="body">
      <Transition name="qd-modal">
        <div v-if="showLibreModal" class="qd-overlay qd-overlay-dark" @click.self="showLibreModal = false">
          <div class="qd-img-modal">
            <div class="qd-modal-head">
              <h3>{{ libreModalTitle }}</h3>
              <button class="qd-modal-close" @click="showLibreModal = false">×</button>
            </div>
            <div class="qd-img-body">
              <img :src="libreModalSrc" class="qd-img-full" :alt="libreModalTitle" />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.qd-root { padding: 1.5rem 2rem; min-height: 100%; background: #f8fafc; }

/* Topbar */
.qd-topbar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.qd-back-btn { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.85rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.78rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.15s; }
.qd-back-btn:hover { background: #f1f5f9; }
.qd-breadcrumb { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; }
.qd-bc-dim { color: #94a3b8; }
.qd-bc-cur { color: #374151; font-weight: 600; }

/* Center / loading */
.qd-center { display: flex; justify-content: center; align-items: center; padding: 4rem; }
.qd-err-text { color: #b91c1c; font-size: 0.88rem; }

/* Page header (Single Flex Row) */
.qd-page-header {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  margin-bottom: 1.25rem; padding: 0.9rem 1.25rem; background: #fff;
  border: 1px solid #e2e8f0; border-radius: 0.875rem; flex-wrap: wrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}
.qd-header-left { display: flex; align-items: center; gap: 0.85rem; }
.qd-avatar-lg { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #1e40af, #2563eb); color: #fff; font-size: 1.05rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 3px 10px rgba(37,99,235,0.22); }
.qd-header-title-box { display: flex; flex-direction: column; gap: 0.15rem; }
.qd-header-name-row { display: flex; align-items: center; gap: 0.65rem; }
.qd-client-name { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.2; }
.qd-client-meta { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; color: #64748b; flex-wrap: wrap; }
.qd-header-actions { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin-left: auto; }

/* Status badge */
.qd-status-badge { display: inline-flex; align-items: center; padding: 0.2rem 0.65rem; border-radius: 9999px; font-size: 0.72rem; font-weight: 700; }
.qd-status-sm    { display: inline-flex; align-items: center; padding: 0.15rem 0.5rem;  border-radius: 9999px; font-size: 0.68rem; font-weight: 700; }
.qd-st-pending   { background: #fef9c3; color: #92400e; border: 1px solid #fde68a; }
.qd-st-checked   { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.qd-st-requested { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }
.qd-st-deposited { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.qd-st-declined  { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.qd-st-dispersed { background: #ecfdf5; color: #065f46; border: 1px solid #6ee7b7; }
.qd-st-default   { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }

/* Buttons */
.qd-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 1rem; border-radius: 0.5rem; font-size: 0.78rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
.qd-btn-deposit { background: linear-gradient(135deg, #10b981, #059669); color: #fff; }
.qd-btn-deposit:hover { opacity: 0.9; }
.qd-btn-status  { background: linear-gradient(135deg, #1e40af, #2563eb); color: #fff; box-shadow: 0 2px 8px rgba(37,99,235,0.22); }
.qd-btn-status:hover { opacity: 0.9; }
.qd-btn-cancel  { background: #f1f5f9; color: #374151; border: 1px solid #e2e8f0; }
.qd-btn-cancel:hover { background: #e2e8f0; }
.qd-btn-confirm { background: linear-gradient(135deg, #1e40af, #2563eb); color: #fff; }
.qd-btn-confirm:hover:not(:disabled) { opacity: 0.9; }
.qd-btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

/* Alerts */
.qd-alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; border-radius: 0.5rem; font-size: 0.78rem; font-weight: 500; margin-bottom: 0.75rem; }
.qd-alert-err { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.qd-alert-ok  { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.qd-alert-close { margin-left: auto; background: none; border: none; cursor: pointer; color: inherit; font-size: 1rem; opacity: 0.7; }
.qd-alert-close:hover { opacity: 1; }

/* Main grid */
.qd-grid { display: grid; grid-template-columns: 360px 1fr; gap: 1.25rem; }
@media (max-width: 900px) { .qd-grid { grid-template-columns: 1fr; } }
.qd-col { display: flex; flex-direction: column; gap: 1.25rem; }

/* Card */
.qd-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 0.875rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
.qd-card-head { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 0.82rem; font-weight: 700; color: #374151; }
.qd-card-body { padding: 1.15rem 1.25rem; }

/* Executive Specification Table */
.qd-spec-table { display: flex; flex-direction: column; }
.qd-spec-row {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: 0.65rem 0; border-bottom: 1px solid #f1f5f9; font-size: 0.82rem;
}
.qd-spec-row:last-child { border-bottom: none; padding-bottom: 0; }
.qd-spec-row:first-child { padding-top: 0; }
.qd-spec-lbl { font-size: 0.76rem; font-weight: 600; color: #64748b; min-width: 100px; flex-shrink: 0; }
.qd-spec-val { color: #0f172a; text-align: right; word-break: break-word; font-weight: 600; }
.font-bold { font-weight: 700; }
.font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.8rem; letter-spacing: -0.01em; }
.text-blue { color: #1d4ed8; }

.qd-plan-chip {
  display: inline-flex; align-items: center;
  padding: 0.2rem 0.6rem; border-radius: 0.375rem;
  background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;
  font-size: 0.74rem; font-weight: 700;
}
.qd-type-chip {
  display: inline-flex; align-items: center;
  padding: 0.2rem 0.6rem; border-radius: 0.375rem;
  background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;
  font-size: 0.74rem; font-weight: 700;
}

/* Info grid */
.qd-info-grid { display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1.25rem; align-items: start; }
.qd-info-label { font-size: 0.72rem; font-weight: 600; color: #64748b; white-space: nowrap; padding-top: 0.05rem; }
.qd-info-val   { font-size: 0.82rem; color: #0f172a; }
.qd-fw6 { font-weight: 700; }
.qd-break { word-break: break-all; }
.qd-muted { color: #94a3b8; }
.qd-text-red { color: #dc2626; }

/* Category strip */
.qd-cat-strip { display: inline-flex; align-items: center; gap: 0.35rem; margin-top: 0.85rem; background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; border-radius: 0.4rem; padding: 0.35rem 0.7rem; font-size: 0.72rem; font-weight: 600; width: 100%; box-sizing: border-box; }

/* Quotation amount */
.qd-amount-row { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.qd-amount-label { font-size: 0.78rem; font-weight: 600; color: #64748b; }
.qd-amount-display { display: flex; align-items: center; gap: 0.5rem; }
.qd-amount-val { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
.qd-edit-btn { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; color: #2563eb; cursor: pointer; padding: 0.25rem; display: flex; }
.qd-edit-btn:hover { background: #dbeafe; }
.qd-amount-edit { display: flex; align-items: center; gap: 0.4rem; }
.qd-currency { font-size: 0.78rem; font-weight: 600; color: #64748b; }
.qd-amount-input { width: 110px; padding: 0.35rem 0.6rem; border: 1.5px solid #6366f1; border-radius: 0.4rem; font-size: 0.85rem; outline: none; }
.qd-save-btn { background: #10b981; color: #fff; border: none; border-radius: 0.4rem; padding: 0.35rem 0.65rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; }
.qd-save-btn:disabled { opacity: 0.5; }
.qd-cancel-btn { background: #f1f5f9; color: #374151; border: none; border-radius: 0.4rem; padding: 0.35rem 0.5rem; font-size: 0.75rem; cursor: pointer; }

/* Divider */
.qd-divider { border: none; border-top: 1px solid #f1f5f9; margin: 1rem 0; }

/* Financial summary */
.qd-fin-row { display: flex; gap: 0.85rem; flex-wrap: wrap; }
.qd-fin-item { flex: 1; padding: 0.75rem 1rem; border-radius: 0.625rem; min-width: 120px; }
.qd-fin-deposit { background: #f0fdf4; border: 1px solid #bbf7d0; }
.qd-fin-monthly { background: #f5f3ff; border: 1px solid #ddd6fe; }
.qd-fin-lbl { font-size: 0.68rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.3rem; }
.qd-fin-val { font-size: 0.92rem; font-weight: 800; color: #0f172a; }
.qd-fin-deposit .qd-fin-val { color: #15803d; }
.qd-fin-monthly .qd-fin-val { color: #6d28d9; }

/* Flags */
.qd-flags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.85rem; }
.qd-flag { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.2rem 0.55rem; border-radius: 9999px; font-size: 0.68rem; font-weight: 700; border: 1px solid; }
.qd-flag-on  { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
.qd-flag-off { background: #f8fafc; color: #94a3b8; border-color: #e2e8f0; }

/* Libre */
.qd-libre-loading { display: flex; align-items: center; gap: 0.5rem; color: #94a3b8; font-size: 0.82rem; padding: 1.5rem 0; justify-content: center; }
.qd-libre-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.qd-libre-item { display: flex; flex-direction: column; gap: 0.5rem; }
.qd-libre-label { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
.qd-libre-img-wrap { position: relative; cursor: pointer; border-radius: 0.625rem; overflow: hidden; border: 2px solid #e2e8f0; }
.qd-libre-img { width: 100%; height: 160px; object-fit: cover; display: block; }
.qd-libre-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0); display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
.qd-libre-img-wrap:hover .qd-libre-overlay { background: rgba(0,0,0,0.4); }
.qd-libre-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; height: 160px; border: 2px dashed #e2e8f0; border-radius: 0.625rem; background: #f8fafc; color: #94a3b8; font-size: 0.75rem; }

/* Modal */
.qd-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.45); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 1rem; overflow-y: auto; }
.qd-overlay-dark { background: rgba(0,0,0,0.75); }
.qd-modal { background: #fff; border-radius: 0.875rem; box-shadow: 0 20px 60px rgba(0,0,0,0.18); width: 100%; max-width: 480px; overflow: hidden; margin: auto; }
.qd-img-modal { background: #1e293b; border-radius: 0.875rem; width: 100%; max-width: 860px; overflow: hidden; margin: auto; }
.qd-modal-head { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; }
.qd-modal-head h3 { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0; }
.qd-img-modal .qd-modal-head { border-color: #334155; }
.qd-img-modal .qd-modal-head h3 { color: #f8fafc; }
.qd-modal-close { background: none; border: none; cursor: pointer; font-size: 1.25rem; color: #64748b; line-height: 1; padding: 0 0.25rem; }
.qd-img-modal .qd-modal-close { color: #94a3b8; }
.qd-modal-body { padding: 1.25rem; }
.qd-modal-desc { font-size: 0.85rem; color: #374151; margin: 0 0 1rem; }
.qd-modal-info { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.75rem 1rem; display: flex; flex-direction: column; gap: 0.4rem; }
.qd-modal-info-row { display: flex; justify-content: space-between; font-size: 0.8rem; color: #374151; }
.qd-modal-info-row strong { color: #0f172a; }
.qd-modal-foot { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 0.875rem 1.25rem; border-top: 1px solid #f1f5f9; background: #f8fafc; }
.qd-img-body { padding: 1.25rem; display: flex; justify-content: center; }
.qd-img-full { max-width: 100%; max-height: 70vh; object-fit: contain; border-radius: 0.5rem; }

/* Status action */
.qd-status-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.qd-status-opt { padding: 0.35rem 0.85rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; border: 1.5px solid #e2e8f0; background: #f8fafc; color: #374151; cursor: pointer; transition: all 0.15s; }
.qd-status-opt:hover { border-color: #6366f1; color: #6366f1; background: #f5f3ff; }
.qd-status-opt-sel { border-color: #6366f1; background: #6366f1; color: #fff; }
.qd-field-label { display: block; font-size: 0.72rem; font-weight: 600; color: #374151; margin-bottom: 0.3rem; }
.qd-textarea { width: 100%; padding: 0.45rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.82rem; color: #1e293b; outline: none; resize: vertical; box-sizing: border-box; }
.qd-textarea:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }

/* Animations */
.qd-modal-enter-active, .qd-modal-leave-active { transition: opacity 0.2s ease; }
.qd-modal-enter-from, .qd-modal-leave-to { opacity: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
.qd-spin { animation: spin 0.9s linear infinite; }
</style>
