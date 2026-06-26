<script setup>
import { computed, ref, watch } from "vue";
import Table from "./Table.vue";

// Define the props with appropriate types
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  headers: {
    type: [Array, Object],
    default: () => [],
  },
  rows: {
    type: Array,
    default: () => [],
  },
  cells: {
    type: Object,
    default: () => ({}),
  },
  toBeSelected: {
    type: String,
    required: true,
  },
  pending: {
    type: Boolean,
    default: false,
  },
  rowCom: {
    type: Object,
    default: null,
  },
  rowComProps: {
    type: Object,
    default: () => ({}),
  },
});

// Emit event for model update
const emit = defineEmits(['update:modelValue']);

// Helper to get value from row using dot-notation path
function getNestedValue(obj, path) {
  return path.split(".").reduce((state, name) => state?.[name], obj);
}

// Function to toggle selection of all rows
function toggleSelectAll(ev) {
  const target = ev.target;
  if (target.checked) {
    const allVals = props.rows.map((el) => getNestedValue(el, props.toBeSelected));
    emit('update:modelValue', allVals);
  } else {
    emit('update:modelValue', []);
  }
}

// Function to toggle individual data selection
function toggleData(data) {
  const current = props.modelValue ? [...props.modelValue] : [];
  const idx = current.findIndex((el) => el === data);
  if (idx === -1) {
    current.push(data);
  } else {
    current.splice(idx, 1);
  }
  emit('update:modelValue', current);
}

// Check if a specific row is selected
function isSelected(row) {
  const val = getNestedValue(row, props.toBeSelected);
  return (props.modelValue || []).includes(val);
}

// Computed property to check if all rows are selected
const allSelected = computed(() => {
  const modelVal = props.modelValue || [];
  return props.rows.length > 0 && modelVal.length === props.rows.length;
});

// Computed: some but not all selected (for indeterminate state)
const someSelected = computed(() => {
  const modelVal = props.modelValue || [];
  return modelVal.length > 0 && modelVal.length < props.rows.length;
});

// When rows change (e.g. after refetch), clean up stale selections
watch(() => props.rows, (newRows) => {
  if (newRows.length === 0) {
    emit('update:modelValue', []);
  }
});

// Expose for parent components
const selected = computed(() => props.modelValue || []);
defineExpose({ selected, toggleSelectAll, toggleData, isSelected, allSelected });
</script>

<template>
  <Table
    :last-col="true"
    :headers="headers"
    :cells="cells"
    :rows="rows"
    :pending="pending"
    :rowCom="rowCom"
    :rowComProps="{
      ...rowComProps,
      selectedItems: selected,
      toBeSelected: toBeSelected,
      onToggleSelect: toggleData,
    }"
  >
    <template #headerLast>
      <div class="flex items-center justify-center">
        <input
          :checked="allSelected"
          :indeterminate="someSelected"
          @change="toggleSelectAll"
          type="checkbox"
          class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </div>
    </template>
    <template #lastCol="{ row }">
      <div class="flex items-center justify-center">
        <input
          :checked="isSelected(row)"
          @change="() => toggleData(getNestedValue(row, toBeSelected))"
          type="checkbox"
          class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </div>
    </template>
    <!-- Fix: Use template with slot forwarding -->
    <template #actions="{ row }">
      <slot name="actions" :row="row" />
    </template>
  </Table>
</template>