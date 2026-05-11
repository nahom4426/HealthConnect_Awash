<script setup>
import DataTable from "./DataTable.vue";
import { inject, ref, useAttrs, watch, computed } from "vue";
import GenericTableRow from "./GenericTableRow.vue";
import icons from "@/utils/icons";
import TableRowSkeleton from "./TableRowSkeleton.vue";

const emit = defineEmits([
  "row",
  "action:certificate",
  "action:delete",
  "action:review",
  "action:suspend",
  "action:edit",
  "bottom",
]);

const props = defineProps({
  showPagination: {
    type: Boolean,
    default: true,
  },
  rowCom: Object,
  actionHide: String,
  headers: [Array, Object],
  rows: {
    type: Array,
    default: () => [],
  },
  firstCol: { type: Boolean, default: false },
  lastCol: { type: Boolean, default: false },
  placeholder: String,
  photoRow: Object,
  cells: Object,
  actions: Array,
  exceptions: Array,
  length: Number,
  Fallback: {
    type: Object,
    default: TableRowSkeleton,
  },
  pending: Boolean,
});

function toUpper(str) {
  let words = str.split(" ");
  if (words.length === 0) return str;

  for (let i = 1; i < words.length; i++) {
    words[0] += words[i].charAt(0).toUpperCase() + words[i].substring(1);
  }

  return words[0];
}

const spec = ref({ head: [], row: [] });

function format() {
  if (Array.isArray(props.headers)) {
    spec.value.head = props.headers;

    const res = props.headers.reduce((state, el) => {
      const temp = el.toLowerCase();
      state.push(toUpper(temp));
      return state;
    }, []);

    spec.value.row = res.filter((el) => el !== "modify");
  } else {
    spec.value.head = props.headers?.head || [];
    spec.value.row = props.headers?.row || [];
  }
}

format();

function getUrl(blob) {
  if (blob.toString().includes("File")) {
    const url = URL.createObjectURL(blob);
    return url;
  }

  return blob;
}

watch(props, () => {
  format();
});

const nextPage = inject("next", () => {});
const previousPage = inject("previous", () => {});
const page = inject("page", ref(1)); // Already 1-based
const totalPages = inject("totalPages", ref(1));
const totalElements = inject("totalElements", ref(0));
const perPage = inject("perPage", ref(25));
const sendPagination = inject("sendPagination", (limit, page) => {});
const pageChanger = inject("pageChanger", (pageNum) => {});

// Handle per-page changes
const handlePerPageChange = (newPerPage) => {
  const newLimit = parseInt(newPerPage);
  if (props.pagination?.onLimitChange) {
    props.pagination.onLimitChange(newLimit);
  } else {
    sendPagination(newLimit, 1); // Reset to page 1 (1-based)
  }
};

// Handle page changes
const handlePageChange = (pageNum) => {
  if (props.pagination?.onPageChange) {
    props.pagination.onPageChange(pageNum);
  } else {
    pageChanger(pageNum); // No conversion needed, already 1-based
  }
};

// Computed values for display
const currentPage = computed(() => {
  return props.pagination?.currentPage || page.value;
});

const currentTotalPages = computed(() => {
  return props.pagination?.totalPages || totalPages.value;
});

const currentTotalElements = computed(() => {
  return props.pagination?.totalElements || totalElements.value;
});

const currentPerPage = computed(() => {
  return props.pagination?.itemsPerPage || perPage.value;
});

// Generate page numbers for pagination display
const pageNumbers = computed(() => {
  const total = currentTotalPages.value;
  const current = currentPage.value;
  const pages = [];
  
  if (total <= 7) {
    // Show all pages if 7 or fewer
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);
    
    if (current > 4) {
      pages.push('...');
    }
    
    // Show pages around current page
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== total) {
        pages.push(i);
      }
    }
    
    if (current < total - 3) {
      pages.push('...');
    }
    
    // Always show last page if more than 1 page
    if (total > 1) {
      pages.push(total);
    }
  }
  
  return pages;
});

// Computed properties for "no data" and pagination logic
const hasData = computed(() => {
  return props.rows && props.rows.length > 0;
});

const showEmptyState = computed(() => {
  return !props.pending && !hasData.value;
});

