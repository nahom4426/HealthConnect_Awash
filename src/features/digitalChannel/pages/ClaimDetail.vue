<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useModuleStore, MODULES } from '@/stores/moduleStore';
import { useDarkModeStore } from '@/stores/darkMode';
import { fetchClaimsByModule, updateClaimStatus } from '@/features/digitalChannel/api/digitalChannelApi';

const route = useRoute();
const router = useRouter();
const moduleStore = useModuleStore();
const darkStore = useDarkModeStore();
const isDark = computed(() => darkStore.isDark);

const claimUuid = computed(() => route.params.claimUuid);
const mod = computed(() => {
  if (moduleStore.activeModule) return moduleStore.activeModule;
  const seg = route.path.split('/')[1];
  const found = MODULES.find(m => m.id === seg);
  if (found) { moduleStore.selectModule(found.id); return found; }
  return null;
});

const claim = ref(null);
const loading = ref(true);
const updating = ref(false);

const statusColors = {
  SUBMITTED: '#3b82f6', SPOT_SURVEY_ASSIGNED: '#8b5cf6', SURVEY_COMPLETED: '#a855f7',
  GARAGE_BIDDING: '#f59e0b', GARAGE_BIDDING_READY: '#f97316', REPAIR_IN_PROGRESS: '#06b6d4',
  SUBROGATION_PENDING: '#e11d48', APPROVED: '#10b981', SETTLED: '#059669', REJECTED: '#dc2626'
};

const statusLabels = {
  SUBMITTED: 'Submitted', SPOT_SURVEY_ASSIGNED: 'Survey Assigned', SURVEY_COMPLETED: 'Survey Completed',
  GARAGE_BIDDING: 'Awaiting Bids', GARAGE_BIDDING_READY: 'Bids Ready', REPAIR_IN_PROGRESS: 'Repair In Progress',
  SUBROGATION_PENDING: 'Subrogation Pending', APPROVED: 'Claim Approved', SETTLED: 'Claim Settled', REJECTED: 'Claim Rejected'
};

const timelineSteps = computed(() => [
  { key: 'SUBMITTED', label: 'Claim Submitted', desc: 'Notification received & logged' },
  { key: 'SURVEY_COMPLETED', label: 'Spot Survey', desc: 'Physical inspection completed' },
  { key: 'GARAGE_BIDDING', label: 'Garage Bidding', desc: 'Repairs estimation & bids' },
  { key: 'APPROVED', label: 'Underwriter Approval', desc: 'Claim decision & payout authorization' },
  { key: 'SETTLED', label: 'Settlement Completed', desc: 'Final payout executed' },
]);

const currentStepIndex = computed(() => {
  if (!claim.value) return 0;
  const flow = ['SUBMITTED','SURVEY_COMPLETED','GARAGE_BIDDING','APPROVED','SETTLED'];
  const idx = flow.indexOf(claim.value.status);
  return idx >= 0 ? idx : 0;
});

async function loadDetail() {
  loading.value = true;
  if (mod.value?.id) {
    const list = await fetchClaimsByModule(mod.value.id);
    claim.value = list.find(c => c.claimUuid === claimUuid.value || c.claimNumber === claimUuid.value) || list[0] || null;
  }
  loading.value = false;
}

async function advanceWorkflow() {
  if (!claim.value) return;
  updating.value = true;
  const flow = ['SUBMITTED','SURVEY_COMPLETED','GARAGE_BIDDING','APPROVED','SETTLED'];
  const idx = flow.indexOf(claim.value.status);
  if (idx < flow.length - 1) {
    await updateClaimStatus(claim.value.claimUuid, flow[idx + 1]);
    await loadDetail();
  }
  updating.value = false;
}

function goBack() {
  router.push(`/${mod.value?.id || 'motor'}/claims/process`);
}

onMounted(loadDetail);
</script>

