<script setup>
// Dashboard view of the launcher: figures across the modules, from the claims every product files
// through the digital channel, and the Life premium summary when the user has Life.
// Nothing here is estimated: a figure the backend doesn't return is not shown.
// Module tabs filter every claim figure; the choice is kept in the URL (?module=fire).
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchAllClaims } from '@/features/motor/claims/api/digitalChannelApi';
import { getDashboardSummary } from '@/features/life/api/dashboardApi';
import {
  CLAIM_STATUS_COLORS,
  CLAIM_STATUS_LABELS,
  CLOSED_CLAIM_STATUSES,
  claimAmount,
  claimPipeline,
  claimTime,
  relativeTime,
} from '@/utils/claimStats';
import LineChart from '@/components/charts/LineChart.vue';
import BarChart from '@/components/charts/BarChart.vue';
import { withAlpha } from '@/config/chartPalette';
import LauncherSkeleton from './LauncherSkeleton.vue';
import ModuleArt from './ModuleArt.vue';
import { MODULE_THEMES, cardStyle, deepOf, hexOf, softStyle, themeOf } from './moduleThemes';

const props = defineProps({
  modules: { type: Array, default: () => [] },
  titleOf: { type: Function, default: (mod) => mod.name },
});
const emit = defineEmits(['open-module']);

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const claims = ref([]);
const lifeSummary = ref(null);

async function load() {
  loading.value = true;
  const hasLife = props.modules.some((mod) => mod.id === 'life');
  const [claimList, life] = await Promise.all([
    fetchAllClaims(),
    hasLife ? getDashboardSummary().catch(() => null) : null,
  ]);
  claims.value = claimList;
  lifeSummary.value = life?.success ? life.data : null;
  loading.value = false;
}
onMounted(load);

/* ── Animation: bars and the donut grow from zero once the figures are on screen ── */
const prefersMotion = () => typeof window.matchMedia === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const grown = ref(!prefersMotion());
watch(loading, (now) => {
  if (now || grown.value) return;
  setTimeout(() => (grown.value = true), 60);
});

const moduleName = (id) => {
  const mod = props.modules.find((m) => m.id === id);
  if (mod) return props.titleOf(mod);
  return id ? id.replace(/[_-]+/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()) : 'Other';
};

/* ── Module tabs: every module that files claims here (Health and Life claims live elsewhere) ── */
const NO_CLAIMS_HERE = new Set(['health', 'life']);
const claimCounts = computed(() => {
  const counts = {};
  for (const c of claims.value) counts[c.productModule || ''] = (counts[c.productModule || ''] || 0) + 1;
  return counts;
});
const tabs = computed(() => {
  const ids = new Set(Object.keys(claimCounts.value).filter(Boolean));
  for (const mod of props.modules) {
    if (mod.kind !== 'tool' && mod.kind !== 'unavailable' && !NO_CLAIMS_HERE.has(mod.id)) ids.add(mod.id);
  }
  const rows = [...ids].map((id) => ({ id, label: moduleName(id), count: claimCounts.value[id] || 0, hex: hexOf(id), deep: deepOf(id) }));
  rows.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  return [{ id: 'all', label: 'All modules', count: claims.value.length, hex: '' }, ...rows];
});
const activeTab = computed(() => (tabs.value.some((t) => t.id === route.query.module) ? route.query.module : 'all'));
function setTab(id) {
  router.replace({ query: { ...route.query, module: id === 'all' ? undefined : id } });
}
// The selected tab is washed with its module's colour
const tabStyle = (tab) =>
  activeTab.value !== tab.id ? undefined : tab.hex ? { ...softStyle(tab, 0.3), borderColor: tab.hex } : undefined;
const activeLabel = computed(() => tabs.value.find((t) => t.id === activeTab.value)?.label);
const scoped = computed(() => (activeTab.value === 'all' ? claims.value : claims.value.filter((c) => c.productModule === activeTab.value)));

/* ── Figures ── */
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const etb = (n) => `ETB ${compact.format(n)}`;
const share = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

