<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { fetchAllClaims } from '@/features/digitalChannel/api/digitalChannelApi';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { useDarkModeStore } from '@/stores/darkMode';

const router = useRouter();
const authStore = useAuthStore();
const darkStore = useDarkModeStore();
const isDark = computed(() => darkStore.isDark);

const claims = ref([]);
const loading = ref(true);
const filter = ref('ALL');

const statusColors = {
  ASSIGN_TO_GARAGE: '#f59e0b', IN_MAINTENANCE: '#06b6d4', MAINTENANCE_COMPLETED: '#10b981', HANDOVER_COMPLETED: '#059669'
};
const statusLabels = {
  ASSIGN_TO_GARAGE: 'Ready to Start', IN_MAINTENANCE: 'In Progress',
  MAINTENANCE_COMPLETED: 'Repair Done', HANDOVER_COMPLETED: 'Handed Over'
};

const assignedClaims = computed(() => {
  const myUsername = authStore.auth?.user?.username || 'garage_auto_care';
  return claims.value.filter(c => c.garageUuid === myUsername || c.garageUuid);
});

const filteredClaims = computed(() => {
  if (filter.value === 'ALL') return assignedClaims.value;
  return assignedClaims.value.filter(c => c.status === filter.value);
});

const PAGE_SIZE = 9;
const currentPage = ref(1);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredClaims.value.length / PAGE_SIZE)));
const paginatedClaims = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return filteredClaims.value.slice(start, start + PAGE_SIZE);
});
function goToPage(p) { if (p >= 1 && p <= totalPages.value) currentPage.value = p; }

const kpis = computed(() => {
  const all = assignedClaims.value;
  return [
    { label: 'Total Vehicles', value: all.length, color: '#6366f1' },
    { label: 'Ready to Start', value: all.filter(c => c.status === 'ASSIGN_TO_GARAGE').length, color: '#f59e0b' },
    { label: 'In Progress', value: all.filter(c => c.status === 'IN_MAINTENANCE').length, color: '#06b6d4' },
    { label: 'Repair Done', value: all.filter(c => c.status === 'MAINTENANCE_COMPLETED').length, color: '#10b981' },
    { label: 'Handed Over', value: all.filter(c => c.status === 'HANDOVER_COMPLETED').length, color: '#059669' },
  ];
});

async function loadClaims() {
  loading.value = true;
  claims.value = await fetchAllClaims();
  loading.value = false;
  currentPage.value = 1;
}

function openDetail(claim) {
  router.push(`/${claim.productModule || 'motor'}/claims/detail/${claim.claimUuid}`);
}

watch(filter, () => { currentPage.value = 1; });

onMounted(() => {
  loadClaims();
});
</script>

