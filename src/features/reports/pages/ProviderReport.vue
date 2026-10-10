<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import DefaultPage from '@/components/DefaultPage.vue';
import ChartCard from '@/components/charts/ChartCard.vue';
import BarChart from '@/components/charts/BarChart.vue';

import { getProviderCreditServicesReport } from '@/features/analytics/api/analyticsApi';
import { getRequestedClaim } from '@/features/claim/api/claimApi';
import { getInstitutionsPolicyByStatus } from '@/features/institutions/api/institutionApi';
import { getActiveContracts } from '@/features/provider_contracts/api/contractApi';
import SearchSelect from '@/components/SearchSelect.vue';
import { Status } from '@/types/interface';
import CreditClaimDetail from '@/features/claim/pages/credit_claim/CreditClaimDetail.vue';
import { formatCurrency, secondDateFormat } from '@/utils/utils';
import { useExportAnalyticsExcel } from '@/composables/useExportAnalyticsExcel';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

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

watch([reportInstitutionUuid, reportProviderUuid, reportFromDate, reportToDate], () => {
  fetchReport();
  detailProvider.value = null;
  detailClaims.value = [];
});

// Drill-down
const detailProvider = ref<any>(null);
const detailClaims = ref<any[]>([]);
const detailLoading = ref(false);
const detailPage = ref(1);
const detailLimit = 25;
const detailTotal = ref(0);
const detailSelectedRow = ref<any>(null);

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
    detailClaims.value = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
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
function viewClaimDetail(row: any) { detailSelectedRow.value = row; }
function backFromClaimDetail() { detailSelectedRow.value = null; }

const detailTotalPages = computed(() => Math.max(1, Math.ceil(detailTotal.value / detailLimit)));

const reportChartData = computed(() => ({
  labels: reportData.value.map(item => item.providerName || 'Unknown'),
  datasets: [{
    label: 'Total Credit Amount (ETB)',
    data: reportData.value.map(item => item.totalAmount || 0),
    backgroundColor: 'rgba(99,102,241,0.85)',
    borderRadius: 8,
    borderSkipped: false,
  }]
}));

const reportCreditsChartData = computed(() => ({
  labels: reportData.value.map(item => item.providerName || 'Unknown'),
  datasets: [{
    label: 'Number of Credits Given',
    data: reportData.value.map(item => item.numberOfCreditsGiven || 0),
    backgroundColor: 'rgba(16,185,129,0.85)',
    borderRadius: 8,
    borderSkipped: false,
  }]
}));

const totalReportAmount = computed(() => reportData.value.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0));
const totalReportCredits = computed(() => reportData.value.reduce((acc, curr) => acc + (curr.numberOfCreditsGiven || 0), 0));
const totalReportProviders = computed(() => reportData.value.length);

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

onMounted(() => { fetchReport(); });
</script>

