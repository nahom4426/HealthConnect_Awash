<script setup lang="ts" generic="T">
import DataTable from "./DataTable.vue";
import { inject, ref, useAttrs, watch, type PropType } from "vue";
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
      <slot name="row">
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
          <tr v-if="!rows?.length && !pending">
            <td :colspan="spec.head.length + 1">
              <slot name="placeholder">
                <div class="flex flex-col gap-2 items-center">
                  <div
                    class="flex-1 w-full flex justify-center py-5 h-full size-28 *:h-56"
                    v-html="icons.no_data"
                  />
                  <p class="text-xl">{{ placeholder ? placeholder : 'No Data Found' }}</p>
                </div>
              </slot>
            </td>
          </tr>
        </template>
      </slot>
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
      v-if="showPagination && totalPages > 1"
      class="flex items-center border-t mt-2 p-2 justify-between"
    >
      <button v-ripple
        @click="previousPage"
        class="text-center border-dark/20 group flex justify-center min-w-[8rem] gap-4 p-2 rounded border"
      >
        <i class="transition-all duration-150 ease-linear group-hover:-translate-x-2" v-html="icons.back" />
        <span>Previous</span>
      </button>
      <!--<p>Page {{ page }} of {{ totalPages }}</p>-->
      <button v-ripple @click="nextPage" class="group flex items-center gap-4 justify-center min-w-[8rem] text-center border-dark/20 p-2 rounded border">
        <span>Next</span>
        <i class="group-hover:translate-x-2 transition-all duration-150 ease-linear" v-html="icons.forward" />
      </button>
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
</style>
