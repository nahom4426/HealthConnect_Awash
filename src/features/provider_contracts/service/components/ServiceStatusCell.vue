<script setup>
import { computed } from 'vue';

const props = defineProps({
  row: { type: Object, required: true },
});

const statusStyle = computed(() => {
  const s = (props.row?.status || '').toUpperCase();
  if (s === 'ACTIVE') return 'bg-success-soft text-success-strong ring-success/20';
  if (s === 'INACTIVE') return 'bg-surface-muted text-ink-muted ring-line';
  if (s === 'SUSPENDED') return 'bg-warning-soft text-warning-strong ring-warning/20';
  if (s === 'PENDING') return 'bg-primary/10 text-primary-hover ring-primary/20';
  if (s === 'DEACTIVATED' || s === 'CANCELLED') return 'bg-error-soft text-error-strong ring-error/20';
  return 'bg-surface-muted text-ink-muted ring-line';
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
