<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useModuleStore, MODULES } from '@/stores/moduleStore';
import { useRouter, useRoute } from 'vue-router';
import { useDarkModeStore } from '@/stores/darkMode';
import { useLanguageStore } from '@/stores/languageStore';
import { fetchClaimsByModule } from '@/features/motor/claims/api/digitalChannelApi';

const moduleStore = useModuleStore();
const router = useRouter();
const route = useRoute();
const darkStore = useDarkModeStore();
const langStore = useLanguageStore();

const isDark = computed(() => darkStore.isDark);
const liveClaims = ref([]);

// Auto-detect module from URL path (e.g. /motor/dashboard → motor)
const mod = computed(() => {
  if (moduleStore.activeModule) return moduleStore.activeModule;
  const seg = route.path.split('/')[1];
  const found = MODULES.find(m => m.id === seg);
  if (found) {
    moduleStore.selectModule(found.id);
    return found;
  }
  return null;
});

async function loadClaims() {
  if (mod.value?.id) {
    liveClaims.value = await fetchClaimsByModule(mod.value.id);
  }
}

onMounted(() => {
  loadClaims();
});

watch(() => mod.value?.id, () => {
  loadClaims();
});


// Every figure below comes from this module's claims (fetchClaimsByModule). Premium and
// policy figures need a policy service per product, which only health and life have today.
const KPI_COLORS = ['#2563eb', '#059669', '#f59e0b', '#7c3aed'];
const CLOSED = ['HANDOVER_COMPLETED', 'REJECTED'];

const fmtEtb = (n) => `ETB ${Math.round(n).toLocaleString()}`;
const claimAmount = (c) => Number(c.approvedAmount ?? c.estimatedAmount) || 0;

const kpiIcons = [
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>`,
];

const PIPELINE_STAGES = [
  { status: 'Submitted',  codes: ['SUBMITTED'],                                    color: '#3b82f6' },
  { status: 'In Process', codes: ['IN_PROCESS', 'BID_ASSIGNED', 'BID_COMPLETED'],  color: '#f59e0b' },
  { status: 'In Repair',  codes: ['ASSIGN_TO_GARAGE', 'IN_MAINTENANCE'],           color: '#8b5cf6' },
  { status: 'Repaired',   codes: ['MAINTENANCE_COMPLETED'],                        color: '#10b981' },
  { status: 'Completed',  codes: ['HANDOVER_COMPLETED'],                           color: '#06b6d4' },
  { status: 'Rejected',   codes: ['REJECTED'],                                     color: '#e11d48' },
];

const claimPipeline = computed(() => {
  const total = liveClaims.value.length;
  return PIPELINE_STAGES.map(stage => {
    const count = liveClaims.value.filter(c => stage.codes.includes(c.status)).length;
    return { ...stage, count, pct: total ? Math.round((count / total) * 100) : 0 };
  });
});

const STATUS_LABELS = Object.fromEntries(
  PIPELINE_STAGES.flatMap(stage => stage.codes.map(code => [code, stage.status]))
);
const STATUS_COLORS = Object.fromEntries(
  PIPELINE_STAGES.flatMap(stage => stage.codes.map(code => [code, stage.color]))
);

function relativeTime(value) {
  const t = new Date(value).getTime();
  if (!t) return '';
  const mins = Math.round((Date.now() - t) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} hr ago`;
  return `${Math.round(mins / 1440)} days ago`;
}

const recentActivities = computed(() =>
  [...liveClaims.value]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || b.incidentDate || 0) - new Date(a.updatedAt || a.createdAt || a.incidentDate || 0))
    .slice(0, 5)
    .map(c => ({
      action: `Claim ${STATUS_LABELS[c.status] || c.status || 'filed'}`,
      entity: c.claimNumber || c.policyNumber || c.claimUuid,
      time: relativeTime(c.updatedAt || c.createdAt || c.incidentDate),
      color: STATUS_COLORS[c.status] || '#64748b',
    }))
);

