<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue';
import DefaultPage from '@/components/DefaultPage.vue';
import ChartCard from '@/components/charts/ChartCard.vue';
import BarChart from '@/components/charts/BarChart.vue';
import LineChart from '@/components/charts/LineChart.vue';
import DoughnutChart from '@/components/charts/DoughnutChart.vue';
import KPICard from '../components/KPICard.vue';
import AnalyticsTable from '../components/AnalyticsTable.vue';
import { getReportsList, executeReport } from '@/features/analytics/api/analyticsApi';

interface ReportMeta {
  reportUuid: string;
  name: string;
  description: string;
  category: string;
  reportGroup: string;
  type: string;
  parameters: string;
  standalone: boolean;
}

// Global Dashboard Filters
const filters = reactive({
  year: '',
  fromDate: '',
  toDate: '',
  institutionFilter: '',
  providerFilter: '',
});

const isFilterOpen = ref(false);
const isLoading = ref(false);
const fetchError = ref('');
const reportsList = ref<ReportMeta[]>([]);

// Reactive KPI Data (Defaulting to 0)
const kpis = ref([
  { title: 'Total Paid Claims', value: 'ETB 0', change: '0%', trend: 'up', icon: '📊' },
  { title: 'Total Claims Submitted', value: '0', change: '0%', trend: 'up', icon: '📝' },
  { title: 'Claims Approved Rate', value: '0.0%', change: '0%', trend: 'up', icon: '✅' },
  { title: 'Avg Loss Ratio', value: '0.0%', change: '0%', trend: 'down', icon: '📉' },
]);

// Reactive Chart Datasets (Defaulting to empty)
const periodicPaidClaimsData = ref<any>({
  labels: [],
  datasets: [
    {
      label: 'Paid Claims',
      data: [],
      backgroundColor: '#93C5FD',
      borderRadius: 6,
    }
  ]
});

const lossRatioData = ref<any>({
  labels: [],
  datasets: []
});

const paidClaimsByProvidersData = ref<any>({
  labels: [],
  datasets: []
});

const claimsCreatedData = ref<any>({
  labels: [],
  datasets: []
});

const claimsStatusData = ref<any>({
  labels: [],
  datasets: []
});

const topInstitutionsData = ref<any>({
  labels: [],
  datasets: []
});

const premiumCollectedData = ref<any>({
  labels: [],
  datasets: []
});

const topInstitutionsTableData = ref<any[]>([]);

// Helper Transformers for API results
function findReport(uuid: string, namePattern: RegExp) {
  return reportsList.value.find(r => r.reportUuid === uuid) ||
         reportsList.value.find(r => namePattern.test(r.name));
}

function parsePeriodicPaidClaims(columns: string[], rows: any[]) {
  if (!rows || rows.length === 0) {
    periodicPaidClaimsData.value = {
      labels: [],
      datasets: [{ label: 'Paid Claims', data: [], backgroundColor: '#93C5FD', borderRadius: 6 }]
    };
    return;
  }
  const labelCol = columns.find(c => /month|period|year|date|label/i.test(c)) || columns[0];
  const valCol = columns.find(c => /paid|amount|claim|total/i.test(c)) || columns[1] || columns[0];

  const labels = rows.map(r => String(r[labelCol] ?? ''));
  const data = rows.map(r => parseFloat(String(r[valCol] ?? 0).replace(/,/g, '')) || 0);

  periodicPaidClaimsData.value = {
    labels,
    datasets: [
      {
        label: 'Paid Claims',
        data,
        backgroundColor: '#93C5FD',
        borderRadius: 6,
      }
    ]
  };
}

function parseLossVsGain(columns: string[], rows: any[]) {
  if (!rows || rows.length === 0) {
    lossRatioData.value = { labels: [], datasets: [] };
    return;
  }
  const labelCol = columns.find(c => /policyholder|institution|customer|name|label/i.test(c)) || columns[0];
  const lossCol = columns.find(c => /loss|paid|claims/i.test(c)) || columns[1];
  const gainCol = columns.find(c => /gain|premium|collected/i.test(c)) || columns[2];

  const labels = rows.map(r => String(r[labelCol] ?? ''));
  const lossData = rows.map(r => parseFloat(String(r[lossCol] ?? 0).replace(/,/g, '')) || 0);
  const gainData = rows.map(r => parseFloat(String(r[gainCol] ?? 0).replace(/,/g, '')) || 0);

  lossRatioData.value = {
    labels,
    datasets: [
      { label: 'Total Loss', data: lossData, backgroundColor: '#FECACA', borderRadius: 6 },
      { label: 'Total Gain', data: gainData, backgroundColor: '#A7F3D0', borderRadius: 6 }
    ]
  };
}

