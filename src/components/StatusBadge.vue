<script setup>
// Status pill for backend status enums (Life colours as listed in docs/life-insurance/07-status-lifecycle.md)
import { computed } from "vue";

const props = defineProps({ status: { type: String, default: "" } });

const TONES = {
  success: ["ACTIVE", "PAID", "AUTHORIZED"],
  info: ["ISSUED", "MODIFIED", "RENEWED", "REVIEWED", "REQUESTED", "REGISTERED"],
  warning: ["ACCEPTED", "LAPSED", "REVISED", "APPROVED"],
  danger: ["CANCELLED", "REJECTED", "DENIED"],
};
const CLASSES = {
  success: "bg-success-soft text-success-strong",
  info: "bg-primary/10 text-primary",
  warning: "bg-warning-soft text-warning-strong",
  danger: "bg-error-soft text-error-strong",
  neutral: "bg-surface-raised text-ink-muted",
};

const tone = computed(() => {
  const s = String(props.status || "").toUpperCase();
  return Object.keys(TONES).find((t) => TONES[t].includes(s)) || "neutral";
});
const label = computed(() => {
  const s = String(props.status || "—");
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/_/g, " ");
});
</script>

<template>
  <span :class="['inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap', CLASSES[tone]]">
    <span class="w-1.5 h-1.5 rounded-full bg-current opacity-70" aria-hidden="true"></span>
    {{ label }}
  </span>
</template>
