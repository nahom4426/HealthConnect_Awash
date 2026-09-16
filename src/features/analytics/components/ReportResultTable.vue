<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  columns: string[];
  rows: Record<string, any>[];
  page: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'page-change', page: number): void;
}>();

// Column Selection & Customization State
const selectedColumns = ref<string[]>([]);
const columnMode = ref<'dual' | 'single'>('dual');
const isColumnMenuOpen = ref(false);
const columnSearchQuery = ref('');

// Sync selectedColumns when props.columns changes
watch(
  () => props.columns,
  (newCols) => {
    if (newCols && newCols.length) {
      selectedColumns.value = [...newCols];
      // Automatically default to dual view if column count > 10
      columnMode.value = newCols.length > 10 ? 'dual' : 'single';
    } else {
      selectedColumns.value = [];
    }
  },
  { immediate: true }
);

function toggleColumn(col: string) {
  if (selectedColumns.value.includes(col)) {
    if (selectedColumns.value.length <= 1) return; // Keep at least 1 column
    selectedColumns.value = selectedColumns.value.filter(c => c !== col);
  } else {
    selectedColumns.value.push(col);
  }
}

function selectTopColumns(count = 10) {
  selectedColumns.value = props.columns.slice(0, count);
}

function selectAllColumns() {
  selectedColumns.value = [...props.columns];
}

function resetColumns() {
  selectedColumns.value = [...props.columns];
  columnMode.value = props.columns.length > 10 ? 'dual' : 'single';
}

const filteredColumnsForMenu = computed(() => {
  if (!columnSearchQuery.value.trim()) return props.columns;
  const q = columnSearchQuery.value.toLowerCase();
  return props.columns.filter(c => c.toLowerCase().includes(q));
});

// Determine if a column is a "loss ratio" type column
function isLossRatioColumn(col: string): boolean {
  return col.toLowerCase().includes('loss ratio') || col.toLowerCase().includes('utilization');
}

// Determine if a column is numeric/currency
function isNumericColumn(col: string): boolean {
  const numericKeywords = ['premium', 'claim', 'amount', 'value', 'assured', 'total', 'paid', 'outstanding', 'rejected', 'count', 'members', 'principals', 'dependents', 'usage'];
  return numericKeywords.some(k => col.toLowerCase().includes(k));
}

// Color code loss ratio value
function lossRatioClass(value: any): string {
  const num = parseFloat(String(value).replace('%', ''));
  if (isNaN(num)) return '';
  if (num < 70) return 'lr-good';
  if (num < 90) return 'lr-warn';
  return 'lr-danger';
}

