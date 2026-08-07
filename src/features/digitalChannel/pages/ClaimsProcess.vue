<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useModuleStore, MODULES } from '@/stores/moduleStore';
import { useRoute, useRouter } from 'vue-router';
import { useDarkModeStore } from '@/stores/darkMode';
import { fetchClaimsByModule, updateClaimStatus } from '@/features/digitalChannel/api/digitalChannelApi';

const route = useRoute();
const router = useRouter();
const moduleStore = useModuleStore();
const darkStore = useDarkModeStore();
const isDark = computed(() => darkStore.isDark);

const mod = computed(() => {
  if (moduleStore.activeModule) return moduleStore.activeModule;
  const seg = route.path.split('/')[1];
  const found = MODULES.find(m => m.id === seg);
  if (found) { moduleStore.selectModule(found.id); return found; }
  return null;
});

const claims = ref([]);
const loading = ref(true);
const filter = ref('ALL');
const expandedClaimUuid = ref(null);

const filteredClaims = computed(() => {
  if (filter.value === 'ALL') return claims.value;
  return claims.value.filter(c => c.status === filter.value);
});

const statusColors = {
  SUBMITTED: '#3b82f6', SPOT_SURVEY_ASSIGNED: '#8b5cf6', SURVEY_COMPLETED: '#a855f7',
  GARAGE_BIDDING: '#f59e0b', GARAGE_BIDDING_READY: '#f97316', REPAIR_IN_PROGRESS: '#06b6d4',
  SUBROGATION_PENDING: '#e11d48', APPROVED: '#10b981', SETTLED: '#059669', REJECTED: '#dc2626'
};

const statusLabels = {
  SUBMITTED: 'Submitted', SPOT_SURVEY_ASSIGNED: 'Survey Assigned', SURVEY_COMPLETED: 'Survey Done',
  GARAGE_BIDDING: 'Awaiting Bids', GARAGE_BIDDING_READY: 'Bids Ready', REPAIR_IN_PROGRESS: 'Repairing',
  SUBROGATION_PENDING: 'Subrogation', APPROVED: 'Approved', SETTLED: 'Settled', REJECTED: 'Rejected'
};

async function loadClaims() {
  loading.value = true;
  if (mod.value?.id) claims.value = await fetchClaimsByModule(mod.value.id);
  loading.value = false;
}

function openDetail(claim, event) {
  if (event) event.stopPropagation();
  router.push(`/${mod.value?.id || 'motor'}/claims/detail/${claim.claimUuid || claim.claimNumber}`);
}

function toggleExpand(uuid) {
  if (expandedClaimUuid.value === uuid) {
    expandedClaimUuid.value = null;
  } else {
    expandedClaimUuid.value = uuid;
  }
}

async function advanceStatus(claim, event) {
  if (event) event.stopPropagation();
  const flow = ['SUBMITTED','SURVEY_COMPLETED','GARAGE_BIDDING','APPROVED','SETTLED'];
  const idx = flow.indexOf(claim.status);
  if (idx < flow.length - 1) {
    await updateClaimStatus(claim.claimUuid, flow[idx + 1]);
    await loadClaims();
  }
}

function goBack() { router.push(`/${mod.value?.id}/dashboard`); }

const pageTitle = computed(() => {
  if (filter.value === 'APPROVED') return `${mod.value?.name || 'Module'} — Approved Claims`;
  if (filter.value === 'SETTLED') return `${mod.value?.name || 'Module'} — Completed Claims`;
  return `${mod.value?.name || 'Module'} — Claims Processing`;
});

function syncFilterFromRoute() {
  if (route.path.includes('/approved')) {
    filter.value = 'APPROVED';
  } else if (route.path.includes('/completed')) {
    filter.value = 'SETTLED';
  } else if (route.query.status) {
    filter.value = route.query.status;
  }
}

onMounted(() => {
  syncFilterFromRoute();
  loadClaims();
});

watch(() => route.path, () => {
  syncFilterFromRoute();
  loadClaims();
});
</script>