<template>
  <div class="gd-root" :class="{ dark: isDark }">
    <div class="gd-header">
      <div>
        <h1 class="gd-title">Garage Workshop</h1>
        <p class="gd-sub">{{ assignedClaims.length }} vehicle{{ assignedClaims.length !== 1 ? 's' : '' }} assigned for repair</p>
      </div>
      <button @click="loadClaims" class="gd-refresh-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        Refresh
      </button>
    </div>

    <div v-if="!loading" class="gd-kpi-grid">
      <div v-for="kpi in kpis" :key="kpi.label" class="gd-kpi-card" :style="`--kc:${kpi.color}`">
        <span class="gd-kpi-value">{{ kpi.value }}</span>
        <span class="gd-kpi-label">{{ kpi.label }}</span>
      </div>
    </div>

    <div v-if="!loading" class="gd-filters">
      <button v-for="f in ['ALL','ASSIGN_TO_GARAGE','IN_MAINTENANCE','MAINTENANCE_COMPLETED','HANDOVER_COMPLETED']" :key="f"
        class="gd-filter-btn" :class="{ active: filter === f }"
        :style="`--fc:${statusColors[f] || '#6366f1'}`"
        @click="filter = f">
        {{ f === 'ALL' ? 'All' : (statusLabels[f] || f) }}
      </button>
    </div>

    <div v-if="loading" class="gd-loading">
      <div class="gd-spinner"></div>
      <p>Loading assigned vehicles...</p>
    </div>

    <div v-else-if="filteredClaims.length === 0" class="gd-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:44px;height:44px"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
      <p>No vehicles assigned for repair right now.</p>
    </div>

    <div v-else class="gd-grid">
      <div v-for="claim in paginatedClaims" :key="claim.claimUuid" class="gd-card" @click="openDetail(claim)">
        <div class="gd-card-top">
          <span class="gd-plate">{{ claim.policyNumber }}</span>
          <span class="gd-status" :style="`--sc:${statusColors[claim.status] || '#94a3b8'}`">
            {{ statusLabels[claim.status] || claim.status }}
          </span>
        </div>
        <div class="gd-card-body">
          <div class="gd-row"><span>Claim ID</span><strong>{{ claim.claimNumber }}</strong></div>
          <div class="gd-row"><span>Loss Date</span><strong>{{ claim.incidentDate ? new Date(claim.incidentDate).toLocaleDateString() : '—' }}</strong></div>
          <div class="gd-row"><span>Cause</span><strong>{{ (claim.causeOfLoss || 'Collision').replace(/_/g, ' ') }}</strong></div>
        </div>
        <button class="gd-action-btn" @click.stop="openDetail(claim)">Open Workspace →</button>
      </div>
    </div>

    <div v-if="!loading && totalPages > 1" class="gd-pagination">
      <span class="gd-page-info">Showing {{ (currentPage - 1) * PAGE_SIZE + 1 }}–{{ Math.min(currentPage * PAGE_SIZE, filteredClaims.length) }} of {{ filteredClaims.length }}</span>
      <div class="gd-page-btns">
        <button class="gd-page-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">← Prev</button>
        <button v-for="p in totalPages" :key="p" class="gd-page-btn" :class="{ active: p === currentPage }" @click="goToPage(p)">{{ p }}</button>
        <button class="gd-page-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Next →</button>
      </div>
    </div>
  </div>
</template>

<style scoped>

.gd-root {
  font-family: 'Inter', system-ui, sans-serif;
  --gd-bg: #f8fafc; --gd-card: #fff; --gd-border: #e2e8f0;
  --gd-title: #0f172a; --gd-sub: #64748b; --gd-muted: #94a3b8;
  --gd-accent: #0f172a;
  min-height: 100%; background: var(--gd-bg); padding: 1.5rem 2rem 3rem;
}
.gd-root.dark {
  --gd-bg: #090d16; --gd-card: rgba(30,41,59,0.65); --gd-border: rgba(255,255,255,0.06);
  --gd-title: #f1f5f9; --gd-sub: #94a3b8; --gd-muted: #64748b; --gd-accent: #38bdf8;
}

.gd-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.gd-title { font-size: 1.2rem; font-weight: 800; color: var(--gd-title); }
.gd-sub { font-size: .78rem; color: var(--gd-sub); margin-top: .15rem; }
.gd-refresh-btn { display: flex; align-items: center; gap: .4rem; background: var(--gd-accent); color: #fff; font-weight: 700; font-size: .8rem; padding: .5rem 1rem; border-radius: 10px; border: none; cursor: pointer; transition: all .2s; }
.gd-refresh-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.15); }

.gd-kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: .6rem; margin-bottom: 1.25rem; }
.gd-kpi-card { display: flex; flex-direction: column; align-items: center; padding: .75rem .5rem; background: color-mix(in srgb, var(--kc) 6%, var(--gd-card)); border: 1px solid color-mix(in srgb, var(--kc) 18%, transparent); border-radius: 11px; transition: all .2s; }
.gd-kpi-card:hover { border-color: color-mix(in srgb, var(--kc) 40%, transparent); transform: translateY(-1px); box-shadow: 0 3px 10px color-mix(in srgb, var(--kc) 10%, transparent); }
.gd-kpi-value { font-size: 1.3rem; font-weight: 800; color: var(--kc); line-height: 1.2; }
.gd-kpi-label { font-size: .66rem; font-weight: 600; color: var(--gd-sub); margin-top: .2rem; letter-spacing: .02em; }

