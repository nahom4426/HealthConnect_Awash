<script setup>
import { computed } from 'vue';

const props = defineProps({
  row: { type: Object, required: true },
});

const statusStyle = computed(() => {
  const s = (props.row?.status || '').toUpperCase();
  if (s === 'ACTIVE') return 'bg-green-100 text-green-700 ring-green-200';
  if (s === 'INACTIVE') return 'bg-gray-100 text-gray-700 ring-gray-200';
  if (s === 'SUSPENDED') return 'bg-yellow-100 text-yellow-700 ring-yellow-200';
  if (s === 'PENDING') return 'bg-blue-100 text-blue-700 ring-blue-200';
  if (s === 'DEACTIVATED' || s === 'CANCELLED') return 'bg-red-100 text-red-700 ring-red-200';
  return 'bg-slate-100 text-slate-700 ring-slate-200';
});
</script>

<template>
  <span
    class="px-2.5 py-1 rounded-full text-xs font-medium ring-1 capitalize"
    :class="statusStyle"
  >
    {{ row?.status || 'UNKNOWN' }}
  </span>
</template>