// Format cell value
function formatCell(col: string, value: any): string {
  if (value === null || value === undefined || value === '') return '—';
  if (isLossRatioColumn(col)) {
    const num = parseFloat(String(value).replace('%', ''));
    return isNaN(num) ? String(value) : `${num.toFixed(2)}%`;
  }
  if (isNumericColumn(col)) {
    const num = parseFloat(String(value));
    if (!isNaN(num)) {
      const lower = col.toLowerCase();
      if (Number.isInteger(num) && (lower.includes('dependent') || lower.includes('count') || lower.includes('member'))) {
        return num.toLocaleString('en-US');
      }
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }
  return String(value);
}

function isBadgeType(col: string, val: any): boolean {
  if (!val) return false;
  const lowerCol = col.toLowerCase();
  const strVal = String(val).toUpperCase();
  if (['gender', 'status', 'type', 'relationship', 'plan type'].some(k => lowerCol.includes(k))) return true;
  return ['ACTIVE', 'INSURED', 'MALE', 'FEMALE', 'DEPENDENT', 'APPROVED', 'PENDING', 'REJECTED'].includes(strVal);
}

function badgeStyleClass(val: any): string {
  const str = String(val).toUpperCase();
  if (['ACTIVE', 'APPROVED', 'MALE'].includes(str)) return 'badge-active';
  if (['FEMALE', 'INSURED'].includes(str)) return 'badge-purple';
  if (['PENDING'].includes(str)) return 'badge-pending';
  if (['REJECTED', 'INACTIVE'].includes(str)) return 'badge-danger';
  return 'badge-neutral';
}

interface ColumnDisplayItem {
  id: string;
  isPair: boolean;
  primaryCol: string;
  secondaryCol?: string;
  headerLabel: string;
}

// 2-in-1 Dual-Data Pairing & Single Column Resolution
const displayColumns = computed<ColumnDisplayItem[]>(() => {
  const activeCols = props.columns.filter(c => selectedColumns.value.includes(c));

  if (columnMode.value === 'single') {
    // Single mode: limit max visible columns to 10 by default if user hasn't filtered down
    const colsToShow = activeCols.length > 10 ? activeCols.slice(0, 10) : activeCols;
    return colsToShow.map(col => ({
      id: col,
      isPair: false,
      primaryCol: col,
      headerLabel: col,
    }));
  }

  // Dual-Data Mode (2-in-1 Pairing)
  const items: ColumnDisplayItem[] = [];
  const used = new Set<string>();

  const knownPairings: [string[], string[]][] = [
    [['full name', 'member name', 'insured name', 'principal'], ['gender', 'phone', 'type', 'relationship', 'status']],
    [['insurance id', 'member id'], ['id number', 'national id', 'status']],
    [['policy holder', 'institution', 'customer name'], ['policy number', 'policy no', 'endorsement number']],
    [['package name', 'plan name', 'package'], ['plan type', 'plan', 'category']],
    [['sum assured', 'allocated', 'total premium'], ['usage', 'paid claims', 'outstanding claims']],
    [['policy period', 'start date'], ['endorsement number', 'end date']],
    [['total principals'], ['total dependents']],
  ];

  for (let i = 0; i < activeCols.length; i++) {
    const col1 = activeCols[i];
    if (used.has(col1)) continue;

    const lower1 = col1.toLowerCase();
    let pairedCol: string | undefined = undefined;

    // Check known pairing rules
    for (const [primaryList, secondaryList] of knownPairings) {
      if (primaryList.some(p => lower1.includes(p))) {
        const found = activeCols.find(c => !used.has(c) && c !== col1 && secondaryList.some(s => c.toLowerCase().includes(s)));
        if (found) {
          pairedCol = found;
          break;
        }
      }
    }

    // Fallback: Pair with next adjacent unused column if total columns > 8
    if (!pairedCol && activeCols.length > 8 && i + 1 < activeCols.length) {
      const nextCol = activeCols.find((c, idx) => idx > i && !used.has(c));
      if (nextCol && !isLossRatioColumn(nextCol)) {
        pairedCol = nextCol;
      }
    }

    if (pairedCol) {
      used.add(col1);
      used.add(pairedCol);
      items.push({
        id: `${col1}__${pairedCol}`,
        isPair: true,
        primaryCol: col1,
        secondaryCol: pairedCol,
        headerLabel: `${col1} / ${pairedCol}`,
      });
    } else {
      used.add(col1);
      items.push({
        id: col1,
        isPair: false,
        primaryCol: col1,
        headerLabel: col1,
      });
    }
  }

  // Guarantee max 10 table columns
  return items.slice(0, 10);
});

function getColumnStyle(item: ColumnDisplayItem) {
  const count = displayColumns.value.length;
  const pct = Math.max(8, Math.floor(95 / Math.max(1, count)));
  return { width: `${pct}%` };
}

const pageNumbers = computed(() => {
  const total = props.totalPages;
  const current = props.page + 1;
  const pages: (number | '...')[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push('...');
    pages.push(total);
  }
  return pages;
});

function goToPage(p: number | '...') {
  if (typeof p !== 'number') return;
  emit('page-change', p - 1);
}
</script>

<template>
  <div class="report-result-table">
    <!-- Toolbar Strip for Column Customization -->
    <div v-if="columns.length > 0" class="rrt-toolbar">
      <div class="rrt-toolbar-left">
        <!-- View Mode Switch -->
        <div class="rrt-mode-toggle">
          <button
            class="rrt-mode-btn"
            :class="{ 'rrt-mode-btn--active': columnMode === 'dual' }"
            @click="columnMode = 'dual'"
            title="Display 2 data fields per column"
          >
            2-in-1 Dual View
          </button>
          <button
            class="rrt-mode-btn"
            :class="{ 'rrt-mode-btn--active': columnMode === 'single' }"
            @click="columnMode = 'single'"
            title="Display single field per column"
          >
            Single View
          </button>
        </div>

        <span class="rrt-col-info">
          Showing <strong>{{ displayColumns.length }}</strong> columns
          <template v-if="columnMode === 'dual'"> ({{ selectedColumns.length }} fields paired)</template>
        </span>
      </div>

      <div class="rrt-toolbar-right">
        <!-- Column Chooser Button & Popover -->
        <div class="rrt-popover-wrap">
          <button
            class="rrt-picker-btn"
            @click="isColumnMenuOpen = !isColumnMenuOpen"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
            </svg>
            Columns ({{ selectedColumns.length }}/{{ columns.length }})
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="rrt-chev"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>

          <!-- Dropdown Popover Menu -->
          <div v-if="isColumnMenuOpen" class="rrt-popover">
            <div class="rrt-popover-header">
              <span class="rrt-popover-title">Customize Columns</span>
              <button class="rrt-popover-close" @click="isColumnMenuOpen = false">✕</button>
            </div>

            <div class="rrt-popover-presets">
              <button @click="selectTopColumns(10)" class="rrt-preset-chip">Top 10</button>
              <button @click="selectAllColumns" class="rrt-preset-chip">Select All</button>
              <button @click="resetColumns" class="rrt-preset-chip">Reset</button>
            </div>

            <div class="rrt-popover-search">
              <input
                type="text"
                v-model="columnSearchQuery"
                placeholder="Search columns..."
                class="rrt-search-input"
              />
            </div>

            <div class="rrt-popover-list">
              <label
                v-for="col in filteredColumnsForMenu"
                :key="col"
                class="rrt-col-item"
              >
                <input
                  type="checkbox"
                  :checked="selectedColumns.includes(col)"
                  @change="toggleColumn(col)"
                  class="rrt-checkbox"
                />
                <span class="rrt-col-name">{{ col }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="loading-overlay">
      <div class="skeleton-table">
        <div class="skeleton-header">
          <div v-for="i in 5" :key="i" class="skeleton-th" />
        </div>
        <div v-for="r in 8" :key="r" class="skeleton-row">
          <div v-for="c in 5" :key="c" class="skeleton-td" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="rows.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#f3f4f6" />
          <path d="M20 24h24M20 32h18M20 40h12" stroke="#d1d5db" stroke-width="3" stroke-linecap="round"/>
          <circle cx="46" cy="46" r="10" fill="#fef3c7" />
          <path d="M46 42v4M46 48v1" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="empty-title">No data found</p>
      <p class="empty-sub">Try adjusting the report parameters and run again.</p>
    </div>

    <!-- Data table -->
    <div v-else class="table-wrapper">
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th class="th-index" style="width: 28px">#</th>
              <th
                v-for="item in displayColumns"
                :key="item.id"
                :style="getColumnStyle(item)"
                :class="[
                  'th-cell',
                  !item.isPair && isNumericColumn(item.primaryCol) ? 'text-right' : 'text-left'
                ]"
              >
                {{ item.headerLabel }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, idx) in rows"
              :key="idx"
              class="data-row"
              :class="idx % 2 === 0 ? 'row-even' : 'row-odd'"
            >
              <td class="td-index">{{ page * pageSize + idx + 1 }}</td>
              <td
                v-for="item in displayColumns"
                :key="item.id"
                :class="[
                  'td-cell',
                  !item.isPair && isNumericColumn(item.primaryCol) && !isLossRatioColumn(item.primaryCol) ? 'text-right td-numeric' : 'text-left',
                  !item.isPair && isLossRatioColumn(item.primaryCol) ? `td-lr ${lossRatioClass(row[item.primaryCol])}` : ''
                ]"
              >
                <!-- Single field cell -->
                <template v-if="!item.isPair">
                  <span v-if="isLossRatioColumn(item.primaryCol)" :class="['lr-badge', lossRatioClass(row[item.primaryCol])]">
                    {{ formatCell(item.primaryCol, row[item.primaryCol]) }}
                  </span>
                  <span v-else>{{ formatCell(item.primaryCol, row[item.primaryCol]) }}</span>
                </template>

                <!-- Modern 2-in-1 Dual Data cell -->
                <template v-else>
                  <div class="dual-cell">
                    <div class="dual-cell-primary" :title="String(row[item.primaryCol] ?? '')">
                      {{ formatCell(item.primaryCol, row[item.primaryCol]) }}
                    </div>
                    <div v-if="item.secondaryCol" class="dual-cell-secondary" :title="String(row[item.secondaryCol] ?? '')">
                      <span
                        v-if="isBadgeType(item.secondaryCol, row[item.secondaryCol])"
                        :class="['dual-badge', badgeStyleClass(row[item.secondaryCol])]"
                      >
                        {{ row[item.secondaryCol] }}
                      </span>
                      <span v-else class="dual-subtext">
                        {{ formatCell(item.secondaryCol, row[item.secondaryCol]) }}
                      </span>
                    </div>
                  </div>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination-bar" v-if="totalPages > 1">
        <p class="pagination-info">
          Showing {{ page * pageSize + 1 }}–{{ Math.min((page + 1) * pageSize, totalElements) }} of
          <strong>{{ totalElements.toLocaleString() }}</strong> records
        </p>
        <div class="pagination-controls">
          <button
            class="pg-btn"
            :disabled="page <= 0"
            @click="emit('page-change', page - 1)"
          >‹</button>

          <button
            v-for="pg in pageNumbers"
            :key="pg"
            class="pg-btn"
            :class="{ 'pg-active': pg === page + 1, 'pg-ellipsis': pg === '...' }"
            :disabled="pg === '...'"
            @click="goToPage(pg)"
          >{{ pg }}</button>

          <button
            class="pg-btn"
            :disabled="page >= totalPages - 1"
            @click="emit('page-change', page + 1)"
          >›</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.report-result-table {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

/* ── Toolbar for Column Customization ── */
.rrt-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 10px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.rrt-toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rrt-mode-toggle {
  display: inline-flex;
  background: #e2e8f0;
  padding: 2px;
  border-radius: 6px;
}

.rrt-mode-btn {
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.rrt-mode-btn--active {
  background: #fff;
  color: #4f46e5;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
}

.rrt-col-info {
  font-size: 10px;
  color: #64748b;
}

.rrt-toolbar-right {
  display: flex;
  align-items: center;
}

.rrt-popover-wrap {
  position: relative;
}

.rrt-picker-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 8px;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  font-size: 10.5px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s;
}
.rrt-picker-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}
.rrt-picker-btn svg { width: 12px; height: 12px; color: #6366f1; }
.rrt-chev { width: 10px !important; height: 10px !important; color: #94a3b8 !important; }

/* Popover Menu */
.rrt-popover {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  width: 220px;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  z-index: 100;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  animation: rrt-pop-in 0.15s ease;
}
@keyframes rrt-pop-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.rrt-popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 4px;
  border-bottom: 1px solid #f1f5f9;
}
.rrt-popover-title {
  font-size: 10.5px;
  font-weight: 700;
  color: #0f172a;
  text-transform: uppercase;
}
.rrt-popover-close {
  background: none;
  border: none;
  font-size: 11px;
  color: #94a3b8;
  cursor: pointer;
}

.rrt-popover-presets {
  display: flex;
  gap: 4px;
}
.rrt-preset-chip {
  flex: 1;
  padding: 2px 4px;
  font-size: 9.5px;
  font-weight: 600;
  color: #4f46e5;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
}
.rrt-preset-chip:hover {
  background: #4f46e5;
  color: #fff;
}

.rrt-popover-search {
  width: 100%;
}
.rrt-search-input {
  width: 100%;
  height: 24px;
  padding: 0 6px;
  font-size: 11px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  outline: none;
  box-sizing: border-box;
}

.rrt-popover-list {
  max-height: 180px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 3px;
  scrollbar-width: thin;
}

.rrt-col-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #334155;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
}
.rrt-col-item:hover {
  background: #f8fafc;
}

