<script setup>
import { ref, computed, onMounted } from 'vue';
import { fetchAllClaims } from '@/features/digitalChannel/api/digitalChannelApi';
import { useRouter } from 'vue-router';
import { useDarkModeStore } from '@/stores/darkMode';

const router = useRouter();
const darkStore = useDarkModeStore();
const isDark = computed(() => darkStore.isDark);

const claims = ref([]);
const loading = ref(true);

const statusColors = {
  SUBMITTED: '#3b82f6', IN_PROCESS: '#8b5cf6', BID_ASSIGNED: '#f59e0b', BID_COMPLETED: '#f97316', 
  ASSIGN_TO_GARAGE: '#06b6d4', IN_MAINTENANCE: '#e11d48', MAINTENANCE_COMPLETED: '#10b981', HANDOVER_COMPLETED: '#059669'
};

const statusLabels = {
  SUBMITTED: 'New (Received)', IN_PROCESS: 'Adjustor Assigned', BID_ASSIGNED: 'Bidding', 
  BID_COMPLETED: 'Bid Selected', ASSIGN_TO_GARAGE: 'Assigned to Garage', IN_MAINTENANCE: 'Repairing',
  MAINTENANCE_COMPLETED: 'Repaired', HANDOVER_COMPLETED: 'Handover Done'
};

async function loadClaims() {
  loading.value = true;
  claims.value = await fetchAllClaims();
  loading.value = false;
}

function openDetail(claim) {
  router.push(`/${claim.productModule || 'motor'}/claims/detail/${claim.claimUuid}`);
}

onMounted(() => {
  loadClaims();
});
</script>

<template>
  <div class="cmd-root" :class="{ dark: isDark }">
    <div class="cmd-header">
      <div>
        <h1 class="cmd-title">Claim Manager Dashboard</h1>
        <p class="cmd-sub">Manage all incoming motor claims and assign adjustors.</p>
      </div>
      <button @click="loadClaims" class="cmd-refresh-btn">
        Refresh
      </button>
    </div>

    <div v-if="loading" class="cmd-loading">
      <div class="cmd-spinner"></div>
      <p>Loading claims...</p>
    </div>

    <div v-else-if="claims.length === 0" class="cmd-empty">
      <p>No claims found in the system.</p>
    </div>

    <div v-else class="cmd-table-wrapper">
      <table class="cmd-table">
        <thead>
          <tr>
            <th>Claim #</th>
            <th>Policy Number</th>
            <th>Incident Date</th>
            <th>Est. Amount</th>
            <th>Adjustor</th>
            <th>Status</th>
            <th style="text-align:right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="claim in claims" :key="claim.claimUuid" class="cmd-row" @click="openDetail(claim)">
            <td class="font-bold">{{ claim.claimNumber }}</td>
            <td class="font-mono text-slate-500">{{ claim.policyNumber }}</td>
            <td>{{ claim.incidentDate ? new Date(claim.incidentDate).toLocaleDateString() : '—' }}</td>
            <td class="font-bold text-amber-600">ETB {{ claim.estimatedAmount?.toLocaleString() || '—' }}</td>
            <td>
              <span v-if="claim.adjustorUuid" class="cmd-tag-pill bg-indigo-100 text-indigo-700">{{ claim.adjustorUuid }}</span>
              <span v-else class="cmd-tag-pill bg-slate-100 text-slate-500">Unassigned</span>
            </td>
            <td>
              <span class="cmd-status" :style="`background:${statusColors[claim.status] || '#94a3b8'}18;color:${statusColors[claim.status] || '#94a3b8'};border-color:${statusColors[claim.status] || '#94a3b8'}35`">
                {{ statusLabels[claim.status] || claim.status }}
              </span>
            </td>
            <td style="text-align:right">
              <button class="cmd-detail-btn" @click.stop="openDetail(claim)">Manage Claim →</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.cmd-root { font-family:'Plus Jakarta Sans',system-ui,sans-serif; --cmd-bg:#f8fafc; --cmd-card:#fff; --cmd-border:#e2e8f0; --cmd-title:#0f172a; --cmd-sub:#64748b; min-height:100%; background:var(--cmd-bg); padding:1.5rem 1.75rem 3rem; }
.cmd-root.dark { --cmd-bg:#090d16; --cmd-card:rgba(30,41,59,0.65); --cmd-border:rgba(255,255,255,0.06); --cmd-title:#f1f5f9; --cmd-sub:#94a3b8; }
.cmd-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; }
.cmd-title { font-size:1.4rem; font-weight:800; color:var(--cmd-title); }
.cmd-sub { font-size:.85rem; color:var(--cmd-sub); margin-top:.2rem; }
.cmd-refresh-btn { background:#6366f1; color:#fff; font-weight:700; padding:.5rem 1rem; border-radius:8px; border:none; cursor:pointer; }
.cmd-table-wrapper { background:var(--cmd-card); border:1px solid var(--cmd-border); border-radius:16px; overflow-x:auto; }
.cmd-table { width:100%; border-collapse:collapse; text-align:left; font-size:.85rem; }
.cmd-table th { padding:1rem; font-size:.75rem; font-weight:800; text-transform:uppercase; color:var(--cmd-sub); border-bottom:1px solid var(--cmd-border); }
.cmd-row { cursor:pointer; border-bottom:1px solid var(--cmd-border); transition:background .15s; }
.cmd-row:hover { background:rgba(99,102,241,0.04); }
.cmd-table td { padding:1rem; color:var(--cmd-title); vertical-align:middle; }
.cmd-tag-pill { font-size:.72rem; font-weight:700; padding:.25rem .5rem; border-radius:6px; display:inline-block; }
.cmd-status { font-size:.75rem; font-weight:800; padding:.3rem .6rem; border-radius:6px; border:1px solid; display:inline-block; }
.cmd-detail-btn { font-size:.75rem; font-weight:800; padding:.4rem .8rem; border-radius:8px; border:1px solid var(--cmd-border); background:var(--cmd-card); color:var(--cmd-title); cursor:pointer; transition:all .2s; }
.cmd-detail-btn:hover { border-color:#6366f1; color:#6366f1; background:rgba(99,102,241,0.05); }
.cmd-loading, .cmd-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:300px; color:var(--cmd-sub); }
.cmd-spinner { width:32px; height:32px; border:3px solid var(--cmd-border); border-top-color:#6366f1; border-radius:50%; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg) } }
</style>
