<script setup>
import { computed, onMounted, ref } from "vue";
import ChartCard from "@/components/charts/ChartCard.vue";
import { CATEGORICAL, GRID, STATUS } from "@/config/chartPalette";
import BarChart from "@/components/charts/BarChart.vue";
import DoughnutChart from "@/components/charts/DoughnutChart.vue";
import Table from "@/components/Table.vue";
import ActiveProvidersDataProvider from "@/features/providers/components/ActiveProviderSDataProvider.vue";
import ActiveproviderStatusRow from "@/features/providers/components/ActiveproviderStatusRow.vue";
import {
  getProviderDashboard,
  getActivePolicies,
  getEachMonthActivePolicies,
  getClaimsDashboard,
  getEachMonthCreatedClaims,
} from "@/features/claim/api/claimApi";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_LABELS = MONTHS.map((m) => m.slice(0, 3));

// Claim workflow states. Each segment differs from its ring neighbours
// (validated in this order, wrap-around included); the legend labels every one.
const STATUS_COLORS = {
  Submitted: STATUS.warning,
  "In Process": CATEGORICAL[1],
  Verified: CATEGORICAL[6],
  Approved: STATUS.good,
  Completed: CATEGORICAL[0],
};
const getStatusColor = (status) => STATUS_COLORS[status] || STATUS.neutral;

function percentChange(today, yesterday) {
  if (yesterday === 0) return today > 0 ? 100 : 0;
  return Math.round(((today - yesterday) / yesterday) * 100);
}

/* ---------- State ---------- */
const isLoading = ref(true);
const loadError = ref(false);

const activePolicies = ref(0);
const providers = ref({ today: 0, yesterday: 0 });
const claimStatuses = ref([]); // [{ status, count, total }]
const claimYesterdayByStatus = ref({});
const monthlyPolicies = ref({});
const monthlyClaims = ref({});

const search = ref("");

/* ---------- Derived ---------- */
const claimTotalToday = computed(() => claimStatuses.value.reduce((sum, s) => sum + s.count, 0));
const claimTotalYesterday = computed(() =>
  Object.values(claimYesterdayByStatus.value).reduce((sum, v) => sum + (Number(v) || 0), 0)
);
const claimDelta = computed(() => claimTotalToday.value - claimTotalYesterday.value);

const activeClaimStatuses = computed(() =>
  claimStatuses.value
    .filter((s) => s.count > 0)
    .map((s) => ({
      ...s,
      percentage: claimTotalToday.value ? Math.round((s.count / claimTotalToday.value) * 100) : 0,
    }))
);

const claimDeltaList = computed(() =>
  claimStatuses.value
    .map((s) => {
      const yesterday = Number(claimYesterdayByStatus.value[s.status]) || 0;
      return { status: s.status, today: s.count, yesterday, delta: s.count - yesterday };
    })
    .filter((d) => d.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 4)
);

const stats = computed(() => {
  const pendingToday = claimStatuses.value.find((s) => s.status === "PENDING")?.count || 0;
  const pendingYesterday = Number(claimYesterdayByStatus.value.PENDING) || 0;
  return [
    {
      title: "Active policies",
      value: activePolicies.value,
      change: null,
      to: "/issued_policy",
      icon: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
    },
    {
      title: "Pending claims",
      value: pendingToday,
      change: percentChange(pendingToday, pendingYesterday),
      to: "/process_claims",
      icon: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
    },
    {
      title: "New providers",
      value: providers.value.today,
      change: percentChange(providers.value.today, providers.value.yesterday),
      to: "/active_providers",
      icon: "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z",
    },
  ];
});

function monthlySeries(source, label, color) {
  return {
    labels: MONTH_LABELS,
    datasets: [
      {
        label,
        data: MONTHS.map((m) => source[m] || 0),
        backgroundColor: color,
      },
    ],
  };
}
const policiesChartData = computed(() => monthlySeries(monthlyPolicies.value, "Active policies", CATEGORICAL[0]));
const claimsChartData = computed(() => monthlySeries(monthlyClaims.value, "Created claims", CATEGORICAL[1]));

const claimStatusChartData = computed(() => {
  const items = activeClaimStatuses.value;
  if (!items.length) return null;
  return {
    labels: items.map((s) => s.status),
    datasets: [
      {
        data: items.map((s) => s.count),
        backgroundColor: items.map((s) => getStatusColor(s.status)),
        hoverOffset: 4,
      },
    ],
  };
});

