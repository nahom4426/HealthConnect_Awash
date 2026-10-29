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
          <!-- Policy Shield Icon -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:22px;height:22px">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
        </div>
        <div>
          <h1 class="mq-title">Motor Quotations</h1>
          <p class="mq-subtitle">Manage, calculate, and issue vehicle premium quotations</p>
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
        <div class="mq-stat-lbl">Total Quotes</div>
      </div>
      <div class="mq-stat-card mq-stat-pending">
        <div class="mq-stat-num">{{ stats.pending }}</div>
        <div class="mq-stat-lbl">Pending Review</div>
      </div>
      <div class="mq-stat-card mq-stat-checked">
        <div class="mq-stat-num">{{ stats.checked }}</div>
        <div class="mq-stat-lbl">Checked & Verified</div>
      </div>
      <div class="mq-stat-card mq-stat-deposited">
        <div class="mq-stat-num">{{ stats.deposited }}</div>
        <div class="mq-stat-lbl">Deposit Received</div>
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;color:#059669"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
          <span>All Quotations</span>
          <span v-if="quotations.length" class="mq-count">{{ quotations.length }}</span>
        </div>
        <div class="mq-search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;color:rgb(var(--ink-subtle))"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/></svg>
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

      <!-- Table Wrapper with horizontal scroll -->
      <div v-else class="mq-table-wrapper">
        <DataTable
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
                <span class="mq-car-sub">{{ [q.carModel, q.makeYear ? `(${q.makeYear})` : ''].filter(Boolean).join(' ') || '' }}</span>
              </div>
            </td>
            <td>
              <span v-if="categoryPath(q) !== '—'" class="mq-cat-path" :title="categoryPath(q)">{{ categoryPath(q) }}</span>
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

  </div>

</template>

<style scoped>
.mq-root { padding: 1.75rem 2rem; min-height: 100%; background: rgb(var(--surface-muted)); }

/* Header */
.mq-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem; }
.mq-header-left { display: flex; align-items: center; gap: 0.85rem; }
/* Official Motor Insurance Blue Theme */
.mq-header-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); display: flex; align-items: center; justify-content: center; color: #ffffff; flex-shrink: 0; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28); }
.mq-title { font-size: 1.25rem; font-weight: 800; color: rgb(var(--ink)); margin: 0; letter-spacing: -0.01em; }
.mq-subtitle { font-size: 0.78rem; color: rgb(var(--ink-subtle)); margin: 0; }
.mq-refresh-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; background: rgb(var(--surface)); border: 1px solid rgb(var(--line)); border-radius: 0.6rem; font-size: 0.78rem; font-weight: 600; color: rgb(var(--ink-muted)); cursor: pointer; transition: all 0.15s; }
.mq-refresh-btn:hover:not(:disabled) { background: rgb(var(--surface-raised)); border-color: rgb(var(--line-strong)); }
.mq-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Stats - Soft Light Context-Tinted Cards (No top accent borders) */
.mq-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.mq-stat-card { background: rgb(var(--surface)); border-radius: 0.85rem; padding: 1.1rem 1.25rem; border: 1px solid rgb(var(--line)); display: flex; flex-direction: column; gap: 0.25rem; transition: transform 0.15s, box-shadow 0.15s; }
.mq-stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.04); }
.mq-stat-num { font-size: 1.75rem; font-weight: 800; line-height: 1; }
.mq-stat-lbl { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }

