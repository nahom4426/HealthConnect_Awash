<script setup>
import DataTable from "./DataTable.vue";
import { inject, ref, watch, computed, useSlots } from "vue";
import GenericTableRow from "./GenericTableRow.vue";
import AnimatedNoData from "./AnimatedNoData.vue";
import TableRowSkeleton from "./TableRowSkeleton.vue";
import icons from "@/utils/icons";

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
  hideIndex: { type: Boolean, default: false },
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
  pagination: {
    type: Object,
    default: null,
  },
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

watch(() => props.headers, () => {
  format();
}, { deep: true });

// Pagination logic
const nextPageFn = inject("next", () => {});
const previousPageFn = inject("previous", () => {});
const page = inject("page", ref(1));
const totalPages = inject("totalPages", ref(1));
const totalElements = inject("totalElements", ref(0));
const perPage = inject("perPage", ref(25));
const sendPagination = inject("sendPagination", (limit, page) => {});
const pageChanger = inject("pageChanger", (pageNum) => {});

const handlePerPageChange = (event) => {
  const newLimit = parseInt(event.target.value);
  if (props.pagination?.onLimitChange) {
    props.pagination.onLimitChange(newLimit);
  } else {
    sendPagination(newLimit, 1);
  }
};

const handlePageChange = (pageNum) => {
  if (props.pagination?.onPageChange) {
    props.pagination.onPageChange(pageNum);
  } else {
    pageChanger(pageNum);
  }
};

const nextPage = () => {
  if (currentPage.value < currentTotalPages.value) {
    handlePageChange(currentPage.value + 1);
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    handlePageChange(currentPage.value - 1);
  }
};

const currentPage = computed(() => props.pagination?.currentPage || page.value);
const currentTotalPages = computed(() => props.pagination?.totalPages || totalPages.value);
const currentTotalElements = computed(() => props.pagination?.totalElements || totalElements.value);
const currentPerPage = computed(() => props.pagination?.itemsPerPage || perPage.value);

const pageNumbers = computed(() => {
  const total = currentTotalPages.value;
  const current = currentPage.value;
  const pages = [];
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 4) pages.push('...');
    
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== total) pages.push(i);
    }
    
    if (current < total - 3) pages.push('...');
    if (total > 1) pages.push(total);
  }
  
  return pages;
});

const hasData = computed(() => props.rows && props.rows.length > 0);
const showEmptyState = computed(() => !props.pending && !hasData.value);

