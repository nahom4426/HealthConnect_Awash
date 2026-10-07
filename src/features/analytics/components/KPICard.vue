<script setup lang="ts">
// KPI tile matching the dashboard's: tinted icon, label, value, optional change.
defineProps({
  title: String,
  value: String,
  /** e.g. "+4.2%". Omit when no real comparison is available — nothing is shown. */
  change: { type: String, default: null },
  trend: String, // 'up' | 'down'
  /** SVG path data for a 24×24 stroke icon */
  icon: String,
  /** "good" | "bad" | "neutral" — colour of the change, independent of direction */
  sentiment: { type: String, default: "neutral" },
});
</script>

<template>
  <div class="flex gap-4 items-start p-4 card sm:p-5">
    <span
      v-if="icon"
      class="grid place-items-center w-10 h-10 rounded-lg shrink-0 bg-primary/[0.07] text-primary"
      aria-hidden="true"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path :d="icon" />
      </svg>
    </span>
    <div class="flex-1 min-w-0">
      <p class="text-sm leading-snug line-clamp-2 text-ink-muted" :title="title">{{ title }}</p>
      <p class="mt-1 text-2xl font-semibold tracking-tight tabular-nums truncate text-ink" :title="value">{{ value }}</p>
      <p v-if="change" class="flex gap-1 items-center mt-1 text-xs">
        <span
          class="font-medium tabular-nums"
          :class="sentiment === 'good' ? 'text-success' : sentiment === 'bad' ? 'text-error' : 'text-ink-muted'"
        >
          {{ trend === "down" ? "▼" : "▲" }} {{ change.replace(/^[+-]/, "") }}
        </span>
        <span class="text-ink-subtle">vs last period</span>
      </p>
    </div>
  </div>
</template>
