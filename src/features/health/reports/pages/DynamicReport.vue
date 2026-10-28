<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import DefaultPage from '@/components/DefaultPage.vue';
import { getReportsList, executeReport } from '@/features/shared/analytics/api/analyticsApi';
import ReportParamForm from '@/features/shared/analytics/components/ReportParamForm.vue';
import ReportResultTable from '@/features/shared/analytics/components/ReportResultTable.vue';

const route = useRoute();

interface ReportDefinition {
  reportUuid: string;
  name: string;
  description: string;
  category: string;
  parameters: string;
}

interface ParsedParam {
  name: string;
  label: string;
  type: 'DATE' | 'TEXT' | 'SELECT';
  required?: boolean;
  options?: string[];
}

const reportsList = ref<ReportDefinition[]>([]);
const reportsListLoading = ref(false);
const reportsListError = ref('');

const selectedCategoryFilter = ref<string>('ALL');
const selectedReportUuid = ref<string>('');

const selectedReport = ref<ReportDefinition | null>(null);
const selectedReportParams = computed<ParsedParam[]>(() => {
  if (!selectedReport.value?.parameters) return [];
  try { return JSON.parse(selectedReport.value.parameters) as ParsedParam[]; }
  catch { return []; }
});

const dynLoading = ref(false);
const dynColumns = ref<string[]>([]);
const dynRows = ref<Record<string, any>[]>([]);
const dynPage = ref(0);
const dynPageSize = ref(25);
const dynTotalElements = ref(0);
const dynTotalPages = ref(0);
const dynHasRun = ref(false);
const dynLastParams = ref<Record<string, string>>({});
const dynExporting = ref(false);

const showFilters = ref(false);

const activeFilterCount = computed(() => {
  return Object.values(dynLastParams.value).filter(v => v !== '' && v !== null && v !== undefined).length;
});

const categoryConfig: Record<string, { color: string; bg: string; icon: string; accent: string }> = {
  POLICY:  { color: 'rgb(var(--primary))', bg: 'rgb(var(--primary) / 0.1)', icon: '📋', accent: 'rgb(var(--primary))' },
  CLAIMS:  { color: '#0891b2', bg: 'rgba(8,145,178,0.1)',  icon: '🏥', accent: '#0891b2' },
  FINANCE: { color: 'rgb(var(--success))', bg: 'rgb(var(--success) / 0.1)',  icon: '💰', accent: 'rgb(var(--success))' },
};

function getCategoryStyle(category: string) {
  return categoryConfig[category] || { color: 'rgb(var(--ink-muted))', bg: 'rgb(var(--ink-muted) / 0.1)', icon: '📄', accent: 'rgb(var(--ink-muted))' };
}

const groupedReports = computed(() => {
  const groups: Record<string, ReportDefinition[]> = {};
  reportsList.value.forEach(r => {
    if (!groups[r.category]) groups[r.category] = [];
    groups[r.category].push(r);
  });
  return groups;
});

const filteredReportsList = computed(() => {
  if (selectedCategoryFilter.value === 'ALL') return reportsList.value;
  return reportsList.value.filter(r => r.category === selectedCategoryFilter.value);
});

function handleCategoryChange(cat: string) {
  selectedCategoryFilter.value = cat;
  const reports = filteredReportsList.value;
  if (reports.length > 0 && (!selectedReport.value || !reports.some(r => r.reportUuid === selectedReport.value?.reportUuid))) {
    selectReport(reports[0]);
  }
}

function handleReportSelectChange(uuid: string) {
  const r = reportsList.value.find(rep => rep.reportUuid === uuid);
  if (r) selectReport(r);
}

