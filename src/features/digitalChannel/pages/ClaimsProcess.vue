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

const statusColors = {
  SUBMITTED: '#3b82f6',
  IN_PROCESS: '#8b5cf6',
  BID_ASSIGNED: '#f59e0b',
  BID_COMPLETED: '#10b981',
  ASSIGN_TO_GARAGE: '#06b6d4',
  IN_MAINTENANCE: '#e11d48',
  MAINTENANCE_COMPLETED: '#059669',
  HANDOVER_COMPLETED: '#047857',
  REJECTED: '#dc2626',
};

const statusLabels = {
  SUBMITTED: 'Submitted',
  IN_PROCESS: 'In Process',
  BID_ASSIGNED: 'Bidding',
  BID_COMPLETED: 'Approved',
  ASSIGN_TO_GARAGE: 'At Garage',
  IN_MAINTENANCE: 'Repairing',
  MAINTENANCE_COMPLETED: 'Repaired',
  HANDOVER_COMPLETED: 'Completed',
  REJECTED: 'Rejected',
};

const COMPLETED_STATUSES = ['MAINTENANCE_COMPLETED', 'HANDOVER_COMPLETED'];
const APPROVED_STATUSES = ['BID_COMPLETED', 'ASSIGN_TO_GARAGE', 'IN_MAINTENANCE'];

const pageMode = computed(() => {
  if (route.path.includes('/completed')) return 'completed';
  if (route.path.includes('/approved')) return 'approved';
  return 'process';
});

const filterTabs = computed(() => {
  if (pageMode.value === 'completed') return ['ALL', 'MAINTENANCE_COMPLETED', 'HANDOVER_COMPLETED'];
  if (pageMode.value === 'approved') return ['ALL', 'BID_COMPLETED', 'ASSIGN_TO_GARAGE', 'IN_MAINTENANCE'];
  return ['ALL', 'SUBMITTED', 'IN_PROCESS', 'BID_ASSIGNED', 'BID_COMPLETED', 'ASSIGN_TO_GARAGE', 'IN_MAINTENANCE', 'MAINTENANCE_COMPLETED', 'HANDOVER_COMPLETED', 'REJECTED'];
});

const scopedClaims = computed(() => {
  if (pageMode.value === 'completed') return claims.value.filter(c => COMPLETED_STATUSES.includes(c.status));
  if (pageMode.value === 'approved') return claims.value.filter(c => APPROVED_STATUSES.includes(c.status));
  return claims.value;
});

const filteredClaims = computed(() => {
  if (filter.value === 'ALL') return scopedClaims.value;
  return scopedClaims.value.filter(c => c.status === filter.value);
});

async function loadClaims() {
  loading.value = true;
  if (mod.value?.id) claims.value = await fetchClaimsByModule(mod.value.id);
  loading.value = false;
}

function openDetail(claim, event) {
  if (event) event.stopPropagation();
  router.push(`/${mod.value?.id || 'motor'}/claims/detail/${claim.claimUuid || claim.claimNumber}`);
}

const WORKFLOW = ['SUBMITTED','IN_PROCESS','BID_ASSIGNED','BID_COMPLETED','ASSIGN_TO_GARAGE','IN_MAINTENANCE','MAINTENANCE_COMPLETED','HANDOVER_COMPLETED'];

async function advanceStatus(claim, event) {
  if (event) event.stopPropagation();
  const idx = WORKFLOW.indexOf(claim.status);
  if (idx >= 0 && idx < WORKFLOW.length - 1) {
    await updateClaimStatus(claim.claimUuid, WORKFLOW[idx + 1]);
    await loadClaims();
  }
}

function goBack() { router.push(`/${mod.value?.id}/dashboard`); }

const pageTitle = computed(() => {
  const name = mod.value?.name || 'Motor Insurance';
  if (pageMode.value === 'completed') return `${name} — Completed Claims`;
  if (pageMode.value === 'approved') return `${name} — Approved Claims`;
  return `${name} — Claims Processing`;
});

onMounted(() => {
  filter.value = 'ALL';
  loadClaims();
});