// Range utility for pagination numbers
const range = (start, end) => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};
</script>
<template>
  <div class="h-full Table-header">
    <DataTable
      :firstCol="props.firstCol"
      :last-col="lastCol"
      class="bg-table-clr border-white/10"
      :headers="spec.head"
    >
      <template v-if="firstCol" #headerFirst>
        <slot name="headerFirst" />
      </template>
      <template v-if="lastCol" #headerLast>
        <slot name="headerLast" />
      </template>

      <template v-if="hasData">
        <template v-if="rowCom">
          <component
            :is="rowCom"
            v-bind="{
              cells: cells,
              headKeys: spec.head,
              rowData: rows,
              rowKeys: spec.row,
            }"
          />
        </template>
        <template v-else>
          <GenericTableRow
            @row="(row) => emit('row', row)"
            :firstCol="props.firstCol"
            :lastCol="props.lastCol"
            :head-keys="spec.head"
            :row-data="rows"
            :row-keys="spec.row"
            :cells="cells"
          >
            <template v-if="firstCol" #select="{ row }">
              <slot name="select" :row="row" />
            </template>
            <template v-if="firstCol" #firstCol="{ row }">
              <slot name="firstCol" :row="row" />
            </template>
            <template v-if="lastCol" #lastCol="{ row }">
              <slot name="lastCol" :row="row" />
            </template>
            <template #actions="{ row }">
              <slot name="actions" :row="row" />
            </template>
            <template #reason="{ row }">
              <slot name="reason" :row="row" />
            </template>
          </GenericTableRow>
        </template>
      </template>

      <tr v-if="showEmptyState">
        <td :colspan="spec.head.length + 1">
          <slot name="placeholder">
            <div class="flex flex-col gap-2 items-center py-8">
              <div
                class="flex-1 w-full flex justify-center py-5 h-full size-28 *:h-56"
                v-html="icons.no_data"
              />
              <p class="text-xl">
                {{ placeholder ? placeholder : 'No Data Found' }}
              </p>
            </div>
          </slot>
        </td>
      </tr>

      <template v-if="pending">
        <component
          :cols="spec.head.length + 1"
          :key="num"
          v-for="num in 15"
          :is="Fallback"
        />
      </template>
    </DataTable>

    <!-- Pagination -->
    <div
      v-if="!pending && showPagination && hasData"
      class="flex flex-wrap items-center justify-between gap-4 px-5 py-4 bg-white border-t border-slate-100 rounded-b-xl"
    >
      <!-- Per-page selector -->
      <div class="flex items-center gap-2.5">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">Show</span>
        <select
          @change="handlePerPageChange($event.target.value)"
          :value="currentPerPage"
          class="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium
                 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all cursor-pointer"
        >
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="75">75</option>
          <option value="100">100</option>
        </select>
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide">entries</span>
      </div>

      <!-- Record count -->
      <p class="text-sm text-slate-500">
        Showing <span class="font-bold text-slate-800">{{ rows?.length || 0 }}</span>
        of <span class="font-bold text-slate-800">{{ currentTotalElements || 0 }}</span> records
      </p>

      <!-- Page buttons -->
      <div class="flex items-center gap-1">
        <button
          @click="previousPage"
          :disabled="currentPage === 1 || pending"
          class="pagination-btn"
          title="Previous"
        >
          <i v-html="icons.chevron_left"></i>
        </button>

        <button
          v-for="pageNum in pageNumbers"
          :key="pageNum"
          @click="pageNum !== '...' ? handlePageChange(pageNum) : null"
          class="pagination-btn"
          :class="currentPage === pageNum ? 'pagination-btn-active' : pageNum === '...' ? 'cursor-default pointer-events-none' : ''"
          :disabled="pageNum === '...'"
        >
          {{ pageNum }}
        </button>

        <button
          @click="nextPage"
          :disabled="currentPage === currentTotalPages || pending"
          class="pagination-btn"
          title="Next"
        >
          <i v-html="icons.chevron_right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style>
.Table-header {
  text-align: left;
  line-height: 21px;
  color: #4e585f;
  font-size: 0.875rem;
}

.Table-contents {
  text-align: start;
  padding-bottom: 0.5rem;
  line-height: 21px;
  font-weight: 500;
  color: #4e585f;
}

.pagination-btn {
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  color: #475569;
  font-weight: 600;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pagination-btn:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #1e293b;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}
.pagination-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.pagination-btn-active {
  background: var(--color-primary, #6366f1) !important;
  color: white !important;
  border-color: transparent !important;
  box-shadow: 0 3px 10px rgba(99,102,241,0.35) !important;
  transform: none !important;
}

@media (max-width: 640px) {
  .pagination-btn { min-width: 2rem; height: 2rem; font-size: 0.75rem; }
}
</style>








