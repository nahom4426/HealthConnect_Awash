<script setup>
import DataTable from "./DataTable.vue";
import { inject, ref, useAttrs, watch, computed, useSlots } from "vue";
import GenericTableRow from "./GenericTableRow.vue";
import AnimatedNoData from "./AnimatedNoData.vue";
import icons from "@/utils/icons";
import TableRowSkeleton from "./TableRowSkeleton.vue";

const emit = defineEmits([
  "row",
  "remove",
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
  rowComProps: {
    type: Object,
    default: () => ({}),
  },
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

const slots = useSlots();
const forwardedColumnSlots = computed(() => {
  return (spec.value?.row || []).filter((key) => !!slots[key]);
});

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

const nextPageFn = inject("next", () => {});
const previousPageFn = inject("previous", () => {});
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

// Handle next page
const nextPage = () => {
 
  if (currentPage.value < currentTotalPages.value) {
    const nextPageNum = currentPage.value + 1;
    handlePageChange(nextPageNum);
  }
};

// Handle previous page
const previousPage = () => {
 
  if (currentPage.value > 1) {
    const prevPageNum = currentPage.value - 1;
    handlePageChange(prevPageNum);
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
  <div class="overflow-visible h-full Table-header">
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

      <!-- Desktop Table Content -->
      <template v-if="hasData">
        <template v-if="rowCom">
          <component
            :is="rowCom"
            v-bind="{
              cells: cells,
              headKeys: spec.head,
              rowData: rows,
              rowKeys: spec.row,
              currentPage: currentPage,
              perPage: currentPerPage,
              ...(props.rowComProps || {}),
            }"
            @row="(row) => emit('row', row)"
            @remove="(uuid) => emit('remove', uuid)"
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
            <template v-for="key in forwardedColumnSlots" :key="key" #[key]="{ row }">
              <slot :name="key" :row="row" />
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

      <tr v-if="showEmptyState" class="hidden lg:table-row">
        <td :colspan="spec.head.length + 1" class="py-8">
          <slot name="placeholder">
            <AnimatedNoData 
              title="No Data Available"
              :message="placeholder || 'There are no items to display at the moment.'"
            />
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

      <!-- Mobile Card View -->
      <template #mobile>
        <div v-if="hasData" class="p-1 space-y-2 sm:p-2">
          <template v-if="rowCom">
            <component
              :is="rowCom"
              v-bind="{
                cells: cells,
                headKeys: spec.head,
                rowData: rows,
                rowKeys: spec.row,
                isMobile: true,
                currentPage: currentPage,
                perPage: currentPerPage,
                ...(props.rowComProps || {}),
              }"
              @row="(row) => emit('row', row)"
              @remove="(uuid) => emit('remove', uuid)"
            />
          </template>
          <template v-else>
            <!-- Generic mobile cards would go here -->
            <div v-for="(row, idx) in rows" :key="idx" class="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div class="space-y-3">
                <div v-for="(key, keyIdx) in spec.row" :key="keyIdx" class="flex justify-between items-start">
                  <span class="text-sm font-medium text-gray-500">{{ spec.head[keyIdx] }}:</span>
                  <span class="text-sm text-right text-gray-900">{{ row[key] }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Mobile Empty State -->
        <div v-if="showEmptyState">
          <AnimatedNoData 
            title="No Data Available"
            :message="placeholder || 'There are no items to display at the moment.'"
          />
        </div>

        <!-- Mobile Loading State -->
        <div v-if="pending" class="p-1 space-y-2 sm:p-2">
          <div v-for="num in 5" :key="num" class="p-2.5 mx-1 bg-white rounded-lg border border-gray-200 shadow-sm animate-pulse sm:p-3 sm:mx-2">
            <div class="space-y-2">
              <div class="w-3/4 h-3 bg-gray-200 rounded"></div>
              <div class="w-1/2 h-3 bg-gray-200 rounded"></div>
              <div class="w-2/3 h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </template>
    </DataTable>

    <div
      v-if="!pending && showPagination && hasData"
      class="flex flex-col gap-3 p-3 bg-gray-50 rounded-b-xl border-t border-gray-100"
    >
      <!-- Mobile-first layout -->
      <div class="flex flex-col gap-3 justify-between items-center sm:flex-row">
        <div class="flex gap-2 items-center text-xs text-gray-600 sm:text-sm">
          <span>Show</span>
          <select
            @change="handlePerPageChange($event.target.value)"
            class="px-2 py-1 text-xs bg-white rounded-md border border-gray-300 transition-all sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :value="currentPerPage"
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="75">75</option>
            <option value="100">100</option>
          </select>
          <span>entries</span>
        </div>
        
        <div v-if="currentTotalElements > 0" class="text-xs text-center text-gray-600 sm:text-sm sm:text-left">
          Showing {{ ((currentPage - 1) * currentPerPage + 1) }} to {{ Math.min(currentPage * currentPerPage, currentTotalElements) }} of {{ currentTotalElements }} records
        </div>
      </div>
      
      <!-- Pagination Controls -->
      <div class="flex gap-1 justify-center items-center">
        <button
          @click="previousPage"
          class="pagination-btn"
          :disabled="currentPage === 1 || pending"
          :class="{ 'opacity-50 cursor-not-allowed': currentPage === 1 || pending }"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        
        <button
          v-for="pageNum in pageNumbers"
          :key="pageNum"
          @click="pageNum !== '...' ? handlePageChange(pageNum) : null"
          class="pagination-btn"
          :class="{ 'pagination-btn-active': currentPage === pageNum }"
          :disabled="pageNum === '...'"
        >
          {{ pageNum }}
        </button>
        
        <button
          @click="nextPage"
          class="pagination-btn"
          :disabled="currentPage === currentTotalPages || pending"
          :class="{ 'opacity-50 cursor-not-allowed': currentPage === currentTotalPages || pending }"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
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

/* Modern pagination button styles */
.pagination-btn {
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pagination-btn-active {
  background-color: #2563eb !important;
  color: white !important;
  border-color: #2563eb !important;
}

.pagination-btn-active:hover {
  background-color: #1d4ed8 !important;
  border-color: #1d4ed8 !important;
}


@media (max-width: 640px) {
  .pagination-btn {
    min-width: 2rem;
    height: 2rem;
    font-size: 0.75rem;
  }
}

/* Fix empty state SVG positioning */
.empty-state-icon {
  overflow: hidden;
}

.empty-state-icon svg {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  display: block;
  margin: 0 auto;
  object-fit: contain;
}

/* Mobile specific adjustments for empty state */
@media (max-width: 640px) {
  .empty-state-icon svg {
    transform: scale(0.8);
  }
}
</style>