<template>
  <DefaultPage :hideSearch="true" title="Provider Credit Report" subtitle="Live credit services breakdown by provider">

    <!-- Hero KPI strip -->
    <div class="pr-kpi-strip">
      <div class="pr-kpi-card pr-kpi-indigo">
        <div class="pr-kpi-icon-wrap pr-icon-indigo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <div>
          <p class="pr-kpi-label">Total Credit Amount</p>
          <p class="pr-kpi-value">ETB {{ totalReportAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</p>
          <p class="pr-kpi-sub">Live calculation</p>
        </div>
      </div>
      <div class="pr-kpi-card pr-kpi-emerald">
        <div class="pr-kpi-icon-wrap pr-icon-emerald">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
        </div>
        <div>
          <p class="pr-kpi-label">Total Credits Given</p>
          <p class="pr-kpi-value">{{ totalReportCredits.toLocaleString() }}</p>
          <p class="pr-kpi-sub">Live calculation</p>
        </div>
      </div>
      <div class="pr-kpi-card pr-kpi-violet">
        <div class="pr-kpi-icon-wrap pr-icon-violet">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
        </div>
        <div>
          <p class="pr-kpi-label">Active Providers</p>
          <p class="pr-kpi-value">{{ totalReportProviders }}</p>
          <p class="pr-kpi-sub">In filtered view</p>
        </div>
      </div>
    </div>

    <!-- Filter Card -->
    <div class="pr-filter-card">
      <div class="pr-filter-header">
        <div class="pr-filter-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 5.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
          Report Filters
        </div>
        <button
          @click="handleExportExcel"
          :disabled="reportData.length === 0 || isExportingExcel"
          class="pr-export-btn"
        >
          <svg v-if="!isExportingExcel" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <svg v-else class="pr-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
          {{ isExportingExcel ? 'Exporting...' : 'Export Excel' }}
        </button>
      </div>
      <div class="pr-filter-grid">
        <div class="pr-filter-field">
          <label class="pr-field-label">Institution</label>
          <SearchSelect
            placeholder="All Institutions"
            :searchCb="(data) => getInstitutionsPolicyByStatus({ ...data, status: Status.ACTIVE })"
            :selectCb="(res) => reportInstitutionUuid = res?.institutionUuid || ''"
            :option="{ label: 'institutionName', value: 'institutionUuid' }"
          />
        </div>
        <div class="pr-filter-field">
          <label class="pr-field-label">Provider</label>
          <SearchSelect
            placeholder="All Providers"
            :searchCb="(data) => getActiveContracts({ ...data, status: Status.ACTIVE })"
            :selectCb="(res) => reportProviderUuid = res?.providerUuid || ''"
            :option="{ label: 'providerName', value: 'providerUuid' }"
          />
        </div>
        <div class="pr-filter-field">
          <label class="pr-field-label">From Date</label>
          <input type="date" v-model="reportFromDate" class="pr-date-input" />
        </div>
        <div class="pr-filter-field">
          <label class="pr-field-label">To Date</label>
          <input type="date" v-model="reportToDate" class="pr-date-input" />
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isReportLoading" class="pr-loading">
      <div class="pr-spinner"></div>
      <p>Generating report data...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="reportData.length === 0" class="pr-empty">
      <div class="pr-empty-icon">📭</div>
      <p class="pr-empty-title">No report data found</p>
      <p class="pr-empty-sub">Try modifying your dates or filter selections.</p>
    </div>

    <!-- Content -->
    <div v-else class="pr-content">
      <!-- Charts -->
      <div class="pr-charts-row">
        <ChartCard title="Total Credit Value by Provider" subtitle="Amount in ETB">
          <BarChart :chart-data="reportChartData" height="300px" />
        </ChartCard>
        <ChartCard title="Credits Volume by Provider" subtitle="Number of Credits Given">
          <BarChart :chart-data="reportCreditsChartData" height="300px" />
        </ChartCard>
      </div>

      <!-- Report Table -->
      <div class="pr-table-card">
        <div class="pr-table-head">
          <div>
            <h3 class="pr-table-title">Report Details</h3>
            <p class="pr-table-sub">Click "View Details" on any row to drill down into individual claims</p>
          </div>
          <span class="pr-record-badge">{{ reportData.length }} records</span>
        </div>
        <div class="pr-table-scroll">
          <table class="pr-table">
            <thead>
              <tr>
                <th class="pr-th pr-th-center" style="width:60px">Rank</th>
                <th class="pr-th">Provider Name</th>
                <th class="pr-th pr-th-right">No. of Credits</th>
                <th class="pr-th pr-th-right">Total Amount</th>
                <th class="pr-th pr-th-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(item, index) in reportData"
                :key="item.providerUuid"
                class="pr-tr"
              >
                <td class="pr-td pr-td-center">
                  <span class="pr-rank" :class="{
                    'pr-rank-gold': index === 0,
                    'pr-rank-silver': index === 1,
                    'pr-rank-bronze': index === 2,
                    'pr-rank-plain': index > 2,
                  }">{{ index + 1 }}</span>
                </td>
                <td class="pr-td">
                  <div class="pr-provider-cell">
                    <div class="pr-provider-avatar">{{ (item.providerName || '?')[0].toUpperCase() }}</div>
                    <span class="pr-provider-name">{{ item.providerName || 'N/A' }}</span>
                  </div>
                </td>
                <td class="pr-td pr-td-right pr-credits-val">
                  {{ (item.numberOfCreditsGiven || 0).toLocaleString() }}
                </td>
                <td class="pr-td pr-td-right pr-amount-val">
                  ETB {{ (item.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
                </td>
                <td class="pr-td pr-td-center">
                  <button @click="openProviderDetail(item)" class="pr-view-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    View Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Drill-down Panel -->
      <div v-if="detailProvider" class="pr-detail-panel">
        <div class="pr-detail-header">
          <div class="pr-detail-header-left">
            <button @click="closeProviderDetail" class="pr-back-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div>
              <h3 class="pr-detail-title">{{ detailProvider.providerName }}</h3>
              <p class="pr-detail-sub">Individual credit claims · {{ reportFromDate }} – {{ reportToDate }}</p>
            </div>
          </div>
          <div class="pr-detail-header-right">
            <span class="pr-detail-count">{{ detailTotal }} claim{{ detailTotal !== 1 ? 's' : '' }}</span>
            <button @click="closeProviderDetail" class="pr-close-text">✕ Close</button>
          </div>
        </div>

        <div v-if="detailLoading" class="pr-detail-loading">
          <div class="pr-spinner"></div>
          <p>Loading claims...</p>
        </div>

        <div v-else-if="detailSelectedRow">
          <CreditClaimDetail :row="detailSelectedRow" @back="backFromClaimDetail" />
        </div>

        <div v-else-if="detailClaims.length === 0" class="pr-detail-empty">
          <span>📭</span>
          <p>No individual claims found</p>
          <p class="pr-detail-empty-sub">Try adjusting the date range or institution filter.</p>
        </div>

        <div v-else>
          <div class="pr-table-scroll">
            <table class="pr-table">
              <thead>
                <tr>
                  <th class="pr-th" style="width:50px">#</th>
                  <th class="pr-th">Insured</th>
                  <th class="pr-th">Institution</th>
                  <th class="pr-th">Provided Date</th>
                  <th class="pr-th pr-th-right">Amount</th>
                  <th class="pr-th pr-th-center">Status</th>
                  <th class="pr-th pr-th-center">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(claim, idx) in detailClaims"
                  :key="claim.serviceProvidedUuid || idx"
                  class="pr-tr"
                >
                  <td class="pr-td pr-text-muted">{{ (detailPage - 1) * detailLimit + idx + 1 }}</td>
                  <td class="pr-td pr-font-medium">{{ claim.insuredName || claim.dependantName || '-' }}</td>
                  <td class="pr-td pr-text-muted">{{ claim.institutionName || '-' }}</td>
                  <td class="pr-td pr-text-muted">{{ secondDateFormat(claim.providedDate) }}</td>
                  <td class="pr-td pr-td-right pr-amount-val">{{ formatCurrency(claim.amount) }}</td>
                  <td class="pr-td pr-td-center">
                    <span class="pr-status-badge" :class="{
                      'pr-status-pending': claim.serviceClaimStatus === 'PENDING',
                      'pr-status-approved': claim.serviceClaimStatus === 'APPROVED',
                      'pr-status-rejected': claim.serviceClaimStatus === 'REJECTED',
                      'pr-status-default': !['PENDING','APPROVED','REJECTED'].includes(claim.serviceClaimStatus),
                    }">{{ claim.serviceClaimStatus || '-' }}</span>
                  </td>
                  <td class="pr-td pr-td-center">
                    <button @click="viewClaimDetail(claim)" class="pr-detail-btn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                      Details
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pagination -->
          <div v-if="detailTotalPages > 1" class="pr-pagination">
            <p class="pr-pagination-info">Page {{ detailPage }} of {{ detailTotalPages }} · {{ detailTotal }} total</p>
            <div class="pr-pagination-btns">
              <button :disabled="detailPage <= 1" @click="fetchProviderDetails(detailProvider, detailPage - 1)" class="pr-page-btn">← Prev</button>
              <button :disabled="detailPage >= detailTotalPages" @click="fetchProviderDetails(detailProvider, detailPage + 1)" class="pr-page-btn">Next →</button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </DefaultPage>
</template>

<style scoped>
/* KPI Strip */
.pr-kpi-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  width: 100%;
  box-sizing: border-box;
}
.pr-kpi-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 16px;
  border: 1px solid transparent;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;
  min-width: 0;
}
.pr-kpi-card::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.04;
  background: radial-gradient(circle at top right, #fff, transparent);
}
.pr-kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
.pr-kpi-indigo { background: linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary))); border-color: rgb(var(--primary-hover)); }
.pr-kpi-emerald { background: linear-gradient(135deg, rgb(var(--success)), rgb(var(--success))); border-color: rgb(var(--success-strong)); }
.pr-kpi-violet { background: linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary))); border-color: rgb(var(--primary-hover)); }
.pr-kpi-icon-wrap {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: rgba(255,255,255,0.2);
}
.pr-kpi-icon-wrap svg { width: 22px; height: 22px; color: #fff; }
.pr-kpi-label { font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pr-kpi-value { font-size: 20px; font-weight: 800; color: #fff; line-height: 1.2; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pr-kpi-sub { font-size: 11px; color: rgba(255,255,255,0.6); }

/* Filter Card */
.pr-filter-card {
  background: #fff;
  border: 1px solid rgb(var(--line));
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  margin-bottom: 20px;
  width: 100%;
  box-sizing: border-box;
}
.pr-filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgb(var(--surface-muted));
}
.pr-filter-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: rgb(var(--ink-muted));
}
.pr-filter-title svg { width: 16px; height: 16px; color: rgb(var(--primary)); }
.pr-export-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  height: 38px;
  background: rgb(var(--primary));
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 2px 8px rgb(var(--primary) / 0.25);
}
.pr-export-btn:hover:not(:disabled) { background: rgb(var(--primary-hover)); transform: translateY(-1px); box-shadow: 0 4px 12px rgb(var(--primary) / 0.3); }
.pr-export-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.pr-export-btn svg { width: 16px; height: 16px; }
.pr-spin { animation: pr-spin 0.8s linear infinite; }
@keyframes pr-spin { to { transform: rotate(360deg); } }
.pr-filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  align-items: end;
  width: 100%;
  box-sizing: border-box;
}
.pr-filter-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.pr-field-label { font-size: 11px; font-weight: 700; color: rgb(var(--ink-muted)); text-transform: uppercase; letter-spacing: 0.05em; }
.pr-date-input {
  height: 40px;
  padding: 0 12px;
  border: 1.5px solid rgb(var(--line));
  border-radius: 8px;
  font-size: 14px;
  color: rgb(var(--ink));
  background: #fff;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
}
.pr-date-input:focus { border-color: rgb(var(--primary)); box-shadow: 0 0 0 3px rgb(var(--primary) / 0.1); }

