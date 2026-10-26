<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { fetchAllClaims } from '@/features/digitalChannel/api/digitalChannelApi';
import RoleSwitcher from '@/components/RoleSwitcher.vue';
import { useRouter } from 'vue-router';
import { useDarkModeStore } from '@/stores/darkMode';

const router = useRouter();
const darkStore = useDarkModeStore();
const isDark = computed(() => darkStore.isDark);

const claims = ref([]);
const loading = ref(true);
const filter = ref('ALL');

const statusColors = {
  SUBMITTED: '#3b82f6', IN_PROCESS: '#8b5cf6', BID_ASSIGNED: '#f59e0b', BID_COMPLETED: '#10b981',
  ASSIGN_TO_GARAGE: '#06b6d4', IN_MAINTENANCE: '#e11d48', MAINTENANCE_COMPLETED: '#059669', HANDOVER_COMPLETED: '#047857', REJECTED: '#dc2626'
};

const statusLabels = {
  SUBMITTED: 'New', IN_PROCESS: 'In Process', BID_ASSIGNED: 'Bidding',
  BID_COMPLETED: 'Approved', ASSIGN_TO_GARAGE: 'At Garage', IN_MAINTENANCE: 'Repairing',
  MAINTENANCE_COMPLETED: 'Repaired', HANDOVER_COMPLETED: 'Completed', REJECTED: 'Rejected'
};

const filteredClaims = computed(() => {
  if (filter.value === 'ALL') return claims.value;
  return claims.value.filter(c => c.status === filter.value);
});

const PAGE_SIZE = 10;
const currentPage = ref(1);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredClaims.value.length / PAGE_SIZE)));
const paginatedClaims = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredClaims.value.slice(start, start + PAGE_SIZE);
});
function goToPage(p) { if (p >= 1 && p <= totalPages.value) currentPage.value = p; }

async function loadClaims() {
  loading.value = true;
  claims.value = await fetchAllClaims();
  loading.value = false;
  currentPage.value = 1;
}

function openDetail(claim) {
  router.push(`/${claim.productModule || 'motor'}/claims/detail/${claim.claimUuid}`);
}

const kpis = computed(() => {
  const all = claims.value;
  const total = all.length;
  const newClaims = all.filter(c => c.status === 'SUBMITTED').length;
  const inProgress = all.filter(c => ['IN_PROCESS', 'BID_ASSIGNED', 'BID_COMPLETED', 'ASSIGN_TO_GARAGE', 'IN_MAINTENANCE'].includes(c.status)).length;
  const completed = all.filter(c => ['MAINTENANCE_COMPLETED', 'HANDOVER_COMPLETED'].includes(c.status)).length;
  const rejected = all.filter(c => c.status === 'REJECTED').length;
  const totalAmount = all.reduce((sum, c) => sum + (c.estimatedAmount || 0), 0);
  return [
    { label: 'Total Claims', value: total, icon: 'clipboard', color: '#6366f1' },
    { label: 'New / Pending', value: newClaims, icon: 'inbox', color: '#3b82f6' },
    { label: 'In Progress', value: inProgress, icon: 'clock', color: '#f59e0b' },
    { label: 'Completed', value: completed, icon: 'check', color: '#10b981' },
    { label: 'Rejected', value: rejected, icon: 'x-circle', color: '#dc2626' },
    { label: 'Total Est. Value', value: `ETB ${totalAmount.toLocaleString()}`, icon: 'banknotes', color: '#d97706' },
  ];
});

watch(filter, () => { currentPage.value = 1; });

onMounted(() => {
  loadClaims();
});
</script>

