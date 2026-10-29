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


const kpiConfigs = {
  motor:       { kpis: ['Total Premiums', 'Active Policies', 'Claims Filed', 'Vehicles Covered'],   values: ['ETB 1.82M', '3,412', '189', '5,640'], trends: [9.2, 6.1, -1.4, 4.8], subs: ['vs last month','across all classes','this month','on network'], colors: ['#2563eb','#059669','#f59e0b','#7c3aed'] },
  fire:        { kpis: ['Total Premiums', 'Active Policies', 'Claims Filed', 'Properties Insured'], values: ['ETB 980K',  '1,104', '57',  '2,890'], trends: [5.3, 3.7, -0.8, 2.2],  subs: ['vs last month','residential & commercial','this month','total portfolio'], colors: ['#ea580c','#059669','#f59e0b','#7c3aed'] },
  marine:      { kpis: ['Total Premiums', 'Active Policies', 'Claims Filed', 'Shipments Covered'],  values: ['ETB 640K',  '412',   '23',  '1,200'], trends: [7.1, 5.0, -2.1, 6.3],  subs: ['vs last month','hull & cargo','this month','in transit'], colors: ['#0284c7','#059669','#f59e0b','#7c3aed'] },
  life:        { kpis: ['Total Premiums', 'Active Policies', 'Claims Filed', 'Lives Covered'],      values: ['ETB 2.1M',  '8,731', '44',  '12,400'],trends: [11.4, 8.9, -0.5, 7.2], subs: ['vs last month','individual & group','this month','beneficiaries'], colors: ['#7c3aed','#059669','#f59e0b','#2563eb'] },
  engineering: { kpis: ['Total Premiums', 'Active Policies', 'Claims Filed', 'Projects Covered'],   values: ['ETB 520K',  '234',   '18',  '340'],   trends: [4.2, 2.8, 1.1, 3.5],   subs: ['vs last month','contractors & machinery','this month','active sites'], colors: ['#d97706','#059669','#f59e0b','#7c3aed'] },
  liability:   { kpis: ['Total Premiums', 'Active Policies', 'Claims Filed', 'Businesses Covered'], values: ['ETB 310K',  '687',   '31',  '820'],   trends: [3.6, 1.9, 0.7, 2.4],   subs: ['vs last month','public & employers','this month','registered entities'], colors: ['#e11d48','#059669','#f59e0b','#7c3aed'] },
  burglary:    { kpis: ['Total Premiums', 'Active Policies', 'Claims Filed', 'Premises Covered'],   values: ['ETB 215K',  '443',   '26',  '680'],   trends: [2.8, 1.5, -1.2, 1.9],  subs: ['vs last month','commercial & residential','this month','secured premises'], colors: ['#0d9488','#059669','#f59e0b','#7c3aed'] },
  travel:      { kpis: ['Total Premiums', 'Active Policies', 'Claims Filed', 'Travelers Covered'],  values: ['ETB 450K',  '1,250', '15',  '3,100'], trends: [8.5, 4.2, -3.1, 5.7],  subs: ['vs last month','single & multi-trip','this month','total insured persons'], colors: ['#0284c7','#059669','#f59e0b','#7c3aed'] },
};

const kpiIcons = [
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>`,
];

const claimPipeline = [
  { status: 'Submitted',  pct: 30, color: '#3b82f6' },
  { status: 'In Process', pct: 22, color: '#f59e0b' },
  { status: 'Verified',   pct: 18, color: '#8b5cf6' },
  { status: 'Approved',   pct: 17, color: '#10b981' },
  { status: 'Completed',  pct: 13, color: '#06b6d4' },
];

const recentActivities = computed(() => {
  const name = mod.value?.name || 'Module';
  return [
    { action: 'New policy issued',   entity: name, time: '1 hr ago',   color: '#3b82f6' },
    { action: 'Claim submitted',     entity: name, time: '3 hrs ago',  color: '#f59e0b' },
    { action: 'Rate config updated', entity: name, time: 'Yesterday',  color: '#8b5cf6' },
    { action: 'Policy renewed',      entity: name, time: '2 days ago', color: '#10b981' },
    { action: 'Claim approved',      entity: name, time: '3 days ago', color: '#059669' },
  ];
});

const cfg = computed(() => {
  const base = kpiConfigs[mod.value?.id] || kpiConfigs.motor;
  if (liveClaims.value && liveClaims.value.length > 0) {
    const updatedValues = [...base.values];
    updatedValues[2] = String(liveClaims.value.length);
    return { ...base, values: updatedValues };
  }
  return base;
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
          <span class="mdb-kpi-trend" :class="cfg.trends[i] >= 0 ? 'up' : 'down'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:11px;height:11px">
              <path stroke-linecap="round" stroke-linejoin="round" :d="cfg.trends[i] >= 0 ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'"/>
            </svg>
            {{ Math.abs(cfg.trends[i]) }}%
          </span>
        </div>
        <div class="mdb-kpi-val">{{ langStore.translateValue(cfg.values[i]) }}</div>
        <div class="mdb-kpi-label">{{ langStore.t('kpis.' + kpi, {}, kpi) }}</div>
        <div class="mdb-kpi-sub">{{ langStore.t('subs.' + cfg.subs[i], {}, cfg.subs[i]) }}</div>
        <div class="mdb-kpi-bar">
          <div class="mdb-kpi-bar-fill" :style="`background:${cfg.colors[i]};width:${50 + i * 10}%`"></div>
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
              <span class="mdb-pipeline-pct">{{ p.pct }}%</span>
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
          <div class="mdb-ins-val">92.4%</div>
          <div class="mdb-ins-trend up">↑ 1.8% {{ langStore.t('insights.vsLastMonth') }}</div>
        </div>
        <div class="mdb-insight mdb-ins-emerald">
          <div class="mdb-ins-label">{{ langStore.t('insights.avgClaimValue') }}</div>
          <div class="mdb-ins-val">{{ langStore.translateValue('ETB 6,820') }}</div>
          <div class="mdb-ins-trend up">↑ 2.4% {{ langStore.t('insights.vsLastMonth') }}</div>
        </div>
        <div class="mdb-insight mdb-ins-violet">
          <div class="mdb-ins-label">{{ langStore.t('insights.processTime') }}</div>
          <div class="mdb-ins-val" v-html="`2.8 ${langStore.isAmharic ? 'ቀናት' : 'days'}`"></div>
          <div class="mdb-ins-trend up">↓ 0.3 {{ langStore.isAmharic ? 'ቀናት ፈጣን' : 'days faster' }}</div>
        </div>
        <div class="mdb-insight mdb-ins-amber">
          <div class="mdb-ins-label">{{ langStore.t('insights.lossRatio') }}</div>
          <div class="mdb-ins-val">58.7%</div>
          <div class="mdb-ins-trend down">↑ 0.9% {{ langStore.t('insights.vsLastMonth') }}</div>
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
          <div v-for="(a, i) in recentActivities" :key="i" class="mdb-activity-row">
            <div class="mdb-activity-dot" :style="`background:${a.color}20;color:${a.color}`">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="mdb-act-body">
              <div class="mdb-act-action">{{ langStore.t('activities.' + a.action, {}, a.action) }}</div>
              <div class="mdb-act-entity">{{ langStore.t('modules.' + mod.id, {}, a.entity) }}</div>
            </div>
            <span class="mdb-act-time">{{ langStore.t('times.' + a.time, {}, a.time) }}</span>
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