/* Loading / Empty */
.pr-loading, .pr-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 24px;
  background: #fff;
  border: 1px solid rgb(var(--line));
  border-radius: 16px;
  color: rgb(var(--ink-muted));
  font-size: 14px;
  font-weight: 500;
}
.pr-spinner {
  width: 36px; height: 36px;
  border: 3px solid rgb(var(--primary) / 0.1);
  border-top-color: rgb(var(--primary));
  border-radius: 50%;
  animation: pr-spin 0.7s linear infinite;
}
.pr-empty-icon { font-size: 48px; }
.pr-empty-title { font-size: 16px; font-weight: 700; color: rgb(var(--ink)); margin: 0; }
.pr-empty-sub { font-size: 13px; color: rgb(var(--ink-subtle)); text-align: center; margin: 0; }

/* Content */
.pr-content { display: flex; flex-direction: column; gap: 20px; }
.pr-charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

/* Table Card */
.pr-table-card {
  background: #fff;
  border: 1px solid rgb(var(--line));
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.pr-table-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 18px 20px;
  border-bottom: 1px solid rgb(var(--surface-muted));
  background: linear-gradient(180deg, rgb(var(--primary) / 0.05) 0%, #fff 100%);
}
.pr-table-title { font-size: 15px; font-weight: 700; color: rgb(var(--ink)); margin: 0 0 2px; }
.pr-table-sub { font-size: 12px; color: rgb(var(--ink-subtle)); margin: 0; }
.pr-record-badge {
  padding: 4px 12px;
  background: rgb(var(--primary) / 0.1);
  color: rgb(var(--primary-hover));
  font-size: 12px;
  font-weight: 700;
  border-radius: 9999px;
  white-space: nowrap;
}
.pr-table-scroll {
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100vh - 400px);
  min-height: 240px;
  scrollbar-width: thin;
  scrollbar-color: rgb(var(--line-strong)) rgb(var(--surface-muted));
}
.pr-table { width: 100%; border-collapse: collapse; min-width: 600px; }
.pr-th {
  padding: 12px 16px;
  background: rgb(var(--surface-muted));
  font-size: 11px;
  font-weight: 700;
  color: rgb(var(--ink-muted));
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgb(var(--line));
  text-align: left;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
}
.pr-th-right { text-align: right; }
.pr-th-center { text-align: center; }
.pr-tr { transition: background 0.15s; }
.pr-tr:hover { background: rgb(var(--primary) / 0.05); }
.pr-td {
  padding: 14px 16px;
  border-bottom: 1px solid rgb(var(--surface-muted));
  font-size: 13px;
  color: rgb(var(--ink-muted));
}
.pr-td-right { text-align: right; }
.pr-td-center { text-align: center; }
.pr-text-muted { color: rgb(var(--ink-muted)); }
.pr-font-medium { font-weight: 600; color: rgb(var(--ink)); }