const claimStatusChartOptions = {
  cutout: "70%",
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const total = ctx.dataset?.data?.reduce((a, b) => a + b, 0) || 0;
          const pct = total ? Math.round((ctx.parsed / total) * 100) : 0;
          return `${ctx.label}: ${ctx.parsed} (${pct}%)`;
        },
      },
    },
  },
};

const barChartOptions = {
  scales: {
    y: { beginAtZero: true, grid: { color: GRID }, border: { display: false }, ticks: { precision: 0 } },
    x: { grid: { display: false }, border: { display: false } },
  },
  plugins: { legend: { display: false } },
};

/* ---------- Data loading: independent requests run in parallel ---------- */
async function fetchDashboardData() {
  isLoading.value = true;
  loadError.value = false;

  const [providerRes, policiesRes, monthlyPoliciesRes, claimsRes, monthlyClaimsRes] = await Promise.allSettled([
    getProviderDashboard(),
    getActivePolicies(),
    getEachMonthActivePolicies(),
    getClaimsDashboard(),
    getEachMonthCreatedClaims(),
  ]);
  const value = (r) => (r.status === "fulfilled" ? r.value : null);

  providers.value = {
    today: value(providerRes)?.data?.today || 0,
    yesterday: value(providerRes)?.data?.yesterday || 0,
  };
  activePolicies.value = value(policiesRes)?.data || 0;
  monthlyPolicies.value = value(monthlyPoliciesRes)?.data || {};
  monthlyClaims.value = value(monthlyClaimsRes)?.data || {};

  const statuses = [];
  const yesterday = {};
  const claimsData = value(claimsRes)?.data;
  if (Array.isArray(claimsData)) {
    claimsData.forEach((statusObj) => {
      const [status, data] = Object.entries(statusObj)[0] || [];
      if (!status) return;
      statuses.push({ status, count: Number(data?.Today) || 0, total: data?.totalClaims || 0 });
      yesterday[status] = data?.Yesterday || 0;
    });
  }
  claimStatuses.value = statuses;
  claimYesterdayByStatus.value = yesterday;

  // The API layer resolves failed calls as { success: false } instead of rejecting
  loadError.value = [providerRes, policiesRes, monthlyPoliciesRes, claimsRes, monthlyClaimsRes].every(
    (r) => r.status === "rejected" || r.value?.success === false
  );
  isLoading.value = false;
}

onMounted(fetchDashboardData);

