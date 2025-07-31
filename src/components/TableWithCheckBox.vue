<script setup lang="ts" generic="T">
import { computed, ref, watch, type PropType } from "vue";
import Table from "./Table.vue";

const props = defineProps({
	modelValue: {
		type: Array as PropType<string[]>
	},
  headers: [Array, Object],
  rows: {
    type: Array as PropType<T[]>,
    default: [],
  },
  cells: Object,
  toBeSelected: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue'])
const selected = ref<string[]>(props.modelValue ? [...props.modelValue] : []);
function toggleSelectAll(ev: Event) {
  const target = ev.target as HTMLInputElement;
  if (target.checked) {
    selected.value = props.rows.map((el: any) => {
      return props.toBeSelected
        .split(".")
        .reduce((state: any, name: string) => {
          return state[name];
        }, el);
    });
  } else {
    selected.value = [];
  }
}

function toggleData(data: string) {
  const idx = selected.value.findIndex(
    (el: any) => el == data
  );
  if (idx == -1) {
    selected.value.push(data);
  } else {
    selected.value.splice(idx, 1);
  }
}

const allSelected = computed(() => {
  return selected.value?.length == props.rows?.length;
});

watch(selected, () => {
	emit('update:modelValue', selected.value)
}, {deep: true, flush: 'post'})

watch(() => props.modelValue, () => {
  selected.value = props.modelValue as string[]
})
</script>

<template>
  <Table
    :last-col="true"
    :headers="headers || []"
    :cells="cells || {}"
    :rows="rows || []"
  >
    <template #headerLast>
      <input :checked="allSelected" @change="toggleSelectAll" type="checkbox" />
    </template>
    <template #lastCol="{ row }">
      <input
        :checked="
					!!selected.find(
						(el: any) => el == row?.[toBeSelected]
					)
				"
        @change="() => toggleData(row?.[toBeSelected])"
        type="checkbox"
      />
    </template>
    <template #actions="{ row }">
      <slot name="actions" :row="row" />
    </template>
  </Table>
</template>
