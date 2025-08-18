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

    <div
      v-if="!pending && showPagination && hasData"
      class="flex justify-between p-4 items-center flex-wrap gap-4"
    >
      <div class="flex gap-5 items-center">
        <span class="text-gray-600">Show</span>
        <select
          @change="handlePerPageChange($event.target.value)"
          class="px-3 py-2 rounded-md bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          :value="currentPerPage"
        >
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="75">75</option>
          <option value="100">100</option>
        </select>
        <span class="text-gray-600">entries</span>
      </div>
      
      <div class="text-gray-600">
        Showing {{ rows?.length || 0 }} of {{ currentTotalElements || 0 }} records
      </div>
      
      <div class="flex gap-2 items-center justify-center flex-wrap">
        <button
          @click="previousPage"
          class="pagination-button"
          :disabled="currentPage === 1 || pending"
        >
          <i v-html="icons.chevron_left"></i>
        </button>
        
        <button
          v-for="pageNum in pageNumbers"
          :key="pageNum"
          @click="pageNum !== '...' ? handlePageChange(pageNum) : null"
          class="pagination-button"
          :class="{ 
            'active-page': currentPage === pageNum,
            'cursor-default': pageNum === '...'
          }"
          :disabled="pageNum === '...'"
        >
          {{ pageNum }}
        </button>
        
        <button
          @click="nextPage"
          class="pagination-button"
          :disabled="currentPage === currentTotalPages || pending"
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
  @apply text-sm;
}

.Table-contents {
  text-align: start;
  padding-bottom: 0.5rem;
  line-height: 21px;
  font-weight: 500;
  color: #4e585f;
}

/* Pagination styles from the second snippet */
.pagination-button {
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  background-color: white;
  color: #4a5568;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-button:hover:not(:disabled) {
  background-color: #f7fafc;
  border-color: #cbd5e0;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.active-page {
  background-color: #4299e1;
  color: white;
  border-color: #4299e1;
}

@media (max-width: 768px) {
  .pagination-wrapper {
    flex-direction: column;
    gap: 1rem;
  }
  
  .pagination-controls {
    order: 3;
    margin-top: 1rem;
  }
  
  .pagination-info {
    order: 2;
  }
  
  .pagination-button {
    min-width: 2.25rem;
    height: 2.25rem;
    font-size: 0.875rem;
  }
}
</style>








