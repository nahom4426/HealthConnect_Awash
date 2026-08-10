<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchClaimByUuid, updateClaimStatus, assignClaimAdjustor, assignClaimGarage, fetchClaimImage } from '@/features/digitalChannel/api/digitalChannelApi';
import { useAuthStore } from '@/stores/auth';
import { useDarkModeStore } from '@/stores/darkMode';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const darkStore = useDarkModeStore();
const isDark = computed(() => darkStore.isDark);
const claimUuid = computed(() => route.params.claimUuid);

const claim = ref(null);
const claimImageSrc = ref(null);
const loading = ref(true);
const updating = ref(false);

const selectedAdjustor = ref('ADJ-100');
const selectedGarage = ref('GAR-200');

const backendHost = import.meta.env.VITE_BACKEND_HOST || 'http://localhost:8888';

const myRole = computed(() => authStore.auth?.user?.roleCode || 'ROLE_CLAIM_MANAGER');

const statusColors = {
  SUBMITTED: '#3b82f6', IN_PROCESS: '#8b5cf6', BID_ASSIGNED: '#f59e0b', BID_COMPLETED: '#f97316', 
  ASSIGN_TO_GARAGE: '#06b6d4', IN_MAINTENANCE: '#e11d48', MAINTENANCE_COMPLETED: '#10b981', HANDOVER_COMPLETED: '#059669'
};

const timelineSteps = computed(() => [
  { key: 'SUBMITTED', label: 'Received', desc: 'Claim reported' },
  { key: 'IN_PROCESS', label: 'In Process', desc: 'Adjustor assigned' },
  { key: 'BID_ASSIGNED', label: 'Bidding', desc: 'Requesting bids' },
  { key: 'BID_COMPLETED', label: 'Bid Selected', desc: 'Cost approved' },
  { key: 'ASSIGN_TO_GARAGE', label: 'Garage', desc: 'Vehicle sent' },
  { key: 'IN_MAINTENANCE', label: 'Repairing', desc: 'Under maintenance' },
  { key: 'MAINTENANCE_COMPLETED', label: 'Repaired', desc: 'Repair finished' },
  { key: 'HANDOVER_COMPLETED', label: 'Handover', desc: 'Vehicle returned' },
]);

const currentStepIndex = computed(() => {
  if (!claim.value) return 0;
  const idx = timelineSteps.value.findIndex(s => s.key === claim.value.status);
  return idx >= 0 ? idx : 0;
});

async function loadDetail() {
  loading.value = true;
  claim.value = await fetchClaimByUuid(claimUuid.value);
  if (claim.value?.accidentImagePath) {
    claimImageSrc.value = await fetchClaimImage(claim.value.claimUuid);
  }
  loading.value = false;
}

async function advanceWorkflow() {
  if (!claim.value) return;
  updating.value = true;
  const idx = currentStepIndex.value;
  if (idx < timelineSteps.value.length - 1) {
    const nextStatus = timelineSteps.value[idx + 1].key;
    await updateClaimStatus(claim.value.claimUuid, nextStatus);
    await loadDetail();
  }
  updating.value = false;
}

async function handleAssignAdjustor() {
  if (!claim.value) return;
  updating.value = true;
  await assignClaimAdjustor(claim.value.claimUuid, selectedAdjustor.value);
  await loadDetail();
  updating.value = false;
}

async function handleAssignGarage() {
  if (!claim.value) return;
  updating.value = true;
  await assignClaimGarage(claim.value.claimUuid, selectedGarage.value);
  await loadDetail();
  updating.value = false;
}

function goBack() {
  router.back();
}

onMounted(loadDetail);
</script>