const cfg = computed(() => {
  const claims = liveClaims.value;
  const open = claims.filter(c => !CLOSED.includes(c.status));
  const completed = claims.filter(c => c.status === 'HANDOVER_COMPLETED');
  const claimed = claims.reduce((sum, c) => sum + claimAmount(c), 0);
  return {
    kpis: ['Claims Filed', 'Open Claims', 'Completed Claims', 'Claimed Amount'],
    values: [String(claims.length), String(open.length), String(completed.length), fmtEtb(claimed)],
    subs: ['all time', 'awaiting a decision or repair', 'handed over', 'approved or estimated'],
    shares: [100, claims.length ? (open.length / claims.length) * 100 : 0, claims.length ? (completed.length / claims.length) * 100 : 0, 100],
    colors: KPI_COLORS,
  };
});

const insights = computed(() => {
  const claims = liveClaims.value;
  const decided = claims.filter(c => CLOSED.includes(c.status));
  const completed = decided.filter(c => c.status === 'HANDOVER_COMPLETED');
  const valued = claims.filter(c => claimAmount(c) > 0);
  return {
    approvalRate: decided.length ? `${((completed.length / decided.length) * 100).toFixed(1)}%` : '—',
    avgClaimValue: valued.length ? fmtEtb(valued.reduce((sum, c) => sum + claimAmount(c), 0) / valued.length) : '—',
  };
});

const now = new Date();

const greetingKey = computed(() => {
  const h = now.getHours();
  if (h < 12) return 'goodMorning';
  if (h < 17) return 'goodAfternoon';
  return 'goodEvening';
});

const greeting = computed(() => langStore.t(greetingKey.value));

const formattedDate = computed(() => {
  const locale = langStore.currentLanguage === 'am' ? 'am-ET' : 'en-US';
  return now.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
});

function switchModule() {
  moduleStore.clearModule();
  router.push('/module-select');
}
</script>

