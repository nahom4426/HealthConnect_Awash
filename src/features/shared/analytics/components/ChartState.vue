<script setup>
// Shows a chart only when its report returned data; otherwise explains why not.
defineProps({
  /** { state: 'pending' | 'missing' | 'empty' | 'error' | 'ok', expected: string, error?: string } */
  status: { type: Object, default: () => ({ state: "pending" }) },
  height: { type: String, default: "300px" },
});
</script>

<template>
  <div v-if="status.state === 'ok'">
    <slot />
  </div>

  <div v-else-if="status.state === 'pending'" class="skeleton" :style="{ height }" aria-label="Loading chart" />

  <div
    v-else
    class="flex flex-col gap-2 justify-center items-center px-6 text-center rounded-lg border border-dashed border-line bg-surface-muted"
    :style="{ height }"
    role="status"
  >
    <svg class="w-6 h-6 text-ink-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 3v18h18M7 15l4-4 3 3 5-6" />
    </svg>
    <template v-if="status.state === 'missing'">
      <p class="text-sm font-medium text-ink">Report not configured</p>
      <p class="max-w-xs text-xs text-ink-muted">
        This chart needs the <span class="font-medium">“{{ status.expected }}”</span> report, which isn't set up on the report server yet.
      </p>
    </template>
    <template v-else-if="status.state === 'empty'">
      <p class="text-sm font-medium text-ink">No data for these filters</p>
      <p class="max-w-xs text-xs text-ink-muted">“{{ status.expected }}” returned no rows. Try a wider date range.</p>
    </template>
    <template v-else>
      <p class="text-sm font-medium text-ink">Couldn't load this chart</p>
      <p class="max-w-xs text-xs text-ink-muted">{{ status.error || `“${status.expected}” failed to run.` }}</p>
    </template>
  </div>
</template>