.gd-filters { display: flex; gap: .4rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.gd-filter-btn { font-size: .73rem; font-weight: 600; padding: .38rem .75rem; border-radius: 20px; border: 1px solid color-mix(in srgb, var(--fc) 20%, transparent); background: color-mix(in srgb, var(--fc) 6%, var(--gd-card)); color: var(--fc); cursor: pointer; transition: all .2s; }
.gd-filter-btn:hover { background: color-mix(in srgb, var(--fc) 12%, var(--gd-card)); border-color: color-mix(in srgb, var(--fc) 35%, transparent); }
.gd-filter-btn.active { background: var(--fc); color: #fff; border-color: var(--fc); font-weight: 700; box-shadow: 0 2px 8px color-mix(in srgb, var(--fc) 25%, transparent); }

.gd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 1rem; }

.gd-card { background: var(--gd-card); border: 1px solid var(--gd-border); border-radius: 14px; cursor: pointer; transition: transform .2s, box-shadow .2s; display: flex; flex-direction: column; overflow: hidden; }
.gd-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }

.gd-card-top { padding: 1rem 1.25rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--gd-border); }
.gd-plate { font-family: 'JetBrains Mono', monospace; font-weight: 800; font-size: .85rem; color: var(--gd-title); background: rgba(0,0,0,0.03); padding: .25rem .6rem; border-radius: 6px; letter-spacing: .5px; }
.gd-root.dark .gd-plate { background: rgba(255,255,255,0.06); }
.gd-status { font-size: .68rem; font-weight: 700; padding: .22rem .55rem; border-radius: 5px; border: 1px solid color-mix(in srgb, var(--sc) 25%, transparent); background: color-mix(in srgb, var(--sc) 8%, transparent); color: var(--sc); }

.gd-card-body { padding: 1rem 1.25rem; flex: 1; display: flex; flex-direction: column; gap: .6rem; }
.gd-row { display: flex; justify-content: space-between; font-size: .82rem; }
.gd-row span { color: var(--gd-sub); font-weight: 500; }
.gd-row strong { color: var(--gd-title); font-weight: 700; font-size: .8rem; }

.gd-action-btn { margin: 0 1rem 1rem; text-align: center; padding: .6rem; background: var(--gd-card); border: 1px solid var(--gd-border); border-radius: 8px; font-weight: 700; font-size: .8rem; color: var(--gd-title); cursor: pointer; transition: all .2s; }
.gd-action-btn:hover { background: var(--gd-accent); color: #fff; border-color: var(--gd-accent); }

.gd-loading, .gd-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: .75rem; color: var(--gd-muted); }
.gd-empty p { font-size: .88rem; }
.gd-spinner { width: 28px; height: 28px; border: 3px solid var(--gd-border); border-top-color: var(--gd-accent); border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg) } }

.gd-pagination { display: flex; align-items: center; justify-content: space-between; padding: 1rem 0 0; flex-wrap: wrap; gap: .5rem; }
.gd-page-info { font-size: .75rem; font-weight: 600; color: var(--gd-sub); }
.gd-page-btns { display: flex; align-items: center; gap: .3rem; }
.gd-page-btn { font-size: .72rem; font-weight: 700; padding: .3rem .6rem; border-radius: 6px; border: 1px solid var(--gd-border); background: var(--gd-card); color: var(--gd-sub); cursor: pointer; transition: all .15s; }
.gd-page-btn:hover:not(:disabled) { border-color: var(--gd-accent); color: var(--gd-accent); }
.gd-page-btn.active { background: var(--gd-accent); color: #fff; border-color: var(--gd-accent); }
.gd-page-btn:disabled { opacity: .4; cursor: not-allowed; }
</style>
