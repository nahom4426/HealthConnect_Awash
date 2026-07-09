<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import DefaultPage from '@/components/DefaultPage.vue';
import ChartCard from '@/components/charts/ChartCard.vue';
import BarChart from '@/components/charts/BarChart.vue';
import LineChart from '@/components/charts/LineChart.vue';
import DoughnutChart from '@/components/charts/DoughnutChart.vue';
import KPICard from '../components/KPICard.vue';
import AnalyticsTable from '../components/AnalyticsTable.vue';

// Live Report imports
import { getProviderCreditServicesReport } from '@/features/analytics/api/analyticsApi';
import { getRequestedClaim } from '@/features/claim/api/claimApi';
import { getInstitutionsPolicyByStatus } from '@/features/institutions/api/institutionApi';
import { getActiveContracts } from '@/features/provider_contracts/api/contractApi';
import SearchSelect from '@/components/SearchSelect.vue';
import { Status } from '@/types/interface';
import CreditClaimDetail from '@/features/claim/pages/credit_claim/CreditClaimDetail.vue';
import { formatCurrency, secondDateFormat } from '@/utils/utils';

// Helper: get today's date as YYYY-MM-DD
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Active Tab state
const activeTab = ref('dashboard'); // 'dashboard' or 'provider-report'

// Report filters & live state
const reportInstitutionUuid = ref('');
const reportProviderUuid = ref('');
const reportFromDate = ref(todayStr());
const reportToDate = ref(todayStr());
const reportData = ref<any[]>([]);
const isReportLoading = ref(false);

const fetchReport = async () => {
  isReportLoading.value = true;
  try {
    const params = {
      institutionUuid: reportInstitutionUuid.value || undefined,
      providerUuid: reportProviderUuid.value || undefined,
      fromDate: reportFromDate.value || undefined,
      toDate: reportToDate.value || undefined,
    };
    const res = await getProviderCreditServicesReport(params);
    reportData.value = Array.isArray(res) ? res : res?.content || res?.data || [];
  } catch (error) {
    console.error('Error fetching report:', error);
    reportData.value = [];
  } finally {
    isReportLoading.value = false;
  }
};

// Watch filters to trigger update
watch([reportInstitutionUuid, reportProviderUuid, reportFromDate, reportToDate], () => {
  fetchReport();
  // Reset detail view if filters change
  detailProvider.value = null;
  detailClaims.value = [];
});

// ─── Provider Detail Drill-Down ───────────────────────────────────────────────
const detailProvider = ref<any>(null);   // the summary row we clicked on
const detailClaims = ref<any[]>([]);     // individual claims fetched
const detailLoading = ref(false);
const detailPage = ref(1);
const detailLimit = 25;
const detailTotal = ref(0);
const detailSelectedRow = ref<any>(null); // claim row to show in CreditClaimDetail

async function fetchProviderDetails(provider: any, page = 1) {
  if (!provider) return;
  detailLoading.value = true;
  try {
    const params: any = {
      page,
      limit: detailLimit,
      serviceType: 'CREDIT',
      fromDate: reportFromDate.value || undefined,
      toDate: reportToDate.value || undefined,
      providerUuid: provider.providerUuid || undefined,
    };
    if (reportInstitutionUuid.value) params.institutionUuid = reportInstitutionUuid.value;
    const res = await getRequestedClaim(params);
    const data = res?.data ?? res;
    detailClaims.value = Array.isArray(data?.content) ? data.content
      : Array.isArray(data) ? data : [];
    detailTotal.value = data?.totalElements ?? detailClaims.value.length;
    detailPage.value = page;
  } catch (e) {
    console.error('Error fetching provider detail:', e);
    detailClaims.value = [];
  } finally {
    detailLoading.value = false;
  }
}

function openProviderDetail(provider: any) {
  detailProvider.value = provider;
  detailSelectedRow.value = null;
  fetchProviderDetails(provider, 1);
}