function parsePaidClaimsByProviders(columns: string[], rows: any[]) {
  if (!rows || rows.length === 0) {
    paidClaimsByProvidersData.value = { labels: [], datasets: [] };
    return;
  }
  const providerCol = columns.find(c => /provider|name|institution/i.test(c)) || columns[0];
  const serviceCols = columns.filter(c => c !== providerCol);

  const labels = rows.map(r => String(r[providerCol] ?? ''));
  const colorPalette = ['#FECACA', '#FED7AA', '#BEF264', '#A5F3FC', '#D8B4FE', '#93C5FD', '#A7F3D0'];

  const datasets = serviceCols.map((col, idx) => ({
    label: col,
    data: rows.map(r => parseFloat(String(r[col] ?? 0).replace(/,/g, '')) || 0),
    backgroundColor: colorPalette[idx % colorPalette.length],
  }));

  paidClaimsByProvidersData.value = { labels, datasets };
}

function parseClaimsCreated(columns: string[], rows: any[]) {
  if (!rows || rows.length === 0) {
    claimsCreatedData.value = { labels: [], datasets: [] };
    return;
  }
  const labelCol = columns.find(c => /provider|insurer|origin|name|category/i.test(c)) || columns[0];
  const valCol = columns.find(c => /count|total|claims|value|percent/i.test(c)) || columns[1] || columns[0];

  const labels = rows.map(r => String(r[labelCol] ?? ''));
  const data = rows.map(r => parseFloat(String(r[valCol] ?? 0).replace(/,/g, '')) || 0);
  const colors = ['#93C5FD', '#FECACA', '#FED7AA', '#A7F3D0', '#D8B4FE', '#FDE047', '#C084FC'];

  claimsCreatedData.value = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: '#fff',
        borderWidth: 2,
      }
    ]
  };
}

function parseClaimsStatus(columns: string[], rows: any[]) {
  if (!rows || rows.length === 0) {
    claimsStatusData.value = { labels: [], datasets: [] };
    return;
  }
  const labelCol = columns.find(c => /policyholder|institution|name|customer/i.test(c)) || columns[0];
  const subCol = columns.find(c => /submitted/i.test(c)) || columns[1];
  const paidCol = columns.find(c => /paid/i.test(c)) || columns[2];
  const rejCol = columns.find(c => /reject/i.test(c)) || columns[3];

  const labels = rows.map(r => String(r[labelCol] ?? ''));
  const datasets: any[] = [];
  if (subCol) {
    datasets.push({
      label: 'Submitted',
      data: rows.map(r => parseFloat(String(r[subCol] ?? 0).replace(/,/g, '')) || 0),
      backgroundColor: '#93C5FD',
      borderRadius: 6,
    });
  }
  if (paidCol) {
    datasets.push({
      label: 'Paid',
      data: rows.map(r => parseFloat(String(r[paidCol] ?? 0).replace(/,/g, '')) || 0),
      backgroundColor: '#A7F3D0',
      borderRadius: 6,
    });
  }
  if (rejCol) {
    datasets.push({
      label: 'Rejected',
      data: rows.map(r => parseFloat(String(r[rejCol] ?? 0).replace(/,/g, '')) || 0),
      backgroundColor: '#FECACA',
      borderRadius: 6,
    });
  }

  claimsStatusData.value = { labels, datasets };
}

function parseTopInstitutionsTrend(columns: string[], rows: any[]) {
  if (!rows || rows.length === 0) {
    topInstitutionsData.value = { labels: [], datasets: [] };
    return;
  }
  const timeCol = columns.find(c => /time|date|hour|month|period/i.test(c)) || columns[0];
  const instCols = columns.filter(c => c !== timeCol).slice(0, 5);
  const colors = ['#93C5FD', '#FED7AA', '#A7F3D0', '#D8B4FE', '#FECACA'];

  if (instCols.length > 0 && timeCol) {
    const labels = rows.map(r => String(r[timeCol] ?? ''));
    const datasets = instCols.map((col, idx) => ({
      label: col,
      data: rows.map(r => parseFloat(String(r[col] ?? 0).replace(/,/g, '')) || 0),
      borderColor: colors[idx % colors.length],
      backgroundColor: colors[idx % colors.length] + '33',
      fill: true,
      tension: 0.4,
    }));
    topInstitutionsData.value = { labels, datasets };
  } else {
    const labelCol = columns[0];
    const valCol = columns[1] || columns[0];
    const top5Rows = rows.slice(0, 5);
    const labels = top5Rows.map(r => String(r[labelCol] ?? ''));
    const data = top5Rows.map(r => parseFloat(String(r[valCol] ?? 0).replace(/,/g, '')) || 0);
    topInstitutionsData.value = {
      labels,
      datasets: [{
        label: 'Insured Persons',
        data,
        borderColor: '#93C5FD',
        backgroundColor: 'rgba(147, 197, 253, 0.2)',
        fill: true,
        tension: 0.4,
      }]
    };
  }
}