<template>
  <div class="cmd-root" :class="{ dark: isDark }">
    <div class="cmd-header">
      <div>
        <h1 class="cmd-title">Claim Manager Dashboard</h1>
        <p class="cmd-sub">{{ filteredClaims.length }} claim{{ filteredClaims.length !== 1 ? 's' : '' }} · Manage incoming claims and assign adjustors</p>
      </div>
      <div style="display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap">
        <RoleSwitcher />
        <button @click="loadClaims" class="cmd-refresh-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Refresh
        </button>
      </div>
    </div>

    <div v-if="!loading" class="cmd-kpi-grid">
      <div v-for="kpi in kpis" :key="kpi.label" class="cmd-kpi-card" :style="`--kc:${kpi.color}`">
        <div class="cmd-kpi-icon">
          <svg v-if="kpi.icon==='clipboard'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          <svg v-else-if="kpi.icon==='inbox'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
          <svg v-else-if="kpi.icon==='clock'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <svg v-else-if="kpi.icon==='check'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <svg v-else-if="kpi.icon==='x-circle'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div class="cmd-kpi-body">
          <span class="cmd-kpi-value">{{ kpi.value }}</span>
          <span class="cmd-kpi-label">{{ kpi.label }}</span>
        </div>
      </div>
    </div>

    <div class="cmd-filters">
      <button v-for="f in ['ALL','SUBMITTED','IN_PROCESS','BID_ASSIGNED','BID_COMPLETED','ASSIGN_TO_GARAGE','IN_MAINTENANCE','HANDOVER_COMPLETED','REJECTED']" :key="f"
        class="cmd-filter-btn" :class="{ active: filter === f }"
        :style="`--fc:${statusColors[f] || '#6366f1'}`"
        @click="filter = f">
        {{ f === 'ALL' ? 'All' : (statusLabels[f] || f) }}
      </button>
    </div>

    <div v-if="loading" class="cmd-loading">
      <div class="cmd-spinner"></div>
      <p>Loading claims...</p>
    </div>

    <div v-else-if="filteredClaims.length === 0" class="cmd-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:44px;height:44px;color:var(--cmd-muted)"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
      <p>No claims found matching this filter.</p>
    </div>

    <div v-else class="cmd-table-wrapper">
      <table class="cmd-table">
        <thead>
          <tr>
            <th class="th-num">#</th>
            <th>Claim Number</th>
            <th>Policy Number</th>
            <th>Incident Date</th>
            <th>Est. Amount</th>
            <th>Adjustor</th>
            <th>Status</th>
            <th class="th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(claim, idx) in paginatedClaims" :key="claim.claimUuid" class="cmd-row" @click="openDetail(claim)">
            <td class="td-num">{{ (currentPage - 1) * PAGE_SIZE + idx + 1 }}</td>
            <td class="td-bold">{{ claim.claimNumber }}</td>
            <td class="td-mono">{{ claim.policyNumber }}</td>
            <td>{{ claim.incidentDate ? new Date(claim.incidentDate).toLocaleDateString() : '—' }}</td>
            <td class="td-amount">ETB {{ claim.estimatedAmount?.toLocaleString() || '0' }}</td>
            <td>
              <span v-if="claim.adjustorUuid" class="cmd-adj-pill assigned">{{ claim.adjustorUuid }}</span>
              <span v-else class="cmd-adj-pill unassigned">Unassigned</span>
            </td>
            <td>
              <span class="cmd-status" :style="`--sc:${statusColors[claim.status] || '#94a3b8'}`">
                {{ statusLabels[claim.status] || claim.status }}
              </span>
            </td>
            <td class="td-actions">
              <button class="cmd-detail-btn" @click.stop="openDetail(claim)">Manage →</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="totalPages > 1" class="cmd-pagination">
        <span class="cmd-page-info">Showing {{ (currentPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(currentPage * PAGE_SIZE, filteredClaims.length) }} of {{ filteredClaims.length }}</span>
        <div class="cmd-page-btns">
          <button class="cmd-page-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">← Prev</button>
          <button v-for="p in totalPages" :key="p" class="cmd-page-btn" :class="{ active: p === currentPage }" @click="goToPage(p)">{{ p }}</button>
          <button class="cmd-page-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Next →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.cmd-root {
  font-family: 'Inter', system-ui, sans-serif;
  --cmd-bg: #f8fafc; --cmd-card: #fff; --cmd-border: #e2e8f0;
  --cmd-title: #0f172a; --cmd-sub: #64748b; --cmd-muted: #94a3b8;
  --cmd-accent: #6366f1;
  min-height: 100%; background: var(--cmd-bg); padding: 1.5rem 2rem 3rem;
}
.cmd-root.dark {
  --cmd-bg: #090d16; --cmd-card: rgba(30,41,59,0.65); --cmd-border: rgba(255,255,255,0.06);
  --cmd-title: #f1f5f9; --cmd-sub: #94a3b8; --cmd-muted: #64748b;
}

.cmd-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
.cmd-title { font-size: 1.2rem; font-weight: 800; color: var(--cmd-title); }
.cmd-sub { font-size: .78rem; color: var(--cmd-sub); margin-top: .15rem; }
.cmd-refresh-btn { display: flex; align-items: center; gap: .4rem; background: var(--cmd-accent); color: #fff; font-weight: 700; font-size: .8rem; padding: .5rem 1rem; border-radius: 10px; border: none; cursor: pointer; transition: all .2s; }
.cmd-refresh-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,.25); }

.cmd-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: .75rem; margin-bottom: 1.5rem; }
.cmd-kpi-card { display: flex; align-items: center; gap: .7rem; padding: .85rem 1rem; background: color-mix(in srgb, var(--kc) 5%, var(--cmd-card)); border: 1px solid color-mix(in srgb, var(--kc) 18%, transparent); border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all .2s; }
.cmd-kpi-card:hover { border-color: color-mix(in srgb, var(--kc) 40%, transparent); box-shadow: 0 3px 12px color-mix(in srgb, var(--kc) 12%, transparent); transform: translateY(-1px); }
.cmd-kpi-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--kc) 10%, transparent); flex-shrink: 0; }
.cmd-kpi-icon svg { width: 18px; height: 18px; color: var(--kc); }
.cmd-kpi-body { display: flex; flex-direction: column; min-width: 0; }
.cmd-kpi-value { font-size: 1.15rem; font-weight: 800; color: var(--cmd-title); line-height: 1.2; }
.cmd-kpi-label { font-size: .68rem; font-weight: 600; color: var(--cmd-sub); letter-spacing: .02em; margin-top: .1rem; }