/* Soft contextual tints */
.mq-stat-total     { background: var(--tint-f0f9ff, #f0f9ff); border: 1px solid var(--tint-dbeafe, #dbeafe); }
.mq-stat-total     .mq-stat-num { color: #1d4ed8; }
.mq-stat-total     .mq-stat-lbl { color: #2563eb; }

.mq-stat-pending   { background: var(--tint-fffbeb, #fffbeb); border: 1px solid var(--tint-fef3c7, #fef3c7); }
.mq-stat-pending   .mq-stat-num { color: #d97706; }
.mq-stat-pending   .mq-stat-lbl { color: #b45309; }

.mq-stat-checked   { background: var(--tint-f5f3ff, #f5f3ff); border: 1px solid var(--tint-ede9fe, #ede9fe); }
.mq-stat-checked   .mq-stat-num { color: #6d28d9; }
.mq-stat-checked   .mq-stat-lbl { color: #7c3aed; }

.mq-stat-deposited { background: var(--tint-f0fdf4, #f0fdf4); border: 1px solid var(--tint-dcfce7, #dcfce7); }
.mq-stat-deposited .mq-stat-num { color: var(--shade-15803d, #15803d); }
.mq-stat-deposited .mq-stat-lbl { color: #16a34a; }

/* Alert */
.mq-alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1rem; border-radius: 0.6rem; font-size: 0.78rem; font-weight: 500; margin-bottom: 1rem; background: var(--tint-fef2f2, #fef2f2); color: #b91c1c; border: 1px solid var(--tint-fecaca, #fecaca); }
.mq-alert-close { margin-left: auto; background: none; border: none; cursor: pointer; color: inherit; font-size: 1rem; opacity: 0.7; }
.mq-alert-close:hover { opacity: 1; }

/* Card & Toolbar */
.mq-card { background: rgb(var(--surface)); border: 1px solid rgb(var(--line)); border-radius: 0.85rem; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.03); }
.mq-card-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.25rem; background: rgb(var(--surface-muted)); border-bottom: 1px solid rgb(var(--line)); flex-wrap: wrap; gap: 0.5rem; }
.mq-card-title-row { display: flex; align-items: center; gap: 0.55rem; font-size: 0.85rem; font-weight: 700; color: rgb(var(--ink)); }
.mq-count { background: var(--tint-dbeafe, #dbeafe); color: #1d4ed8; border-radius: 9999px; font-size: 0.7rem; font-weight: 800; padding: 0.15rem 0.5rem; }
.mq-search-box { display: flex; align-items: center; gap: 0.45rem; background: rgb(var(--surface)); border: 1px solid rgb(var(--line-strong)); border-radius: 0.6rem; padding: 0.35rem 0.75rem; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
.mq-search-input { border: none; background: transparent; outline: none; font-size: 0.78rem; color: rgb(var(--ink-muted)); width: 230px; }

/* Table Wrapper for Horizontal Scroll */
.mq-table-wrapper { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.mq-table-wrapper :deep(table) { min-width: 960px; width: 100%; border-collapse: collapse; }

/* Loading skeleton */
.mq-loading { padding: 0.75rem 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
.mq-skel-row { display: flex; align-items: center; gap: 1rem; padding: 0.6rem 0; border-bottom: 1px solid rgb(var(--line)); }
.mq-skel { background: rgb(var(--surface-raised)); border-radius: 4px; height: 14px; animation: mq-shimmer 1.4s infinite; }
.mq-skel-wide { width: 160px; }
.mq-skel-med  { width: 100px; }
.mq-skel-sm   { width: 70px; }
.mq-skel-xs   { width: 50px; }
@keyframes mq-shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

/* Empty */
.mq-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 4rem; color: rgb(var(--ink-subtle)); font-size: 0.88rem; }

/* Table styling */
.mq-datatable :deep(th) { background: rgb(var(--surface-raised)); color: rgb(var(--ink)); font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.85rem 1rem; border-bottom: 2px solid rgb(var(--line)); }
.mq-row { border-bottom: 1px solid rgb(var(--line)); transition: background 0.15s; cursor: pointer; }
.mq-row:hover { background: var(--tint-f0f9ff, #f0f9ff); }
.mq-row td { padding: 0.85rem 1rem; color: rgb(var(--ink-muted)); vertical-align: middle; font-size: 0.82rem; }
.mq-idx { color: rgb(var(--ink-subtle)); font-size: 0.74rem; font-weight: 700; width: 36px; }

/* Client cell */
.mq-client { display: flex; align-items: center; gap: 0.65rem; }
.mq-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); color: #ffffff; font-size: 0.78rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 5px rgba(37,99,235,0.22); }
.mq-client-name { font-weight: 700; color: rgb(var(--ink)); font-size: 0.84rem; white-space: nowrap; }
.mq-client-email { font-size: 0.7rem; color: rgb(var(--ink-subtle)); white-space: nowrap; }

.mq-phone { font-size: 0.8rem; font-weight: 600; color: rgb(var(--ink-muted)); white-space: nowrap; }

/* Vehicle cell */
.mq-vehicle { display: flex; flex-direction: column; gap: 0.15rem; }
.mq-car-name { font-weight: 700; color: rgb(var(--ink)); font-size: 0.84rem; }
.mq-car-sub  { font-size: 0.71rem; color: rgb(var(--ink-subtle)); font-weight: 500; }

/* Contextual Category Pill */
.mq-cat-path { font-size: 0.72rem; font-weight: 600; color: #1d4ed8; background: var(--tint-eff6ff, #eff6ff); border: 1px solid var(--tint-bfdbfe, #bfdbfe); padding: 0.2rem 0.55rem; border-radius: 6px; display: inline-block; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mq-muted { color: rgb(var(--ink-subtle)); }

/* Amount & Date */
.mq-amount { font-weight: 800; color: rgb(var(--ink)); font-size: 0.84rem; white-space: nowrap; }
.mq-date   { font-size: 0.78rem; color: rgb(var(--ink-subtle)); white-space: nowrap; }

/* Status badges */
.mq-status-badge { display: inline-flex; align-items: center; padding: 0.25rem 0.65rem; border-radius: 9999px; font-size: 0.68rem; font-weight: 800; white-space: nowrap; }
.qst-pending   { background: var(--tint-fef9c3, #fef9c3); color: var(--shade-92400e, #92400e); border: 1px solid var(--tint-fde68a, #fde68a); }
.qst-checked   { background: var(--tint-eff6ff, #eff6ff); color: #1d4ed8; border: 1px solid var(--tint-bfdbfe, #bfdbfe); }
.qst-requested { background: var(--tint-f5f3ff, #f5f3ff); color: #6d28d9; border: 1px solid var(--tint-ddd6fe, #ddd6fe); }
.qst-deposited { background: var(--tint-f0fdf4, #f0fdf4); color: var(--shade-15803d, #15803d); border: 1px solid var(--tint-bbf7d0, #bbf7d0); }
.qst-declined  { background: var(--tint-fef2f2, #fef2f2); color: #b91c1c; border: 1px solid var(--tint-fecaca, #fecaca); }
.qst-dispersed { background: var(--tint-ecfdf5, #ecfdf5); color: var(--shade-065f46, #065f46); border: 1px solid #6ee7b7; }
.qst-default   { background: rgb(var(--surface-raised)); color: rgb(var(--ink-subtle)); border: 1px solid rgb(var(--line)); }

/* Contextual Action Button */
.mq-open-btn { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.8rem; background: var(--tint-eff6ff, #eff6ff); color: #1d4ed8; border: 1px solid var(--tint-bfdbfe, #bfdbfe); border-radius: 0.5rem; font-size: 0.74rem; font-weight: 700; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.mq-open-btn:hover { background: #2563eb; color: #ffffff; border-color: #2563eb; }

@keyframes spin { to { transform: rotate(360deg); } }
.mq-spin { animation: spin 0.9s linear infinite; }

/* Header actions group */
.mq-header-actions { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }

/* New Quotation button */
.mq-new-btn { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.5rem 1.15rem; background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); color: #fff; border: none; border-radius: 0.6rem; font-size: 0.78rem; font-weight: 800; cursor: pointer; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28); transition: transform 0.15s, opacity 0.15s; }
.mq-new-btn:hover { opacity: 0.95; transform: translateY(-1px); }
</style>