function closeProviderDetail() {
  detailProvider.value = null;
  detailClaims.value = [];
  detailSelectedRow.value = null;
}

function viewClaimDetail(row: any) {
  detailSelectedRow.value = row;
}

function backFromClaimDetail() {
  detailSelectedRow.value = null;
}

const detailTotalPages = computed(() => Math.max(1, Math.ceil(detailTotal.value / detailLimit)));

// Dynamic chart data computed properties
const reportChartData = computed(() => {
  const labels = reportData.value.map(item => item.providerName || 'Unknown');
  const amounts = reportData.value.map(item => item.totalAmount || 0);

  return {
    labels,
    datasets: [
      {
        label: 'Total Credit Amount (ETB)',
        data: amounts,
        backgroundColor: '#4F46E5', // indigo-600
        borderRadius: 6,
      }
    ]
  };
});

const reportCreditsChartData = computed(() => {
  const labels = reportData.value.map(item => item.providerName || 'Unknown');
  const credits = reportData.value.map(item => item.numberOfCreditsGiven || 0);

  return {
    labels,
    datasets: [
      {
        label: 'Number of Credits Given',
        data: credits,
        backgroundColor: '#10B981', // emerald-500
        borderRadius: 6,
      }
    ]
  };
});

// Summary KPI values
const totalReportAmount = computed(() => {
  return reportData.value.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
});

const totalReportCredits = computed(() => {
  return reportData.value.reduce((acc, curr) => acc + (curr.numberOfCreditsGiven || 0), 0);
});

const totalReportProviders = computed(() => {
  return reportData.value.length;
});

