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

import { useExportAnalyticsExcel } from '@/composables/useExportAnalyticsExcel';

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

// Export Excel
const { exporting: isExportingExcel, exportExcel: doExportExcel } = useExportAnalyticsExcel();

const handleExportExcel = () => {
  doExportExcel({
    reportData: reportData.value,
    fromDate: reportFromDate.value,
    toDate: reportToDate.value,
    institutionUuid: reportInstitutionUuid.value,
    providerUuid: reportProviderUuid.value,
  });
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

// ═══════════════════════════════════════════════════════════════════════════════
// DYNAMIC REPORTS — New tab logic
// ═══════════════════════════════════════════════════════════════════════════════
import { getReportsList, executeReport } from '@/features/analytics/api/analyticsApi';
import ReportParamForm from '../components/ReportParamForm.vue';
import ReportResultTable from '../components/ReportResultTable.vue';

interface ReportDefinition {
  reportUuid: string;
  name: string;
  description: string;
  category: string;
  parameters: string; // JSON string
}

interface ParsedParam {
  name: string;
  label: string;
  type: 'DATE' | 'TEXT' | 'SELECT';
  required?: boolean;
  options?: string[];
}

// Reports list state
const reportsList = ref<ReportDefinition[]>([]);
const reportsListLoading = ref(false);
const reportsListError = ref('');

// Selected report
const selectedReport = ref<ReportDefinition | null>(null);
const selectedReportParams = computed<ParsedParam[]>(() => {
  if (!selectedReport.value?.parameters) return [];
  try {
    return JSON.parse(selectedReport.value.parameters) as ParsedParam[];
  } catch {
    return [];
  }
});

// Execute state
const dynLoading = ref(false);
const dynColumns = ref<string[]>([]);
const dynRows = ref<Record<string, any>[]>([]);
const dynPage = ref(0);
const dynPageSize = ref(20);
const dynTotalElements = ref(0);
const dynTotalPages = ref(0);
const dynHasRun = ref(false);
const dynLastParams = ref<Record<string, string>>({});

// Category config
const categoryConfig: Record<string, { color: string; bg: string; icon: string }> = {
  POLICY: { color: '#4f46e5', bg: 'rgba(99,102,241,0.1)', icon: '📋' },
  CLAIMS: { color: '#0891b2', bg: 'rgba(8,145,178,0.1)', icon: '🏥' },
};

function getCategoryStyle(category: string) {
  return categoryConfig[category] || { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: '📄' };
}

// Computed KPIs from result
const dynKpis = computed(() => {
  if (!dynRows.value.length) return [];
  const kpiList: { label: string; value: string; icon: string; color: string }[] = [];

  // Total Premium
  const premiumKey = dynColumns.value.find(c => c.toLowerCase().includes('premium'));
  if (premiumKey) {
    const total = dynRows.value.reduce((s, r) => s + (parseFloat(String(r[premiumKey]).replace(/,/g, '')) || 0), 0);
    kpiList.push({ label: 'Total Premium', value: total.toLocaleString('en-US', { maximumFractionDigits: 0 }), icon: '💰', color: '#4f46e5' });
  }

  // Total Members
  const membersKey = dynColumns.value.find(c => c.toLowerCase() === 'total members');
  if (membersKey) {
    const total = dynRows.value.reduce((s, r) => s + (parseFloat(String(r[membersKey]).replace(/,/g, '')) || 0), 0);
    kpiList.push({ label: 'Total Members', value: total.toLocaleString(), icon: '👥', color: '#0891b2' });
  }

  // Total Claims
  const claimsKey = dynColumns.value.find(c => c.toLowerCase() === 'total claims');
  if (claimsKey) {
    const total = dynRows.value.reduce((s, r) => s + (parseFloat(String(r[claimsKey]).replace(/,/g, '')) || 0), 0);
    kpiList.push({ label: 'Total Claims', value: total.toLocaleString('en-US', { maximumFractionDigits: 0 }), icon: '📊', color: '#dc2626' });
  }

  // Avg Loss Ratio
  const lrKey = dynColumns.value.find(c => c.toLowerCase().includes('loss ratio'));
  if (lrKey) {
    const vals = dynRows.value.map(r => parseFloat(String(r[lrKey]).replace('%', ''))).filter(v => !isNaN(v));
    if (vals.length) {
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
      kpiList.push({ label: 'Avg Loss Ratio', value: `${avg.toFixed(1)}%`, icon: '📉', color: avg > 90 ? '#dc2626' : avg > 70 ? '#d97706' : '#059669' });
    }
  }

  // Record count
  kpiList.push({ label: 'Records Found', value: dynTotalElements.value.toLocaleString(), icon: '🗂️', color: '#7c3aed' });

  return kpiList;
});

async function loadReportsList() {
  reportsListLoading.value = true;
  reportsListError.value = '';
  try {
    const res = await getReportsList();
    reportsList.value = Array.isArray(res) ? res : res?.data || res?.content || [];
  } catch (e: any) {
    reportsListError.value = e?.message || 'Failed to load reports list';
    reportsList.value = [];
  } finally {
    reportsListLoading.value = false;
  }
}

function selectReport(report: ReportDefinition) {
  if (selectedReport.value?.reportUuid === report.reportUuid) return;
  selectedReport.value = report;
  dynHasRun.value = false;
  dynColumns.value = [];
  dynRows.value = [];
  dynPage.value = 0;
  dynTotalElements.value = 0;
  dynTotalPages.value = 0;
  dynLastParams.value = {};
  // Auto-run with empty params immediately on selection
  runReport({}, 0);
}

async function runReport(params: Record<string, string>, page = 0) {
  if (!selectedReport.value) return;
  dynLoading.value = true;
  dynLastParams.value = params;
  try {
    const res = await executeReport(selectedReport.value.reportUuid, params, page, dynPageSize.value);
    dynColumns.value = res?.columns || [];
    const data = res?.data || {};
    dynRows.value = data?.content || [];
    dynPage.value = data?.page != null ? data.page - 1 : page; // API returns 1-indexed page
    dynTotalElements.value = data?.totalElements || 0;
    dynTotalPages.value = data?.totalPages || 0;
    dynHasRun.value = true;
  } catch (e) {
    console.error('Error executing report:', e);
    dynRows.value = [];
    dynHasRun.value = true;
  } finally {
    dynLoading.value = false;
  }
}

function handlePageChange(newPage: number) {
  runReport(dynLastParams.value, newPage);
}

// ─── Export all pages to Excel ───────────────────────────────────────────────
const dynExporting = ref(false);

async function exportDynReport() {
  if (!selectedReport.value || dynExporting.value) return;
  if (!dynColumns.value.length) return;

  dynExporting.value = true;
  try {
    const res = await executeReport(
      selectedReport.value.reportUuid,
      dynLastParams.value,
      0,
      10000
    );
    const columns: string[] = res?.columns || dynColumns.value;
    const allRows: Record<string, any>[] = res?.data?.content || dynRows.value;

    if (!allRows.length) return;

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');

    // Title Row
    const colCount = columns.length;
    sheet.mergeCells(1, 1, 1, colCount);
    const titleCell = sheet.getCell('A1');
    titleCell.value = selectedReport.value.name;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 32;

    // Header Row
    const headerRow = sheet.addRow(columns);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF6366F1' } } };
    });
    sheet.getRow(2).height = 28;

    // Data Rows
    allRows.forEach((row, idx) => {
      const values = columns.map(col => row[col] ?? '');
      const dataRow = sheet.addRow(values);
      const rowBg = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
      dataRow.eachCell({ includeEmpty: true }, (cell, colIdx) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
        cell.alignment = { vertical: 'middle' };
        
        const colName = columns[colIdx - 1] || '';
        const lower = colName.toLowerCase();
        if (['premium','claim','amount','total','paid','outstanding','rejected','members','principals','dependents'].some(k => lower.includes(k))) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
        if (lower.includes('loss ratio') || lower.includes('utilization')) {
          const num = parseFloat(String(cell.value).replace('%', ''));
          if (!isNaN(num)) {
            const argb = num < 70 ? 'FFD1FAE5' : num < 90 ? 'FFFEF3C7' : 'FFFEE2E2';
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
          }
        }
      });
    });

    sheet.columns = columns.map(() => ({ width: 22 }));
    sheet.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: colCount } };
    sheet.views = [{ state: 'frozen', ySplit: 2, activeCell: 'A3' }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `${selectedReport.value.name.replace(/\s+/g, '_')}_${date}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 200);
  } catch (e) {
    console.error('Export failed:', e);
  } finally {
    dynExporting.value = false;
  }
}

// Grouped reports by category
const groupedReports = computed(() => {
  const groups: Record<string, ReportDefinition[]> = {};
  reportsList.value.forEach(r => {
    if (!groups[r.category]) groups[r.category] = [];
    groups[r.category].push(r);
  });
  return groups;
});

watch(activeTab, (tab) => {
  if (tab === 'dynamic-reports' && reportsList.value.length === 0) {
    loadReportsList();
  }
});

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
      <button 
        @click="activeTab = 'dynamic-reports'"
        :class="[
          'px-5 py-3 font-semibold text-sm transition-all relative border-b-2 -mb-px flex items-center gap-2',
          activeTab === 'dynamic-reports' 
            ? 'border-primary text-primary' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        ]"
      >
        Dynamic Reports
        <span class="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700">
          NEW
        </span>
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
    <div v-else-if="activeTab === 'provider-report'" class="space-y-6">
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
            @click="handleExportExcel" 
            :disabled="reportData.length === 0 || isExportingExcel"
            class="flex gap-2 items-center px-4 h-10 text-sm font-semibold text-white rounded-lg shadow-sm transition-colors bg-primary hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg v-if="!isExportingExcel" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isExportingExcel ? 'Exporting...' : 'Export Report (Excel)' }}
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

    <!-- ═══════════════════ DYNAMIC REPORTS TAB ═══════════════════ -->
    <div v-else-if="activeTab === 'dynamic-reports'" class="dyn-reports-root">

      <!-- Reports list loading -->
      <div v-if="reportsListLoading" class="dyn-loading-splash">
        <div class="dyn-spinner"></div>
        <p>Loading available reports...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="reportsListError" class="dyn-error-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
        <p>{{ reportsListError }}</p>
        <button @click="loadReportsList" class="dyn-retry-btn">Retry</button>
      </div>

      <div v-else class="dyn-shelf-container">
        <!-- ── Top Shelf: Available Reports (Full Width) ── -->
        <div class="dyn-shelf">
          <div class="dyn-shelf-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>Available Reports</span>
            <span class="dyn-shelf-count">{{ reportsList.length }}</span>
          </div>

          <div class="dyn-shelf-grid">
            <template v-for="(reports, category) in groupedReports" :key="category">
              <button
                v-for="report in reports"
                :key="report.reportUuid"
                class="dyn-report-card"
                :class="{ 'dyn-report-card--active': selectedReport?.reportUuid === report.reportUuid }"
                @click="selectReport(report)"
              >
                <div class="dyn-report-card-meta">
                  <span class="dyn-report-card-cat" :style="{
                    color: getCategoryStyle(category).color,
                    background: getCategoryStyle(category).bg
                  }">
                    {{ getCategoryStyle(category).icon }} {{ category }}
                  </span>
                </div>
                <div class="dyn-report-card-title">{{ report.name }}</div>
                <div class="dyn-report-card-desc">{{ report.description }}</div>
              </button>
            </template>
          </div>
        </div>

        <!-- ── Main content area (Full Width below) ── -->
        <div class="dyn-main-stacked">

          <!-- No report selected -->
          <div v-if="!selectedReport" class="dyn-no-selection">
            <div class="dyn-no-selection-icon">
              <svg viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" fill="#f0f4ff"/>
                <rect x="18" y="14" width="28" height="36" rx="4" fill="#e0e7ff" stroke="#6366f1" stroke-width="2"/>
                <path d="M24 24h16M24 30h16M24 36h10" stroke="#6366f1" stroke-width="2" stroke-linecap="round"/>
                <circle cx="48" cy="48" r="10" fill="#6366f1"/>
                <path d="M45 48l2 2 4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <p class="dyn-no-selection-title">Select a Report</p>
            <p class="dyn-no-selection-sub">Choose one of the available reports from the top shelf to configure and run it.</p>
          </div>

          <!-- Report selected -->
          <div v-else class="dyn-selected-container">

            <!-- Report header -->
            <div class="dyn-report-header">
              <div class="dyn-report-header-top">
                <div>
                  <div class="dyn-report-badge" :style="{
                    color: getCategoryStyle(selectedReport.category).color,
                    background: getCategoryStyle(selectedReport.category).bg
                  }">
                    {{ getCategoryStyle(selectedReport.category).icon }} {{ selectedReport.category }}
                  </div>
                  <h2 class="dyn-report-title">{{ selectedReport.name }}</h2>
                  <p class="dyn-report-desc">{{ selectedReport.description }}</p>
                </div>
              </div>
            </div>

            <!-- Parameters + Run form -->
            <div class="dyn-params-card">
              <div class="dyn-params-card-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                </svg>
                Report Parameters
              </div>
              <ReportParamForm
                :parameters="selectedReportParams"
                :loading="dynLoading"
                @submit="(params) => runReport(params, 0)"
              ></ReportParamForm>
            </div>

            <!-- KPI cards after running -->
            <div v-if="dynHasRun && dynKpis.length > 0" class="dyn-kpis">
              <div
                v-for="kpi in dynKpis"
                :key="kpi.label"
                class="dyn-kpi-card"
              >
                <div class="dyn-kpi-icon">{{ kpi.icon }}</div>
                <div class="dyn-kpi-value" :style="{ color: kpi.color }">{{ kpi.value }}</div>
                <div class="dyn-kpi-label">{{ kpi.label }}</div>
              </div>
            </div>

            <!-- Result table -->
            <div v-if="dynHasRun" class="dyn-result-card">
              <div class="dyn-result-header">
                <div class="dyn-result-header-left">
                  <h3 class="dyn-result-title">Report Results</h3>
                  <p class="dyn-result-sub" v-if="!dynLoading">
                    <span class="dyn-result-count">{{ dynTotalElements.toLocaleString() }}</span>
                    record{{ dynTotalElements !== 1 ? 's' : '' }} &middot; {{ dynColumns.length }} columns
                  </p>
                </div>
                <div class="dyn-result-actions" v-if="dynRows.length > 0">
                  <span class="dyn-result-badge" v-if="dynTotalPages > 1">
                    Page {{ dynPage + 1 }} / {{ dynTotalPages }}
                  </span>
                  <button
                    class="export-excel-btn"
                    :class="{ 'export-excel-btn--loading': dynExporting }"
                    :disabled="dynExporting || dynLoading"
                    @click="exportDynReport"
                  >
                    <svg v-if="!dynExporting" class="export-excel-icon" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="3" width="20" height="18" rx="2" fill="#16a34a" opacity="0.15"/>
                      <path d="M14 3v4a1 1 0 001 1h4" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round"/>
                      <path d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" stroke="#16a34a" stroke-width="1.5" stroke-linejoin="round"/>
                      <path d="M9 17l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                    <span>{{ dynExporting ? 'Exporting...' : 'Export Excel' }}</span>
                  </button>
                </div>
              </div>

              <ReportResultTable
                :columns="dynColumns"
                :rows="dynRows"
                :page="dynPage"
                :page-size="dynPageSize"
                :total-elements="dynTotalElements"
                :total-pages="dynTotalPages"
                :loading="dynLoading"
                @page-change="handlePageChange"
              ></ReportResultTable>
            </div>

          </div>
        </div>
      </div>
    </div>
  </DefaultPage>
</template>

<style scoped>
/* ═══════════════════════════════════════════════
   DYNAMIC REPORTS TAB
   ═══════════════════════════════════════════════ */

.dyn-reports-root {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 600px;
}

/* ── Loading splash ── */
.dyn-loading-splash {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 24px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
}

.dyn-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e0e7ff;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Error state ── */
.dyn-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 24px;
  color: #dc2626;
  font-size: 14px;
}

.dyn-error-state svg {
  width: 48px;
  height: 48px;
  opacity: 0.6;
}

.dyn-retry-btn {
  margin-top: 4px;
  padding: 8px 20px;
  border-radius: 8px;
  background: #6366f1;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.dyn-retry-btn:hover {
  background: #4f46e5;
}

/* ── Top Shelf: Available Reports ── */
.dyn-shelf {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  padding: 18px 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.dyn-shelf-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 14px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 10px;
}

.dyn-shelf-header svg {
  width: 16px;
  height: 16px;
  color: #6366f1;
}

.dyn-shelf-count {
  background: #e0e7ff;
  color: #4338ca;
  font-size: 11px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 9999px;
  margin-left: 6px;
}

.dyn-shelf-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.dyn-report-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  padding: 16px;
  border-radius: 12px;
  background: #f8fafc;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.dyn-report-card:hover {
  background: #fff;
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transform: translateY(-2px);
}

.dyn-report-card--active {
  background: #fff;
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
}

.dyn-report-card-meta {
  margin-bottom: 8px;
}

.dyn-report-card-cat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 4px;
}

.dyn-report-card-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
  margin-bottom: 4px;
}

.dyn-report-card--active .dyn-report-card-title {
  color: #4f46e5;
}

.dyn-report-card-desc {
  font-size: 11px;
  color: #64748b;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Main Stacked content ── */
.dyn-main-stacked {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
}

/* ── No selection state ── */
.dyn-no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 32px;
  gap: 12px;
}

.dyn-no-selection-icon svg {
  width: 96px;
  height: 96px;
}

.dyn-no-selection-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.dyn-no-selection-sub {
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
  max-width: 320px;
  margin: 0;
  line-height: 1.6;
}

/* ── Report header ── */
.dyn-report-header {
  padding: 20px 24px 0;
}

.dyn-report-header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.dyn-report-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}

.dyn-report-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px;
  line-height: 1.2;
}

.dyn-report-desc {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

/* ── Params card ── */
.dyn-params-card {
  margin: 16px 24px;
  padding: 16px 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.dyn-params-card-header {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 14px;
}

.dyn-params-card-header svg {
  width: 14px;
  height: 14px;
  color: #6366f1;
}

/* ── KPI row ── */
.dyn-kpis {
  display: flex;
  gap: 12px;
  padding: 0 24px;
  flex-wrap: wrap;
}

.dyn-kpi-card {
  flex: 1;
  min-width: 130px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: box-shadow 0.15s, transform 0.15s;
}

.dyn-kpi-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transform: translateY(-1px);
}

.dyn-kpi-icon {
  font-size: 20px;
  line-height: 1;
}

.dyn-kpi-value {
  font-size: 20px;
  font-weight: 800;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.dyn-kpi-label {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ── Result card ── */
.dyn-result-card {
  margin: 16px 24px 24px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.dyn-result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  background: #fafbff;
}

.dyn-result-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 2px;
}

.dyn-result-sub {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

.dyn-result-count {
  font-weight: 800;
  color: #0f172a;
}

.dyn-result-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dyn-result-badge {
  background: #f0f4ff;
  color: #4f46e5;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 9999px;
  border: 1px solid #e0e7ff;
}

/* ── Excel Export button ── */
.export-excel-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 36px;
  padding: 0 14px 0 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #15803d;
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(22, 163, 74, 0.08);
  white-space: nowrap;
}

.export-excel-btn:hover:not(:disabled) {
  background: #dcfce7;
  border-color: #86efac;
  color: #166534;
  box-shadow: 0 3px 8px rgba(22, 163, 74, 0.15);
  transform: translateY(-1px);
}

.export-excel-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(22, 163, 74, 0.1);
}

.export-excel-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.export-excel-btn--loading {
  color: #6b7280 !important;
  background: #f9fafb !important;
  border-color: #e5e7eb !important;
}

.export-excel-icon {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
}

.export-excel-spin {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  animation: spin-export 0.8s linear infinite;
  color: #9ca3af;
}

@keyframes spin-export {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 900px) {
  .dyn-shelf-grid {
    grid-template-columns: 1fr;
  }

  .dyn-kpis {
    padding: 0 16px;
  }

  .dyn-params-card,
  .dyn-result-card {
    margin-left: 16px;
    margin-right: 16px;
  }
}
</style>
