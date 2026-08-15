<script setup lang="ts">
import { computed } from 'vue';

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

// Determine if a column is a "loss ratio" type column
function isLossRatioColumn(col: string): boolean {
  return col.toLowerCase().includes('loss ratio') || col.toLowerCase().includes('utilization');
}

// Determine if a column is numeric/currency
function isNumericColumn(col: string): boolean {
  const numericKeywords = ['premium', 'claim', 'amount', 'value', 'assured', 'total', 'paid', 'outstanding', 'rejected', 'count', 'members', 'principals', 'dependents'];
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
    const num = parseFloat(String(value));
    return isNaN(num) ? String(value) : `${num.toFixed(2)}%`;
  }
  return String(value);
}

const pageNumbers = computed(() => {
  const total = props.totalPages;
  const current = props.page + 1; // display is 1-indexed
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
  emit('page-change', p - 1); // API is 0-indexed
}
</script>

<template>
  <div class="report-result-table">
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
              <th class="th-index">#</th>
              <th v-for="col in columns" :key="col" :class="['th-cell', isNumericColumn(col) ? 'text-right' : 'text-left']">
                {{ col }}
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
                v-for="col in columns"
                :key="col"
                :class="[
                  'td-cell',
                  isNumericColumn(col) && !isLossRatioColumn(col) ? 'text-right td-numeric' : 'text-left',
                  isLossRatioColumn(col) ? `td-lr ${lossRatioClass(row[col])}` : ''
                ]"
              >
                <span v-if="isLossRatioColumn(col)" :class="['lr-badge', lossRatioClass(row[col])]">
                  {{ formatCell(col, row[col]) }}
                </span>
                <span v-else>{{ formatCell(col, row[col]) }}</span>
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
  min-height: 200px;
}

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
  overflow: hidden;
}

.table-scroll {
  overflow-x: auto;
  overflow-y: visible;
  /* Always show scrollbar track so users know it's scrollable */
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.table-scroll::-webkit-scrollbar {
  height: 8px;
}

.table-scroll::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 0 0 4px 4px;
}

.table-scroll::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 4px;
  border: 2px solid #f1f5f9;
}

.table-scroll::-webkit-scrollbar-thumb:hover {
  background: #6366f1;
}

.data-table {
  width: 100%;
  min-width: 640px; /* ensures horizontal scroll kicks in for narrow containers */
  border-collapse: collapse;
  font-size: 13px;
}

.th-index {
  width: 48px;
  padding: 13px 16px;
  background: #1e293b;
  color: rgba(255,255,255,0.6);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: center;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
}

.th-cell {
  padding: 13px 16px;
  background: #1e293b;
  color: rgba(255,255,255,0.85);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
}

.td-index {
  padding: 11px 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 500;
}

.td-cell {
  padding: 11px 16px;
  color: #374151;
  white-space: nowrap;
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
}

.lr-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
}

.pagination-info {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 6px;
  border-radius: 6px;
  font-size: 13px;
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
