<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import DataTable from '@/components/DataTable.vue';
import { fetchMotorProposals } from '@/features/motor/claims/api/digitalChannelApi';
import { useRoleContext } from '../composables/useRoleContext';
import RoleSwitcher from '@/components/RoleSwitcher.vue';

const router = useRouter();
const { activeRole, setRole, ROLES } = useRoleContext();

const proposals = ref([]);
const loading = ref(false);
const error = ref('');
const searchQ = ref('');
const statusFilter = ref('');

let pollTimer = null;

async function loadProposals(showSpinner = true) {
  if (showSpinner) loading.value = true;
  error.value = '';
  try {
    const data = await fetchMotorProposals();
    const rawList = Array.isArray(data) ? data : (data?.content || []);
    const seen = new Set();
    const freshList = rawList.filter(item => {
      const key = item.proposalUuid || item.proposalNumber || item.id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (JSON.stringify(freshList) !== JSON.stringify(proposals.value)) {
      proposals.value = freshList;
    }
  } catch (e) {
    if (proposals.value.length === 0) {
      error.value = e?.response?.data?.message || e.message || 'Failed to load proposals';
    }
  } finally {
    if (showSpinner) loading.value = false;
  }
}

onMounted(() => {
  loadProposals(true);
  pollTimer = setInterval(() => loadProposals(false), 8000);
});

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer);
});

let searchTimer = null;
watch(searchQ, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {}, 350);
});

const filtered = computed(() => {
  return proposals.value.filter(p => {
    const q = searchQ.value.toLowerCase();
    const matchSearch = !q ||
      p.proposalNumber?.toLowerCase().includes(q) ||
      p.insuredName?.toLowerCase().includes(q) ||
      p.vehiclePlateNumber?.toLowerCase().includes(q);
    const matchStatus = !statusFilter.value || normalizeStatus(p.status) === statusFilter.value;
    
    // Role Gating Filter (Adjustors only see assigned items when logged in as Adjustor)
    if (activeRole.value === 'ROLE_ADJUSTOR') {
      return matchSearch && matchStatus && (p.assignedAdjustorUuid === 'ADJ-101' || !p.assignedAdjustorUuid);
    }
    return matchSearch && matchStatus;
  });
});

const currentPage = ref(1);
const pageSize = 10;

watch([searchQ, statusFilter], () => {
  currentPage.value = 1;
});

const paginated = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filtered.value.slice(start, start + pageSize);
});

const totalPages = computed(() => Math.ceil(filtered.value.length / pageSize));

const stats = computed(() => {
  const all = proposals.value;
  return {
    total: all.length,
    submitted: all.filter(p => normalizeStatus(p.status) === 'SUBMITTED').length,
    inspected: all.filter(p => ['APPROVED', 'PENDING_PAYMENT'].includes(normalizeStatus(p.status))).length,
    paid: all.filter(p => normalizeStatus(p.status) === 'PAID').length,
    issued: all.filter(p => normalizeStatus(p.status) === 'ACTIVE').length,
  };
});

// One state machine shared with mobile: SUBMITTED → APPROVED → PENDING_PAYMENT → PAID → ACTIVE (or REJECTED).
// Older rows may still carry legacy values; map them so the dashboard shows a single vocabulary.
const LEGACY_STATUS = {
  REGISTERED: 'SUBMITTED', ADJUSTOR_ASSIGNED: 'SUBMITTED', INSPECTION_PENDING: 'SUBMITTED',
  INSPECTION_DONE: 'APPROVED', COVERAGE_SELECTED: 'APPROVED', PASSED: 'APPROVED',
  TP_PAID: 'PAID', OD_PAID: 'PAID', CONTRACT_ISSUED: 'ACTIVE', CANCELLED: 'REJECTED',
};
function normalizeStatus(st) {
  const s = String(st || 'SUBMITTED').toUpperCase();
  return LEGACY_STATUS[s] || s;
}

function statusMeta(st) {
  const map = {
    SUBMITTED:       { cls: 'mp-st-submitted', label: 'Submitted' },
    APPROVED:        { cls: 'mp-st-inspected', label: 'Approved · awaiting payment' },
    PENDING_PAYMENT: { cls: 'mp-st-assigned',  label: 'Payment in progress' },
    PAID:            { cls: 'mp-st-tp',        label: 'Paid · issue certificate' },
    ACTIVE:          { cls: 'mp-st-issued',    label: 'Active' },
    REJECTED:        { cls: 'mp-st-rejected',  label: 'Rejected' },
  };
  return map[normalizeStatus(st)] || { cls: 'mp-st-default', label: st || '—' };
}

function paymentLabel(st) {
  if (st === 'PAID') return 'Paid';
  return st || 'Pending';
}