const dynKpis = computed(() => {
  if (!dynRows.value.length) return [];
  const kpiList: { label: string; value: string; icon: string; color: string }[] = [];
  const premiumKey = dynColumns.value.find(c => c.toLowerCase().includes('premium'));
  if (premiumKey) {
    const total = dynRows.value.reduce((s, r) => s + (parseFloat(String(r[premiumKey]).replace(/,/g, '')) || 0), 0);
    kpiList.push({ label: 'Total Premium', value: total.toLocaleString('en-US', { maximumFractionDigits: 0 }), icon: '💰', color: 'rgb(var(--primary))' });
  }
  const membersKey = dynColumns.value.find(c => c.toLowerCase() === 'total members');
  if (membersKey) {
    const total = dynRows.value.reduce((s, r) => s + (parseFloat(String(r[membersKey]).replace(/,/g, '')) || 0), 0);
    kpiList.push({ label: 'Total Members', value: total.toLocaleString(), icon: '👥', color: '#0891b2' });
  }
  const claimsKey = dynColumns.value.find(c => c.toLowerCase() === 'total claims');
  if (claimsKey) {
    const total = dynRows.value.reduce((s, r) => s + (parseFloat(String(r[claimsKey]).replace(/,/g, '')) || 0), 0);
    kpiList.push({ label: 'Total Claims', value: total.toLocaleString('en-US', { maximumFractionDigits: 0 }), icon: '📊', color: 'rgb(var(--error))' });
  }
  const lrKey = dynColumns.value.find(c => c.toLowerCase().includes('loss ratio'));
  if (lrKey) {
    const vals = dynRows.value.map(r => parseFloat(String(r[lrKey]).replace('%', ''))).filter(v => !isNaN(v));
    if (vals.length) {
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
      kpiList.push({ label: 'Avg Loss Ratio', value: `${avg.toFixed(1)}%`, icon: '📉', color: avg > 90 ? 'rgb(var(--error))' : avg > 70 ? 'rgb(var(--warning))' : 'rgb(var(--success))' });
    }
  }
  kpiList.push({ label: 'Records Found', value: dynTotalElements.value.toLocaleString(), icon: '🗂️', color: '#7c3aed' });
  return kpiList;
});