<template>
  <div class="cd-root" :class="{ dark: isDark }">
    <div class="cd-header">
      <div class="cd-header-left">
        <button class="cd-back" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <div class="cd-breadcrumb">Claims / Detail</div>
          <h1 class="cd-title">{{ claim?.claimNumber || 'Claim Detail' }}</h1>
        </div>
      </div>
      <div class="cd-header-actions" v-if="claim">
        <span class="cd-status-badge" :style="`background:${statusColors[claim.status] || '#94a3b8'}18;color:${statusColors[claim.status] || '#94a3b8'};border-color:${statusColors[claim.status] || '#94a3b8'}40`">
          {{ claim.status }}
        </span>
        <button v-if="claim.status !== 'HANDOVER_COMPLETED'" class="cd-advance-btn" :disabled="updating" @click="advanceWorkflow">
          {{ updating ? 'Updating...' : 'Advance Status →' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="cd-loading">
      <div class="cd-spinner"></div>
      <p>Loading claim details...</p>
    </div>

    <div v-else-if="!claim" class="cd-empty">
      <p>Claim record not found.</p>
    </div>

    <div v-else class="cd-content">
      <!-- Workflow Progress Tracker -->
      <div class="cd-card cd-tracker-card">
        <h2 class="cd-card-title">Workflow Progress</h2>
        <div class="cd-timeline">
          <div v-for="(step, idx) in timelineSteps" :key="step.key" class="cd-timeline-step" :class="{ active: idx <= currentStepIndex, current: idx === currentStepIndex }">
            <div class="cd-step-icon">
              <span v-if="idx < currentStepIndex">✓</span>
              <span v-else>{{ idx + 1 }}</span>
            </div>
            <div class="cd-step-info">
              <div class="cd-step-label">{{ step.label }}</div>
              <div class="cd-step-desc">{{ step.desc }}</div>
            </div>
            <div v-if="idx < timelineSteps.length - 1" class="cd-step-line" :class="{ filled: idx < currentStepIndex }"></div>
          </div>
        </div>
      </div>

      <div class="cd-grid">
        <!-- Main Claim Summary -->
        <div class="cd-card">
          <h2 class="cd-card-title">Incident Information</h2>
          <div class="cd-info-list">
            <div class="cd-info-row">
              <span class="cd-label">Claim Number</span>
              <span class="cd-val font-mono font-bold">{{ claim.claimNumber }}</span>
            </div>
            <div class="cd-info-row">
              <span class="cd-label">Policy Number</span>
              <span class="cd-val font-mono">{{ claim.policyNumber }}</span>
            </div>
            <div class="cd-info-row">
              <span class="cd-label">Cause of Loss</span>
              <span class="cd-val">{{ claim.causeOfLoss?.replace(/_/g, ' ') || '—' }}</span>
            </div>
            <div class="cd-info-row">
              <span class="cd-label">Incident Date</span>
              <span class="cd-val">{{ claim.incidentDate ? new Date(claim.incidentDate).toLocaleString() : '—' }}</span>
            </div>
            <div class="cd-info-row">
              <span class="cd-label">Location</span>
              <span class="cd-val">{{ claim.incidentLocation || '—' }}</span>
            </div>
          </div>
          
          <div class="cd-desc-box mt-4">
            <span class="cd-label">Description of Incident</span>
            <p class="cd-desc-text">{{ claim.description || 'No detailed description logged.' }}</p>
          </div>

          <!-- Accident Photo -->
          <div class="mt-4" v-if="claim.accidentImagePath">
            <span class="cd-label mb-2 block">Accident Photo</span>
            <div class="cd-photo-container">
              <img v-if="claimImageSrc" :src="claimImageSrc" alt="Accident Photo" class="cd-accident-photo" />
              <div v-else class="text-xs text-slate-500 italic p-4 text-center">Loading image securely...</div>
            </div>
          </div>
        </div>

        <!-- Location Map & GPS -->
        <div class="cd-card">
          <h2 class="cd-card-title">Accident GPS Location</h2>
          <div v-if="claim.gpsCoordinates" class="cd-map-container">
            <iframe 
              width="100%" 
              height="200" 
              style="border:0; border-radius:12px;" 
              loading="lazy" 
              allowfullscreen 
              :src="`https://maps.google.com/maps?q=${claim.gpsCoordinates}&z=15&output=embed`">
            </iframe>
            <div class="mt-2 text-xs text-slate-500 text-center font-mono">{{ claim.gpsCoordinates }}</div>
          </div>
          <div v-else class="cd-empty-map">
            No GPS coordinates provided by the mobile app.
          </div>
        </div>
      </div>

      <div class="cd-grid">
        <!-- Claim Management Actions (Only for Managers) -->
        <div v-if="['ROLE_CLAIM_MANAGER', 'ROLE_UNDERWRITER'].includes(myRole)" class="cd-card">
          <h2 class="cd-card-title text-indigo-700">Claim Management Actions</h2>
          <div class="cd-actions-box">
            
            <div class="cd-action-group">
              <span class="cd-label mb-1 block">Assign Field Adjustor</span>
              <div class="flex gap-2">
                <select v-model="selectedAdjustor" class="cd-select flex-1">
                  <option value="ADJ-100">Solomon Tadesse (Vehicle Adjustor)</option>
                  <option value="ADJ-101">Dawit Tesfaye (Senior Adjustor)</option>
                  <option value="ADJ-102">Almaz Wolde (Field Adjustor)</option>
                </select>
                <button class="cd-action-btn" :disabled="updating" @click="handleAssignAdjustor">Assign</button>
              </div>
            </div>

            <div class="cd-action-group mt-4">
              <span class="cd-label mb-1 block">Assign Repair Garage</span>
              <div class="flex gap-2">
                <select v-model="selectedGarage" class="cd-select flex-1">
                  <option value="GAR-200">AutoTrust Premium Garage</option>
                  <option value="GAR-201">Ethio Motors Repair Center</option>
                  <option value="GAR-202">Addis Auto Body Works</option>
                </select>
                <button class="cd-action-btn" :disabled="updating" @click="handleAssignGarage">Assign</button>
              </div>
            </div>

          </div>
        </div>

        <!-- Assignments Card -->
        <div class="cd-card">
          <h2 class="cd-card-title">Claim Assignments</h2>
          <div class="cd-info-list">
            <div class="cd-info-row">
              <span class="cd-label">Assigned Adjustor</span>
              <span class="cd-val">
                <span v-if="claim.adjustorUuid" class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">{{ claim.adjustorUuid }}</span>
                <span v-else class="text-slate-400">Unassigned</span>
              </span>
            </div>
            <div class="cd-info-row">
              <span class="cd-label">Assigned Garage</span>
              <span class="cd-val">
                <span v-if="claim.garageUuid" class="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">{{ claim.garageUuid }}</span>
                <span v-else class="text-slate-400">Unassigned</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Financial Assessment -->
        <div class="cd-card">
          <h2 class="cd-card-title">Financials</h2>
          <div class="cd-financial-box">
            <div class="cd-fin-item">
              <span class="cd-fin-label">Estimated Loss Amount</span>
              <span class="cd-fin-amount text-amber-600 font-extrabold">ETB {{ claim.estimatedAmount?.toLocaleString() || '0' }}</span>
            </div>
            <div class="cd-fin-item" v-if="claim.approvedAmount">
              <span class="cd-fin-label">Approved Settlement</span>
              <span class="cd-fin-amount text-emerald-600 font-extrabold">ETB {{ claim.approvedAmount?.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.cd-root { font-family:'Plus Jakarta Sans',system-ui,sans-serif; --cd-bg:#f8fafc; --cd-card:#fff; --cd-border:#e2e8f0; --cd-title:#0f172a; --cd-sub:#64748b; --cd-muted:#94a3b8; min-height:100%; background:var(--cd-bg); padding:1.5rem 1.75rem 3rem; }
.cd-root.dark { --cd-bg:#090d16; --cd-card:rgba(30,41,59,0.65); --cd-border:rgba(255,255,255,0.06); --cd-title:#f1f5f9; --cd-sub:#94a3b8; --cd-muted:#64748b; }
.cd-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem; }
.cd-header-left { display:flex; align-items:center; gap:.85rem; }
.cd-back { background:var(--cd-card); border:1px solid var(--cd-border); border-radius:12px; padding:.55rem; cursor:pointer; color:var(--cd-sub); display:flex; transition:all .2s; }
.cd-back:hover { border-color:#6366f1; color:#6366f1; }
.cd-breadcrumb { font-size:.72rem; font-weight:700; color:var(--cd-muted); text-transform:uppercase; letter-spacing:.05em; }
.cd-title { font-size:1.35rem; font-weight:800; color:var(--cd-title); }
.cd-header-actions { display:flex; align-items:center; gap:.75rem; }
.cd-status-badge { font-size:.78rem; font-weight:800; padding:.4rem .85rem; border-radius:8px; border:1px solid; }
.cd-advance-btn { padding:.5rem 1.25rem; font-size:.82rem; font-weight:800; border-radius:10px; border:none; background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; cursor:pointer; box-shadow:0 4px 14px rgba(99,102,241,0.25); transition:all .2s; }
.cd-advance-btn:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(99,102,241,0.35); }
.cd-loading, .cd-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:350px; gap:1rem; color:var(--cd-muted); }
.cd-spinner { width:36px; height:36px; border:3px solid var(--cd-border); border-top-color:#6366f1; border-radius:50%; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg) } }
.cd-content { display:flex; flex-direction:column; gap:1.5rem; max-width:1100px; }
.cd-card { background:var(--cd-card); border:1px solid var(--cd-border); border-radius:18px; padding:1.5rem; box-shadow:0 4px 20px rgba(0,0,0,0.02); }
.cd-card-title { font-size:.95rem; font-weight:800; color:var(--cd-title); margin-bottom:1.25rem; }
.cd-timeline { display:flex; justify-content:space-between; align-items:flex-start; position:relative; overflow-x:auto; padding:.5rem 0; }
.cd-timeline-step { display:flex; flex-direction:column; align-items:center; text-align:center; position:relative; flex:1; min-width:90px; }
.cd-step-icon { width:28px; height:28px; border-radius:50%; background:var(--cd-bg); border:2px solid var(--cd-border); color:var(--cd-muted); font-size:.7rem; font-weight:800; display:flex; align-items:center; justify-content:center; z-index:2; margin-bottom:.5rem; transition:all .3s; }
.cd-timeline-step.active .cd-step-icon { background:#6366f1; border-color:#6366f1; color:#fff; }
.cd-step-info { display:flex; flex-direction:column; gap:.15rem; }
.cd-step-label { font-size:.7rem; font-weight:800; color:var(--cd-sub); }
.cd-timeline-step.active .cd-step-label { color:var(--cd-title); }
.cd-step-desc { font-size:.65rem; color:var(--cd-muted); }
.cd-step-line { position:absolute; top:14px; left:50%; right:-50%; height:2px; background:var(--cd-border); z-index:1; }
.cd-step-line.filled { background:#6366f1; }
.cd-grid { display:grid; grid-template-columns:1fr; gap:1.5rem; }
@media(min-width:768px) { .cd-grid { grid-template-columns:1fr 1fr; } }
.cd-info-list { display:flex; flex-direction:column; gap:.75rem; }
.cd-info-row { display:flex; justify-content:space-between; align-items:center; padding-bottom:.6rem; border-bottom:1px solid var(--cd-border); font-size:.83rem; }
.cd-info-row:last-child { border-bottom:none; }
.cd-label { font-size:.75rem; font-weight:700; color:var(--cd-muted); }
.cd-val { color:var(--cd-title); font-weight:600; }
.cd-financial-box { display:flex; flex-direction:column; gap:.75rem; background:rgba(241,245,249,0.5); padding:1rem; border-radius:12px; }
.cd-root.dark .cd-financial-box { background:rgba(15,23,42,0.5); }
.cd-fin-item { display:flex; flex-direction:column; gap:.2rem; }
.cd-fin-label { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--cd-muted); }
.cd-fin-amount { font-size:1.25rem; }
.cd-desc-box { display:flex; flex-direction:column; gap:.35rem; }
.cd-desc-text { font-size:.85rem; color:var(--cd-sub); line-height:1.5; background:var(--cd-bg); padding:.85rem; border-radius:10px; border:1px solid var(--cd-border); }
.cd-empty-map { display:flex; align-items:center; justify-content:center; height:200px; background:rgba(0,0,0,0.03); border-radius:12px; color:var(--cd-muted); font-size:.85rem; font-style:italic; border:1px dashed var(--cd-border); }
.cd-root.dark .cd-empty-map { background:rgba(255,255,255,0.02); }

/* Additional Styling for Photo & Assignments */
.cd-photo-container { border-radius:12px; overflow:hidden; border:1px solid var(--cd-border); max-height:250px; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.02); }
.cd-accident-photo { width:100%; height:100%; object-fit:cover; }
.cd-actions-box { background:rgba(99,102,241,0.05); border:1px solid rgba(99,102,241,0.15); border-radius:12px; padding:1.25rem; }
.cd-root.dark .cd-actions-box { background:rgba(99,102,241,0.02); }
.cd-select { padding:.55rem .75rem; border-radius:8px; border:1px solid var(--cd-border); background:var(--cd-bg); color:var(--cd-title); font-size:.85rem; outline:none; }
.cd-select:focus { border-color:#6366f1; }
.cd-action-btn { background:#6366f1; color:#fff; border:none; padding:0 1rem; border-radius:8px; font-weight:700; font-size:.8rem; cursor:pointer; transition:all .2s; }
.cd-action-btn:hover { background:#4f46e5; }
.cd-action-btn:disabled { opacity:0.6; cursor:not-allowed; }
</style>