watch(() => route.path, () => {
  filter.value = 'ALL';
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
      <button v-for="f in filterTabs" :key="f"
        class="cp-filter-btn" :class="{ active: filter === f }" @click="filter = f">
        {{ f === 'ALL' ? 'All' : (statusLabels[f] || f) }}
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
            <th class="th-num">#</th>
            <th>Claim Number</th>
            <th>Policy Number</th>
            <th>Coverage</th>
            <th>Cause of Loss</th>
            <th>Incident Date</th>
            <th>Est. Amount</th>
            <th>Status</th>
            <th class="th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(claim, idx) in filteredClaims" :key="claim.claimUuid" class="cp-row" @click="openDetail(claim, $event)">
            <td class="td-num">{{ idx + 1 }}</td>
            <td class="td-claim-num">{{ claim.claimNumber }}</td>
            <td class="td-mono">{{ claim.policyNumber }}</td>
            <td><span class="cp-tag-pill">{{ claim.coverageType?.replace(/_/g, ' ') || '—' }}</span></td>
            <td>{{ claim.causeOfLoss?.replace(/_/g, ' ') || '—' }}</td>
            <td>{{ claim.incidentDate ? new Date(claim.incidentDate).toLocaleDateString() : '—' }}</td>
            <td class="td-amount">ETB {{ claim.estimatedAmount?.toLocaleString() || '0' }}</td>
            <td>
              <span class="cp-status" :style="`--sc:${statusColors[claim.status] || '#94a3b8'}`">
                {{ statusLabels[claim.status] || claim.status }}
              </span>
            </td>
            <td class="td-actions" @click.stop>
              <button class="cp-detail-btn" @click="openDetail(claim, $event)">View →</button>
              <button v-if="claim.status !== 'HANDOVER_COMPLETED' && claim.status !== 'REJECTED'" class="cp-advance-btn" @click="advanceStatus(claim, $event)">
                Advance
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.cp-root {
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  --cp-bg: #f8fafc; --cp-card: #fff; --cp-border: #e2e8f0;
  --cp-title: #0f172a; --cp-sub: #64748b; --cp-muted: #94a3b8;
  --cp-accent: #6366f1;
  min-height: 100%; background: var(--cp-bg); padding: 1.5rem 2rem 3rem;
}
.cp-root.dark {
  --cp-bg: #090d16; --cp-card: rgba(30,41,59,0.65); --cp-border: rgba(255,255,255,0.06);
  --cp-title: #f1f5f9; --cp-sub: #94a3b8; --cp-muted: #64748b;
}

.cp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem; }
.cp-header-left { display: flex; align-items: center; gap: .75rem; }
.cp-back { background: var(--cp-card); border: 1px solid var(--cp-border); border-radius: 10px; padding: .5rem; cursor: pointer; color: var(--cp-sub); display: flex; transition: all .2s; }
.cp-back:hover { border-color: var(--cp-accent); color: var(--cp-accent); }
.cp-title { font-size: 1.15rem; font-weight: 800; color: var(--cp-title); line-height: 1.3; }
.cp-sub { font-size: .78rem; color: var(--cp-sub); margin-top: .1rem; }
.cp-new-btn { display: flex; align-items: center; gap: .4rem; color: #fff; font-size: .8rem; font-weight: 700; border-radius: 10px; padding: .55rem 1rem; text-decoration: none; transition: transform .2s, box-shadow .2s; box-shadow: 0 4px 12px rgba(99,102,241,.15); }
.cp-new-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(99,102,241,.25); }

.cp-filters { display: flex; gap: .4rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.cp-filter-btn { font-size: .73rem; font-weight: 600; padding: .38rem .75rem; border-radius: 20px; border: 1px solid var(--cp-border); background: var(--cp-card); color: var(--cp-sub); cursor: pointer; transition: all .2s; }
.cp-filter-btn:hover { border-color: var(--cp-accent); color: var(--cp-accent); }
.cp-filter-btn.active { background: var(--cp-accent); color: #fff; border-color: var(--cp-accent); }

.cp-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: .75rem; color: var(--cp-muted); }
.cp-spinner { width: 28px; height: 28px; border: 3px solid var(--cp-border); border-top-color: var(--cp-accent); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg) } }

.cp-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: .75rem; }
.cp-empty p { color: var(--cp-muted); font-size: .9rem; }
.cp-empty-link { color: var(--cp-accent); font-weight: 700; text-decoration: none; font-size: .85rem; }
.cp-empty-link:hover { text-decoration: underline; }

.cp-table-wrapper { background: var(--cp-card); border: 1px solid var(--cp-border); border-radius: 14px; overflow-x: auto; box-shadow: 0 1px 4px rgba(0,0,0,0.03); }
.cp-table { width: 100%; border-collapse: collapse; text-align: left; font-size: .82rem; }
.cp-table th { padding: .75rem 1rem; font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--cp-sub); border-bottom: 1px solid var(--cp-border); background: rgba(248,250,252,0.8); white-space: nowrap; }
.cp-root.dark .cp-table th { background: rgba(15,23,42,0.6); }
.th-num { width: 44px; text-align: center; }
.th-actions { text-align: right; }

.cp-row { cursor: pointer; transition: background .15s; border-bottom: 1px solid var(--cp-border); }
.cp-row:last-child { border-bottom: none; }
.cp-row:hover { background: rgba(99,102,241,0.03); }

.cp-table td { padding: .7rem 1rem; color: var(--cp-title); vertical-align: middle; white-space: nowrap; }
.td-num { text-align: center; font-weight: 600; color: var(--cp-muted); width: 44px; }
.td-claim-num { font-weight: 800; }
.td-mono { font-family: 'JetBrains Mono', monospace; font-size: .78rem; color: var(--cp-sub); }
.td-amount { font-weight: 700; color: #d97706; }
.td-actions { text-align: right; }

.cp-tag-pill { font-size: .7rem; font-weight: 600; padding: .18rem .5rem; border-radius: 5px; background: rgba(226,232,240,0.7); color: var(--cp-sub); display: inline-block; text-transform: capitalize; }
.cp-root.dark .cp-tag-pill { background: rgba(51,65,85,0.5); }

.cp-status { font-size: .7rem; font-weight: 700; padding: .22rem .55rem; border-radius: 5px; border: 1px solid color-mix(in srgb, var(--sc) 25%, transparent); background: color-mix(in srgb, var(--sc) 8%, transparent); color: var(--sc); display: inline-block; }

.cp-detail-btn { font-size: .72rem; font-weight: 700; padding: .32rem .65rem; border-radius: 7px; border: 1px solid var(--cp-border); background: var(--cp-card); color: var(--cp-title); cursor: pointer; transition: all .2s; }
.cp-detail-btn:hover { border-color: var(--cp-accent); color: var(--cp-accent); }
.cp-advance-btn { font-size: .72rem; font-weight: 700; padding: .32rem .65rem; border-radius: 7px; border: 1px solid #a5b4fc; background: rgba(99,102,241,.06); color: var(--cp-accent); cursor: pointer; transition: all .2s; margin-left: .4rem; }
.cp-advance-btn:hover { background: var(--cp-accent); color: #fff; border-color: var(--cp-accent); }
</style>