function parsePremiumCollected(columns: string[], rows: any[]) {
  if (!rows || rows.length === 0) {
    premiumCollectedData.value = { labels: [], datasets: [] };
    return;
  }
  const labelCol = columns.find(c => /policyholder|institution|name|customer|series/i.test(c)) || columns[0];
  const valCol = columns.find(c => /premium|collected|total|amount|value/i.test(c)) || columns[1] || columns[0];

  const labels = rows.map(r => String(r[labelCol] ?? ''));
  const data = rows.map(r => parseFloat(String(r[valCol] ?? 0).replace(/,/g, '')) || 0);
  const colors = ['#93C5FD', '#A7F3D0', '#FED7AA', '#FECACA', '#D8B4FE', '#C084FC'];

  premiumCollectedData.value = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: '#fff',
        borderWidth: 3,
      }
    ]
  };
}

function parseTopInstitutionsTable(columns: string[], rows: any[]) {
  if (!rows || rows.length === 0) {
    topInstitutionsTableData.value = [];
    return;
  }
  const instCol = columns.find(c => /institution|policyholder|name|customer/i.test(c)) || columns[0];
  const insuredCol = columns.find(c => /insured|member|person|count/i.test(c)) || columns[1];
  const pctCol = columns.find(c => /percent|share|ratio/i.test(c)) || columns[2];

  const totalInsured = rows.reduce((s, r) => s + (parseFloat(String(r[insuredCol] ?? 0).replace(/,/g, '')) || 0), 0);

  // Take only top 5 rows
  const top5Rows = rows.slice(0, 5);

  topInstitutionsTableData.value = top5Rows.map((r, idx) => {
    const count = parseFloat(String(r[insuredCol] ?? 0).replace(/,/g, '')) || 0;
    let pct = parseFloat(String(r[pctCol] ?? 0).replace(/%/g, ''));
    if (isNaN(pct)) {
      pct = totalInsured > 0 ? (count / totalInsured) * 100 : 0;
    }
    return {
      rank: idx + 1,
      institution: String(r[instCol] ?? `Institution ${idx + 1}`),
      insuredPersons: count,
      percentage: parseFloat(pct.toFixed(1)),
    };
  });
}

