<script setup>
// Shared empty state (name kept for existing imports).
defineProps({
  title: {
    type: String,
    default: "No data available",
  },
  message: {
    type: String,
    default: "There are no items to display at the moment.",
  },
});
</script>

<template>
  <div class="flex flex-col gap-3 justify-center items-center px-4 py-10 text-center">
    <div class="grid place-items-center w-12 h-12 rounded-full bg-surface-muted ring-1 ring-line" aria-hidden="true">
      <svg class="w-6 h-6 text-ink-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 13h4l2 3h6l2-3h4" />
        <path d="M5.5 5.5 3 13v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5l-2.5-7.5A2 2 0 0 0 16.6 4H7.4a2 2 0 0 0-1.9 1.5Z" />
      </svg>
    </div>
    <div class="space-y-1 max-w-xs">
      <p class="text-sm font-semibold text-ink">{{ title }}</p>
      <p class="text-sm text-ink-muted">{{ message }}</p>
    </div>
    <slot />
  </div>
</template>