.cmd-filters { display: flex; gap: .4rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.cmd-filter-btn { font-size: .73rem; font-weight: 600; padding: .38rem .75rem; border-radius: 20px; border: 1px solid color-mix(in srgb, var(--fc) 20%, transparent); background: color-mix(in srgb, var(--fc) 6%, var(--cmd-card)); color: var(--fc); cursor: pointer; transition: all .2s; }
.cmd-filter-btn:hover { background: color-mix(in srgb, var(--fc) 12%, var(--cmd-card)); border-color: color-mix(in srgb, var(--fc) 35%, transparent); }
.cmd-filter-btn.active { background: var(--fc); color: #fff; border-color: var(--fc); font-weight: 700; box-shadow: 0 2px 8px color-mix(in srgb, var(--fc) 25%, transparent); }

.cmd-table-wrapper { background: var(--cmd-card); border: 1px solid var(--cmd-border); border-radius: 14px; overflow-x: auto; box-shadow: 0 1px 4px rgba(0,0,0,0.03); }
.cmd-table { width: 100%; border-collapse: collapse; text-align: left; font-size: .82rem; }
.cmd-table th { padding: .75rem 1rem; font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: var(--cmd-title); border-bottom: 1.5px solid var(--cmd-border); background: rgba(248,250,252,0.9); white-space: nowrap; }
.cmd-root.dark .cmd-table th { background: rgba(15,23,42,0.6); }
.th-num { width: 44px; text-align: center; }
.th-actions { text-align: right; }

.cmd-row { cursor: pointer; transition: background .15s; border-bottom: 1px solid var(--cmd-border); }
.cmd-row:nth-child(even) { background: #f8fafc; }
.cmd-root.dark .cmd-row:nth-child(even) { background: rgba(15,23,42,0.4); }
.cmd-row:last-child { border-bottom: none; }
.cmd-row:hover { background: #eef2ff; }
.cmd-root.dark .cmd-row:hover { background: rgba(99,102,241,0.08); }

.cmd-table td { padding: .7rem 1rem; color: var(--cmd-title); vertical-align: middle; white-space: nowrap; }
.td-num { text-align: center; font-weight: 600; color: var(--cmd-muted); width: 44px; }
.td-bold { font-weight: 800; }
.td-mono { font-family: 'JetBrains Mono', monospace; font-size: .78rem; color: var(--cmd-sub); }
.td-amount { font-weight: 700; color: #d97706; }
.td-actions { text-align: right; }

.cmd-adj-pill { font-size: .7rem; font-weight: 600; padding: .2rem .5rem; border-radius: 5px; display: inline-block; }
.cmd-adj-pill.assigned { background: rgba(99,102,241,0.08); color: #6366f1; }
.cmd-adj-pill.unassigned { background: rgba(148,163,184,0.1); color: var(--cmd-muted); }

.cmd-status { font-size: .7rem; font-weight: 700; padding: .22rem .55rem; border-radius: 5px; border: 1px solid color-mix(in srgb, var(--sc) 25%, transparent); background: color-mix(in srgb, var(--sc) 8%, transparent); color: var(--sc); display: inline-block; }

.cmd-detail-btn { font-size: .72rem; font-weight: 700; padding: .32rem .65rem; border-radius: 7px; border: 1px solid var(--cmd-border); background: var(--cmd-card); color: var(--cmd-title); cursor: pointer; transition: all .2s; }
.cmd-detail-btn:hover { border-color: var(--cmd-accent); color: var(--cmd-accent); }

.cmd-loading, .cmd-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: .75rem; color: var(--cmd-muted); }
.cmd-empty p { font-size: .88rem; }
.cmd-spinner { width: 28px; height: 28px; border: 3px solid var(--cmd-border); border-top-color: var(--cmd-accent); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg) } }

.cmd-pagination { display: flex; align-items: center; justify-content: space-between; padding: .75rem 1rem; border-top: 1px solid var(--cmd-border); flex-wrap: wrap; gap: .5rem; }
.cmd-page-info { font-size: .75rem; font-weight: 600; color: var(--cmd-sub); }
.cmd-page-btns { display: flex; align-items: center; gap: .3rem; }
.cmd-page-btn { font-size: .72rem; font-weight: 700; padding: .3rem .6rem; border-radius: 6px; border: 1px solid var(--cmd-border); background: var(--cmd-card); color: var(--cmd-sub); cursor: pointer; transition: all .15s; }
.cmd-page-btn:hover:not(:disabled) { border-color: var(--cmd-accent); color: var(--cmd-accent); }
.cmd-page-btn.active { background: var(--cmd-accent); color: #fff; border-color: var(--cmd-accent); }
.cmd-page-btn:disabled { opacity: .4; cursor: not-allowed; }
</style>