const quickActions = [
  { label: "Add policy", to: "/institution_policy", icon: "M12 4.5v15m7.5-7.5h-15" },
  { label: "Process claims", to: "/process_claims", icon: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
  { label: "Add provider", to: "/add_provider", icon: "M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" },
];
</script>

<template>
  <div class="flex flex-col gap-4 sm:gap-6">
    <!-- Page header -->
    <div class="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-end">
      <div>
        <h1 class="!px-0 text-xl font-semibold tracking-tight text-ink">Overview</h1>
        <p class="text-sm text-ink-muted">Today's activity across policies, claims and providers.</p>
      </div>
      <button
        type="button"
        class="inline-flex gap-1.5 items-center self-start text-sm font-medium sm:self-auto text-ink-muted hover:text-ink disabled:opacity-50"
        :disabled="isLoading"
        @click="fetchDashboardData"
      >
        <svg class="w-4 h-4" :class="{ 'animate-spin': isLoading }" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6M16.5 3.5v3h-3" />
        </svg>
        Refresh
      </button>
    </div>

    <div v-if="loadError" class="flex gap-3 items-start p-4 text-sm text-red-800 bg-red-50 rounded-xl border border-red-200" role="alert">
      <svg class="mt-0.5 w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>
      <p>Dashboard data couldn't be loaded. Check your connection and try refreshing.</p>
    </div>

    <!-- KPI cards -->
    <section class="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4" aria-label="Key metrics">
      <RouterLink
        v-for="stat in stats"
        :key="stat.title"
        :to="stat.to"
        class="flex gap-4 items-start p-4 transition-colors card sm:p-5 hover:border-line-strong group"
      >
        <span class="grid place-items-center w-10 h-10 rounded-lg shrink-0 bg-primary/[0.07] text-primary" aria-hidden="true">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path :d="stat.icon" />
          </svg>
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-ink-muted">{{ stat.title }}</p>
          <div v-if="isLoading" class="mt-2 w-16 h-7 skeleton" />
          <p v-else class="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-ink">
            {{ stat.value.toLocaleString() }}
          </p>
          <p v-if="!isLoading && stat.change !== null" class="flex gap-1 items-center mt-1 text-xs">
            <span
              class="font-medium tabular-nums"
              :class="stat.change > 0 ? 'text-emerald-700' : stat.change < 0 ? 'text-red-700' : 'text-ink-subtle'"
            >
              {{ stat.change > 0 ? "▲" : stat.change < 0 ? "▼" : "" }} {{ Math.abs(stat.change) }}%
            </span>
            <span class="text-ink-subtle">vs yesterday</span>
          </p>
        </div>
        <svg class="mt-1 w-4 h-4 transition-transform shrink-0 text-ink-subtle group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="m8 5 5 5-5 5" />
        </svg>
      </RouterLink>
    </section>

    <!-- Claims + charts -->
    <div class="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-12">
      <div class="flex flex-col gap-4 sm:gap-6 xl:col-span-5">
        <!-- Claim status -->
        <section class="card" aria-labelledby="claim-status-title">
          <header class="flex justify-between items-start px-5 pt-5">
            <div>
              <h2 id="claim-status-title" class="text-sm font-semibold text-ink">Claim status</h2>
              <p class="text-xs text-ink-subtle">Distribution today</p>
            </div>
            <RouterLink to="/process_claims" class="text-sm font-medium text-primary hover:underline underline-offset-2">View all</RouterLink>
          </header>

          <div class="p-5">
            <div v-if="isLoading" class="grid grid-cols-1 gap-5 items-center sm:grid-cols-2">
              <div class="mx-auto w-40 h-40 rounded-full skeleton" />
              <div class="space-y-2">
                <div v-for="n in 4" :key="n" class="h-8 skeleton" />
              </div>
            </div>

            <div v-else-if="claimStatusChartData" class="grid grid-cols-1 gap-5 items-center sm:grid-cols-2">
              <div class="relative mx-auto w-full max-w-[220px]">
                <DoughnutChart :data="claimStatusChartData" :options="claimStatusChartOptions" height="200px" />
                <div class="flex absolute inset-0 flex-col justify-center items-center pointer-events-none">
                  <span class="text-2xl font-semibold tabular-nums text-ink">{{ claimTotalToday }}</span>
                  <span class="text-xs text-ink-subtle">claims today</span>
                </div>
              </div>
              <ul class="space-y-1">
                <li
                  v-for="item in activeClaimStatuses"
                  :key="item.status"
                  class="flex gap-3 justify-between items-center px-2 py-1.5 rounded-md hover:bg-surface-muted"
                >
                  <span class="flex gap-2 items-center min-w-0">
                    <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: getStatusColor(item.status) }" />
                    <span class="text-sm truncate text-ink-muted">{{ item.status }}</span>
                  </span>
                  <span class="text-sm tabular-nums text-ink">
                    {{ item.count }} <span class="text-xs text-ink-subtle">· {{ item.percentage }}%</span>
                  </span>
                </li>
              </ul>
            </div>

            <div v-else class="py-8 text-sm text-center text-ink-subtle">No claim activity today.</div>
          </div>

          <!-- Today vs yesterday -->
          <div class="px-5 py-4 border-t border-line">
            <dl class="grid grid-cols-3 gap-3">
              <div>
                <dt class="text-xs text-ink-subtle">Yesterday</dt>
                <dd class="mt-0.5 text-lg font-semibold tabular-nums text-ink">{{ isLoading ? "—" : claimTotalYesterday }}</dd>
              </div>
              <div>
                <dt class="text-xs text-ink-subtle">Today</dt>
                <dd class="mt-0.5 text-lg font-semibold tabular-nums text-ink">{{ isLoading ? "—" : claimTotalToday }}</dd>
              </div>
              <div>
                <dt class="text-xs text-ink-subtle">Change</dt>
                <dd
                  class="mt-0.5 text-lg font-semibold tabular-nums"
                  :class="isLoading ? 'text-ink' : claimDelta > 0 ? 'text-emerald-700' : claimDelta < 0 ? 'text-red-700' : 'text-ink'"
                >
                  <template v-if="isLoading">—</template>
                  <template v-else>
                    {{ claimDelta > 0 ? "+" : "" }}{{ claimDelta }}
                    <span class="text-xs font-normal text-ink-subtle">({{ percentChange(claimTotalToday, claimTotalYesterday) }}%)</span>
                  </template>
                </dd>
              </div>
            </dl>

            <ul v-if="!isLoading && claimDeltaList.length" class="pt-3 mt-3 space-y-1 border-t border-dashed border-line">
              <li v-for="item in claimDeltaList" :key="item.status" class="flex justify-between items-center text-sm">
                <span class="flex gap-2 items-center min-w-0">
                  <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: getStatusColor(item.status) }" />
                  <span class="truncate text-ink-muted">{{ item.status }}</span>
                </span>
                <span class="flex gap-2 items-center tabular-nums">
                  <span class="text-xs text-ink-subtle">{{ item.yesterday }} → {{ item.today }}</span>
                  <span class="w-10 font-medium text-right" :class="item.delta > 0 ? 'text-emerald-700' : 'text-red-700'">
                    {{ item.delta > 0 ? "+" : "" }}{{ item.delta }}
                  </span>
                </span>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:gap-6 xl:col-span-7">
        <ChartCard title="Monthly active policies" subtitle="Policies active per month">
          <div v-if="isLoading" class="h-[220px] skeleton" />
          <BarChart v-else :chart-data="policiesChartData" :options="barChartOptions" :max-bar-thickness="28" height="220px" />
        </ChartCard>
        <ChartCard title="Monthly created claims" subtitle="New claims per month">
          <div v-if="isLoading" class="h-[220px] skeleton" />
          <BarChart v-else :chart-data="claimsChartData" :options="barChartOptions" :max-bar-thickness="28" height="220px" />
        </ChartCard>
      </div>
    </div>

    <!-- Providers + quick actions -->
    <div class="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-12">
      <section class="min-w-0 card xl:col-span-8" aria-labelledby="providers-title">
        <header class="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h2 id="providers-title" class="text-sm font-semibold text-ink">Active providers</h2>
            <p class="text-xs text-ink-subtle">Healthcare providers currently in network</p>
          </div>
          <div class="flex overflow-hidden items-center w-full rounded-lg border sm:w-64 h-control border-line-strong focus-within:border-primary focus-within:shadow-focus">
            <svg class="ml-3 w-4 h-4 shrink-0 text-ink-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input
              v-model="search"
              type="search"
              placeholder="Search providers…"
              aria-label="Search providers"
              class="flex-1 px-2.5 h-full min-w-0 text-base bg-transparent sm:text-sm focus-visible:outline-none"
            />
          </div>
        </header>
        <div class="p-3 sm:p-5">
          <ActiveProvidersDataProvider :search="search" v-slot="{ providers: providerRows, pending }">
            <Table
              :pending="pending"
              :headers="{
                head: ['Provider Name', 'Contact Person', 'Contact', 'Category'],
                row: ['providerName', 'email', 'telephone', 'category'],
              }"
              :rows="providerRows"
              :rowCom="ActiveproviderStatusRow"
              max-height="420px"
            />
          </ActiveProvidersDataProvider>
          <div class="mt-3 text-right">
            <RouterLink to="/active_providers" class="text-sm font-medium text-primary hover:underline underline-offset-2">
              View all providers →
            </RouterLink>
          </div>
        </div>
      </section>

      <section class="p-5 card xl:col-span-4 h-fit" aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title" class="text-sm font-semibold text-ink">Quick actions</h2>
        <ul class="grid grid-cols-1 gap-2 mt-3 sm:grid-cols-3 xl:grid-cols-1">
          <li v-for="action in quickActions" :key="action.to">
            <RouterLink
              :to="action.to"
              class="flex gap-3 items-center px-3 py-2.5 rounded-lg border transition-colors border-line hover:border-primary/40 hover:bg-primary/[0.03] group"
            >
              <span class="grid place-items-center w-8 h-8 rounded-md bg-primary/[0.07] text-primary shrink-0" aria-hidden="true">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path :d="action.icon" /></svg>
              </span>
              <span class="flex-1 text-sm font-medium text-ink">{{ action.label }}</span>
              <svg class="w-4 h-4 transition-transform text-ink-subtle group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m8 5 5 5-5 5" /></svg>
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
