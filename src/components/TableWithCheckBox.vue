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
  showPagination: {
    type: Boolean,
    default: true,
  },
});

// Emit event for model update
const emit = defineEmits(['update:modelValue']);

// Helper to get value from row using dot-notation path
function getNestedValue(obj, path) {
  if (!path || !obj) return undefined;
  return path.split(".").reduce((state, name) => state?.[name], obj);
}

// Claims that are already paid can't be selected again (ported from Awash "Pagination")
const selectableRows = computed(() =>
  (props.rows || []).filter((r) => {
    const status = String(r?.serviceClaimStatus || "").toUpperCase();
    return status !== "PAYED" && status !== "PAID";
  })
);

// Function to toggle selection of all rows
function toggleSelectAll(ev) {
  const target = ev.target;
  if (target.checked) {
    const allVals = selectableRows.value
      .map((el) => getNestedValue(el, props.toBeSelected))
      .filter(Boolean);
    emit('update:modelValue', allVals);
  } else {
    emit('update:modelValue', []);
  }
}

// Function to toggle individual data selection
function toggleData(data) {
  if (!data) return;
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
const selectableIds = computed(() =>
  selectableRows.value.map((r) => getNestedValue(r, props.toBeSelected)).filter(Boolean)
);

const allSelected = computed(() => {
  const modelVal = props.modelValue || [];
  return selectableIds.value.length > 0 && selectableIds.value.every((id) => modelVal.includes(id));
});

// Computed: some but not all selected (for indeterminate state)
const someSelected = computed(() => {
  const modelVal = props.modelValue || [];
  return !allSelected.value && selectableIds.value.some((id) => modelVal.includes(id));
});

// When rows change (e.g. after refetch), clean up stale selections
// Rows can disappear (e.g. rejected services are removed): drop their ids too
watch(selectableIds, (ids) => {
  const modelVal = props.modelValue || [];
  const kept = modelVal.filter((id) => ids.includes(id));
  if (kept.length !== modelVal.length) emit('update:modelValue', kept);
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
    :show-pagination="showPagination"
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
          class="w-4 h-4 rounded border-line-strong text-primary focus:ring-primary cursor-pointer"
        />
      </div>
    </template>
    <template #lastCol="{ row }">
      <div class="flex items-center justify-center">
        <input
          :checked="isSelected(row)"
          @change="() => toggleData(getNestedValue(row, toBeSelected))"
          type="checkbox"
          class="w-4 h-4 rounded border-line-strong text-primary focus:ring-primary cursor-pointer"
        />
      </div>
    </template>
    <!-- Fix: Use template with slot forwarding -->
    <template #actions="{ row }">
      <slot name="actions" :row="row" />
    </template>
  </Table>
</template>