// Compute live KPIs summary from chart data
function updateKPIs() {
  let totalPaid = 0;
  let totalSubmitted = 0;
  let avgLossRatioVal = 0;

  // Compute Total Paid from Periodic Paid Claims
  if (periodicPaidClaimsData.value?.datasets?.[0]?.data?.length) {
    totalPaid = periodicPaidClaimsData.value.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
  }

  // Compute Total Submitted & Paid from Claims Status
  if (claimsStatusData.value?.datasets?.length) {
    const subDataset = claimsStatusData.value.datasets.find((d: any) => d.label === 'Submitted');
    if (subDataset?.data?.length) {
      totalSubmitted = subDataset.data.reduce((a: number, b: number) => a + b, 0);
    }
    const paidDataset = claimsStatusData.value.datasets.find((d: any) => d.label === 'Paid');
    if (paidDataset?.data?.length && !totalPaid) {
      totalPaid = paidDataset.data.reduce((a: number, b: number) => a + b, 0);
    }
  }

  // Compute Loss Ratio from Loss vs Gain
  if (lossRatioData.value?.datasets?.length === 2) {
    const losses = lossRatioData.value.datasets[0].data || [];
    const gains = lossRatioData.value.datasets[1].data || [];
    let totLoss = losses.reduce((a: number, b: number) => a + b, 0);
    let totGain = gains.reduce((a: number, b: number) => a + b, 0);
    if (totGain > 0) {
      avgLossRatioVal = (totLoss / totGain) * 100;
    }
  }

  const approvedRate = totalSubmitted > 0 ? Math.min(100, (totalPaid / totalSubmitted) * 100) : 0;

  kpis.value = [
    {
      title: 'Total Paid Claims',
      value: `ETB ${totalPaid.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      change: '0%',
      trend: 'up',
      icon: '📊',
    },
    {
      title: 'Total Claims Submitted',
      value: totalSubmitted.toLocaleString(),
      change: '0%',
      trend: 'up',
      icon: '📝',
    },
    {
      title: 'Claims Approved Rate',
      value: `${approvedRate.toFixed(1)}%`,
      change: '0%',
      trend: 'up',
      icon: '✅',
    },
    {
      title: 'Avg Loss Ratio',
      value: `${avgLossRatioVal.toFixed(1)}%`,
      change: avgLossRatioVal > 60 ? '+4.1%' : '0%',
      trend: avgLossRatioVal > 60 ? 'up' : 'down',
      icon: '📉',
    },
  ];
}

// Load and execute dynamic reports for dashboard
async function fetchAnalyticsDashboard() {
  isLoading.value = true;
  fetchError.value = '';

  try {
    const res = await getReportsList({ standaloneOnly: true });
    reportsList.value = Array.isArray(res) ? res : res?.data || res?.content || [];

    const queryParams: Record<string, string> = {};
    if (filters.year) queryParams.year = filters.year;
    if (filters.fromDate) queryParams.from_date = filters.fromDate;
    if (filters.toDate) queryParams.to_date = filters.toDate;
    if (filters.institutionFilter) queryParams.institution_filter = filters.institutionFilter;
    if (filters.providerFilter) queryParams.provider_filter = filters.providerFilter;

    // Report mapping configurations
    const reportConfigs = [
      {
        uuid: '7887fe31-6e8f-43fe-8bb3-4bddd93a00ca',
        pattern: /Periodic Total Paid Claims/i,
        parser: parsePeriodicPaidClaims,
      },
      {
        uuid: '2636cad5-312b-4158-9f9d-4bec4581010e',
        pattern: /Loss vs Gain/i,
        parser: parseLossVsGain,
      },
      {
        uuid: 'cc7363e8-fcbf-43ae-b19f-4b4832c4bdd3',
        pattern: /Paid Claims by Providers/i,
        parser: parsePaidClaimsByProviders,
      },
      {
        uuid: '0b62b3d9-2a76-4788-aa7b-2a69bfabe77d',
        pattern: /Claims Created by Provider/i,
        parser: parseClaimsCreated,
      },
      {
        uuid: '430d4cee-0703-453a-a2b0-75ae2af55d1a',
        pattern: /Claims Status by Policyholder/i,
        parser: parseClaimsStatus,
      },
      {
        uuid: '7002df1e-4e29-4bc2-bcf2-26a10ad3ddee',
        pattern: /Top 5 Institutions by Insured Persons/i,
        parser: parseTopInstitutionsTrend,
      },
      {
        uuid: '3be532ed-5bed-423b-89c7-4de973523c10',
        pattern: /Total Premium Collected/i,
        parser: parsePremiumCollected,
      },
      {
        uuid: 'cf5731c3-68c3-4b36-bdd9-819c7ce83c55',
        pattern: /Top 5 Institutions$/i,
        parser: parseTopInstitutionsTable,
      },
    ];

    const executePromises = reportConfigs.map(async (cfg) => {
      const rep = findReport(cfg.uuid, cfg.pattern);
      if (!rep) return;

      try {
        const execRes = await executeReport(rep.reportUuid, queryParams, 0, 100);
        const columns: string[] = execRes?.columns || [];
        const rows: any[] = execRes?.data?.content || [];
        cfg.parser(columns, rows);
      } catch (err) {
        console.warn(`Failed to execute report ${rep.name}:`, err);
      }
    });

    await Promise.allSettled(executePromises);
    updateKPIs();
  } catch (err: any) {
    console.error('Failed to load analytics dashboard reports:', err);
    fetchError.value = err?.message || 'Failed to fetch dynamic reports list';
  } finally {
    isLoading.value = false;
  }
}

function handleApplyFilters() {
  fetchAnalyticsDashboard();
}

function handleResetFilters() {
  filters.year = '';
  filters.fromDate = '';
  filters.toDate = '';
  filters.institutionFilter = '';
  filters.providerFilter = '';
  fetchAnalyticsDashboard();
}

onMounted(() => {
  fetchAnalyticsDashboard();
});
</script>

<template>
  <DefaultPage :hideSearch="true" title="Analytics" subtitle="Comprehensive claims, policy, and provider overview">

    <!-- Top Dashboard Controls (Filters & Refresh) -->
    <div class="mb-6 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
            📈
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-900 flex items-center gap-2">
              Dashboard Reports & Analytics
              <span v-if="reportsList.length > 0" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                {{ reportsList.length }} Reports Connected
              </span>
            </h2>
            <p class="text-xs text-slate-500">Live data integrated with backend ClaimConnect dynamic reports endpoint</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="isFilterOpen = !isFilterOpen"
            :class="[
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer',
              isFilterOpen 
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            ]"
          >
            <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 5.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
            <span>{{ isFilterOpen ? 'Hide Filters' : 'Filter Dashboard' }}</span>
          </button>

          <button
            @click="fetchAnalyticsDashboard"
            :disabled="isLoading"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            <svg v-if="!isLoading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            <span v-else class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>{{ isLoading ? 'Refreshing...' : 'Refresh Data' }}</span>
          </button>
        </div>
      </div>

      <!-- Expandable Filter Bar -->
      <transition enter-active-class="transition duration-200 ease-out" enter-from-class="transform -translate-y-2 opacity-0" enter-to-class="transform translate-y-0 opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="transform translate-y-0 opacity-100" leave-to-class="transform -translate-y-2 opacity-0">
        <div v-show="isFilterOpen" class="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Year</label>
            <input 
              v-model="filters.year" 
              type="number" 
              placeholder="e.g. 2026" 
              class="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition" 
            />
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">From Date</label>
            <input 
              v-model="filters.fromDate" 
              type="date" 
              class="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition" 
            />
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">To Date</label>
            <input 
              v-model="filters.toDate" 
              type="date" 
              class="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition" 
            />
          </div>
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Institution</label>
            <input 
              v-model="filters.institutionFilter" 
              type="text" 
              placeholder="Filter institution" 
              class="w-full h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition" 
            />
          </div>
          <div class="flex items-end gap-2">
            <button
              @click="handleApplyFilters"
              class="flex-1 h-9 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              Apply
            </button>
            <button
              @click="handleResetFilters"
              class="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </transition>
    </div>

    <!-- Error Banner if API fails -->
    <div v-if="fetchError" class="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-700 text-xs font-medium">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-rose-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ fetchError }}</span>
      </div>
      <button @click="fetchAnalyticsDashboard" class="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 transition">
        Retry
      </button>
    </div>

    <!-- Overview Dashboard Content -->
    <div class="px-6 py-8 -mx-6 -my-6 space-y-8 bg-gradient-to-br via-blue-50 to-indigo-50 rounded-2xl from-slate-50 relative">
      <!-- Loading overlay backdrop during refresh -->
      <div v-if="isLoading" class="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-20 flex items-center justify-center rounded-2xl pointer-events-none transition-all">
        <div class="bg-white/90 shadow-xl border border-slate-200 px-5 py-3 rounded-2xl flex items-center gap-3">
          <div class="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs font-bold text-slate-700">Updating dashboard reports...</span>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          v-for="(kpi, idx) in kpis" 
          :key="idx"
          :title="kpi.title"
          :value="kpi.value"
          :change="kpi.change"
          :trend="kpi.trend"
          :icon="kpi.icon"
        />
      </div>

      <!-- Row 1: Periodic Paid Claims & Loss Ratio -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Periodic Total Paid Claims" subtitle="Monthly paid claims trend">
          <BarChart :chart-data="periodicPaidClaimsData" height="300px" />
        </ChartCard>

        <ChartCard title="Total Loss Ratio by Policyholder and Cover Types" subtitle="Loss vs Gain analysis">
          <BarChart :chart-data="lossRatioData" height="300px" />
        </ChartCard>
      </div>

      <!-- Row 2: Paid Claims by Providers & Claims Created -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Paid Claims by Providers and Service Types" subtitle="Breakdown by provider and service">
          <BarChart :chart-data="paidClaimsByProvidersData" height="300px" />
        </ChartCard>

        <ChartCard title="Total Claims Created by Insurer/Provider/Claimants" subtitle="Distribution of claim origins">
          <DoughnutChart :data="claimsCreatedData" height="300px" />
        </ChartCard>
      </div>

      <!-- Row 3: Claims Status & Top Institutions -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Total Number of Claims Submitted, Paid, and Rejected by Policyholder" subtitle="Claims status breakdown">
          <BarChart :chart-data="claimsStatusData" height="300px" />
        </ChartCard>

        <ChartCard title="Top 5 Institutions with the highest number of insured persons" subtitle="Insured persons trend">
          <LineChart :chartData="topInstitutionsData" height="300px" />
        </ChartCard>
      </div>

      <!-- Row 4: Premium Collected & Table -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Total Premium Collected by Policyholders" subtitle="Premium distribution">
          <DoughnutChart :data="premiumCollectedData" height="300px" />
        </ChartCard>

        <ChartCard title="Top 5 Institutions" subtitle="Insured persons count">
          <AnalyticsTable :data="topInstitutionsTableData" />
        </ChartCard>
      </div>
    </div>

  </DefaultPage>
</template>

<style scoped>
</style>