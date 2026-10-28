<script setup>
// Days to a deadline (plan section 3, FE-36): green over 7 days, amber 7 or less, red overdue, grey met.
import { computed } from "vue";
import { daysBetween, formatDate, todayIso } from "../utils/format";
import { deadlineTone } from "../utils/deadlines";

const props = defineProps({
  dueDate: { type: String, required: true },
  status: { type: String, default: "OPEN" }, // OPEN | MET
  today: { type: String, default: "" },
});

const tone = computed(() => deadlineTone(props.dueDate, props.status, props.today || todayIso()));
const days = computed(() => daysBetween(props.today || todayIso(), props.dueDate));
const text = computed(() => {
  if (tone.value === "met") return "Met";
  if (days.value < 0) return `${-days.value} day${days.value === -1 ? "" : "s"} overdue`;
  if (days.value === 0) return "Due today";
  return `${days.value} day${days.value === 1 ? "" : "s"} left`;
});
const CLASSES = {
  met: "bg-surface-raised text-ink-muted",
  overdue: "bg-error-soft text-error-strong",
  due: "bg-warning-soft text-warning-strong",
  open: "bg-success-soft text-success-strong",
};
</script>

<template>
  <span :class="['inline-flex px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap', CLASSES[tone]]" :title="`Due ${formatDate(dueDate)}`">{{ text }}</span>
</template>
