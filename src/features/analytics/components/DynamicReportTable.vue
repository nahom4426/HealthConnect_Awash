<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { executeReport, type ReportCatalog, type ReportParam, type DynamicReportResponse } from '../api/reportEngineApi';

const props = defineProps<{
  report: ReportCatalog;
}>();

// ─── State ───────────────────────────────────────────
const loading = ref(false);
const error = ref<string | null>(null);
const result = ref<DynamicReportResponse | null>(null);
const filterValues = ref<Record<string, string>>({});
const sortColumn = ref<string | null>(null);
const sortDirection = ref<'asc' | 'desc'>('asc');
const currentPage = ref(1);
const pageSize = ref(50);

// ─── Parsed Params ────────────────────────────────────
const parsedParams = computed<ReportParam[]>(() => {
  try {
    return props.report.parameters ? JSON.parse(props.report.parameters) : [];
  } catch {
    return [];
  }
});

// ─── Pagination info from server ─────────────────────
const totalElements = computed(() => result.value?.data?.totalElements ?? 0);
const totalPages = computed(() => result.value?.data?.totalPages ?? 1);
const isLastPage = computed(() => result.value?.data?.last ?? true);
const rows = computed(() => result.value?.data?.content ?? []);
const columns = computed(() => result.value?.columns ?? []);

// ─── Client-side sort (within current page) ──────────
const displayedRows = computed(() => {
  if (!sortColumn.value) return rows.value;
  const col = sortColumn.value;
  return [...rows.value].sort((a, b) => {
    const av = a[col] ?? '';
    const bv = b[col] ?? '';
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
    return sortDirection.value === 'asc' ? cmp : -cmp;
  });
});

// ─── Methods ──────────────────────────────────────────
async function runReport(page = 1) {
  loading.value = true;
  error.value = null;
  currentPage.value = page;
  try {
    const params: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(filterValues.value)) {
      if (value && value.trim() !== '') {
        params[key] = value;
      }
    }
    result.value = await executeReport(props.report.reportUuid, params, page, pageSize.value);
  } catch (e: unknown) {
    error.value = (e as Error)?.message ?? 'Failed to execute report';
  } finally {
    loading.value = false;
  }
}

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value || loading.value) return;
  runReport(page);
}

function toggleSort(col: string) {
  if (sortColumn.value === col) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = col;
    sortDirection.value = 'asc';
  }
}

function clearFilters() {
  filterValues.value = {};
  result.value = null;
  error.value = null;
  currentPage.value = 1;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
}
</script>

<template>
  <div class="dynamic-report">
    <!-- Header -->
    <div class="report-header">
      <div>
        <h2 class="report-title">{{ report.name }}</h2>
        <p v-if="report.description" class="report-desc">{{ report.description }}</p>
      </div>
      <span class="report-badge">{{ report.category }}</span>
    </div>

    <!-- Filters Panel -->
    <div v-if="parsedParams.length" class="filter-panel">
      <div class="filter-grid">
        <div v-for="param in parsedParams" :key="param.name" class="filter-field">
          <label class="filter-label">
            {{ param.label }}
            <span v-if="param.required" class="required">*</span>
          </label>
          <input v-if="param.type === 'DATE'" v-model="filterValues[param.name]" type="date" class="filter-input" />
          <input v-else-if="param.type === 'NUMBER'" v-model="filterValues[param.name]" type="number" class="filter-input" :placeholder="param.label" />
          <select v-else-if="param.type === 'SELECT'" v-model="filterValues[param.name]" class="filter-input">
            <option value="">All</option>
            <option v-for="opt in param.options" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <input v-else v-model="filterValues[param.name]" type="text" class="filter-input" :placeholder="param.label" />
        </div>

        <!-- Page size selector -->
        <div class="filter-field">
          <label class="filter-label">Rows per page</label>
          <select v-model.number="pageSize" class="filter-input">
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
            <option :value="200">200</option>
            <option :value="500">500</option>
          </select>
        </div>
      </div>
      <div class="filter-actions">
        <button class="btn-primary" :disabled="loading" @click="runReport(1)">
          <span v-if="loading" class="spinner" />
          <span v-else>Run Report</span>
        </button>
        <button class="btn-secondary" @click="clearFilters">Clear</button>
      </div>
    </div>

    <!-- Run button when no filters -->
    <div v-else class="no-filter-run">
      <button class="btn-primary" :disabled="loading" @click="runReport(1)">
        <span v-if="loading" class="spinner" />
        <span v-else>Run Report</span>
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="error-banner">{{ error }}</div>

    <!-- Results -->
    <div v-if="result" class="result-section">
      <!-- Toolbar -->
      <div class="result-toolbar">
        <span class="result-count">
          {{ totalElements.toLocaleString() }} total rows
          <span v-if="totalPages > 1"> · Page {{ currentPage }} of {{ totalPages }}</span>
        </span>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        <table class="report-table">
          <thead>
            <tr>
              <th v-for="col in columns" :key="col" class="th" @click="toggleSort(col)">
                <span>{{ col }}</span>
                <span class="sort-icon">
                  {{ sortColumn === col ? (sortDirection === 'asc' ? '↑' : '↓') : '↕' }}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in displayedRows" :key="i" class="tr">
              <td v-for="col in columns" :key="col" class="td">{{ formatValue(row[col]) }}</td>
            </tr>
            <tr v-if="displayedRows.length === 0">
              <td :colspan="columns.length" class="empty-row">No results found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Server-side Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="currentPage === 1 || loading" @click="goToPage(1)">«</button>
        <button class="page-btn" :disabled="currentPage === 1 || loading" @click="goToPage(currentPage - 1)">‹ Prev</button>

        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>

        <button class="page-btn" :disabled="isLastPage || loading" @click="goToPage(currentPage + 1)">Next ›</button>
        <button class="page-btn" :disabled="isLastPage || loading" @click="goToPage(totalPages)">»</button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading" class="empty-state">
      <p>Set your filters and click <strong>Run Report</strong> to see results.</p>
    </div>
  </div>