.pr-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px; height: 28px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
}
.pr-rank-gold { background: rgb(var(--warning-soft)); color: rgb(var(--warning-strong)); }
.pr-rank-silver { background: rgb(var(--surface-muted)); color: rgb(var(--ink-muted)); }
.pr-rank-bronze { background: rgb(var(--warning-soft)); color: rgb(var(--warning-strong)); }
.pr-rank-plain { background: rgb(var(--surface-muted)); color: rgb(var(--ink-subtle)); }

.pr-provider-cell { display: flex; align-items: center; gap: 10px; }
.pr-provider-avatar {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgb(var(--primary) / 0.1), rgb(var(--primary) / 0.3));
  color: rgb(var(--primary));
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pr-provider-name { font-weight: 600; color: rgb(var(--ink)); }
.pr-credits-val { color: rgb(var(--success)); font-weight: 600; }
.pr-amount-val { color: rgb(var(--primary)); font-weight: 700; }

.pr-view-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary)));
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 2px 6px rgb(var(--primary) / 0.2);
}
.pr-view-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgb(var(--primary) / 0.3); }
.pr-view-btn svg { width: 14px; height: 14px; }

/* Detail Panel */
.pr-detail-panel {
  background: #fff;
  border: 2px solid rgb(var(--primary) / 0.3);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgb(var(--primary) / 0.1);
  animation: pr-slide-up 0.3s ease;
}
@keyframes pr-slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.pr-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgb(var(--primary) / 0.05), rgb(var(--primary) / 0.1));
  border-bottom: 1px solid rgb(var(--primary) / 0.3);
}
.pr-detail-header-left { display: flex; align-items: center; gap: 12px; }
.pr-back-btn {
  width: 32px; height: 32px;
  background: #fff;
  border: 1.5px solid rgb(var(--primary) / 0.3);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  color: rgb(var(--primary));
  flex-shrink: 0;
}
.pr-back-btn:hover { background: rgb(var(--primary)); color: #fff; }
.pr-back-btn svg { width: 15px; height: 15px; }
.pr-detail-title { font-size: 14px; font-weight: 700; color: rgb(var(--primary-hover)); margin: 0 0 2px; }
.pr-detail-sub { font-size: 12px; color: rgb(var(--primary)); margin: 0; }
.pr-detail-header-right { display: flex; align-items: center; gap: 12px; }
.pr-detail-count {
  padding: 4px 12px;
  background: #fff;
  border: 1.5px solid rgb(var(--primary) / 0.3);
  color: rgb(var(--primary));
  font-size: 12px;
  font-weight: 700;
  border-radius: 9999px;
}
.pr-close-text { font-size: 12px; font-weight: 600; color: rgb(var(--primary)); cursor: pointer; background: none; border: none; }
.pr-close-text:hover { color: rgb(var(--primary)); }
.pr-detail-loading, .pr-detail-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 60px 24px;
  color: rgb(var(--ink-muted)); font-size: 14px;
}
.pr-detail-empty span { font-size: 36px; }
.pr-detail-empty-sub { font-size: 12px; color: rgb(var(--ink-subtle)); }