<template>
  <div v-if="mod" class="mdb-root" :class="{ dark: isDark }">

    <!-- ══ TOP BAR ══ -->
    <div class="mdb-topbar">
      <div class="mdb-topbar-left">
        <div class="mdb-standalone-icon" :style="`color:${mod.color.to}`">
          <span v-html="mod.icon" class="mdb-badge-icon"></span>
        </div>
        <div class="flex flex-col text-left justify-center items-start m-0 p-0">
          <h1 class="mdb-title m-0 p-0 text-left">{{ langStore.t('modules.' + mod.id) }} Dashboard</h1>
          <p class="mdb-subtitle p-0 text-left">{{ langStore.t('realTimeAnalytics', { module: langStore.t('modules.' + mod.id) }) }}</p>
        </div>
      </div>
      <div class="mdb-topbar-right">
        <div class="mdb-date-chip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;flex-shrink:0">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          {{ formattedDate }}
        </div>
        
        <!-- Language Switch Button -->
        <button class="mdb-lang-btn" @click="langStore.toggleLanguage()" :title="langStore.isAmharic ? 'English' : 'አማርኛ'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">
            <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>
          </svg>
          {{ langStore.isAmharic ? 'English' : 'አማርኛ' }}
        </button>

        <button class="mdb-switch-btn" @click="switchModule">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/>
          </svg>
          {{ langStore.t('switchModule') }}
        </button>


      </div>
    </div>

    <!-- ══ KPI CARDS ══ -->
    <div class="mdb-kpi-grid">
      <div
        v-for="(kpi, i) in cfg.kpis" :key="kpi"
        class="mdb-kpi-card"
        :style="`animation-delay:${i*60}ms`"
      >
        <div class="mdb-kpi-top">
          <div class="mdb-kpi-icon" :style="`background:${cfg.colors[i]}15;color:${cfg.colors[i]};border-color:${cfg.colors[i]}30`" v-html="kpiIcons[i]"></div>
        </div>
        <div class="mdb-kpi-val">{{ langStore.translateValue(cfg.values[i]) }}</div>
        <div class="mdb-kpi-label">{{ langStore.t('kpis.' + kpi, {}, kpi) }}</div>
        <div class="mdb-kpi-sub">{{ langStore.t('subs.' + cfg.subs[i], {}, cfg.subs[i]) }}</div>
        <div class="mdb-kpi-bar">
          <div class="mdb-kpi-bar-fill" :style="`background:${cfg.colors[i]};width:${cfg.shares[i]}%`"></div>
        </div>
      </div>
    </div>

    <!-- ══ MIDDLE ROW ══ -->
    <div class="mdb-mid-row">

      <!-- Claim Pipeline -->
      <div class="mdb-card mdb-pipeline">
        <div class="mdb-card-hdr">
          <div>
            <div class="mdb-card-title">{{ langStore.t('claimPipeline') }}</div>
            <div class="mdb-card-sub">{{ langStore.t('processingStatusOverview') }}</div>
          </div>
          <span class="mdb-chip mdb-chip-blue">{{ langStore.t('activePipeline') }}</span>
        </div>
        <div class="mdb-pipeline-list">
          <div v-for="(p, i) in claimPipeline" :key="i" class="mdb-pipeline-row">
            <div class="mdb-pipeline-lbl">
              <div class="mdb-pipeline-dot" :style="`background:${p.color}`"></div>
              <span>{{ langStore.t('pipeline.' + p.status, {}, p.status) }}</span>
            </div>
            <div class="mdb-pipeline-bar-wrap">
              <div class="mdb-pipeline-track">
                <div class="mdb-pipeline-fill" :style="`width:${p.pct}%;background:${p.color}`"></div>
              </div>
              <span class="mdb-pipeline-pct">{{ p.count }}</span>
            </div>
          </div>
        </div>
        <RouterLink :to="`/${mod.id}/claims/process`" class="mdb-view-link">
          {{ langStore.t('viewAllClaims') }}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
        </RouterLink>
      </div>

      <!-- Insights -->
      <div class="mdb-insights-col">
        <div class="mdb-insight mdb-ins-blue">
          <div class="mdb-ins-label">{{ langStore.t('insights.approvalRate') }}</div>
          <div class="mdb-ins-val">{{ insights.approvalRate }}</div>
          <div class="mdb-ins-trend">of closed claims completed</div>
        </div>
        <div class="mdb-insight mdb-ins-emerald">
          <div class="mdb-ins-label">{{ langStore.t('insights.avgClaimValue') }}</div>
          <div class="mdb-ins-val">{{ langStore.translateValue(insights.avgClaimValue) }}</div>
          <div class="mdb-ins-trend">approved or estimated</div>
        </div>
        <div class="mdb-insight mdb-ins-violet">
          <div class="mdb-ins-label">{{ langStore.t('insights.processTime') }}</div>
          <div class="mdb-ins-val">—</div>
          <div class="mdb-ins-trend">needs claim timestamps from the API</div>
        </div>
        <div class="mdb-insight mdb-ins-amber">
          <div class="mdb-ins-label">{{ langStore.t('insights.lossRatio') }}</div>
          <div class="mdb-ins-val">—</div>
          <div class="mdb-ins-trend">needs premium data for this product</div>
        </div>
      </div>

      <!-- Activity Feed -->
      <div class="mdb-card mdb-activity">
        <div class="mdb-card-hdr">
          <div>
            <div class="mdb-card-title">{{ langStore.t('recentActivity') }}</div>
            <div class="mdb-card-sub">{{ langStore.t('latestEvents') }}</div>
          </div>
          <span class="mdb-live-wrap">
            <span class="mdb-live-dot"></span>
            <span class="mdb-live-txt">{{ langStore.t('live') }}</span>
          </span>
        </div>
        <div class="mdb-activity-list">
          <div v-if="recentActivities.length === 0" class="mdb-act-entity">No claims filed for this product yet.</div>
          <div v-for="(a, i) in recentActivities" :key="i" class="mdb-activity-row">
            <div class="mdb-activity-dot" :style="`background:${a.color}20;color:${a.color}`">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="mdb-act-body">
              <div class="mdb-act-action">{{ langStore.t('activities.' + a.action, {}, a.action) }}</div>
              <div class="mdb-act-entity">{{ a.entity }}</div>
            </div>
            <span class="mdb-act-time">{{ a.time }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ QUICK ACTIONS ══ -->
    <div class="mdb-card mdb-qa-section">
      <div class="mdb-card-hdr">
        <div>
          <div class="mdb-card-title">{{ langStore.t('quickActions') }}</div>
          <div class="mdb-card-sub">{{ langStore.t('commonTasks', { module: langStore.t('modules.' + mod.id) }) }}</div>
        </div>
        <span class="mdb-chip mdb-chip-blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          {{ langStore.isAmharic ? 'ቀጣይ እርምጃዎች' : 'Shortcuts' }}
        </span>
      </div>
      <div class="mdb-qa-grid">
        <RouterLink :to="`/${mod.id}/claims/new`" class="mdb-qa-btn" :style="`--qc:${mod.color.to}`">
          <div class="mdb-qa-icon" :style="`background:${mod.color.to}15;color:${mod.color.to};border-color:${mod.color.to}30`">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          </div>
          <div class="mdb-qa-text">
            <div class="mdb-qa-label">{{ langStore.t('actions.newClaim') }}</div>
            <div class="mdb-qa-sub">{{ langStore.t('actions.submitClaim') }}</div>
          </div>
          <div class="mdb-qa-arrow-wrap" :style="`color:${mod.color.to}`">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mdb-qa-arrow"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </div>
        </RouterLink>

        <RouterLink :to="`/${mod.id}/claims/process`" class="mdb-qa-btn" :style="`--qc:${mod.color.to}`">
          <div class="mdb-qa-icon" :style="`background:${mod.color.to}15;color:${mod.color.to};border-color:${mod.color.to}30`">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
          </div>
          <div class="mdb-qa-text">
            <div class="mdb-qa-label">{{ langStore.t('actions.processClaims') }}</div>
            <div class="mdb-qa-sub">{{ langStore.t('actions.reviewPending') }}</div>
          </div>
          <div class="mdb-qa-arrow-wrap" :style="`color:${mod.color.to}`">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mdb-qa-arrow"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </div>
        </RouterLink>



        <button class="mdb-qa-btn mdb-qa-switch" @click="switchModule">
          <div class="mdb-qa-icon mdb-qa-icon-switch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/></svg>
          </div>
          <div class="mdb-qa-text">
            <div class="mdb-qa-label">{{ langStore.t('actions.switchModuleLabel') }}</div>
            <div class="mdb-qa-sub">{{ langStore.t('actions.goBackSelect') }}</div>
          </div>
          <div class="mdb-qa-arrow-wrap mdb-qa-arrow-switch">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="mdb-qa-arrow"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </div>
        </button>
      </div>
    </div>

  </div>

  <!-- Fallback -->
  <div v-else class="mdb-fallback">
    <p>{{ langStore.t('noModuleSelected') }}</p>
    <RouterLink to="/module-select">{{ langStore.t('selectAModule') }}</RouterLink>
  </div>
</template>

<style scoped src="./module-dashboard.css"></style>

<style scoped>
.mdb-root {
  /* Theme variables bound reactively */
  --theme-color-primary: v-bind('mod?.color?.to || "#6366f1"');
  --theme-color-glow: v-bind('mod?.color?.glow || "rgba(99,102,241,0.15)"');
  --theme-color-accent: v-bind('mod?.color?.accent || "#818cf8"');
  --theme-color-from: v-bind('mod?.color?.from || "#4f46e5"');
}
</style>