<template>
  <div class="cd-root" :class="{ dark: isDark }">
    <!-- Header -->
    <div class="cd-header">
      <div class="cd-header-left">
        <button class="cd-back" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <div class="cd-breadcrumb">Claims Processing / Detail</div>
          <h1 class="cd-title">{{ claim?.claimNumber || 'Claim Detail' }}</h1>
        </div>
      </div>
      <div class="cd-header-actions" v-if="claim">
        <span class="cd-status-badge" :style="`background:${statusColors[claim.status]}18;color:${statusColors[claim.status]};border-color:${statusColors[claim.status]}40`">
          {{ statusLabels[claim.status] || claim.status }}
        </span>
        <button v-if="claim.status !== 'SETTLED' && claim.status !== 'REJECTED'" class="cd-advance-btn" :disabled="updating" @click="advanceWorkflow">
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
      <button class="cd-back-btn" @click="goBack">Return to Claims</button>
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
          <h2 class="cd-card-title">Policy & Incident Summary</h2>
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
              <span class="cd-label">Product Module</span>
              <span class="cd-val font-bold text-indigo-600 dark:text-indigo-400 capitalize">{{ mod?.name }}</span>
            </div>
            <div class="cd-info-row">
              <span class="cd-label">Coverage Type</span>
              <span class="cd-val">{{ claim.coverageType?.replace(/_/g, ' ') }}</span>
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
              <span class="cd-label">Incident Location</span>
              <span class="cd-val">{{ claim.incidentLocation || '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Financial & Status Card -->
        <div class="cd-card">
          <h2 class="cd-card-title">Financial Assessment</h2>
          <div class="cd-financial-box">
            <div class="cd-fin-item">
              <span class="cd-fin-label">Estimated Loss Amount</span>
              <span class="cd-fin-amount text-amber-600 font-extrabold">ETB {{ claim.estimatedAmount?.toLocaleString() || '0' }}</span>
            </div>
            <div class="cd-fin-item" v-if="claim.approvedAmount">
              <span class="cd-fin-label">Approved Settlement Amount</span>
              <span class="cd-fin-amount text-emerald-600 font-extrabold">ETB {{ claim.approvedAmount?.toLocaleString() }}</span>
            </div>
          </div>

          <div class="cd-desc-box">
            <span class="cd-label">Description of Incident</span>
            <p class="cd-desc-text">{{ claim.description || 'No detailed description logged for this claim.' }}</p>
          </div>
        </div>
      </div>

      <!-- Spot Survey & Inspection Details -->
      <div class="cd-card" v-if="claim.spotSurvey">
        <h2 class="cd-card-title">Spot Survey & Field Inspection</h2>
        <div class="cd-info-list">
          <div class="cd-info-row">
            <span class="cd-label">Assigned Surveyor</span>
            <span class="cd-val font-bold">{{ claim.spotSurvey.surveyorName }}</span>
          </div>
          <div class="cd-info-row">
            <span class="cd-label">Vehicle Drivable</span>
            <span class="cd-val" :class="claim.spotSurvey.isDrivable ? 'text-emerald-600' : 'text-rose-600 font-bold'">
              {{ claim.spotSurvey.isDrivable ? 'Yes — Drivable' : 'No — Towing Service Needed' }}
            </span>
          </div>
          <div class="cd-info-row" v-if="claim.spotSurvey.surveyNotes">
            <span class="cd-label">Surveyor Findings</span>
            <span class="cd-val">{{ claim.spotSurvey.surveyNotes }}</span>
          </div>
        </div>
      </div>

      <!-- Garage Bids Section -->
      <div class="cd-card" v-if="claim.garageBids?.length">
        <h2 class="cd-card-title">Garage Repair Bids</h2>
        <div class="cd-bids-list">
          <div v-for="bid in claim.garageBids" :key="bid.bidUuid" class="cd-bid-card">
            <div>
              <div class="cd-garage-name">{{ bid.garageName }}</div>
              <div class="cd-bid-meta">{{ bid.estimatedRepairDays }} days estimated repair duration</div>
            </div>
            <div class="cd-bid-cost">ETB {{ bid.bidAmount?.toLocaleString() }}</div>
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

/* Timeline Progress Tracker */
.cd-timeline { display:flex; justify-content:space-between; align-items:flex-start; position:relative; overflow-x:auto; padding:.5rem 0; }
.cd-timeline-step { display:flex; flex-direction:column; align-items:center; text-align:center; position:relative; flex:1; min-width:140px; }
.cd-step-icon { width:32px; height:32px; border-radius:50%; background:var(--cd-bg); border:2px solid var(--cd-border); color:var(--cd-muted); font-size:.78rem; font-weight:800; display:flex; align-items:center; justify-content:center; z-index:2; margin-bottom:.6rem; transition:all .3s; }
.cd-timeline-step.active .cd-step-icon { background:#6366f1; border-color:#6366f1; color:#fff; }
.cd-step-info { display:flex; flex-direction:column; gap:.15rem; }
.cd-step-label { font-size:.78rem; font-weight:800; color:var(--cd-sub); }
.cd-timeline-step.active .cd-step-label { color:var(--cd-title); }
.cd-step-desc { font-size:.68rem; color:var(--cd-muted); }
.cd-step-line { position:absolute; top:16px; left:50%; right:-50%; height:2px; background:var(--cd-border); z-index:1; }
.cd-step-line.filled { background:#6366f1; }

/* Grid Layout */
.cd-grid { display:grid; grid-template-columns:1fr; gap:1.5rem; }
@media(min-width:768px) { .cd-grid { grid-template-columns:1fr 1fr; } }
.cd-info-list { display:flex; flex-direction:column; gap:.75rem; }
.cd-info-row { display:flex; justify-content:space-between; align-items:center; padding-bottom:.6rem; border-bottom:1px solid var(--cd-border); font-size:.83rem; }
.cd-info-row:last-child { border-bottom:none; }
.cd-label { font-size:.75rem; font-weight:700; color:var(--cd-muted); }
.cd-val { color:var(--cd-title); font-weight:600; }

.cd-financial-box { display:flex; flex-direction:column; gap:.75rem; background:rgba(241,245,249,0.5); padding:1rem; border-radius:12px; margin-bottom:1rem; }
.cd-root.dark .cd-financial-box { background:rgba(15,23,42,0.5); }
.cd-fin-item { display:flex; flex-direction:column; gap:.2rem; }
.cd-fin-label { font-size:.72rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--cd-muted); }
.cd-fin-amount { font-size:1.25rem; }

.cd-desc-box { display:flex; flex-direction:column; gap:.35rem; }
.cd-desc-text { font-size:.85rem; color:var(--cd-sub); line-height:1.5; background:var(--cd-bg); padding:.85rem; border-radius:10px; border:1px solid var(--cd-border); }

/* Bids List */
.cd-bids-list { display:flex; flex-direction:column; gap:.75rem; }
.cd-bid-card { display:flex; justify-content:space-between; align-items:center; padding:.85rem 1rem; border-radius:12px; border:1px solid var(--cd-border); background:var(--cd-bg); }
.cd-garage-name { font-size:.85rem; font-weight:800; color:var(--cd-title); }
.cd-bid-meta { font-size:.72rem; color:var(--cd-muted); margin-top:.15rem; }
.cd-bid-cost { font-size:1rem; font-weight:800; color:#2563eb; }
</style>