async function loadReportsList() {
  reportsListLoading.value = true;
  reportsListError.value = '';
  try {
    const res = await getReportsList();
    reportsList.value = Array.isArray(res) ? res : res?.data || res?.content || [];
    // If navigated from Analytics with a specific reportUuid, pre-select it
    const targetUuid = route.query.reportUuid as string | undefined;
    if (targetUuid) {
      const match = reportsList.value.find(r => r.reportUuid === targetUuid);
      if (match) { selectReport(match); return; }
    }
    if (reportsList.value.length > 0 && !selectedReport.value) {
      selectReport(reportsList.value[0]);
    }
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
  selectedReportUuid.value = report.reportUuid;
  dynHasRun.value = false;
  dynColumns.value = [];
  dynRows.value = [];
  dynPage.value = 0;
  dynTotalElements.value = 0;
  dynTotalPages.value = 0;
  dynLastParams.value = {};
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
    dynPage.value = data?.page != null ? data.page - 1 : page;
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

function handlePageChange(newPage: number) { runReport(dynLastParams.value, newPage); }
function handlePageSizeChange(size: number) {
  dynPageSize.value = size;
  runReport(dynLastParams.value, 0);
}

async function exportDynReport() {
  if (!selectedReport.value || dynExporting.value || !dynColumns.value.length) return;
  dynExporting.value = true;
  try {
    const res = await executeReport(selectedReport.value.reportUuid, dynLastParams.value, 0, 10000);
    const columns: string[] = res?.columns || dynColumns.value;
    const allRows: Record<string, any>[] = res?.data?.content || dynRows.value;
    if (!allRows.length) return;

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');
    const colCount = columns.length;

    sheet.mergeCells(1, 1, 1, colCount);
    const titleCell = sheet.getCell('A1');
    titleCell.value = selectedReport.value.name;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 32;

    const headerRow = sheet.addRow(columns);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF6366F1' } } };
    });
    sheet.getRow(2).height = 28;

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

onMounted(() => { loadReportsList(); });
</script>

<template>
  <DefaultPage :hideSearch="true" title="Dynamic Reports" subtitle="Configure and execute data-driven reports">

    <!-- Loading splash -->
    <div v-if="reportsListLoading" class="dr-splash">
      <div class="dr-splash-spinner"></div>
      <p>Loading available reports...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="reportsListError" class="dr-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      </svg>
      <p>{{ reportsListError }}</p>
      <button @click="loadReportsList" class="dr-retry-btn">↺ Retry</button>
    </div>

    <div v-else class="dr-root">

      <!-- Premium Top Control Card (Category Tabs + Report Dropdown + Active Report Banner) -->
      <div class="dr-top-card">
        <div class="dr-top-controls">
          <!-- Category Tabs -->
          <div class="dr-cat-tabs">
            <button
              class="dr-cat-tab"
              :class="{ 'dr-cat-tab--active': selectedCategoryFilter === 'ALL' }"
              @click="handleCategoryChange('ALL')"
            >
              All ({{ reportsList.length }})
            </button>
            <button
              v-for="(_, cat) in groupedReports"
              :key="cat"
              class="dr-cat-tab"
              :class="{ 'dr-cat-tab--active': selectedCategoryFilter === cat }"
              @click="handleCategoryChange(cat as string)"
            >
              <span class="dr-cat-dot" :style="{ background: getCategoryStyle(cat as string).color }"></span>
              {{ getCategoryStyle(cat as string).icon }} {{ cat }}
            </button>
          </div>

          <!-- Report Selector Dropdown -->
          <div class="dr-select-container">
            <label class="dr-select-lbl">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Report:
            </label>
            <div class="dr-select-wrapper">
              <select
                :value="selectedReportUuid"
                @change="e => handleReportSelectChange((e.target as HTMLSelectElement).value)"
                class="dr-report-dropdown"
              >
                <option value="" disabled>-- Select a Report --</option>
                <template v-if="selectedCategoryFilter === 'ALL'">
                  <optgroup
                    v-for="(reports, cat) in groupedReports"
                    :key="cat"
                    :label="`${getCategoryStyle(cat as string).icon} ${cat}`"
                  >
                    <option v-for="r in reports" :key="r.reportUuid" :value="r.reportUuid">
                      {{ r.name }}
                    </option>
                  </optgroup>
                </template>
                <template v-else>
                  <option v-for="r in filteredReportsList" :key="r.reportUuid" :value="r.reportUuid">
                    {{ r.name }}
                  </option>
                </template>
              </select>
              <div class="dr-select-chevron">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Report Info Banner with Small KPI Cards -->
        <div v-if="selectedReport" class="dr-banner-strip">
          <div class="dr-banner-title-row">
            <div class="dr-banner-title-left">
              <span
                class="dr-banner-badge"
                :style="{ color: getCategoryStyle(selectedReport.category).color, background: getCategoryStyle(selectedReport.category).bg }"
              >
                {{ getCategoryStyle(selectedReport.category).icon }} {{ selectedReport.category }}
              </span>
              <h2 class="dr-banner-name">{{ selectedReport.name }}</h2>
            </div>
            <button
              class="dr-filter-toggle-btn"
              :class="{ 'dr-filter-toggle-btn--active': showFilters }"
              @click="showFilters = !showFilters"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 5.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
              <span>{{ showFilters ? 'Hide Filters' : 'Show Filters' }}</span>
              <span v-if="activeFilterCount > 0" class="dr-active-badge">{{ activeFilterCount }}</span>
            </button>
          </div>
          <p v-if="selectedReport.description" class="dr-banner-desc">
            {{ selectedReport.description }}
          </p>

          <!-- Small KPI Cards integrated directly with top header -->
          <div v-if="dynHasRun && dynKpis.length > 0" class="dr-kpi-grid">
            <div v-for="kpi in dynKpis" :key="kpi.label" class="dr-kpi-card">
              <div class="dr-kpi-icon-wrap" :style="{ color: kpi.color }">{{ kpi.icon }}</div>
              <div class="dr-kpi-info">
                <div class="dr-kpi-val" :style="{ color: kpi.color }">{{ kpi.value }}</div>
                <div class="dr-kpi-lbl">{{ kpi.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty selection state -->
      <div v-if="!selectedReport" class="dr-empty-select">
        <div class="dr-empty-graphic">
          <svg viewBox="0 0 80 80" fill="none">
            <circle class="fill-primary/5" cx="40" cy="40" r="38"/>
            <rect class="fill-primary/10 stroke-primary" x="22" y="16" width="36" height="48" rx="6" stroke-width="2"/>
            <path class="stroke-primary" d="M30 30h20M30 38h20M30 46h12" stroke-width="2" stroke-linecap="round"/>
            <circle class="fill-primary" cx="58" cy="60" r="14"/>
            <path d="M54 60l3 3 6-6" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="dr-empty-title">Select a Report to Get Started</p>
        <p class="dr-empty-sub">Choose a report from the dropdown above to configure filters and view data.</p>
      </div>

      <!-- Report panel -->
      <div v-else class="dr-report-panel">

        <!-- Params + run form -->
        <div class="dr-params-card" :class="{ 'dr-params-card--collapsed': !showFilters }">
          <div class="dr-params-header" @click="showFilters = !showFilters">
            <div class="dr-params-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
              <span>Filters & Parameters</span>
              <span v-if="activeFilterCount > 0" class="dr-active-badge">{{ activeFilterCount }} active</span>
            </div>
            <div class="dr-params-toggle-action">
              <span class="dr-params-toggle-text">{{ showFilters ? 'Hide Filters' : 'Show Filters' }}</span>
              <svg class="dr-params-chevron" :class="{ 'dr-params-chevron--open': showFilters }" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>
          <Transition name="dr-slide">
            <div v-show="showFilters" class="dr-params-body">
              <ReportParamForm
                :parameters="selectedReportParams"
                :loading="dynLoading"
                @submit="(params) => runReport(params, 0)"
              />
            </div>
          </Transition>
        </div>

        <!-- Results table -->
        <div v-if="dynHasRun" class="dr-results-card">
          <div class="dr-results-header">
            <div>
              <h3 class="dr-results-title">Results</h3>
              <p class="dr-results-sub" v-if="!dynLoading">
                <strong>{{ dynTotalElements.toLocaleString() }}</strong> record{{ dynTotalElements !== 1 ? 's' : '' }} · {{ dynColumns.length }} dynamic columns
              </p>
            </div>
            <div class="dr-results-actions" v-if="dynRows.length > 0">
              <button
                class="dr-export-btn"
                :class="{ 'dr-export-btn--busy': dynExporting }"
                :disabled="dynExporting || dynLoading"
                @click="exportDynReport"
              >
                <svg v-if="!dynExporting" viewBox="0 0 24 24" fill="none">
                  <rect class="fill-success" x="2" y="3" width="20" height="18" rx="2" opacity="0.15"/>
                  <path class="stroke-success" d="M14 3v4a1 1 0 001 1h4" stroke-width="1.5" stroke-linecap="round"/>
                  <path class="stroke-success" d="M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" stroke-width="1.5" stroke-linejoin="round"/>
                  <path class="stroke-success" d="M9 17l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span class="dr-export-spin" v-else></span>
                {{ dynExporting ? 'Exporting…' : 'Export Excel' }}
              </button>
            </div>
          </div>

          <div class="dr-results-body">
            <ReportResultTable
              :columns="dynColumns"
              :rows="dynRows"
              :page="dynPage"
              :page-size="dynPageSize"
              :total-elements="dynTotalElements"
              :total-pages="dynTotalPages"
              :loading="dynLoading"
              :storage-key="selectedReport?.reportUuid"
              @page-change="handlePageChange"
              @page-size-change="handlePageSizeChange"
            />
          </div>
        </div>
      </div>
    </div>

  </DefaultPage>
</template>

<style scoped>
/* Layout */
.dr-root {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

/* Splash / Error */
.dr-splash, .dr-error {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 14px; padding: 60px 20px;
  background: rgb(var(--surface)); border: 1px solid rgb(var(--line)); border-radius: 14px;
  color: rgb(var(--ink-muted)); font-size: 13px; font-weight: 500;
}
.dr-splash-spinner {
  width: 32px; height: 32px;
  border: 3px solid rgb(var(--primary) / 0.1); border-top-color: rgb(var(--primary));
  border-radius: 50%;
  animation: dr-spin 0.7s linear infinite;
}
@keyframes dr-spin { to { transform: rotate(360deg); } }
.dr-error { color: rgb(var(--error)); }
.dr-error svg { width: 40px; height: 40px; opacity: 0.6; }
.dr-retry-btn {
  padding: 7px 18px; border-radius: 7px;
  background: rgb(var(--primary)); color: #fff;
  font-size: 12.5px; font-weight: 600; border: none; cursor: pointer;
  transition: background 0.15s;
}
.dr-retry-btn:hover { background: rgb(var(--primary)); }

/* ─────────────────────────────────────────────────────────
   PREMIUM TOP CONTROL CARD
───────────────────────────────────────────────────────── */
.dr-top-card {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgb(var(--surface));
  border: 1px solid rgb(var(--line));
  border-radius: 12px;
  padding: 10px 14px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.03);
  width: 100%;
  box-sizing: border-box;
}

.dr-top-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
}

/* Category Tabs */
.dr-cat-tabs {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.dr-cat-tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 600;
  color: rgb(var(--ink-muted));
  background: rgb(var(--surface-muted));
  border: 1px solid rgb(var(--line));
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
}
.dr-cat-tab:hover {
  background: rgb(var(--surface-muted));
  color: rgb(var(--ink));
}
.dr-cat-tab--active {
  background: linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-hover))) !important;
  color: #fff !important;
  border-color: rgb(var(--primary-hover)) !important;
  box-shadow: 0 3px 10px rgb(var(--primary) / 0.28);
}