</template>

<style scoped>
.dynamic-report { display: flex; flex-direction: column; gap: 1.25rem; }

.report-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.report-title { font-size: 1.15rem; font-weight: 600; color: #1e293b; margin: 0; }
.report-desc { font-size: 0.82rem; color: #64748b; margin: 0.25rem 0 0; }
.report-badge { font-size: 0.72rem; font-weight: 600; background: #e0f2fe; color: #0369a1; padding: 0.2rem 0.6rem; border-radius: 999px; white-space: nowrap; }

.filter-panel { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1rem 1.25rem; }
.filter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem 1rem; }
.filter-field { display: flex; flex-direction: column; gap: 0.3rem; }
.filter-label { font-size: 0.78rem; font-weight: 500; color: #475569; }
.required { color: #ef4444; margin-left: 2px; }
.filter-input { border: 1px solid #cbd5e1; border-radius: 0.4rem; padding: 0.4rem 0.6rem; font-size: 0.85rem; outline: none; background: white; }
.filter-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }
.filter-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; }

.no-filter-run { display: flex; justify-content: flex-start; }
.btn-primary { background: #3b82f6; color: white; border: none; padding: 0.45rem 1.2rem; border-radius: 0.4rem; font-size: 0.85rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 0.45rem 1rem; border-radius: 0.4rem; font-size: 0.85rem; cursor: pointer; }

.spinner { width: 14px; height: 14px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.error-banner { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.6rem 1rem; border-radius: 0.5rem; font-size: 0.85rem; }

.result-section { display: flex; flex-direction: column; gap: 0.75rem; }
.result-toolbar { display: flex; align-items: center; justify-content: space-between; }
.result-count { font-size: 0.82rem; color: #64748b; font-weight: 500; }

.table-wrapper { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 0.6rem; }
.report-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
.th { background: #f1f5f9; padding: 0.55rem 0.85rem; text-align: left; font-weight: 600; color: #374151; white-space: nowrap; cursor: pointer; user-select: none; border-bottom: 1px solid #e2e8f0; }
.th:hover { background: #e2e8f0; }
.sort-icon { margin-left: 0.3rem; color: #94a3b8; font-size: 0.75rem; }
.tr:hover { background: #f8fafc; }
.tr:nth-child(even) { background: #fafafa; }
.td { padding: 0.5rem 0.85rem; color: #374151; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
.empty-row { padding: 2rem; text-align: center; color: #94a3b8; }

.pagination { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
.page-btn { background: white; border: 1px solid #cbd5e1; color: #374151; padding: 0.3rem 0.65rem; border-radius: 0.4rem; cursor: pointer; font-size: 0.82rem; transition: background 0.15s; }
.page-btn:hover:not(:disabled) { background: #f1f5f9; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { font-size: 0.82rem; color: #64748b; padding: 0 0.5rem; }

.empty-state { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 0.75rem; padding: 2.5rem; text-align: center; color: #64748b; font-size: 0.88rem; }
</style>
