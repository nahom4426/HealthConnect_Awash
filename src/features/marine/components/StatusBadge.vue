<script setup>
// Coloured status pill: `entity` + `status` pick the colour from the plan's status table.
import { computed } from "vue";
import { STATUS_LABELS, STATUS_TONES } from "../constants";

const props = defineProps({
  entity: { type: String, required: true },
  status: { type: String, default: "" },
  size: { type: String, default: "sm" },
});

const CLASSES = {
  grey: "bg-surface-raised text-ink-muted",
  blue: "bg-primary/10 text-primary",
  amber: "bg-warning-soft text-warning-strong",
  green: "bg-success-soft text-success-strong",
  teal: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200",
  red: "bg-error-soft text-error-strong",
};

const tone = computed(() => STATUS_TONES[props.entity]?.[props.status] ?? "grey");
const label = computed(() => {
  const custom = STATUS_LABELS[props.entity]?.[props.status];
  if (custom) return custom;
  const s = String(props.status || "—").replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap',
      size === 'lg' ? 'px-4 py-1.5 text-base' : 'px-2.5 py-0.5 text-xs',
      CLASSES[tone],
    ]"
  >
    <span :class="['rounded-full bg-current opacity-70', size === 'lg' ? 'w-2.5 h-2.5' : 'w-1.5 h-1.5']" aria-hidden="true"></span>
    {{ label }}
  </span>
</template>