.dr-cat-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Dropdown Container */
.dr-select-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  max-width: 440px;
  min-width: 240px;
}

.dr-select-lbl {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: rgb(var(--ink-muted));
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}
.dr-select-lbl svg { width: 14px; height: 14px; color: rgb(var(--primary)); }

.dr-select-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.dr-report-dropdown {
  width: 100%;
  height: 36px;
  padding: 0 32px 0 12px;
  border: 1.5px solid rgb(var(--line-strong));
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  color: rgb(var(--ink));
  background: rgb(var(--surface));
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
.dr-report-dropdown:focus {
  border-color: rgb(var(--primary));
  box-shadow: 0 0 0 3px rgb(var(--primary) / 0.15);
}

.dr-select-chevron {
  position: absolute;
  right: 10px;
  pointer-events: none;
  display: flex;
  align-items: center;
  color: rgb(var(--ink-muted));
}
.dr-select-chevron svg { width: 15px; height: 15px; }

/* Banner Strip for Active Report */
.dr-banner-strip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgb(var(--surface-muted)) 0%, rgb(var(--surface-muted)) 100%);
  border: 1px solid rgb(var(--line));
  border-radius: 8px;
}

.dr-banner-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.dr-banner-title-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dr-filter-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 700;
  color: rgb(var(--ink-muted));
  background: rgb(var(--surface));
  border: 1.5px solid rgb(var(--line-strong));
  cursor: pointer;
  transition: all 0.18s ease;
}
.dr-filter-toggle-btn:hover {
  background: rgb(var(--surface-muted));
  border-color: rgb(var(--primary));
  color: rgb(var(--primary));
}
.dr-filter-toggle-btn--active {
  background: rgb(var(--primary) / 0.1);
  border-color: rgb(var(--primary));
  color: rgb(var(--primary-hover));
}
.dr-filter-toggle-btn svg { width: 14px; height: 14px; }