const ICONS = {
  claims: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5.6a1 1 0 01.7.3l5.4 5.4a1 1 0 01.3.7V19a2 2 0 01-2 2z"/></svg>',
  open: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  done: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>',
  money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></svg>',
};

const kpis = computed(() => {
  const all = scoped.value;
  const open = all.filter((c) => !CLOSED_CLAIM_STATUSES.includes(c.status)).length;
  const completed = all.filter((c) => c.status === 'HANDOVER_COMPLETED').length;
  const amount = all.reduce((sum, c) => sum + claimAmount(c), 0);
  const where = activeTab.value === 'all' ? 'every product' : activeLabel.value;
  return [
    { label: 'Claims filed', raw: all.length, whole: true, format: compact.format, caption: `All time, ${where}`, pct: all.length ? 100 : 0, icon: ICONS.claims, theme: { hex: '#93c5fd', deep: '#1d4ed8' } },
    { label: 'Open claims', raw: open, whole: true, format: compact.format, caption: `${share(open, all.length)}% awaiting a decision or repair`, pct: share(open, all.length), icon: ICONS.open, theme: { hex: '#fcd34d', deep: '#b45309' } },
    { label: 'Completed', raw: completed, whole: true, format: compact.format, caption: `${share(completed, all.length)}% handed over`, pct: share(completed, all.length), icon: ICONS.done, theme: { hex: '#6ee7b7', deep: '#047857' } },
    { label: 'Claimed amount', raw: amount, format: etb, caption: 'Approved, or estimated until approved', pct: amount ? 100 : 0, icon: ICONS.money, theme: { hex: '#c4b5fd', deep: '#6d28d9' } },
  ];
});

// Headline numbers count up to their value whenever they change (instantly with reduced motion)
const shown = ref([0, 0, 0, 0]);
let frame = 0;
watch(
  () => kpis.value.map((k) => k.raw),
  (targets) => {
    cancelAnimationFrame(frame);
    if (!prefersMotion() || typeof requestAnimationFrame !== 'function') {
      shown.value = [...targets];
      return;
    }
    const from = [...shown.value];
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / 700, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      shown.value = targets.map((to, i) => (t === 1 ? to : from[i] + (to - from[i]) * ease));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
  },
  { immediate: true },
);
onBeforeUnmount(() => cancelAnimationFrame(frame));
const kpiValue = (kpi, i) => kpi.format(kpi.whole ? Math.round(shown.value[i]) : shown.value[i]);

const byProduct = computed(() => {
  const totals = {};
  for (const c of claims.value) {
    const key = c.productModule || '';
    totals[key] ??= { count: 0, amount: 0 };
    totals[key].count += 1;
    totals[key].amount += claimAmount(c);
  }
  const rows = Object.entries(totals).sort((a, b) => b[1].count - a[1].count);
  const max = rows[0]?.[1].count || 0;
  return rows.map(([id, v]) => ({ id, name: moduleName(id), ...v, width: share(v.count, max), color: hexOf(id) }));
});

// Donut of the claim pipeline: one arc per stage on a circle whose circumference is 100
const pipeline = computed(() => claimPipeline(scoped.value));
const arcs = computed(() => {
  const total = scoped.value.length;
  let offset = 0;
  return pipeline.value
    .filter((stage) => stage.count)
    .map((stage) => {
      const length = (stage.count / total) * 100;
      const arc = { ...stage, length, offset };
      offset += length;
      return arc;
    });
});

const recent = computed(() =>
  [...scoped.value]
    .sort((a, b) => new Date(claimTime(b) || 0) - new Date(claimTime(a) || 0))
    .slice(0, 6)
    .map((c) => ({
      key: c.claimUuid || c.claimNumber || `${c.policyNumber}-${claimTime(c)}`,
      title: c.claimNumber || c.policyNumber || 'Claim',
      product: moduleName(c.productModule),
      productStyle: softStyle({ hex: hexOf(c.productModule), deep: deepOf(c.productModule) }, 0.3),
      status: CLAIM_STATUS_LABELS[c.status] || c.status || 'Filed',
      color: CLAIM_STATUS_COLORS[c.status] || '#64748b',
      time: relativeTime(claimTime(c)),
    })),
);

