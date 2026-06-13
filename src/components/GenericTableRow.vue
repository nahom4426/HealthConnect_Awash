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
  rowClass: {
    type: [String, Function] as PropType<string | ((row: T) => string)>,
    default: "",
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
  hideIndex: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["row"]);

// Helper to get nested property value
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Format cell value
const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};
</script>

<template>
  <template v-for="(row, index) in rowData" :key="(row as any)?.id ?? index">
    <slot name="top" :row="row" />
    <tr
      @click="emit('row', row)"
      :class="[
        'group cursor-pointer transition-colors duration-100 hover:bg-gray-50/80',
        typeof props.rowClass === 'function' ? props.rowClass(row) : props.rowClass,
      ]"
    >
      <!-- First column slot -->
      <td v-if="firstCol" class="px-4 py-2.5 whitespace-nowrap">
        <slot name="select" :row="row" />
      </td>

      <!-- Index column -->
      <td v-if="!hideIndex" class="px-4 py-2.5 text-xs font-medium text-gray-400 whitespace-nowrap tabular-nums w-12">
        {{ index + 1 }}
      </td>

      <!-- Dynamic data columns -->
      <td
        v-for="key in rowKeys"
        :key="key"
        class="px-4 py-2.5 max-w-[200px] text-sm text-gray-700 truncate"
      >
        <slot v-if="$slots[key]" :name="key" :row="row" />
        <slot v-else-if="$slots[`cell(${key})`]" :name="`cell(${key})`" :row="row" :value="getNestedValue(row, key)" />
        <span v-else-if="!cells || !cells[key]">
          {{ formatCellValue(getNestedValue(row, key)) }}
        </span>
        <component
          v-else-if="cells[key]?.__hmrId"
          :row="row"
          :value="getNestedValue(row, key)"
          :is="cells[key]"
        />
        <span v-else-if="typeof cells[key] === 'function'">
          {{ cells[key](getNestedValue(row, key), row) }}
        </span>
        <span v-else>
          {{ formatCellValue(getNestedValue(row, key)) }}
        </span>
      </td>

      <!-- Last column slot -->
      <td v-if="lastCol" class="px-4 py-2.5 whitespace-nowrap">
        <slot name="lastCol" :row="row" />
      </td>
    </tr>
    <slot name="bottom" :row="row" />
  </template>
</template>

<style scoped>
tr {
  transition: background-color 0.1s ease;
}
</style>