.dr-active-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 6px;
  background: rgb(var(--primary));
  color: #fff;
  font-size: 9.5px;
  font-weight: 800;
  border-radius: 9999px;
  line-height: 1.2;
}

.dr-banner-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 9.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dr-banner-name {
  font-size: 14px;
  font-weight: 800;
  color: rgb(var(--ink));
  margin: 0;
  line-height: 1.2;
}

.dr-banner-desc {
  font-size: 11.5px;
  color: rgb(var(--ink-muted));
  margin: 0;
  line-height: 1.35;
}

/* Empty select state */
.dr-empty-select {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 32px 24px;
  background: rgb(var(--surface)); border: 1px solid rgb(var(--line)); border-radius: 10px;
}
.dr-empty-graphic svg { width: 56px; height: 56px; }
.dr-empty-title { font-size: 15px; font-weight: 700; color: rgb(var(--ink)); margin: 0; }
.dr-empty-sub { font-size: 12px; color: rgb(var(--ink-subtle)); text-align: center; max-width: 300px; margin: 0; line-height: 1.5; }

/* Report Panel */
.dr-report-panel {
  display: flex; flex-direction: column; gap: 10px;
  flex: 1; min-height: 0; overflow: hidden;
  width: 100%; max-width: 100%; min-width: 0;
  animation: dr-fade-up 0.25s ease;
}
@keyframes dr-fade-up {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Params card */
.dr-params-card {
  flex-shrink: 0;
  background: rgb(var(--surface)); border: 1px solid rgb(var(--line)); border-radius: 10px;
  padding: 8px 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box;
  transition: all 0.2s ease;
}
.dr-params-card:hover {
  border-color: rgb(var(--line-strong));
}
.dr-params-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  padding: 2px 0;
}
.dr-params-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700; color: rgb(var(--ink-muted));
  text-transform: uppercase; letter-spacing: 0.05em;
  margin-bottom: 0; padding-bottom: 0;
  border-bottom: none;
}
.dr-params-label svg { width: 14px; height: 14px; color: rgb(var(--primary)); }

.dr-params-toggle-action {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: rgb(var(--primary));
}
.dr-params-toggle-text {
  font-size: 11.5px;
  font-weight: 600;
}
.dr-params-chevron {
  width: 16px;
  height: 16px;
  transition: transform 0.25s ease;
  color: rgb(var(--primary));
}
.dr-params-chevron--open {
  transform: rotate(180deg);
}