const startIndex = computed(() => ((currentPage.value - 1) * currentPerPage.value) + 1);
const endIndex = computed(() => Math.min(currentPage.value * currentPerPage.value, currentTotalElements.value));
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Table Content -->
    <div class="overflow-auto flex-1 min-h-0 custom-scrollbar">
      <DataTable
        :firstCol="firstCol"
        :last-col="lastCol"
        :hideIndex="hideIndex"
        class="min-w-full"
        :headers="spec.head"
      >
        <template v-if="firstCol" #headerFirst>
          <slot name="headerFirst" />
        </template>
        <template v-if="lastCol" #headerLast>
          <slot name="headerLast" />
        </template>

        <!-- Table Body -->
        <template v-if="hasData && !pending">
          <template v-if="rowCom">
            <component
              :is="rowCom"
              v-bind="{
                cells: cells,
                headKeys: spec.head,
                rowData: rows,
                rowKeys: spec.row,
                hideIndex,
                ...(rowComProps || {}),
              }"
              @row="(row) => emit('row', row)"
              @remove="(uuid) => emit('remove', uuid)"
            />
          </template>
          <template v-else>
            <GenericTableRow
              @row="(row) => emit('row', row)"
              :firstCol="firstCol"
              :lastCol="lastCol"
              :hideIndex="hideIndex"
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
              <template v-for="key in forwardedColumnSlots" :key="key" #[key]="{ row }">
                <slot :name="key" :row="row" />
              </template>
              <template #actions="{ row }">
                <slot name="actions" :row="row" />
              </template>
              <template #reason="{ row }">
                <slot name="reason" :row="row" />
              </template>
              <template v-if="lastCol" #lastCol="{ row }">
                <slot name="lastCol" :row="row" />
              </template>
            </GenericTableRow>
          </template>
        </template>

        <!-- Loading State -->
        <template v-if="pending">
          <component
            :cols="spec.head.length + (firstCol ? 1 : 0) + (lastCol ? 1 : 0) + (hideIndex ? 0 : 1)"
            v-for="num in 10"
            :key="num"
            :is="Fallback"
          />
        </template>
      </DataTable>

      <!-- Empty State -->
      <div v-if="showEmptyState" class="flex flex-col justify-center items-center py-16 px-4">
        <slot name="placeholder">
          <AnimatedNoData
            title="No Data Available"
            :message="placeholder || 'There are no items to display at the moment.'"
          />
        </slot>
      </div>
    </div>

    <!-- Mobile Card View -->
    <div class="lg:hidden">
      <slot name="mobile">
        <div v-if="hasData && !pending" class="space-y-2 p-1">
          <div
            v-for="(row, idx) in rows"
            :key="idx"
            class="p-3.5 bg-white rounded-lg border border-gray-200/80 transition-all duration-150 hover:shadow-soft active:scale-[0.99] cursor-pointer"
            @click="emit('row', row)"
          >
            <div class="space-y-1.5">
              <div v-for="(key, keyIdx) in spec.row" :key="keyIdx" class="flex justify-between items-start gap-3">
                <span class="text-[11px] font-medium text-gray-400 uppercase tracking-wide flex-shrink-0">{{ spec.head[keyIdx] }}</span>
                <span class="text-sm text-right text-gray-800 font-medium">{{ row[key] || '-' }}</span>
              </div>

              <!-- Mobile Actions -->
              <div v-if="$slots.actions" class="flex gap-2 pt-2 mt-1.5 border-t border-gray-100">
                <slot name="actions" :row="row" />
              </div>
            </div>
          </div>
        </div>
      </slot>
    </div>

    <!-- Pagination -->
    <div
      v-if="!pending && showPagination && hasData"
      class="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-100"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <!-- Left: Info + Per Page -->
        <div class="flex items-center gap-3">
          <div class="flex gap-1.5 items-center">
            <select
              @change="handlePerPageChange"
              class="h-8 px-2 pr-7 text-xs font-medium text-gray-600 bg-gray-50 rounded-md border border-gray-200 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              :value="currentPerPage"
            >
              <option :value="25">25</option>
              <option :value="50">50</option>
              <option :value="75">75</option>
              <option :value="100">100</option>
            </select>
            <span class="text-xs text-gray-400">per page</span>
          </div>
          <div class="hidden sm:block h-4 w-px bg-gray-200"></div>
          <span class="hidden sm:inline text-xs text-gray-500">
            {{ startIndex }}-{{ endIndex }} of {{ currentTotalElements }}
          </span>
        </div>

        <!-- Right: Page Controls -->
        <div class="flex items-center gap-1">
          <button
            @click="previousPage"
            class="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 text-gray-500 transition-all duration-150 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            :disabled="currentPage === 1"
            aria-label="Previous page"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <template v-for="pageNum in pageNumbers" :key="pageNum">
            <span
              v-if="pageNum === '...'"
              class="inline-flex items-center justify-center w-8 h-8 text-xs text-gray-400"
            >
              ...
            </span>
            <button
              v-else
              @click="handlePageChange(pageNum)"
              class="inline-flex items-center justify-center w-8 h-8 rounded-md text-xs font-medium transition-all duration-150"
              :class="[
                currentPage === pageNum
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              ]"
            >
              {{ pageNum }}
            </button>
          </template>

          <button
            @click="nextPage"
            class="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 text-gray-500 transition-all duration-150 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            :disabled="currentPage === currentTotalPages"
            aria-label="Next page"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>