.pr-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.pr-status-pending { background: rgb(var(--warning-soft)); color: rgb(var(--warning-strong)); }
.pr-status-approved { background: rgb(var(--success-soft)); color: rgb(var(--success-strong)); }
.pr-status-rejected { background: rgb(var(--error-soft)); color: rgb(var(--error-strong)); }
.pr-status-default { background: rgb(var(--primary) / 0.1); color: rgb(var(--primary-hover)); }

.pr-detail-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: rgb(var(--primary) / 0.05);
  color: rgb(var(--primary));
  border: 1.5px solid rgb(var(--primary) / 0.3);
  border-radius: 7px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.pr-detail-btn:hover { background: rgb(var(--primary)); color: #fff; border-color: rgb(var(--primary)); }
.pr-detail-btn svg { width: 12px; height: 12px; }

.pr-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgb(var(--surface-muted));
  border-top: 1px solid rgb(var(--surface-muted));
}
.pr-pagination-info { font-size: 12px; color: rgb(var(--ink-muted)); }
.pr-pagination-btns { display: flex; gap: 8px; }
.pr-page-btn {
  padding: 6px 14px;
  background: #fff;
  border: 1.5px solid rgb(var(--line));
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: rgb(var(--ink-muted));
  cursor: pointer;
  transition: all 0.15s;
}
.pr-page-btn:hover:not(:disabled) { background: rgb(var(--primary) / 0.05); border-color: rgb(var(--primary) / 0.3); color: rgb(var(--primary)); }
.pr-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

@media (max-width: 900px) {
  .pr-kpi-strip { grid-template-columns: 1fr; }
  .pr-filter-grid { grid-template-columns: 1fr 1fr; }
  .pr-charts-row { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .pr-filter-grid { grid-template-columns: 1fr; }
}
</style>
