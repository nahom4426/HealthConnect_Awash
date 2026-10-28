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

<style scoped>

/* ── CSS Variables ── */
.mdb-root {
  font-family: 'Inter', system-ui, sans-serif;
  --mdb-root-bg: #f8fafc;
  --mdb-card-bg: rgba(255, 255, 255, 0.7);
  --mdb-card-border: rgba(226, 232, 240, 0.8);
  --mdb-card-shadow: 0 4px 20px rgba(99,102,241,0.04);
  --mdb-title: #0f172a;
  --mdb-subtitle: #64748b;
  --mdb-muted: #94a3b8;
  --mdb-chip-bg: rgba(241, 245, 249, 0.8);
  --mdb-chip-border: #e2e8f0;
  --mdb-bar-fill: #f1f5f9;
  --mdb-pipeline-lbl: #334155;
  --mdb-pipeline-track: #f1f5f9;
  --mdb-activity-border: rgba(241, 245, 249, 0.8);
  --mdb-act-action: #0f172a;
  --mdb-ins-blue-bg: rgba(59, 130, 246, 0.04); --mdb-ins-blue-border: rgba(59, 130, 246, 0.15);
  --mdb-ins-emerald-bg: rgba(16, 185, 129, 0.04); --mdb-ins-emerald-border: rgba(16, 185, 129, 0.15);
  --mdb-ins-violet-bg: rgba(139, 92, 246, 0.04); --mdb-ins-violet-border: rgba(139, 92, 246, 0.15);
  --mdb-ins-amber-bg: rgba(245, 158, 11, 0.04); --mdb-ins-amber-border: rgba(245, 158, 11, 0.15);
  --mdb-qa-bg: rgba(255, 255, 255, 0.7);
  --mdb-qa-border: rgba(226, 232, 240, 0.8);
  --mdb-qa-label: #0f172a;
  --mdb-qa-switch-icon-bg: #f1f5f9;
  --mdb-qa-switch-icon-color: #64748b;
  --mdb-qa-switch-arrow: #94a3b8;
  --mdb-switch-btn-bg: rgba(255, 255, 255, 0.8);
  --mdb-switch-btn-color: #475569;
  --mdb-date-bg: rgba(255, 255, 255, 0.8);
  --mdb-date-color: #475569;

  /* Theme variables bound reactively */
  --theme-color-primary: v-bind('mod?.color?.to || "#6366f1"');
  --theme-color-glow: v-bind('mod?.color?.glow || "rgba(99,102,241,0.15)"');
  --theme-color-accent: v-bind('mod?.color?.accent || "#818cf8"');
  --theme-color-from: v-bind('mod?.color?.from || "#4f46e5"');
}

.mdb-root.dark {
  --mdb-root-bg: #090d16;
  --mdb-card-bg: rgba(30, 41, 59, 0.65);
  --mdb-card-border: rgba(255,255,255,0.06);
  --mdb-card-shadow: 0 10px 30px rgba(0,0,0,0.3);
  --mdb-title: #f1f5f9;
  --mdb-subtitle: #94a3b8;
  --mdb-muted: #64748b;
  --mdb-chip-bg: rgba(255,255,255,0.04);
  --mdb-chip-border: rgba(255,255,255,0.08);
  --mdb-bar-fill: rgba(255,255,255,0.05);
  --mdb-pipeline-lbl: #cbd5e1;
  --mdb-pipeline-track: rgba(255,255,255,0.05);
  --mdb-activity-border: rgba(255,255,255,0.05);
  --mdb-act-action: #e2e8f0;
  --mdb-ins-blue-bg: rgba(59, 130, 246, 0.08); --mdb-ins-blue-border: rgba(59, 130, 246, 0.2);
  --mdb-ins-emerald-bg: rgba(16, 185, 129, 0.08); --mdb-ins-emerald-border: rgba(16, 185, 129, 0.2);
  --mdb-ins-violet-bg: rgba(139, 92, 246, 0.08); --mdb-ins-violet-border: rgba(139, 92, 246, 0.2);
  --mdb-ins-amber-bg: rgba(245, 158, 11, 0.08); --mdb-ins-amber-border: rgba(245, 158, 11, 0.2);
  --mdb-qa-bg: rgba(30, 41, 59, 0.65);
  --mdb-qa-border: rgba(255,255,255,0.06);
  --mdb-qa-label: #e2e8f0;
  --mdb-qa-switch-icon-bg: rgba(255,255,255,0.05);
  --mdb-qa-switch-icon-color: #94a3b8;
  --mdb-qa-switch-arrow: #64748b;
  --mdb-switch-btn-bg: rgba(255,255,255,0.05);
  --mdb-switch-btn-color: #cbd5e1;
  --mdb-date-bg: rgba(255,255,255,0.05);
  --mdb-date-color: #cbd5e1;
}

