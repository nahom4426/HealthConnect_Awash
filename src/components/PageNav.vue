<script setup>
const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, default: 1 },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(["update:page"]);
const go = (p) => !props.disabled && p >= 1 && p <= props.totalPages && emit("update:page", p);
const btn = "h-8 px-3 text-sm rounded-lg border border-line text-ink hover:bg-surface-muted disabled:opacity-40 disabled:hover:bg-transparent";
</script>

<template>
  <nav v-if="totalPages > 1" class="flex gap-2 justify-end items-center px-4 py-3 border-t border-line" aria-label="Pagination">
    <span class="mr-2 text-xs text-ink-subtle">Page {{ page }} of {{ totalPages }}</span>
    <button type="button" :class="btn" :disabled="disabled || page <= 1" @click="go(page - 1)">Previous</button>
    <button type="button" :class="btn" :disabled="disabled || page >= totalPages" @click="go(page + 1)">Next</button>
  </nav>
</template>