.rrt-checkbox {
  accent-color: #6366f1;
  cursor: pointer;
}

.rrt-col-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Modern 2-in-1 Dual-Data Cell Styles ── */
.dual-cell {
  display: flex;
  flex-direction: column;
  gap: 1px;
  line-height: 1.15;
}

.dual-cell-primary {
  font-size: 11px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dual-cell-secondary {
  font-size: 10px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dual-subtext {
  color: #64748b;
  font-weight: 500;
}

.dual-badge {
  display: inline-block;
  padding: 0px 5px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  width: fit-content;
  line-height: 1.3;
}

.badge-active { background: #dcfce7; color: #15803d; }
.badge-purple { background: #f3e8ff; color: #7e22ce; }
.badge-pending { background: #fef9c3; color: #a16207; }
.badge-danger  { background: #fee2e2; color: #b91c1c; }
.badge-neutral { background: #f1f5f9; color: #475569; }

/* ── Loading skeleton ── */
.loading-overlay {
  padding: 8px 0;
}

.skeleton-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skeleton-header {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #1e293b;
  border-radius: 10px 10px 0 0;
}

.skeleton-th {
  height: 14px;
  background: rgba(255,255,255,0.15);
  border-radius: 4px;
  flex: 1;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-row {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #f3f4f6;
}

.skeleton-td {
  height: 14px;
  background: #e5e7eb;
  border-radius: 4px;
  flex: 1;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  gap: 10px;
}

.empty-icon svg {
  width: 80px;
  height: 80px;
}

.empty-title {
  font-size: 15px;
  font-weight: 700;
  color: #374151;
  margin: 0;
}

.empty-sub {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
}

/* ── Table ── */
.table-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
}

.table-scroll {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.table-scroll::-webkit-scrollbar {
  width: 5px;
  height: 0px;
}

.table-scroll::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.table-scroll::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 3px;
}

.table-scroll::-webkit-scrollbar-thumb:hover {
  background: #6366f1;
}

.data-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 11px;
}

.th-index {
  width: 28px;
  padding: 6px 3px;
  background: #1e293b;
  color: rgba(255,255,255,0.6);
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  text-align: center;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

.th-cell {
  padding: 6px 5px;
  background: #1e293b;
  color: rgba(255,255,255,0.9);
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  white-space: normal;
  word-break: break-word;
  line-height: 1.15;
  vertical-align: middle;
  position: sticky;
  top: 0;
  z-index: 10;
}

.td-index {
  padding: 5px 3px;
  text-align: center;
  color: #9ca3af;
  font-size: 10px;
  font-weight: 500;
}

.td-cell {
  padding: 5px 5px;
  color: #374151;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}

.td-numeric {
  font-weight: 600;
  color: #1e293b;
  font-variant-numeric: tabular-nums;
}

.row-even {
  background: #ffffff;
}

.row-odd {
  background: #f8fafc;
}

.data-row {
  transition: background 0.1s;
}

.data-row:hover {
  background: #eff6ff !important;
}

/* ── Loss ratio badges ── */
.td-lr {
  text-align: center;
  padding-left: 2px !important;
  padding-right: 2px !important;
}

.lr-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  padding: 2px 4px;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 700;
  box-sizing: border-box;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lr-good {
  background: #dcfce7;
  color: #15803d;
}

.lr-warn {
  background: #fef9c3;
  color: #a16207;
}

.lr-danger {
  background: #fee2e2;
  color: #b91c1c;
}

/* ── Pagination ── */
.pagination-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
}

.pagination-info {
  font-size: 11px;
  color: #6b7280;
  margin: 0;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 3px;
}

.pg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
  padding: 0 5px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  background: #fff;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.12s;
}

.pg-btn:hover:not(:disabled):not(.pg-ellipsis) {
  background: #6366f1;
  color: #fff;
  border-color: #6366f1;
}

.pg-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pg-active {
  background: #6366f1 !important;
  color: #fff !important;
  border-color: #6366f1 !important;
}

.pg-ellipsis {
  cursor: default;
  border-color: transparent;
  background: transparent;
}

.text-right { text-align: right; }
.text-left  { text-align: left; }
</style>