.mdb-root {
  min-height: 100%;
  background: var(--mdb-root-bg);
  padding: 1.5rem 1.75rem 3rem;
  display: flex; flex-direction: column; gap: 1.25rem;
  transition: background 0.4s ease;
}

/* Top bar */
.mdb-topbar {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 1rem;
  background: var(--mdb-card-bg);
  border: 1px solid var(--mdb-card-border);
  backdrop-filter: blur(20px);
  border-radius: 20px; padding: 1.25rem 1.75rem;
  box-shadow: var(--mdb-card-shadow);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.mdb-topbar-left { display: flex; align-items: center; gap: 1rem; }
.mdb-standalone-icon {
  width: 32px; height: 32px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.mdb-badge-icon { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; }
.mdb-title { margin: 0 !important; padding: 0 !important; text-indent: 0 !important; font-size: 1.35rem; font-weight: 800; color: var(--mdb-title); letter-spacing: normal; transition: color 0.4s; }
.mdb-subtitle { margin-top: 0.15rem !important; margin-left: 0 !important; margin-right: 0 !important; margin-bottom: 0 !important; padding: 0 !important; text-indent: 0 !important; font-size: 0.85rem; font-weight: 500; color: var(--mdb-subtitle); letter-spacing: normal; transition: color 0.4s; }
.mdb-topbar-right { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }

.mdb-date-chip {
  display: flex; align-items: center; gap: 0.45rem;
  font-size: 0.78rem; font-weight: 600; color: var(--mdb-date-color);
  background: var(--mdb-date-bg); border: 1px solid var(--mdb-card-border);
  border-radius: 10px; padding: 0.5rem 0.85rem;
  backdrop-filter: blur(8px);
  transition: all 0.4s ease;
}

.mdb-lang-btn {
  display: flex; align-items: center; gap: 0.45rem;
  font-size: 0.78rem; font-weight: 700; color: var(--mdb-switch-btn-color);
  background: var(--mdb-switch-btn-bg); border: 1px solid var(--mdb-card-border);
  border-radius: 10px; padding: 0.5rem 0.85rem; cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}
.mdb-lang-btn:hover {
  border-color: var(--theme-color-accent);
  color: var(--theme-color-primary);
  background: var(--theme-color-glow);
  transform: translateY(-1px);
}

.mdb-switch-btn {
  display: flex; align-items: center; gap: 0.45rem;
  font-size: 0.78rem; font-weight: 700; color: var(--mdb-switch-btn-color);
  background: var(--mdb-switch-btn-bg); border: 1px solid var(--mdb-card-border);
  border-radius: 10px; padding: 0.5rem 0.85rem; cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}
.mdb-switch-btn:hover {
  border-color: var(--theme-color-accent);
  color: var(--theme-color-primary);
  transform: translateY(-1px);
}

.mdb-rc-btn {
  display: flex; align-items: center; gap: 0.45rem;
  font-size: 0.78rem; font-weight: 800; color: #fff;
  border-radius: 10px; padding: 0.5rem 0.95rem;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 12px var(--theme-color-glow);
}
.mdb-rc-btn:hover {
  transform: translateY(-1.5px);
  box-shadow: 0 8px 20px var(--theme-color-glow);
}

/* KPI grid */
.mdb-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.125rem; }
.mdb-kpi-card {
  background: var(--mdb-card-bg); border: 1px solid var(--mdb-card-border);
  border-radius: 20px; padding: 1.35rem 1.35rem 1.15rem;
  display: flex; flex-direction: column; gap: 0.35rem;
  box-shadow: var(--mdb-card-shadow);
  backdrop-filter: blur(20px);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s, box-shadow 0.3s;
  animation: cardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.mdb-kpi-card:hover {
  transform: translateY(-4px);
  border-color: var(--theme-color-accent);
  box-shadow: 0 12px 30px rgba(0,0,0,0.06), 0 0 15px var(--theme-color-glow);
}
.mdb-kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.mdb-kpi-icon {
  width: 40px; height: 40px; border-radius: 11px; border: 1.5px solid;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.3s;
}
.mdb-kpi-card:hover .mdb-kpi-icon { transform: scale(1.08) rotate(-5deg); }
.mdb-kpi-icon :deep(svg) { width: 22px; height: 22px; }
.mdb-kpi-trend {
  display: flex; align-items: center; gap: 3px;
  font-size: 0.74rem; font-weight: 800; border-radius: 7px; padding: 0.22rem 0.55rem;
}
.mdb-kpi-trend.up   { background: #ecfdf5; color: #059669; }
.mdb-kpi-trend.down { background: #fff1f2; color: #e11d48; }
.mdb-kpi-val   { font-size: 1.6rem; font-weight: 800; color: var(--mdb-title); letter-spacing: -0.03em; line-height: 1; transition: color 0.4s; }
.mdb-kpi-label { font-size: 0.85rem; font-weight: 700; color: var(--mdb-pipeline-lbl); transition: color 0.4s; }
.mdb-kpi-sub   { font-size: 0.75rem; color: var(--mdb-muted); transition: color 0.4s; }
.mdb-kpi-bar   { margin-top: 0.6rem; height: 4px; background: var(--mdb-bar-fill); border-radius: 9999px; overflow: hidden; }
.mdb-kpi-bar-fill { height: 100%; border-radius: 9999px; transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1); }

/* Card base */
.mdb-card {
  background: var(--mdb-card-bg); border: 1px solid var(--mdb-card-border);
  border-radius: 20px; padding: 1.5rem; box-shadow: var(--mdb-card-shadow);
  backdrop-filter: blur(20px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.mdb-card:hover {
  transform: translateY(-2px);
  border-color: var(--theme-color-accent);
  box-shadow: 0 12px 30px rgba(0,0,0,0.06), 0 0 15px var(--theme-color-glow);
}
.mdb-card-hdr {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 1.25rem; gap: 0.75rem;
}
.mdb-card-title { font-size: 0.95rem; font-weight: 800; color: var(--mdb-title); transition: color 0.4s; }
.mdb-card-sub   { font-size: 0.75rem; color: var(--mdb-muted); margin-top: 0.15rem; transition: color 0.4s; }
.mdb-chip { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.72rem; font-weight: 800; border-radius: 7px; padding: 0.25rem 0.65rem; white-space: nowrap; }
.mdb-chip-blue { background: rgba(59, 130, 246, 0.08); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.15); }
.mdb-view-link {
  display: inline-flex; align-items: center; gap: 0.4rem;
  font-size: 0.82rem; font-weight: 800; color: #2563eb;
  text-decoration: none; margin-top: 1rem;
  transition: gap 0.2s, color 0.2s;
}
.mdb-view-link:hover { gap: 0.6rem; color: var(--theme-color-primary); }

/* Middle row */
.mdb-mid-row { display: grid; grid-template-columns: 1.6fr 0.85fr 1.45fr; gap: 1.125rem; align-items: start; }

/* Pipeline */
.mdb-pipeline-list { display: flex; flex-direction: column; gap: 0.85rem; }
.mdb-pipeline-row  { display: flex; align-items: center; gap: 0.85rem; }
.mdb-pipeline-lbl  {
  display: flex; align-items: center; gap: 0.5rem;
  width: 105px; flex-shrink: 0;
  font-size: 0.8rem; font-weight: 600; color: var(--mdb-pipeline-lbl);
  transition: color 0.4s;
}
.mdb-pipeline-dot  { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.mdb-pipeline-bar-wrap { flex: 1; display: flex; align-items: center; gap: 0.5rem; }
.mdb-pipeline-track { flex: 1; height: 7px; background: var(--mdb-pipeline-track); border-radius: 9999px; overflow: hidden; transition: background 0.4s; }
.mdb-pipeline-fill  { height: 100%; border-radius: 9999px; transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1); }
.mdb-pipeline-pct   { font-size: 0.72rem; font-weight: 800; color: var(--mdb-subtitle); width: 35px; text-align: right; transition: color 0.4s; }

/* Insights */
.mdb-insights-col { display: flex; flex-direction: column; gap: 0.7rem; }
.mdb-insight { border-radius: 14px; padding: 0.9rem 1rem; border: 1.5px solid transparent; transition: all 0.4s ease; }
.mdb-insight:hover { transform: scale(1.02); }
.mdb-ins-blue    { background: var(--mdb-ins-blue-bg);    border-color: var(--mdb-ins-blue-border); }
.mdb-ins-emerald { background: var(--mdb-ins-emerald-bg); border-color: var(--mdb-ins-emerald-border); }
.mdb-ins-violet  { background: var(--mdb-ins-violet-bg);  border-color: var(--mdb-ins-violet-border); }
.mdb-ins-amber   { background: var(--mdb-ins-amber-bg);   border-color: var(--mdb-ins-amber-border); }
.mdb-ins-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--mdb-subtitle); transition: color 0.4s; }
.mdb-ins-val   { font-size: 1.35rem; font-weight: 800; color: var(--mdb-title); letter-spacing: -0.025em; margin: 0.25rem 0; transition: color 0.4s; }
.mdb-ins-trend { font-size: 0.72rem; font-weight: 700; }
.mdb-ins-trend.up   { color: #059669; }
.mdb-ins-trend.down { color: #e11d48; }

/* Live dot */
.mdb-live-wrap { display: flex; align-items: center; gap: 0.35rem; }
.mdb-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: livePulse 2s infinite; }
@keyframes livePulse {
  0%,100% { box-shadow: 0 0 0 2px rgba(16,185,129,0.2); }
  50%      { box-shadow: 0 0 0 6px rgba(16,185,129,0.06); }
}
.mdb-live-txt { font-size: 0.72rem; font-weight: 800; color: #059669; }

/* Activity */
.mdb-activity-list { display: flex; flex-direction: column; gap: 0.7rem; }
.mdb-activity-row  {
  display: flex; align-items: center; gap: 0.85rem;
  padding-bottom: 0.7rem; border-bottom: 1px solid var(--mdb-activity-border);
  transition: border-color 0.4s;
}
.mdb-activity-row:last-child { border-bottom: none; padding-bottom: 0; }
.mdb-activity-dot {
  width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.mdb-act-body  { flex: 1; min-width: 0; }
.mdb-act-action { font-size: 0.8rem; font-weight: 700; color: var(--mdb-act-action); transition: color 0.4s; }
.mdb-act-entity { font-size: 0.72rem; color: var(--mdb-muted); margin-top: 0.1rem; transition: color 0.4s; }
.mdb-act-time   { font-size: 0.7rem; font-weight: 600; color: var(--mdb-muted); white-space: nowrap; flex-shrink: 0; }

/* Quick Actions */
.mdb-qa-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.mdb-qa-btn {
  display: flex; align-items: center; justify-content: space-between; gap: 0.85rem;
  padding: 1.1rem 1.15rem; border-radius: 16px;
  border: 1.5px solid var(--mdb-qa-border);
  background: var(--mdb-qa-bg);
  text-decoration: none; cursor: pointer;
  position: relative; overflow: hidden;
  outline: none;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s, background 0.2s, box-shadow 0.2s;
  animation: cardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.mdb-qa-btn:hover {
  transform: translateY(-2px);
  border-color: var(--qc, #94a3b8);
  background: color-mix(in srgb, var(--qc, #94a3b8) 6%, var(--mdb-qa-bg));
  box-shadow: 0 8px 20px -4px rgba(0,0,0,0.08);
}
.mdb-qa-btn:focus,
.mdb-qa-btn:focus-visible,
.mdb-qa-btn:active {
  outline: none;
  border-color: var(--qc, #94a3b8);
  box-shadow: 0 4px 14px rgba(0,0,0,0.06);
}
.mdb-qa-icon {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid transparent;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.mdb-qa-btn:hover .mdb-qa-icon {
  transform: scale(1.06);
}
.mdb-qa-icon-switch {
  background: var(--mdb-qa-switch-icon-bg) !important;
  color: var(--mdb-qa-switch-icon-color) !important;
  border-color: rgba(148, 163, 184, 0.2) !important;
}
.mdb-qa-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.15rem; }
.mdb-qa-label {
  font-size: 0.88rem; font-weight: 800; color: var(--mdb-qa-label);
  line-height: 1.25; transition: color 0.4s;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.mdb-qa-sub {
  font-size: 0.75rem; font-weight: 500; color: var(--mdb-subtitle);
  line-height: 1.2; transition: color 0.4s;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.mdb-qa-arrow-wrap {
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--qc, #94a3b8) 12%, transparent);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.mdb-qa-arrow { width: 14px; height: 14px; transition: transform 0.2s ease; }
.mdb-qa-arrow-switch {
  color: var(--mdb-qa-switch-arrow) !important;
  background: rgba(148, 163, 184, 0.12) !important;
}
.mdb-qa-btn:hover .mdb-qa-arrow-wrap {
  background: var(--qc, #94a3b8);
  color: #ffffff !important;
  transform: translateX(2px);
}
.mdb-qa-btn:hover .mdb-qa-arrow-switch {
  background: #64748b !important;
  color: #ffffff !important;
}
.mdb-qa-switch { --qc: #94a3b8; }

/* Fallback */
.mdb-fallback { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 1rem; color: #64748b; }

/* Responsive */
@media (max-width: 1100px) {
  .mdb-kpi-grid { grid-template-columns: repeat(2,1fr); }
  .mdb-mid-row  { grid-template-columns: 1fr 1fr; }
  .mdb-qa-grid  { grid-template-columns: repeat(2,1fr); }
}
@media (max-width: 768px) {
  .mdb-root     { padding: 1rem 1rem 2rem; }
  .mdb-kpi-grid { grid-template-columns: repeat(2,1fr); }
  .mdb-mid-row  { grid-template-columns: 1fr; }
  .mdb-qa-grid  { grid-template-columns: repeat(2,1fr); }
}
@media (max-width: 480px) {
  .mdb-kpi-grid { grid-template-columns: 1fr; }
  .mdb-qa-grid  { grid-template-columns: 1fr; }
}
</style>
