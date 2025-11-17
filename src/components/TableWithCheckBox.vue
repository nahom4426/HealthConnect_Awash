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
});

// Emit event for model update
const emit = defineEmits(['update:modelValue']);

const selected = ref(props.modelValue ? [...props.modelValue] : []);

// Function to toggle selection of all rows
function toggleSelectAll(ev) {
  const target = ev.target;
  if (target.checked) {
    selected.value = props.rows.map((el) => {
      return props.toBeSelected
        .split(".")
        .reduce((state, name) => {
          return state[name];
        }, el);
    });
  } else {
    selected.value = [];
  }
}

// Function to toggle individual data selection
function toggleData(data) {
  const idx = selected.value.findIndex((el) => el === data);
  if (idx === -1) {
    selected.value.push(data);
  } else {
    selected.value.splice(idx, 1);
  }
}

// Computed property to check if all rows are selected
const allSelected = computed(() => {
  return selected.value.length === props.rows.length;
});

// Watch for changes in selected items
watch(selected, () => {
  emit('update:modelValue', selected.value);
}, { deep: true, flush: 'post' });

// Watch for changes in modelValue prop
watch(() => props.modelValue, () => {
  selected.value = props.modelValue;
});
</script>

<template>
  <Table
    :last-col="true"
    :headers="headers"
    :cells="cells"
    :rows="rows"
  >
    <template #headerLast>
      <input :checked="allSelected" @change="toggleSelectAll" type="checkbox" />
    </template>
    <template #lastCol="{ row }">
      <input
        :checked="selected.includes(row?.[toBeSelected])"
        @change="() => toggleData(row?.[toBeSelected])"
        type="checkbox"
      />
    </template>
    <template #actions="{ row }">
      <slot name="actions" :row="row" />
    </template>
  </Table>
</template>