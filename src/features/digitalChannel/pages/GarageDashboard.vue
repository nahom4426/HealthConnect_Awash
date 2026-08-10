<script setup>
import { ref, computed, onMounted } from 'vue';
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

const statusColors = {
  ASSIGN_TO_GARAGE: '#f59e0b', IN_MAINTENANCE: '#06b6d4', MAINTENANCE_COMPLETED: '#10b981', HANDOVER_COMPLETED: '#059669'
};
const statusLabels = {
  ASSIGN_TO_GARAGE: 'Ready to Start', IN_MAINTENANCE: 'Repair in Progress', 
  MAINTENANCE_COMPLETED: 'Repair Finished', HANDOVER_COMPLETED: 'Handed Over'
};

const assignedClaims = computed(() => {
  // In a real app, this should be filtered by the backend based on garageUuid
  // For now, we simulate it or just show claims that have a garage assigned
  const myUsername = authStore.auth?.user?.username || 'garage_auto_care';
  return claims.value.filter(c => c.garageUuid === myUsername || c.garageUuid);
});

async function loadClaims() {
  loading.value = true;
  claims.value = await fetchAllClaims();
  loading.value = false;
}

function openDetail(claim) {
  router.push(`/digital-channel/claims/detail/${claim.claimUuid}`);
}

onMounted(() => {
  loadClaims();
});
</script>

<template>
  <div class="gd-root" :class="{ dark: isDark }">
    <div class="gd-header">
      <div>
        <h1 class="gd-title">Garage Workshop</h1>
        <p class="gd-sub">Manage repairs for your assigned vehicles.</p>
      </div>
      <button @click="loadClaims" class="gd-refresh-btn">Refresh</button>
    </div>

    <div v-if="loading" class="gd-loading">
      <div class="gd-spinner"></div>
      <p>Loading assigned vehicles...</p>
    </div>

    <div v-else-if="assignedClaims.length === 0" class="gd-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;color:var(--gd-muted);margin-bottom:1rem;"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
      <p>No vehicles assigned for repair right now.</p>
    </div>

    <div v-else class="gd-grid">
      <div v-for="claim in assignedClaims" :key="claim.claimUuid" class="gd-card" @click="openDetail(claim)">
        <div class="gd-card-header">
          <span class="gd-plate">{{ claim.policyNumber }}</span>
          <span class="gd-status" :style="`background:${statusColors[claim.status] || '#94a3b8'}15;color:${statusColors[claim.status] || '#94a3b8'}`">
            {{ statusLabels[claim.status] || claim.status }}
          </span>
        </div>
        <div class="gd-card-body">
          <div class="gd-row"><span>Claim ID</span><strong>{{ claim.claimNumber }}</strong></div>
          <div class="gd-row"><span>Loss Date</span><strong>{{ claim.incidentDate ? new Date(claim.incidentDate).toLocaleDateString() : '—' }}</strong></div>
          <div class="gd-row"><span>Cause</span><strong>{{ claim.causeOfLoss || 'Collision' }}</strong></div>
        </div>
        <div class="gd-card-footer">
          <button class="gd-action-btn" @click.stop="openDetail(claim)">Open Workspace →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.gd-root { font-family:'Plus Jakarta Sans',system-ui,sans-serif; --gd-bg:#f1f5f9; --gd-card:#fff; --gd-border:#e2e8f0; --gd-title:#0f172a; --gd-sub:#64748b; --gd-muted:#94a3b8; min-height:100%; background:var(--gd-bg); padding:1.5rem 1.75rem 3rem; }
.gd-root.dark { --gd-bg:#090d16; --gd-card:rgba(30,41,59,0.65); --gd-border:rgba(255,255,255,0.06); --gd-title:#f1f5f9; --gd-sub:#94a3b8; }
.gd-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; }
.gd-title { font-size:1.4rem; font-weight:800; color:var(--gd-title); }
.gd-sub { font-size:.85rem; color:var(--gd-sub); margin-top:.2rem; }
.gd-refresh-btn { background:#0f172a; color:#fff; font-weight:700; padding:.5rem 1rem; border-radius:8px; border:none; cursor:pointer; }
.gd-root.dark .gd-refresh-btn { background:#334155; }
.gd-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:1.25rem; }
.gd-card { background:var(--gd-card); border:1px solid var(--gd-border); border-radius:12px; cursor:pointer; transition:transform .2s, box-shadow .2s; display:flex; flex-direction:column; }
.gd-card:hover { transform:translateY(-2px); box-shadow:0 10px 25px rgba(0,0,0,0.05); }
.gd-card-header { padding:1.25rem; border-bottom:1px solid var(--gd-border); display:flex; justify-content:space-between; align-items:center; }
.gd-plate { font-family:monospace; font-weight:800; font-size:1.1rem; color:var(--gd-title); background:rgba(0,0,0,0.04); padding:.2rem .6rem; border-radius:6px; letter-spacing:1px; }
.gd-root.dark .gd-plate { background:rgba(255,255,255,0.08); }
.gd-status { font-size:.7rem; font-weight:800; padding:.3rem .6rem; border-radius:6px; }
.gd-card-body { padding:1.25rem; flex:1; display:flex; flex-direction:column; gap:.75rem; }
.gd-row { display:flex; justify-content:space-between; font-size:.85rem; }
.gd-row span { color:var(--gd-sub); }
.gd-row strong { color:var(--gd-title); font-weight:700; }
.gd-card-footer { padding:1rem 1.25rem; background:rgba(0,0,0,0.015); border-top:1px solid var(--gd-border); border-radius:0 0 12px 12px; }
.gd-root.dark .gd-card-footer { background:rgba(0,0,0,0.2); }
.gd-action-btn { width:100%; text-align:center; padding:.6rem; background:#fff; border:1px solid var(--gd-border); border-radius:8px; font-weight:700; font-size:.85rem; color:var(--gd-title); cursor:pointer; transition:all .2s; }
.gd-root.dark .gd-action-btn { background:rgba(255,255,255,0.05); }
.gd-action-btn:hover { background:#0f172a; color:#fff; border-color:#0f172a; }
.gd-root.dark .gd-action-btn:hover { background:#38bdf8; border-color:#38bdf8; color:#0f172a; }
.gd-loading, .gd-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:300px; color:var(--gd-sub); }
.gd-spinner { width:32px; height:32px; border:3px solid var(--gd-border); border-top-color:#0f172a; border-radius:50%; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg) } }
</style>
