<script setup>
// How much of an open cover's annual limit is used: amber above 80%, red above 100% (FE-29).
import { computed } from "vue";

const props = defineProps({ pct: { type: Number, default: 0 }, label: { type: String, default: "" } });
const tone = computed(() => (props.pct > 100 ? "bg-error" : props.pct > 80 ? "bg-warning" : "bg-primary"));
</script>

<template>
  <div class="flex gap-2 items-center min-w-[7rem]">
    <div class="overflow-hidden flex-1 h-2 rounded-full bg-surface-raised" role="meter" :aria-valuenow="Math.round(pct)" aria-valuemin="0" aria-valuemax="100" :aria-label="label || 'Used of annual limit'">
      <div :class="['h-full rounded-full', tone]" :style="{ width: `${Math.min(100, pct)}%` }"></div>
    </div>
    <span class="text-xs tabular-nums text-ink-muted">{{ Math.round(pct) }}%</span>
  </div>
</template>
