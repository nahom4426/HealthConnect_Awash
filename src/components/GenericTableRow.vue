<script setup lang="ts" generic="T">
import type { PropType } from "vue";

type CellFunction = () => string;

interface Cells {
  [key: string]: CellFunction;
}

const props = defineProps({
  rowData: {
    type: Array as PropType<T[] | null>,
    required: true,
  },
  firstCol: {
    type: Boolean,
    default: false,
  },
  lastCol: {
    type: Boolean,
    default: false,
  },
  rowKeys: {
    type: Array as PropType<string[]>,
    required: true,
  },
  headKeys: {
    type: Array as PropType<string[]>,
    default: [],
  },
  cells: Object as PropType<any>,
});
const emit = defineEmits(["row"]);
</script>
<template>
  <template :key="row?.id" v-for="(row, index) in rowData">
    <slot name="top" :row="row" />
    <tr
      @click="emit('row', row)"
      class="cursor-pointer hover:bg-gray-100 border-x-[0.2p border-b-[0.2p border-t-[0.2px]"
    >
      <td v-if="firstCol" class="p-3">
        <slot name="select" :row="row" />
      </td>
      <td class="p-4 font-medium">{{ index + 1 }}</td>
      <td
        class="p-2 py-4 font-medium max-w-40"
        :key="key"
        v-for="key in rowKeys"
      >
        <span v-if="!Object.keys(cells || {}) || !cells?.[key]">
          {{
            key.split(".").reduce((all: any, el: string) => {
              return all?.[el];
            }, row)
          }}
        </span>
        <component
          v-else-if="Object.keys(cells || {}) && cells[key].__hmrId"
          :row="row"
          :is="cells[key]"
        />
        <span v-else-if="typeof cells[key] == 'function'">
          {{ cells[key](row?.[key], row as T) }}
        </span>
      </td>
      <td
        class="p-3"
        v-if="headKeys.find((head) => head.toLowerCase() == 'actions')"
      >
        <slot name="actions" :row="row" />
      </td>
      <td
        class="p-3"
        v-if="headKeys.find((head) => head.toLowerCase() == 'reason')"
      >
        <slot name="reason" :row="row" />
      </td>
      <td v-if="lastCol" class="p-3">
        <slot name="lastCol" :row="row" />
      </td>
    </tr>
    <slot name="bottom" :row="row" />
  </template>
</template>