const LIFE_FIGURES = [
  { key: 'grossWrittenPremium', label: 'Gross written premium' },
  { key: 'premiumCollected', label: 'Premium collected' },
  { key: 'premiumOutstanding', label: 'Premium outstanding' },
  { key: 'claimsPaid', label: 'Claims paid' },
  { key: 'sumAssuredInForce', label: 'Sum assured in force' },
];
const lifeFigures = computed(() =>
  LIFE_FIGURES.filter((f) => typeof lifeSummary.value?.[f.key] === 'number').map((f) => ({ ...f, value: etb(lifeSummary.value[f.key]) })),
);
const lifeModule = computed(() => props.modules.find((m) => m.id === 'life'));

const quickModules = computed(() => props.modules.filter((mod) => mod.kind !== 'unavailable'));
const lifeStyle = cardStyle(MODULE_THEMES.life);

/* ── Charts (chart.js animates them in) ── */
const claimDate = (c) => c.createdAt || c.incidentDate || claimTime(c);
const monthKey = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${d.getMonth()}`;
};
// The last six months, oldest first
const months = computed(() => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en', { month: 'short' }) };
  });
});

const lineSeries = (label, data, hex) => ({
  label,
  data,
  borderColor: hex,
  backgroundColor: withAlpha(hex, 0.16),
  fill: true,
  // Smooth, but never curving past a month's real value (no dips below zero)
  cubicInterpolationMode: 'monotone',
  pointRadius: 3,
  pointBackgroundColor: '#fff',
  pointBorderColor: hex,
  pointBorderWidth: 2,
});

const trendData = computed(() => ({
  labels: months.value.map((m) => m.label),
  datasets: [
    lineSeries('Filed', months.value.map((m) => scoped.value.filter((c) => monthKey(claimDate(c)) === m.key).length), '#60a5fa'),
    lineSeries(
      'Completed',
      months.value.map((m) => scoped.value.filter((c) => c.status === 'HANDOVER_COMPLETED' && monthKey(claimTime(c)) === m.key).length),
      '#34d399',
    ),
  ],
}));
const trendEmpty = computed(() => trendData.value.datasets.every((d) => d.data.every((n) => !n)));

const amountData = computed(() => ({
  labels: byProduct.value.map((r) => r.name),
  datasets: [{
    label: 'Claimed amount',
    data: byProduct.value.map((r) => r.amount),
    backgroundColor: byProduct.value.map((r) => withAlpha(r.color, 0.75)),
    hoverBackgroundColor: byProduct.value.map((r) => r.color),
    borderRadius: 8,
    maxBarThickness: 42,
  }],
}));

// Open, completed and rejected claims per product, stacked
const STATUS_SERIES = [
  { label: 'Open', hex: '#fcd34d', test: (c) => !CLOSED_CLAIM_STATUSES.includes(c.status) },
  { label: 'Completed', hex: '#6ee7b7', test: (c) => c.status === 'HANDOVER_COMPLETED' },
  { label: 'Rejected', hex: '#fda4af', test: (c) => c.status === 'REJECTED' },
];
const statusData = computed(() => ({
  labels: byProduct.value.map((r) => r.name),
  datasets: STATUS_SERIES.map((s) => ({
    label: s.label,
    data: byProduct.value.map((r) => claims.value.filter((c) => (c.productModule || '') === r.id && s.test(c)).length),
    backgroundColor: s.hex,
    borderRadius: 6,
    maxBarThickness: 34,
  })),
}));

const countTicks = { precision: 0 };
const trendOptions = {
  plugins: { legend: { position: 'bottom' } },
  scales: { y: { beginAtZero: true, ticks: countTicks, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } },
};
const amountOptions = {
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ${etb(ctx.parsed.y)}` } } },
  scales: { y: { beginAtZero: true, ticks: { callback: (v) => compact.format(v) }, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } },
};
const statusOptions = {
  plugins: { legend: { position: 'bottom' } },
  scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: countTicks, grid: { color: '#f1f5f9' } } },
};
</script>

