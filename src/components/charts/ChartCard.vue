<script setup lang="ts">
defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: "",
  },
  /** Deprecated: decorative icons are no longer rendered */
  icon: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <section class="card">
    <header class="px-5 pt-5">
      <h2 class="!px-0 text-sm font-semibold text-ink">{{ title }}</h2>
      <p v-if="subtitle" class="text-xs text-ink-subtle">{{ subtitle }}</p>
    </header>
    <div class="p-5 w-full">
      <slot />
    </div>
  </section>
</template>