function paymentCls(st) {
  return st === 'PAID' ? 'mp-pay-paid' : 'mp-pay-pending';
}

function coverageMeta(type) {
  if (!type || type === 'PENDING_SELECTION' || type === 'PENDING' || type === 'null') {
    return { cls: 'mp-cov-pending', label: 'Pending Selection' };
  }
  if (type === 'COMPREHENSIVE') return { cls: 'mp-cov-comp', label: 'Comprehensive' };
  if (type === 'THIRD_PARTY') return { cls: 'mp-cov-tp', label: 'Third Party' };
  if (type === 'OWN_DAMAGE') return { cls: 'mp-cov-od', label: 'Own Damage (OD)' };
  return { cls: 'mp-cov-pending', label: 'Pending Selection' };
}

function formatMoney(val) {
  if (val == null || val === 0) return 'Pending Selection';
  return 'ETB ' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function openDetail(uuid) {
  router.push(`/motor/proposals/${uuid}`);
}
</script>

<template>
  <div class="mp-root">

    <!-- Header -->
    <div class="mp-header">
      <div class="mp-header-left">
        <div class="mp-header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:22px;height:22px">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <div>
          <h1 class="mp-title">Proposals & Contracts</h1>
          <p class="mp-subtitle">Manage customer motor insurance proposal submissions (Reg 554/2024)</p>
        </div>
      </div>
      <div class="mp-header-actions">
        <RoleSwitcher />
        <button class="mp-refresh-btn" @click="loadProposals" :disabled="loading" title="Refresh">
          <svg :class="{ 'mp-spin': loading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px">
            <path stroke-linecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Stats cards -->
    <div class="mp-stats">
      <div class="mp-stat-card mp-stat-total">
        <div class="mp-stat-num">{{ stats.total }}</div>
        <div class="mp-stat-lbl">Total Proposals</div>
      </div>
      <div class="mp-stat-card mp-stat-submitted">
        <div class="mp-stat-num">{{ stats.submitted }}</div>
        <div class="mp-stat-lbl">Submitted</div>
      </div>
      <div class="mp-stat-card mp-stat-inspected">
        <div class="mp-stat-num">{{ stats.inspected }}</div>
        <div class="mp-stat-lbl">In Review</div>
      </div>
      <div class="mp-stat-card mp-stat-issued">
        <div class="mp-stat-num">{{ stats.issued }}</div>
        <div class="mp-stat-lbl">Contracts Issued</div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="mp-alert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v4m0 4h.01"/></svg>
      {{ error }}
      <button class="mp-alert-close" @click="error = ''">×</button>
    </div>

    <!-- Table card -->
    <div class="mp-card">
      <div class="mp-card-toolbar">
        <div class="mp-card-title-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;color:#059669"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
          <span>All Proposals</span>
          <span v-if="filtered.length" class="mp-count">{{ filtered.length }}</span>
        </div>
        <div class="mp-toolbar-right">
          <select v-model="statusFilter" class="mp-filter-select">
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved (awaiting payment)</option>
            <option value="PENDING_PAYMENT">Payment in progress</option>
            <option value="PAID">Paid (issue certificate)</option>
            <option value="ACTIVE">Active</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <div class="mp-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;color:#94a3b8"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/></svg>
            <input v-model="searchQ" class="mp-search-input" placeholder="Search plate, name, proposal #…" />
          </div>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="mp-loading">
        <div v-for="i in 5" :key="i" class="mp-skel-row">
          <div class="mp-skel mp-skel-wide"></div>
          <div class="mp-skel mp-skel-med"></div>
          <div class="mp-skel mp-skel-med"></div>
          <div class="mp-skel mp-skel-sm"></div>
          <div class="mp-skel mp-skel-sm"></div>
          <div class="mp-skel mp-skel-xs"></div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!filtered.length" class="mp-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:42px;height:42px;color:#cbd5e1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <span>No motor proposals found matching criteria</span>
      </div>

      <!-- Table -->
      <div v-else class="mp-table-wrapper">
        <DataTable
          :headers="['#', 'Proposal / Date', 'Insured & Vehicle', 'Coverage', 'Total Premium', 'Payments (TP / OD)', 'Status', 'Action']"
          :hide-index="true"
          class="mp-datatable"
        >
          <tr v-for="(p, i) in paginated" :key="p.proposalUuid || i" class="mp-row" @click="openDetail(p.proposalUuid)">
            <td class="mp-idx">{{ (currentPage - 1) * pageSize + i + 1 }}</td>
            <td>
              <div class="mp-proposal-num">{{ p.proposalNumber || '—' }}</div>
              <div class="mp-proposal-date">{{ formatDate(p.createdAt) }}</div>
            </td>
            <td>
              <div class="mp-client">
                <div class="mp-avatar">{{ (p.insuredName || '?')[0].toUpperCase() }}</div>
                <div>
                  <div class="mp-client-name">{{ p.insuredName || '—' }}</div>
                  <div class="mp-client-sub">{{ p.vehiclePlateNumber }} · {{ p.carName }} {{ p.carModel }}</div>
                </div>
              </div>
            </td>
            <td>
              <span :class="['mp-coverage-badge', coverageMeta(p.coverageType).cls]">{{ coverageMeta(p.coverageType).label }}</span>
            </td>
            <td class="mp-amount">{{ formatMoney(p.totalPremiumAmount) }}</td>
            <td>
              <div v-if="p.coverageType === 'COMPREHENSIVE' || p.coverageType === 'THIRD_PARTY'" class="mp-pay-row">
                <span class="mp-pay-label">TP:</span>
                <span :class="['mp-pay-pill', paymentCls(p.tpPaymentStatus)]">{{ paymentLabel(p.tpPaymentStatus) }}</span>
              </div>
              <div v-if="p.coverageType === 'COMPREHENSIVE' || p.coverageType === 'OWN_DAMAGE'" class="mp-pay-row">
                <span class="mp-pay-label">OD:</span>
                <span :class="['mp-pay-pill', paymentCls(p.odPaymentStatus)]">{{ paymentLabel(p.odPaymentStatus) }}</span>
              </div>
            </td>
            <td>
              <span :class="['mp-status-badge', statusMeta(p.status).cls]">{{ statusMeta(p.status).label }}</span>
            </td>
            <td @click.stop>
              <button class="mp-open-btn" @click="openDetail(p.proposalUuid)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                Manage
              </button>
            </td>
          </tr>
        </DataTable>

        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="mp-pagination">
          <button class="mp-page-btn" :disabled="currentPage === 1" @click="currentPage--">Previous</button>
          <span class="mp-page-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <button class="mp-page-btn" :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.mp-root { padding: 1.75rem 2rem; min-height: 100%; background: #f8fafc; }

/* Header */
.mp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem; }
.mp-header-left { display: flex; align-items: center; gap: 0.85rem; }
.mp-header-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); display: flex; align-items: center; justify-content: center; color: #ffffff; flex-shrink: 0; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28); }
.mp-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.01em; }
.mp-subtitle { font-size: 0.78rem; color: #64748b; margin: 0; }
.mp-header-actions { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
.mp-refresh-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.6rem; font-size: 0.78rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.15s; }
.mp-refresh-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #cbd5e1; }
.mp-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Stats */
.mp-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.mp-stat-card { background: #fff; border-radius: 0.85rem; padding: 1.1rem 1.25rem; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 0.25rem; transition: transform 0.15s, box-shadow 0.15s; }
.mp-stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.04); }
.mp-stat-num { font-size: 1.75rem; font-weight: 800; line-height: 1; }
.mp-stat-lbl { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.mp-stat-total     { background: #f0f9ff; border: 1px solid #dbeafe; }
.mp-stat-total     .mp-stat-num { color: #1d4ed8; }
.mp-stat-total     .mp-stat-lbl { color: #2563eb; }
.mp-stat-submitted { background: #fffbeb; border: 1px solid #fef3c7; }
.mp-stat-submitted .mp-stat-num { color: #d97706; }
.mp-stat-submitted .mp-stat-lbl { color: #b45309; }
.mp-stat-inspected { background: #f5f3ff; border: 1px solid #ede9fe; }
.mp-stat-inspected .mp-stat-num { color: #6d28d9; }
.mp-stat-inspected .mp-stat-lbl { color: #7c3aed; }
.mp-stat-issued    { background: #f0fdf4; border: 1px solid #dcfce7; }
.mp-stat-issued    .mp-stat-num { color: #15803d; }
.mp-stat-issued    .mp-stat-lbl { color: #16a34a; }

/* Alert */
.mp-alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1rem; border-radius: 0.6rem; font-size: 0.78rem; font-weight: 500; margin-bottom: 1rem; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.mp-alert-close { margin-left: auto; background: none; border: none; cursor: pointer; color: inherit; font-size: 1rem; opacity: 0.7; }
.mp-alert-close:hover { opacity: 1; }

/* Card & Toolbar */
.mp-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 0.85rem; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.03); }
.mp-card-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; gap: 0.5rem; }
.mp-card-title-row { display: flex; align-items: center; gap: 0.55rem; font-size: 0.85rem; font-weight: 700; color: #1e293b; }
.mp-count { background: #dbeafe; color: #1d4ed8; border-radius: 9999px; font-size: 0.7rem; font-weight: 800; padding: 0.15rem 0.5rem; }
.mp-toolbar-right { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.mp-filter-select { background: #fff; border: 1px solid #cbd5e1; border-radius: 0.5rem; padding: 0.35rem 0.65rem; font-size: 0.78rem; color: #334155; outline: none; cursor: pointer; }
.mp-filter-select:focus { border-color: #2563eb; }
.mp-search-box { display: flex; align-items: center; gap: 0.45rem; background: #fff; border: 1px solid #cbd5e1; border-radius: 0.6rem; padding: 0.35rem 0.75rem; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
.mp-search-input { border: none; background: transparent; outline: none; font-size: 0.78rem; color: #334155; width: 210px; }

/* Table Wrapper */
.mp-table-wrapper { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.mp-table-wrapper :deep(table) { min-width: 1020px; width: 100%; border-collapse: collapse; }

/* Loading */
.mp-loading { padding: 0.75rem 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
.mp-skel-row { display: flex; align-items: center; gap: 1rem; padding: 0.6rem 0; border-bottom: 1px solid #f1f5f9; }
.mp-skel { background: #f1f5f9; border-radius: 4px; height: 14px; animation: mp-shimmer 1.4s infinite; }
.mp-skel-wide { width: 160px; } .mp-skel-med { width: 100px; } .mp-skel-sm { width: 70px; } .mp-skel-xs { width: 50px; }
@keyframes mp-shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

/* Empty */
.mp-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 4rem; color: #94a3b8; font-size: 0.88rem; }

/* Table */
.mp-datatable :deep(th) { background: #f1f5f9; color: #0f172a; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.85rem 1rem; border-bottom: 2px solid #e2e8f0; }
.mp-row { border-bottom: 1px solid #f1f5f9; transition: background 0.15s; cursor: pointer; }
.mp-row:hover { background: #f0f9ff; }
.mp-row td { padding: 0.85rem 1rem; color: #334155; vertical-align: middle; font-size: 0.82rem; }
.mp-idx { color: #94a3b8; font-size: 0.74rem; font-weight: 700; width: 36px; }

/* Proposal cell */
.mp-proposal-num { font-weight: 700; color: #0f172a; font-size: 0.84rem; }
.mp-proposal-date { font-size: 0.71rem; color: #64748b; }

/* Client cell */
.mp-client { display: flex; align-items: center; gap: 0.65rem; }
.mp-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); color: #ffffff; font-size: 0.78rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 5px rgba(37,99,235,0.22); }
.mp-client-name { font-weight: 700; color: #0f172a; font-size: 0.84rem; white-space: nowrap; }
.mp-client-sub { font-size: 0.7rem; color: #64748b; white-space: nowrap; }

/* Coverage badge */
.mp-coverage-badge { display: inline-flex; align-items: center; padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.72rem; font-weight: 700; white-space: nowrap; }
.mp-cov-pending { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
.mp-cov-comp { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }
.mp-cov-tp   { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
.mp-cov-od   { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }

/* Amount */
.mp-amount { font-weight: 800; color: #0f172a; font-size: 0.84rem; white-space: nowrap; }

/* Payment pills */
.mp-pay-row { display: flex; align-items: center; gap: 0.35rem; font-size: 0.72rem; }
.mp-pay-row + .mp-pay-row { margin-top: 0.2rem; }
.mp-pay-label { color: #64748b; font-weight: 600; }
.mp-pay-pill { padding: 0.1rem 0.45rem; border-radius: 4px; font-weight: 700; font-size: 0.68rem; }
.mp-pay-paid { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.mp-pay-pending { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }

/* Status badge */
.mp-st-rejected { background:#fee2e2; color:#b91c1c; }
.mp-status-badge { display: inline-flex; align-items: center; padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.68rem; font-weight: 800; white-space: nowrap; }
.mp-st-submitted  { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
.mp-st-assigned   { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }
.mp-st-tp         { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.mp-st-od         { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.mp-st-inspected  { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }
.mp-st-issued     { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.mp-st-default    { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }

/* Action button */
.mp-open-btn { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.8rem; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 0.5rem; font-size: 0.74rem; font-weight: 700; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.mp-open-btn:hover { background: #2563eb; color: #ffffff; border-color: #2563eb; }

/* Pagination */
.mp-pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1.25rem 1rem; border-top: 1px solid #e2e8f0; background: #fff; }
.mp-page-btn { padding: 0.45rem 1rem; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 0.5rem; font-size: 0.8rem; font-weight: 600; color: #334155; cursor: pointer; transition: all 0.15s; }
.mp-page-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #94a3b8; }
.mp-page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mp-page-info { font-size: 0.82rem; font-weight: 600; color: #64748b; }

@keyframes spin { to { transform: rotate(360deg); } }
.mp-spin { animation: spin 0.9s linear infinite; }
</style>
