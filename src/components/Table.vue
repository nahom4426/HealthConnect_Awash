<script setup lang="ts" generic="T">
import DataTable from "./DataTable.vue";
import { inject, ref, useAttrs, watch, type PropType, computed } from "vue";
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
    type: Array as PropType<T[]>,
    default: [],
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
    default: TableRowSkeleton
  },
  pending: Boolean,
});

function toUpper(str: string) {
  let words = str.split(" ");
  if (words.length == 0) return str;

  for (let i = 1; i < words.length; i++) {
    words[0] += words[i].charAt(0).toUpperCase() + words[i].substring(1);
  }

  return words[0];
}

interface Spec {
  head: string[],
  row: string[]
}
const spec = ref<Spec>({ head: [], row: [] });

function format() {
  if (Array.isArray(props.headers)) {
    spec.value.head = props.headers as [];

    const res = props.headers.reduce((state, el) => {
      const temp = el.toLowerCase();
      state.push(toUpper(temp));
      return state;
    }, []);

    spec.value.row = res.filter((el: string) => el != "modify");
  } else {
    spec.value.head = props.headers?.head || [];
    spec.value.row = props.headers?.row || [];
  }
}

format();

function getUrl(blob: Blob) {
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
const page = inject("page", 1);
const totalPages = inject("totalPages", 1);
const totalElements = inject("totalElements", null);
const perPage = inject("perPage", 25);
const sendPagination = inject("sendPagination", () => {});
const pageChanger = inject("pageChanger", (page) => {
  sendPagination(perPage.value, page - 1);
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
          @change="sendPagination(parseInt($event.target.value), 0)"
          class="px-3 py-2 rounded-md bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          :value="perPage"
        >
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="75">75</option>
          <option value="100">100</option>
        </select>
        <span class="text-gray-600">entries</span>
      </div>
      
      <div class="text-gray-600">
        Showing {{ rows?.length || 0 }} of {{ totalElements || 0 }} records
      </div>
      
      <div class="flex gap-2 items-center justify-center flex-wrap">
        <button
          @click="previousPage"
          class="pagination-button"
          :disabled="page === 1 || pending"
        >
          <i v-html="icons.chevron_left"></i>
        </button>
        
        <template v-if="totalPages <= 7">
          <button
            v-for="pageNum in totalPages"
            :key="pageNum"
            @click="pageChanger(pageNum)"
            class="pagination-button"
            :class="{ 'active-page': page === pageNum }"
          >
            {{ pageNum }}
          </button>
        </template>
        
        <template v-else>
          <button
            @click="pageChanger(1)"
            class="pagination-button"
            :class="{ 'active-page': page === 1 }"
          >
            1
          </button>
          
          <template v-if="page < 4">
            <button
              v-for="pageNum in range(2, 4)"
              :key="pageNum"
              @click="pageChanger(pageNum)"
              class="pagination-button"
              :class="{ 'active-page': page === pageNum }"
            >
              {{ pageNum }}
            </button>
            <span class="px-2">...</span>
          </template>
          
          <template v-else-if="page > totalPages - 3">
            <span class="px-2">...</span>
            <button
              v-for="pageNum in range(totalPages - 3, totalPages - 1)"
              :key="pageNum"
              @click="pageChanger(pageNum)"
              class="pagination-button"
              :class="{ 'active-page': page === pageNum }"
            >
              {{ pageNum }}
            </button>
          </template>
          
          <template v-else>
            <span class="px-2">...</span>
            <button
              v-for="pageNum in [page - 1, page, page + 1]"
              :key="pageNum"
              @click="pageChanger(pageNum)"
              class="pagination-button"
              :class="{ 'active-page': page === pageNum }"
            >
              {{ pageNum }}
            </button>
            <span class="px-2">...</span>
          </template>
          
          <button
            @click="pageChanger(totalPages)"
            class="pagination-button"
            :class="{ 'active-page': page === totalPages }"
          >
            {{ totalPages }}
          </button>
        </template>
        
        <button
          @click="nextPage"
          class="pagination-button"
          :disabled="page === totalPages || pending"
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