// Export CSV
const downloadCSV = () => {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Rank,Provider Name,Number of Credits Given,Total Amount (ETB)\n";
  
  reportData.value.forEach((item, index) => {
    csvContent += `${index + 1},"${item.providerName || ''}",${item.numberOfCreditsGiven || 0},${item.totalAmount || 0}\n`;
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `provider_credit_services_report_${reportFromDate.value}_to_${reportToDate.value}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// KPI Data
const kpis = ref([
  { title: 'Total Paid Claims', value: 'ETB 2,450,000', change: '+12.5%', trend: 'up', icon: '📊' },
  { title: 'Total Claims Submitted', value: '1,245', change: '+8.3%', trend: 'up', icon: '📝' },
  { title: 'Claims Approved Rate', value: '87.5%', change: '+5.2%', trend: 'up', icon: '✅' },
  { title: 'Avg Loss Ratio', value: '45.2%', change: '-2.1%', trend: 'down', icon: '📉' },
]);

// Periodic Total Paid Claims Data (Bar Chart)
const periodicPaidClaimsData = ref({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: 'Paid Claims',
      data: [30, 40, 45, 50, 48, 60, 70, 81, 80, 75, 65, 55],
      backgroundColor: '#93C5FD',
      borderRadius: 6,
    }
  ]
});

// Total Loss Ratio by Policyholder and Cover Types (Grouped Bar Chart)
const lossRatioData = ref({
  labels: ['CBE', 'Medco', 'Dashin Bank'],
  datasets: [
    {
      label: 'Total Loss',
      data: [110, 55, 75],
      backgroundColor: '#FECACA',
      borderRadius: 6,
    },
    {
      label: 'Total Gain',
      data: [15, 80, 95],
      backgroundColor: '#A7F3D0',
      borderRadius: 6,
    }
  ]
});

// Paid Claims by Providers and Service Types (Stacked Bar Chart)
const paidClaimsByProvidersData = ref({
  labels: ['Addis Harar', 'TekleMariam', 'Hayal Hospital', 'Amen Hospital', 'Beta zolla'],
  datasets: [
    {
      label: 'Laboratory',
      data: [44, 55, 41, 87, 22],
      backgroundColor: '#FECACA',
    },
    {
      label: 'Pharmacy',
      data: [13, 23, 20, 13, 43],
      backgroundColor: '#FED7AA',
    },
    {
      label: 'Surgical service',
      data: [21, 7, 25, 8, 22],
      backgroundColor: '#BEF264',
    },
    {
      label: 'Radiotherapy',
      data: [11, 27, 15, 13, 18],
      backgroundColor: '#A5F3FC',
    },
    {
      label: 'Dental',
      data: [11, 27, 15, 13, 18],
      backgroundColor: '#D8B4FE',
    }
  ]
});

// Total Claims Created by Insurer/Provider/Claimants (Pie Chart)
const claimsCreatedData = ref({
  labels: ['Insurer 1', 'Insurer 2', 'Insurer 3', 'Insurer 4', 'Insurer 5'],
  datasets: [
    {
      data: [24.0, 24.7, 7.3, 21.1, 12.4],
      backgroundColor: ['#93C5FD', '#FECACA', '#FED7AA', '#A7F3D0', '#D8B4FE'],
      borderColor: '#fff',
      borderWidth: 2,
    }
  ]
});

// Total Number of Claims Submitted, Paid, and Rejected (Grouped Bar Chart)
const claimsStatusData = ref({
  labels: ['CBE', 'Medco', 'Dashin Bank', 'Sheraton', 'Sellawy'],
  datasets: [
    {
      label: 'Submitted',
      data: [45, 55, 40, 10, 20],
      backgroundColor: '#93C5FD',
      borderRadius: 6,
    },
    {
      label: 'Paid',
      data: [12, 22, 18, 8, 15],
      backgroundColor: '#A7F3D0',
      borderRadius: 6,
    },
    {
      label: 'Rejected',
      data: [8, 15, 12, 5, 18],
      backgroundColor: '#FECACA',
      borderRadius: 6,
    }
  ]
});

// Top 5 Institutions (Area Chart)
const topInstitutionsData = ref({
  labels: ['00:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00'],
  datasets: [
    {
      label: 'Medco',
      data: [30, 50, 40, 60, 70, 80, 90],
      borderColor: '#93C5FD',
      backgroundColor: 'rgba(147, 197, 253, 0.2)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'CBE',
      data: [20, 30, 35, 45, 55, 65, 75],
      borderColor: '#FED7AA',
      backgroundColor: 'rgba(254, 215, 170, 0.2)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Dashin Bank',
      data: [40, 45, 50, 55, 60, 70, 85],
      borderColor: '#A7F3D0',
      backgroundColor: 'rgba(167, 243, 208, 0.2)',
      fill: true,
      tension: 0.4,
    },
    {
      label: 'Sheraton',
      data: [25, 35, 40, 50, 60, 75, 95],
      borderColor: '#D8B4FE',
      backgroundColor: 'rgba(216, 180, 254, 0.2)',
      fill: true,
      tension: 0.4,
    }
  ]
});

// Total Premium Collected (Doughnut Chart)
const premiumCollectedData = ref({
  labels: ['series-1', 'series-2', 'series-3', 'series-4', 'series-5'],
  datasets: [
    {
      data: [25.6, 32.0, 23.8, 9.9, 8.7],
      backgroundColor: ['#93C5FD', '#A7F3D0', '#FED7AA', '#FECACA', '#D8B4FE'],
      borderColor: '#fff',
      borderWidth: 3,
    }
  ]
});

// Top Institutions Table Data
const topInstitutionsTableData = ref([
  { rank: 1, institution: 'Medco', insuredPersons: 1250, percentage: 28.5 },
  { rank: 2, institution: 'CBE', insuredPersons: 980, percentage: 22.3 },
  { rank: 3, institution: 'Dashin Bank', insuredPersons: 875, percentage: 19.9 },
  { rank: 4, institution: 'Sheraton', insuredPersons: 650, percentage: 14.8 },
  { rank: 5, institution: 'Addis Harar', insuredPersons: 520, percentage: 11.8 },
]);

onMounted(() => {
  // Fetch provider credit report immediately on mount
  fetchReport();
});
</script>

<template>
  <DefaultPage :hideSearch="true" title="Analytics & Reports" subtitle="Comprehensive claims, policy, and provider reports">
    <!-- Tab Navigation -->
    <div class="flex gap-4 pb-px mb-6 border-b border-gray-200">
      <button 
        @click="activeTab = 'dashboard'"
        :class="[
          'px-5 py-3 font-semibold text-sm transition-all relative border-b-2 -mb-px',
          activeTab === 'dashboard' 
            ? 'border-primary text-primary' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        ]"
      >
        Overview Dashboard
      </button>
      <button 
        @click="activeTab = 'provider-report'"
        :class="[
          'px-5 py-3 font-semibold text-sm transition-all relative border-b-2 -mb-px',
          activeTab === 'provider-report' 
            ? 'border-primary text-primary' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        ]"
      >
        Provider Credit Reports
      </button>
    </div>

    <!-- Overview Dashboard Content (Legacy mockup analytics) -->
    <div v-if="activeTab === 'dashboard'" class="px-6 py-8 -mx-6 -my-6 space-y-8 bg-gradient-to-br via-blue-50 to-indigo-50 rounded-2xl from-slate-50">
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

    <!-- Provider Credit Reports (LIVE Report API Integration) -->
    <div v-else class="space-y-6">
      <!-- Live Filter Card -->
      <div class="p-6 space-y-4 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div class="flex justify-between items-center">
          <h3 class="flex gap-2 items-center text-base font-bold text-gray-800">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 5.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter Options
          </h3>
          <button 
            @click="downloadCSV" 
            :disabled="reportData.length === 0"
            class="flex gap-2 items-center px-4 h-10 text-sm font-semibold text-white rounded-lg shadow-sm transition-colors bg-primary hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Report (CSV)
          </button>
        </div>

        <div class="grid grid-cols-1 gap-4 items-end md:grid-cols-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-gray-500">Institution</label>
            <SearchSelect
              placeholder="All Institutions"
              :searchCb="(data) => getInstitutionsPolicyByStatus({ ...data, status: Status.ACTIVE })"
              :selectCb="(res) => reportInstitutionUuid = res?.institutionUuid || ''"
              :option="{ label: 'institutionName', value: 'institutionUuid' }"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-gray-500">Provider</label>
            <SearchSelect
              placeholder="All Providers"
              :searchCb="(data) => getActiveContracts({ ...data, status: Status.ACTIVE })"
              :selectCb="(res) => reportProviderUuid = res?.providerUuid || ''"
              :option="{ label: 'providerName', value: 'providerUuid' }"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-gray-500">From Date</label>
            <input 
              type="date" 
              v-model="reportFromDate" 
              class="px-3 w-4/5 h-10 text-sm bg-white rounded-lg border border-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-gray-500">To Date</label>
            <input 
              type="date" 
              v-model="reportToDate" 
              class="px-3 w-4/5 h-10 text-sm bg-white rounded-lg border border-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <!-- Report KPIs -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KPICard 
          title="Total Credit Amount" 
          :value="'ETB ' + totalReportAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })"
          change="Live calculation" 
          trend="up" 
          icon="💰" 
        />
        <KPICard 
          title="Total Credits Given" 
          :value="totalReportCredits.toLocaleString()"
          change="Live calculation" 
          trend="up" 
          icon="📈" 
        />
        <KPICard 
          title="Active Providers" 
          :value="totalReportProviders.toString()"
          change="In filtered view" 
          trend="up" 
          icon="🏥" 
        />
      </div>

      <!-- Live Loading State -->
      <div v-if="isReportLoading" class="flex flex-col gap-3 justify-center items-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div class="w-10 h-10 rounded-full border-4 animate-spin border-primary border-t-transparent"></div>
        <p class="text-sm font-semibold text-gray-500">Generating report data...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="reportData.length === 0" class="flex flex-col gap-3 justify-center items-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
        <span class="text-4xl">📭</span>
        <p class="text-sm font-bold text-gray-700">No report data found</p>
        <p class="text-xs text-gray-400">Try modifying your dates or filter selections.</p>
      </div>

      <!-- Report Visualizations and Table -->
      <div v-else class="space-y-6">
        <!-- Visual Charts -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Total Credit Value by Provider" subtitle="Amount in ETB">
            <BarChart :chart-data="reportChartData" height="300px" />
          </ChartCard>
          <ChartCard title="Credits Volume by Provider" subtitle="Number of Credits Given">
            <BarChart :chart-data="reportCreditsChartData" height="300px" />
          </ChartCard>
        </div>

        <!-- Tabular Report Details -->
        <div class="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
          <div class="flex justify-between items-center p-5 border-b border-gray-100">
            <div>
              <h3 class="text-base font-bold text-gray-800">Report Details</h3>
              <p class="text-xs text-gray-400">Click "View Details" on any provider to see individual credit claims</p>
            </div>
            <span class="px-2.5 py-1 text-xs font-semibold bg-indigo-50 rounded-full border border-indigo-100 text-primary">
              {{ reportData.length }} records
            </span>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 w-20 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase">Rank</th>
                  <th scope="col" class="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-500 uppercase">Provider Name</th>
                  <th scope="col" class="px-6 py-3 text-xs font-semibold tracking-wider text-right text-gray-500 uppercase">Number of Credits</th>
                  <th scope="col" class="px-6 py-3 text-xs font-semibold tracking-wider text-right text-gray-500 uppercase">Total Amount</th>
                  <th scope="col" class="px-6 py-3 text-xs font-semibold tracking-wider text-center text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(item, index) in reportData" :key="item.providerUuid" class="transition-colors hover:bg-slate-50">
                  <td class="px-6 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap">
                    <span class="inline-flex justify-center items-center w-6 h-6 text-xs rounded-full" :class="[
                      index === 0 ? 'bg-amber-100 text-amber-800 font-bold' : 
                      index === 1 ? 'bg-slate-100 text-slate-800' : 
                      index === 2 ? 'bg-orange-50 text-orange-800' : 'bg-gray-50 text-gray-500'
                    ]">
                      {{ index + 1 }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm font-semibold text-gray-800 whitespace-nowrap">
                    {{ item.providerName || 'N/A' }}
                  </td>
                  <td class="px-6 py-4 text-sm font-medium text-right text-gray-600 whitespace-nowrap">
                    {{ (item.numberOfCreditsGiven || 0).toLocaleString() }}
                  </td>
                  <td class="px-6 py-4 text-sm font-semibold text-right whitespace-nowrap text-primary">
                    ETB {{ (item.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                  </td>
                  <td class="px-6 py-4 text-center whitespace-nowrap">
                    <button
                      @click="openProviderDetail(item)"
                      class="inline-flex gap-1 items-center px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors bg-primary hover:bg-indigo-700"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      View Details
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ─── Provider Detail Drill-Down Panel ─────────────────────────────── -->
        <div v-if="detailProvider" class="overflow-hidden bg-white rounded-xl border border-indigo-200 shadow-md">
          <!-- Panel Header -->
          <div class="flex justify-between items-center px-5 py-4 bg-indigo-50 border-b border-indigo-100">
            <div class="flex gap-3 items-center">
              <button @click="closeProviderDetail" class="p-1.5 text-indigo-600 bg-white rounded-lg border border-indigo-200 hover:bg-indigo-100 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div>
                <h3 class="text-sm font-bold text-indigo-800">{{ detailProvider.providerName }}</h3>
                <p class="text-xs text-indigo-500">Individual credit claims — {{ reportFromDate }} to {{ reportToDate }}</p>
              </div>
            </div>
            <div class="flex gap-4 items-center">
              <span class="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-white rounded-full border border-indigo-200">
                {{ detailTotal }} claim{{ detailTotal !== 1 ? 's' : '' }}
              </span>
              <button @click="closeProviderDetail" class="text-xs font-semibold text-indigo-500 hover:text-indigo-700">✕ Close</button>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="detailLoading" class="flex flex-col gap-2 justify-center items-center py-12">
            <div class="w-8 h-8 rounded-full border-4 animate-spin border-primary border-t-transparent"></div>
            <p class="text-xs text-gray-500">Loading claims...</p>
          </div>

          <!-- CreditClaimDetail sub-view -->
          <div v-else-if="detailSelectedRow">
            <CreditClaimDetail :row="detailSelectedRow" @back="backFromClaimDetail" />
          </div>

          <!-- Claims Table -->
          <div v-else-if="detailClaims.length === 0" class="flex flex-col gap-2 justify-center items-center py-12">
            <span class="text-3xl">📭</span>
            <p class="text-sm font-bold text-gray-700">No individual claims found</p>
            <p class="text-xs text-gray-400">Try adjusting the date range or institution filter above.</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
              <thead class="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                <tr>
                  <th class="px-5 py-3 text-left">#</th>
                  <th class="px-5 py-3 text-left">Insured</th>
                  <th class="px-5 py-3 text-left">Institution</th>
                  <th class="px-5 py-3 text-left">Provided Date</th>
                  <th class="px-5 py-3 text-right">Amount</th>
                  <th class="px-5 py-3 text-center">Status</th>
                  <th class="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 bg-white">
                <tr
                  v-for="(claim, idx) in detailClaims"
                  :key="claim.serviceProvidedUuid || idx"
                  class="hover:bg-slate-50 transition-colors"
                >
                  <td class="px-5 py-3 text-gray-500">{{ (detailPage - 1) * detailLimit + idx + 1 }}</td>
                  <td class="px-5 py-3 font-medium text-gray-800 whitespace-nowrap">{{ claim.insuredName || claim.dependantName || '-' }}</td>
                  <td class="px-5 py-3 text-gray-600 whitespace-nowrap">{{ claim.institutionName || '-' }}</td>
                  <td class="px-5 py-3 text-gray-600 whitespace-nowrap">{{ secondDateFormat(claim.providedDate) }}</td>
                  <td class="px-5 py-3 text-right font-semibold text-primary whitespace-nowrap">{{ formatCurrency(claim.amount) }}</td>
                  <td class="px-5 py-3 text-center">
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      :class="{
                        'bg-yellow-100 text-yellow-800': claim.serviceClaimStatus === 'PENDING',
                        'bg-green-100 text-green-800': claim.serviceClaimStatus === 'APPROVED',
                        'bg-red-100 text-red-800': claim.serviceClaimStatus === 'REJECTED',
                        'bg-blue-100 text-blue-800': !['PENDING','APPROVED','REJECTED'].includes(claim.serviceClaimStatus),
                      }"
                    >{{ claim.serviceClaimStatus || '-' }}</span>
                  </td>
                  <td class="px-5 py-3 text-center">
                    <button
                      @click="viewClaimDetail(claim)"
                      class="inline-flex gap-1 items-center px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      Details
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Pagination -->
            <div v-if="detailTotalPages > 1" class="flex justify-between items-center px-5 py-3 bg-gray-50 border-t border-gray-100">
              <p class="text-xs text-gray-500">Page {{ detailPage }} of {{ detailTotalPages }} &bull; {{ detailTotal }} total</p>
              <div class="flex gap-2">
                <button
                  :disabled="detailPage <= 1"
                  @click="fetchProviderDetails(detailProvider, detailPage - 1)"
                  class="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >← Prev</button>
                <button
                  :disabled="detailPage >= detailTotalPages"
                  @click="fetchProviderDetails(detailProvider, detailPage + 1)"
                  class="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >Next →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DefaultPage>
</template>

<style scoped>
</style>