<template>
  <LauncherSkeleton v-if="loading" variant="stats" />

  <div v-else class="space-y-5">
    <!-- Module tabs -->
    <div class="rise -mx-1 overflow-x-auto px-1 pb-1" style="--d: 0ms">
      <div class="flex w-max gap-2" role="tablist" aria-label="Filter statistics by module">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.id"
          :class="[
            'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            activeTab === tab.id ? 'shadow-soft' : 'border-line bg-white text-ink-muted hover:-translate-y-px hover:border-primary/30 hover:text-ink',
            activeTab === tab.id && !tab.hex ? 'border-primary/30 bg-primary/10 text-primary' : '',
          ]"
          :style="tabStyle(tab)"
          @click="setTab(tab.id)"
        >
          <span v-if="tab.hex" class="h-2 w-2 rounded-full" :style="{ background: activeTab === tab.id ? tab.deep : tab.hex }"></span>
          {{ tab.label }}
          <span :class="['rounded-full px-1.5 text-[10px] tabular-nums', activeTab === tab.id ? 'bg-white/80' : 'bg-surface-raised']">{{ tab.count }}</span>
        </button>
      </div>
    </div>

    <!-- Headline figures -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      <div
        v-for="(kpi, i) in kpis"
        :key="kpi.label"
        class="rise group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-medium"
        :style="{ ...cardStyle(kpi.theme), '--d': `${60 + i * 60}ms` }"
      >
        <span class="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 transition-transform duration-500 group-hover:scale-125" :style="{ background: kpi.theme.hex }"></span>
        <div class="relative flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-semibold text-ink-muted">{{ kpi.label }}</p>
            <p class="mt-2 text-[1.75rem] font-black leading-none tracking-tight text-ink tabular-nums">{{ kpiValue(kpi, i) }}</p>
          </div>
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/80 shadow-soft transition-transform duration-300 group-hover:rotate-6 [&>svg]:h-5 [&>svg]:w-5" :style="{ color: kpi.theme.deep }" v-html="kpi.icon"></span>
        </div>
        <div class="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/80">
          <div class="grow-x h-full rounded-full" :style="{ width: grown ? `${kpi.pct}%` : '0%', background: kpi.theme.hex }"></div>
        </div>
        <p class="relative mt-2 text-[11px] font-medium text-ink-muted">{{ kpi.caption }}</p>
      </div>
    </div>

    <!-- Your modules: one compact row of tiles, each with its own picture and colour -->
    <section class="rise" style="--d: 240ms" aria-labelledby="stats-modules">
      <div class="mb-2 flex items-baseline justify-between">
        <h3 id="stats-modules" class="text-sm font-extrabold text-ink">Your modules</h3>
        <span class="text-[11px] font-semibold text-ink-subtle">{{ quickModules.length }} available</span>
      </div>
      <p v-if="!quickModules.length" class="rounded-2xl border border-dashed border-line bg-white py-6 text-center text-sm text-ink-subtle">Ask an administrator to give you a role.</p>
      <ul v-else class="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8">
        <li v-for="mod in quickModules" :key="mod.id">
          <button
            type="button"
            class="group flex h-full w-full items-center gap-2.5 rounded-xl border py-2 pl-2 pr-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            :style="cardStyle(themeOf(mod))"
            :title="`Open ${titleOf(mod)}`"
            @click="emit('open-module', mod)"
          >
            <span class="block h-10 w-14 shrink-0 transition-transform duration-300 group-hover:scale-110">
              <ModuleArt :kind="themeOf(mod).art" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-xs font-extrabold text-ink">{{ titleOf(mod) }}</span>
              <span class="block truncate text-[10px] text-ink-muted">{{ mod.roleName || (mod.kind === 'tool' ? 'Tools' : 'Open module') }}</span>
            </span>
            <svg class="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" :style="{ color: themeOf(mod).deep }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </li>
      </ul>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <!-- Claims over time -->
      <section class="rise lg:col-span-3 rounded-2xl border border-line bg-white p-5 shadow-soft" style="--d: 300ms" aria-labelledby="stats-trend">
        <div class="mb-3 flex items-baseline justify-between gap-3">
          <h3 id="stats-trend" class="text-sm font-extrabold text-ink">Claims over time</h3>
          <span class="text-[11px] font-semibold text-ink-subtle">Last 6 months</span>
        </div>
        <p v-if="trendEmpty" class="py-16 text-center text-sm text-ink-subtle">No claims in the last six months.</p>
        <LineChart v-else :chart-data="trendData" :options="trendOptions" height="240px" />
      </section>

      <!-- Claim pipeline as a donut -->
      <section class="rise lg:col-span-2 rounded-2xl border border-line bg-white p-5 shadow-soft" style="--d: 360ms" aria-labelledby="stats-pipeline">
        <h3 id="stats-pipeline" class="mb-4 text-sm font-extrabold text-ink">Claim pipeline</h3>
        <div class="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
          <div class="relative h-36 w-36 shrink-0">
            <svg viewBox="0 0 42 42" class="h-full w-full -rotate-90" role="img" :aria-label="pipeline.map((s) => `${s.status} ${s.count}`).join(', ')">
              <circle class="text-line" cx="21" cy="21" r="15.915" fill="none" stroke="currentColor" stroke-width="5" />
              <circle
                v-for="arc in arcs"
                :key="arc.status"
                class="donut-arc"
                cx="21"
                cy="21"
                r="15.915"
                fill="none"
                :stroke="arc.color"
                stroke-opacity="0.75"
                stroke-width="5"
                :stroke-dasharray="grown ? `${arc.length} ${100 - arc.length}` : '0 100'"
                :stroke-dashoffset="-arc.offset"
              />
            </svg>
            <div class="absolute inset-0 grid place-items-center text-center">
              <span>
                <span class="block text-2xl font-black leading-none text-ink tabular-nums">{{ scoped.length }}</span>
                <span class="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">claims</span>
              </span>
            </div>
          </div>
          <ul class="grid w-full grid-cols-2 gap-x-4 gap-y-2.5">
            <li v-for="stage in pipeline" :key="stage.status" class="flex items-center justify-between gap-2 text-xs">
              <span class="flex items-center gap-2 font-semibold text-ink-muted"><span class="h-2.5 w-2.5 rounded-sm opacity-75" :style="{ background: stage.color }"></span>{{ stage.status }}</span>
              <span class="font-bold text-ink tabular-nums">{{ stage.count }}</span>
            </li>
          </ul>
        </div>
      </section>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <!-- Claims by product: click a bar to filter by that module -->
      <section class="rise lg:col-span-2 rounded-2xl border border-line bg-white p-5 shadow-soft" style="--d: 420ms" aria-labelledby="stats-by-product">
        <div class="mb-5 flex items-baseline justify-between gap-3">
          <h3 id="stats-by-product" class="text-sm font-extrabold text-ink">Claims by product</h3>
          <span class="text-[11px] font-semibold text-ink-subtle">Click to filter</span>
        </div>
        <p v-if="!byProduct.length" class="py-8 text-center text-sm text-ink-subtle">No claims filed yet.</p>
        <ul v-else class="space-y-2">
          <li v-for="row in byProduct" :key="row.id">
            <button
              type="button"
              :class="[
                'w-full rounded-xl px-3 py-2 text-left transition-all duration-200 hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                activeTab !== 'all' && activeTab !== row.id ? 'opacity-40' : '',
              ]"
              :aria-pressed="activeTab === row.id"
              @click="setTab(activeTab === row.id ? 'all' : row.id)"
            >
              <div class="mb-1.5 flex items-center justify-between gap-3 text-xs">
                <span class="flex items-center gap-2 font-bold text-ink"><span class="h-2.5 w-2.5 rounded-full" :style="{ background: row.color }"></span>{{ row.name }}</span>
                <span class="font-semibold text-ink-muted tabular-nums">{{ row.count }} · {{ etb(row.amount) }}</span>
              </div>
              <div class="h-2.5 overflow-hidden rounded-full bg-surface-raised">
                <div class="grow-x h-full rounded-full" :style="{ width: grown ? `${row.width}%` : '0%', background: row.color }"></div>
              </div>
            </button>
          </li>
        </ul>
      </section>

      <!-- Claimed amount by product -->
      <section class="rise lg:col-span-3 rounded-2xl border border-line bg-white p-5 shadow-soft" style="--d: 480ms" aria-labelledby="stats-amount">
        <div class="mb-3 flex items-baseline justify-between gap-3">
          <h3 id="stats-amount" class="text-sm font-extrabold text-ink">Claimed amount by product</h3>
          <span class="text-[11px] font-semibold text-ink-subtle">ETB</span>
        </div>
        <p v-if="!byProduct.length" class="py-16 text-center text-sm text-ink-subtle">No claims filed yet.</p>
        <BarChart v-else :chart-data="amountData" :options="amountOptions" height="240px" />
      </section>
    </div>

    <!-- Status of claims by product -->
    <section v-if="byProduct.length" class="rise rounded-2xl border border-line bg-white p-5 shadow-soft" style="--d: 540ms" aria-labelledby="stats-status">
      <div class="mb-3 flex items-baseline justify-between gap-3">
        <h3 id="stats-status" class="text-sm font-extrabold text-ink">Claim status by product</h3>
        <span class="text-[11px] font-semibold text-ink-subtle">Open · completed · rejected</span>
      </div>
      <BarChart :chart-data="statusData" :options="statusOptions" height="260px" />
    </section>

    <!-- Life business, when the Life service returns its summary -->
    <section v-if="lifeFigures.length && activeTab === 'all'" class="rise rounded-2xl border p-5" :style="{ ...lifeStyle, '--d': '600ms' }" aria-labelledby="stats-life">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="block h-10 w-14"><ModuleArt kind="life" /></span>
          <h3 id="stats-life" class="text-sm font-extrabold text-ink">Life business</h3>
        </div>
        <button v-if="lifeModule" type="button" class="text-xs font-bold hover:underline" :style="{ color: MODULE_THEMES.life.deep }" @click="emit('open-module', lifeModule)">Open Life →</button>
      </div>
      <dl class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <div v-for="f in lifeFigures" :key="f.key" class="rounded-xl bg-white/80 px-4 py-3 shadow-soft">
          <dt class="text-[11px] font-semibold" :style="{ color: MODULE_THEMES.life.deep }">{{ f.label }}</dt>
          <dd class="mt-1 text-lg font-black text-ink tabular-nums">{{ f.value }}</dd>
        </div>
      </dl>
    </section>

    <!-- Recent activity -->
    <section class="rise rounded-2xl border border-line bg-white p-5 shadow-soft" style="--d: 660ms" aria-labelledby="stats-recent">
      <h3 id="stats-recent" class="mb-3 text-sm font-extrabold text-ink">Recent claim activity</h3>
      <p v-if="!recent.length" class="py-8 text-center text-sm text-ink-subtle">Nothing yet. New claims appear here.</p>
      <ul v-else class="divide-y divide-line">
        <li v-for="item in recent" :key="item.key" class="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-muted">
          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-black" :style="item.productStyle">{{ item.product.charAt(0) }}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-xs font-bold text-ink">{{ item.title }}</span>
            <span class="block text-[11px] text-ink-subtle">{{ item.product }}</span>
          </span>
          <span class="rounded-full px-2 py-0.5 text-[10px] font-bold" :style="{ color: item.color, background: `${item.color}1a` }">{{ item.status }}</span>
          <span class="hidden w-20 shrink-0 text-right text-[11px] text-ink-subtle sm:block">{{ item.time }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
/* Sections rise in one after another; --d is each section's delay */
.rise {
  animation: rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--d, 0ms);
}
@keyframes rise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}

.grow-x {
  transition: width 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}
.donut-arc {
  transition: stroke-dasharray 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}

@media (prefers-reduced-motion: reduce) {
  .rise { animation: none; }
  .grow-x, .donut-arc { transition: none; }
}
</style>
