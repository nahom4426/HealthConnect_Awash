<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import DataTable from '@/components/DataTable.vue';
import Button from '@/components/Button.vue';
import { fetchAllQuotations } from '../api/motorApi.js';

const router = useRouter();

// ── state ─────────────────────────────────────────────────────────────────────
const quotations = ref([]);
const loading    = ref(false);
const error      = ref('');
const searchQ    = ref('');

// ── load ──────────────────────────────────────────────────────────────────────
async function loadQuotations() {
  loading.value = true;
  error.value = '';
  try {
    quotations.value = await fetchAllQuotations({ search: searchQ.value });
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Failed to load quotations';
  } finally {
    loading.value = false;
  }
}

onMounted(loadQuotations);

let searchTimer = null;
watch(searchQ, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadQuotations, 350);
});

// ── computed ──────────────────────────────────────────────────────────────────
const stats = computed(() => {
  const all = quotations.value;
  return {
    total:    all.length,
    pending:  all.filter(q => q.quotationStatus === 'PENDING').length,
    checked:  all.filter(q => q.quotationStatus === 'CHECKED').length,
    deposited: all.filter(q => q.quotationStatus === 'DEPOSITED').length,
  };
});

// ── helpers ───────────────────────────────────────────────────────────────────
function statusMeta(status) {
  const map = {
    PENDING:    { cls: 'qst-pending',   label: 'Pending'   },
    CHECKED:    { cls: 'qst-checked',   label: 'Checked'   },
    REQUESTED:  { cls: 'qst-requested', label: 'Requested' },
    DEPOSITED:  { cls: 'qst-deposited', label: 'Deposited' },
    DECLINED:   { cls: 'qst-declined',  label: 'Declined'  },
    DISPERSED:  { cls: 'qst-dispersed', label: 'Dispersed' },
  };
  return map[status] || { cls: 'qst-default', label: status || '—' };
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatAmount(val) {
  if (val == null) return '—';
  return 'ETB ' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fullName(q) {
  return [q.clientFirstName, q.clientFatherName, q.clientGrandFatherName].filter(Boolean).join(' ');
}

function categoryPath(q) {
  return [q.category1, q.category2, q.category3, q.category4].filter(Boolean).join(' › ');
}

function openDetail(quotationUuid) {
  router.push(`/motor/quotation/${quotationUuid}`);
}

function openNewQuotation() {
  router.push('/motor/quotation/new');
}
</script>

<template>
  <div class="mq-root">

    <!-- Header -->
    <div class="mq-header">
      <div class="mq-header-left">
        <div class="mq-header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:20px;height:20px">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <div>
          <h1 class="mq-title">Quotations</h1>
          <p class="mq-subtitle">Manage and review motor insurance quotations</p>
        </div>
      </div>
      <div class="mq-header-actions">
        <button class="mq-new-btn" @click="openNewQuotation">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          New Quotation
        </button>
        <button class="mq-refresh-btn" @click="loadQuotations" :disabled="loading" title="Refresh">
          <svg :class="{ 'mq-spin': loading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px">
            <path stroke-linecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Refresh
        </button>
      </div>
    </div>

    <!-- Stats cards -->
    <div class="mq-stats">
      <div class="mq-stat-card mq-stat-total">
        <div class="mq-stat-num">{{ stats.total }}</div>
        <div class="mq-stat-lbl">Total</div>
      </div>
      <div class="mq-stat-card mq-stat-pending">
        <div class="mq-stat-num">{{ stats.pending }}</div>
        <div class="mq-stat-lbl">Pending</div>
      </div>
      <div class="mq-stat-card mq-stat-checked">
        <div class="mq-stat-num">{{ stats.checked }}</div>
        <div class="mq-stat-lbl">Checked</div>
      </div>
      <div class="mq-stat-card mq-stat-deposited">
        <div class="mq-stat-num">{{ stats.deposited }}</div>
        <div class="mq-stat-lbl">Deposited</div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="mq-alert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v4m0 4h.01"/></svg>
      {{ error }}
      <button class="mq-alert-close" @click="error = ''">×</button>
    </div>

    <!-- Table card -->
    <div class="mq-card">
      <div class="mq-card-toolbar">
        <div class="mq-card-title-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:#64748b"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
          <span>All Quotations</span>
          <span v-if="quotations.length" class="mq-count">{{ quotations.length }}</span>
        </div>
        <div class="mq-search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;color:#94a3b8"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/></svg>
          <input v-model="searchQ" class="mq-search-input" placeholder="Search quotations…" />
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="loading" class="mq-loading">
        <div v-for="i in 5" :key="i" class="mq-skel-row">
          <div class="mq-skel mq-skel-wide"></div>
          <div class="mq-skel mq-skel-med"></div>
          <div class="mq-skel mq-skel-med"></div>
          <div class="mq-skel mq-skel-sm"></div>
          <div class="mq-skel mq-skel-sm"></div>
          <div class="mq-skel mq-skel-xs"></div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!quotations.length" class="mq-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:42px;height:42px;color:#cbd5e1">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <span>No quotations found</span>
      </div>

      <!-- Table -->
      <DataTable
        v-else
        :headers="['#', 'Client', 'Phone', 'Vehicle', 'Category', 'Amount', 'Date', 'Status', 'Action']"
        :hide-index="true"
        class="mq-datatable"
      >
        <tr
          v-for="(q, i) in quotations"
          :key="q.quotationUuid || i"
          class="mq-row"
          @click="openDetail(q.quotationUuid)"
        >
          <td class="mq-idx">{{ i + 1 }}</td>
          <td>
            <div class="mq-client">
              <div class="mq-avatar">{{ (q.clientFirstName || '?')[0].toUpperCase() }}</div>
              <div>
                <div class="mq-client-name">{{ fullName(q) || '—' }}</div>
                <div class="mq-client-email">{{ q.clientEmail || '' }}</div>
              </div>
            </div>
          </td>
          <td class="mq-phone">{{ q.clientPhoneNumber || '—' }}</td>
          <td>
            <div class="mq-vehicle">
              <span class="mq-car-name">{{ q.carName || '—' }}</span>
              <span class="mq-car-sub">{{ [q.carModel, q.carType].filter(Boolean).join(' · ') || '' }}</span>
            </div>
          </td>
          <td>
            <span v-if="categoryPath(q)" class="mq-cat-path">{{ categoryPath(q) }}</span>
            <span v-else class="mq-muted">—</span>
          </td>
          <td class="mq-amount">{{ formatAmount(q.quotationAmount) }}</td>
          <td class="mq-date">{{ formatDate(q.quotationDate) }}</td>
          <td>
            <span :class="['mq-status-badge', statusMeta(q.quotationStatus).cls]">
              {{ statusMeta(q.quotationStatus).label }}
            </span>
          </td>
          <td @click.stop>
            <button
              class="mq-open-btn"
              @click="openDetail(q.quotationUuid)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              View
            </button>
          </td>
        </tr>
      </DataTable>
    </div>

  </div>

</template>

<style scoped>
.mq-root { padding: 1.5rem 2rem; min-height: 100%; background: #f8fafc; }

/* Header */
.mq-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem; }
.mq-header-left { display: flex; align-items: center; gap: 0.75rem; }
.mq-header-icon { width: 42px; height: 42px; border-radius: 10px; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
.mq-title { font-size: 1.15rem; font-weight: 700; color: #0f172a; margin: 0; }
.mq-subtitle { font-size: 0.75rem; color: #64748b; margin: 0; }
.mq-refresh-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.9rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.78rem; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.15s; }
.mq-refresh-btn:hover:not(:disabled) { background: #f1f5f9; }
.mq-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Stats */
.mq-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.85rem; margin-bottom: 1.25rem; }
.mq-stat-card { background: #fff; border-radius: 0.75rem; padding: 1rem 1.25rem; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 0.2rem; }
.mq-stat-num { font-size: 1.6rem; font-weight: 800; line-height: 1; }
.mq-stat-lbl { font-size: 0.72rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
.mq-stat-total   .mq-stat-num { color: #0f172a; }
.mq-stat-pending .mq-stat-num { color: #d97706; }
.mq-stat-checked .mq-stat-num { color: #2563eb; }
.mq-stat-deposited .mq-stat-num { color: #16a34a; }

/* Alert */
.mq-alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; border-radius: 0.5rem; font-size: 0.78rem; font-weight: 500; margin-bottom: 0.75rem; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.mq-alert-close { margin-left: auto; background: none; border: none; cursor: pointer; color: inherit; font-size: 1rem; opacity: 0.7; }
.mq-alert-close:hover { opacity: 1; }

/* Card */
.mq-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 0.75rem; overflow: hidden; }
.mq-card-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; gap: 0.5rem; }
.mq-card-title-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; font-weight: 600; color: #374151; }
.mq-count { background: #e0e7ff; color: #4f46e5; border-radius: 9999px; font-size: 0.68rem; font-weight: 700; padding: 0.1rem 0.45rem; }
.mq-search-box { display: flex; align-items: center; gap: 0.4rem; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.3rem 0.65rem; }
.mq-search-input { border: none; background: transparent; outline: none; font-size: 0.78rem; color: #334155; width: 190px; }

/* Loading skeleton */
.mq-loading { padding: 0.5rem 1.25rem; display: flex; flex-direction: column; gap: 0.6rem; }
.mq-skel-row { display: flex; align-items: center; gap: 1rem; padding: 0.6rem 0; border-bottom: 1px solid #f1f5f9; }
.mq-skel { background: #f1f5f9; border-radius: 4px; height: 14px; animation: mq-shimmer 1.4s infinite; }
.mq-skel-wide { width: 160px; }
.mq-skel-med  { width: 100px; }
.mq-skel-sm   { width: 70px; }
.mq-skel-xs   { width: 50px; }
@keyframes mq-shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

/* Empty */
.mq-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3.5rem; color: #94a3b8; font-size: 0.85rem; }

/* Table */
.mq-datatable :deep(.overflow-x-auto) { border: none; border-radius: 0; box-shadow: none; }
.mq-row { border-bottom: 1px solid #f1f5f9; transition: background 0.1s; cursor: pointer; }
.mq-row:hover { background: #f8fafc; }
.mq-row td { padding: 0.75rem 1rem; color: #334155; vertical-align: middle; font-size: 0.82rem; }
.mq-idx { color: #94a3b8; font-size: 0.74rem; font-weight: 600; width: 36px; }

/* Client cell */
.mq-client { display: flex; align-items: center; gap: 0.6rem; }
.mq-avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; font-size: 0.72rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mq-client-name { font-weight: 600; color: #0f172a; font-size: 0.82rem; white-space: nowrap; }
.mq-client-email { font-size: 0.7rem; color: #94a3b8; white-space: nowrap; }

.mq-phone { font-size: 0.8rem; color: #475569; white-space: nowrap; }

/* Vehicle cell */
.mq-vehicle { display: flex; flex-direction: column; gap: 0.15rem; }
.mq-car-name { font-weight: 600; color: #0f172a; font-size: 0.82rem; }
.mq-car-sub  { font-size: 0.7rem; color: #94a3b8; }

/* Category */
.mq-cat-path { font-size: 0.72rem; color: #6366f1; background: #f5f3ff; padding: 0.15rem 0.45rem; border-radius: 4px; white-space: nowrap; }
.mq-muted { color: #94a3b8; }

/* Amount & Date */
.mq-amount { font-weight: 700; color: #0f172a; font-size: 0.82rem; white-space: nowrap; }
.mq-date   { font-size: 0.78rem; color: #64748b; white-space: nowrap; }

/* Status badges */
.mq-status-badge { display: inline-flex; align-items: center; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.68rem; font-weight: 700; white-space: nowrap; }
.qst-pending   { background: #fef9c3; color: #92400e; border: 1px solid #fde68a; }
.qst-checked   { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.qst-requested { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }
.qst-deposited { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.qst-declined  { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.qst-dispersed { background: #ecfdf5; color: #065f46; border: 1px solid #6ee7b7; }
.qst-default   { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }

/* Action button */
.mq-open-btn { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.7rem; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 0.4rem; font-size: 0.72rem; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.mq-open-btn:hover { background: #dbeafe; }

@keyframes spin { to { transform: rotate(360deg); } }
.mq-spin { animation: spin 0.9s linear infinite; }

/* Header actions group */
.mq-header-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }

/* New Quotation button */
.mq-new-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.48rem 1rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; border-radius: 0.5rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
.mq-new-btn:hover { opacity: 0.9; }
</style>
