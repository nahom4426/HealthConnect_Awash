<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  back: { type: String, default: "" },
});
</script>

<template>
  <header class="flex flex-wrap gap-4 justify-between items-start mb-5">
    <div class="min-w-0">
      <RouterLink
        v-if="back"
        :to="back"
        class="inline-flex gap-1 items-center mb-1 text-xs font-medium text-ink-subtle hover:text-primary"
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15l-5-5 5-5" stroke-linecap="round" stroke-linejoin="round" /></svg>
        Back
      </RouterLink>
      <div class="flex flex-wrap gap-2 items-center">
        <h1 class="text-xl font-semibold tracking-tight text-ink">{{ title }}</h1>
        <slot name="badge" />
      </div>
      <p v-if="subtitle" class="mt-1 max-w-2xl text-sm text-ink-muted">{{ subtitle }}</p>
    </div>
    <div class="flex flex-wrap gap-2 items-center">
      <slot name="actions" />
    </div>
  </header>
</template>