<template>
  <div class="cp-root" :class="{ dark: isDark }">
    <div class="cp-header">
      <div class="cp-header-left">
        <button class="cp-back" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <h1 class="cp-title">{{ pageTitle }}</h1>
          <p class="cp-sub">{{ filteredClaims.length }} claim{{ filteredClaims.length !== 1 ? 's' : '' }} found</p>
        </div>
      </div>
      <RouterLink :to="`/${mod?.id}/claims/new`" class="cp-new-btn" :style="`background:linear-gradient(135deg,${mod?.color?.from},${mod?.color?.to})`">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:15px;height:15px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        New Claim
      </RouterLink>
    </div>

    <div class="cp-filters">
      <button v-for="f in ['ALL','SUBMITTED','APPROVED','SETTLED','REJECTED']" :key="f"
        class="cp-filter-btn" :class="{ active: filter === f }" @click="filter = f">
        {{ f === 'ALL' ? 'All' : statusLabels[f] || f }}
      </button>
    </div>

    <div v-if="loading" class="cp-loading">
      <div class="cp-spinner"></div>
      <p>Loading claims...</p>
    </div>

    <div v-else-if="filteredClaims.length === 0" class="cp-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;color:var(--cp-muted)"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
      <p>No claims found for {{ mod?.name }}</p>
      <RouterLink :to="`/${mod?.id}/claims/new`" class="cp-empty-link">Submit your first claim →</RouterLink>
    </div>

    <div v-else class="cp-table-wrapper">
      <table class="cp-table">
        <thead>
          <tr>
            <th style="width:50px;text-align:center">#</th>
            <th>Claim #</th>
            <th>Policy Number</th>
            <th>Coverage Type</th>
            <th>Cause of Loss</th>
            <th>Incident Date</th>
            <th>Est. Amount</th>
            <th>Status</th>
            <th style="text-align:right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(claim, idx) in filteredClaims" :key="claim.claimUuid" class="cp-row" @click="openDetail(claim, $event)">
            <td class="nowrap text-center font-bold text-slate-400" style="width:50px;text-align:center">{{ idx + 1 }}</td>
            <td class="nowrap font-bold text-slate-900 dark:text-slate-100">
              <div class="cp-claim-id-cell">
                <span class="cp-claim-num-text">{{ claim.claimNumber }}</span>
              </div>
            </td>
              <td class="nowrap font-mono text-slate-600 dark:text-slate-400">{{ claim.policyNumber }}</td>
              <td class="nowrap"><span class="cp-tag-pill">{{ claim.coverageType?.replace(/_/g, ' ') }}</span></td>
              <td class="nowrap">{{ claim.causeOfLoss?.replace(/_/g, ' ') || '—' }}</td>
              <td class="nowrap">{{ claim.incidentDate ? new Date(claim.incidentDate).toLocaleDateString() : '—' }}</td>
              <td class="nowrap font-bold text-amber-600">ETB {{ claim.estimatedAmount?.toLocaleString() || '—' }}</td>
              <td class="nowrap">
                <span class="cp-status" :style="`background:${statusColors[claim.status] || '#94a3b8'}18;color:${statusColors[claim.status] || '#94a3b8'};border-color:${statusColors[claim.status] || '#94a3b8'}35`">
                  {{ statusLabels[claim.status] || claim.status }}
                </span>
              </td>
              <td class="nowrap" style="text-align:right" @click.stop>
                <div class="cp-actions-cell">
                  <button class="cp-detail-btn" @click="openDetail(claim, $event)">
                    View Detail →
                  </button>
                  <button v-if="claim.status !== 'SETTLED' && claim.status !== 'REJECTED'" class="cp-advance-btn" @click="advanceStatus(claim, $event)">
                    Advance
                  </button>
                </div>
              </td>
            </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.cp-root { font-family:'Plus Jakarta Sans',system-ui,sans-serif; --cp-bg:#f8fafc; --cp-card:#fff; --cp-border:#e2e8f0; --cp-title:#0f172a; --cp-sub:#64748b; --cp-muted:#94a3b8; min-height:100%; background:var(--cp-bg); padding:1.5rem 1.75rem 3rem; }
.cp-root.dark { --cp-bg:#090d16; --cp-card:rgba(30,41,59,0.65); --cp-border:rgba(255,255,255,0.06); --cp-title:#f1f5f9; --cp-sub:#94a3b8; --cp-muted:#64748b; }
.cp-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem; flex-wrap:wrap; gap:1rem; }
.cp-header-left { display:flex; align-items:center; gap:.75rem; }
.cp-back { background:var(--cp-card); border:1px solid var(--cp-border); border-radius:12px; padding:.5rem; cursor:pointer; color:var(--cp-sub); display:flex; transition:all .2s; }
.cp-back:hover { border-color:#6366f1; color:#6366f1; }
.cp-title { font-size:1.2rem; font-weight:800; color:var(--cp-title); }
.cp-sub { font-size:.78rem; color:var(--cp-sub); margin-top:.1rem; }
.cp-new-btn { display:flex; align-items:center; gap:.4rem; color:#fff; font-size:.82rem; font-weight:800; border-radius:12px; padding:.6rem 1.1rem; text-decoration:none; transition:transform .2s,box-shadow .2s; box-shadow:0 4px 12px rgba(99,102,241,.15); }
.cp-new-btn:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(99,102,241,.25); }
.cp-filters { display:flex; gap:.5rem; margin-bottom:1.25rem; flex-wrap:wrap; }
.cp-filter-btn { font-size:.75rem; font-weight:700; padding:.4rem .85rem; border-radius:8px; border:1px solid var(--cp-border); background:var(--cp-card); color:var(--cp-sub); cursor:pointer; transition:all .2s; }
.cp-filter-btn.active { background:#6366f1; color:#fff; border-color:#6366f1; }
.cp-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:300px; gap:.75rem; color:var(--cp-muted); }
.cp-spinner { width:32px; height:32px; border:3px solid var(--cp-border); border-top-color:#6366f1; border-radius:50%; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg) } }
.cp-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:300px; gap:.75rem; }
.cp-empty p { color:var(--cp-muted); font-size:.9rem; }
.cp-empty-link { color:#6366f1; font-weight:700; text-decoration:none; font-size:.85rem; }

/* Table View Styling */
.cp-table-wrapper { background:var(--cp-card); border:1px solid var(--cp-border); border-radius:16px; overflow-x:auto; box-shadow:0 4px 20px rgba(0,0,0,0.02); }
.cp-table { width:100%; border-collapse:collapse; text-align:left; font-size:.83rem; white-space:nowrap; }
.cp-table th { background:rgba(241,245,249,0.6); padding:.85rem 1.1rem; font-size:.72rem; font-weight:800; text-transform:uppercase; letter-spacing:.05em; color:var(--cp-sub); border-bottom:1px solid var(--cp-border); white-space:nowrap; }
.cp-root.dark .cp-table th { background:rgba(15,23,42,0.6); }
.cp-row { cursor:pointer; transition:background .15s; border-bottom:1px solid var(--cp-border); }
.cp-row:hover { background:rgba(99,102,241,0.04); }
.cp-table td { padding:.85rem 1.1rem; color:var(--cp-title); vertical-align:middle; white-space:nowrap; }
.nowrap { white-space:nowrap; }
.cp-claim-id-cell { display:flex; align-items:center; gap:.5rem; }
.cp-claim-num-text { font-weight:800; color:var(--cp-title); }
.cp-tag-pill { font-size:.72rem; font-weight:700; padding:.2rem .55rem; border-radius:6px; background:rgba(226,232,240,0.6); color:var(--cp-sub); display:inline-block; }
.cp-status { font-size:.72rem; font-weight:800; padding:.25rem .6rem; border-radius:6px; border:1px solid; display:inline-block; }
.cp-actions-cell { display:flex; align-items:center; justify-content:flex-end; gap:.5rem; }
.cp-detail-btn { font-size:.72rem; font-weight:800; padding:.35rem .75rem; border-radius:8px; border:1px solid var(--cp-border); background:var(--cp-card); color:var(--cp-title); cursor:pointer; transition:all .2s; }
.cp-detail-btn:hover { border-color:#6366f1; color:#6366f1; background:rgba(99,102,241,0.05); }
.cp-advance-btn { font-size:.72rem; font-weight:800; padding:.35rem .75rem; border-radius:8px; border:1px solid #818cf8; background:rgba(99,102,241,.08); color:#6366f1; cursor:pointer; transition:all .2s; }
.cp-advance-btn:hover { background:#6366f1; color:#fff; }
</style>