.dr-params-body {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgb(var(--surface-muted));
}

/* Slide Transition for Filters */
.dr-slide-enter-active,
.dr-slide-leave-active {
  transition: all 0.25s ease-out;
  overflow: hidden;
}
.dr-slide-enter-from,
.dr-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* KPI Row & Filter Button Alongside */
.dr-kpi-row {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  box-sizing: border-box;
}

.dr-kpi-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;
  margin-top: 6px;
}

.dr-kpi-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 48px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  color: rgb(var(--primary));
  background: rgb(var(--surface));
  border: 1.5px solid rgb(var(--line-strong));
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  flex-shrink: 0;
}
.dr-kpi-filter-btn:hover {
  background: rgb(var(--surface-muted));
  border-color: rgb(var(--primary));
  color: rgb(var(--primary-hover));
  box-shadow: 0 3px 8px rgb(var(--primary) / 0.12);
  transform: translateY(-1px);
}
.dr-kpi-filter-btn--active {
  background: linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary-hover))) !important;
  color: #fff !important;
  border-color: rgb(var(--primary-hover)) !important;
  box-shadow: 0 3px 10px rgb(var(--primary) / 0.25) !important;
}
.dr-kpi-filter-btn svg { width: 16px; height: 16px; }

.dr-kpi-card {
  display: flex; align-items: center; gap: 10px;
  background: rgb(var(--surface)); border: 1px solid rgb(var(--line)); border-radius: 10px;
  padding: 8px 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  transition: box-shadow 0.2s, transform 0.2s;
  min-width: 0;
}
.dr-kpi-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); transform: translateY(-1px); }
.dr-kpi-icon-wrap {
  font-size: 16px; width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: rgb(var(--surface-muted)); border-radius: 8px; flex-shrink: 0;
  border: 1px solid rgb(var(--surface-muted));
}
.dr-kpi-info { display: flex; flex-direction: column; min-width: 0; }
.dr-kpi-val { font-size: 15px; font-weight: 800; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dr-kpi-lbl { font-size: 9px; font-weight: 700; color: rgb(var(--ink-subtle)); text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Results card */
.dr-results-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: rgb(var(--surface)); border: 1px solid rgb(var(--line)); border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box;
}
.dr-results-header {
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 14px; border-bottom: 1px solid rgb(var(--surface-muted));
  background: linear-gradient(180deg, rgb(var(--primary) / 0.05) 0%, rgb(var(--surface)) 100%);
}
.dr-results-body {
  padding: 12px 14px 14px;
  min-width: 0;
}
.dr-results-title { font-size: 13px; font-weight: 800; color: rgb(var(--ink)); margin: 0; }
.dr-results-sub { font-size: 11px; color: rgb(var(--ink-subtle)); margin: 0; }
.dr-results-actions { display: flex; align-items: center; gap: 8px; }
.dr-export-btn {
  display: inline-flex; align-items: center; gap: 5px;
  height: 28px; padding: 0 12px 0 8px;
  border-radius: 7px; font-size: 11px; font-weight: 700;
  color: rgb(var(--success-strong)); background: rgb(var(--success-soft)); border: 1.5px solid rgb(var(--success) / 0.3);
  cursor: pointer; transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgb(var(--success) / 0.08);
}
.dr-export-btn:hover:not(:disabled) {
  background: rgb(var(--success-soft)); border-color: rgb(var(--success) / 0.3); color: rgb(var(--success-strong));
  box-shadow: 0 3px 10px rgb(var(--success) / 0.15); transform: translateY(-1px);
}
.dr-export-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.dr-export-btn--busy { color: rgb(var(--ink-muted)) !important; background: rgb(var(--surface-muted)) !important; border-color: rgb(var(--line)) !important; }
.dr-export-btn svg { width: 15px; height: 15px; }
.dr-export-spin {
  width: 13px; height: 13px; flex-shrink: 0;
  border: 2px solid rgb(var(--line-strong)); border-top-color: rgb(var(--ink-muted));
  border-radius: 50%; animation: dr-spin 0.7s linear infinite;
}

@media (max-width: 900px) {
  .dr-top-controls { flex-direction: column; align-items: stretch; }
  .dr-select-container { max-width: 100%; }
  .dr-kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 480px) {
  .dr-kpi-grid { grid-template-columns: 1fr; }
}
</style>
