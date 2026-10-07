<script setup>
import { computed } from "vue";

const props = defineProps({
  page: { type: Number, default: 1 }, // 1-based
  totalPages: { type: Number, default: 1 },
  totalElements: { type: Number, default: 0 },
  perPage: { type: Number, default: 25 },
  perPageOptions: { type: Array, default: () => [25, 50, 75, 100] },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["change-page", "change-limit"]);

const pageNumbers = computed(() => {
  const total = props.totalPages;
  const current = props.page;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [1];
  if (current > 4) pages.push("…");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 3) pages.push("…");
  pages.push(total);
  return pages;
});

const rangeStart = computed(() => (props.page - 1) * props.perPage + 1);
const rangeEnd = computed(() => Math.min(props.page * props.perPage, props.totalElements));

function go(p) {
  if (props.disabled || p < 1 || p > props.totalPages || p === props.page) return;
  emit("change-page", p);
}
</script>

<template>
  <nav
    class="flex flex-col gap-3 justify-between items-center px-1 pt-3 sm:flex-row"
    aria-label="Table pagination"
  >
    <div class="flex flex-wrap gap-x-4 gap-y-2 justify-center items-center text-sm text-ink-muted">
      <label class="flex gap-2 items-center">
        <span>Rows per page</span>
        <select
          class="pl-2 pr-7 h-8 text-sm bg-no-repeat rounded-md border appearance-none cursor-pointer border-line-strong bg-surface text-ink bg-[length:1rem] bg-[right_0.375rem_center] bg-[url('data:image/svg+xml,%3csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20fill=%27none%27%20viewBox=%270%200%2020%2020%27%3e%3cpath%20stroke=%27%236b7280%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%20stroke-width=%271.5%27%20d=%27M6%208l4%204%204-4%27/%3e%3c/svg%3e')]"
          :value="perPage"
          :disabled="disabled"
          @change="emit('change-limit', parseInt($event.target.value))"
        >
          <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
        </select>
      </label>
      <span v-if="totalElements > 0" class="tabular-nums">
        {{ rangeStart }}–{{ rangeEnd }} of {{ totalElements }}
      </span>
    </div>

    <div class="flex gap-1 items-center">
      <button
        type="button"
        class="pagination-btn"
        :disabled="page <= 1 || disabled"
        aria-label="Previous page"
        @click="go(page - 1)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <template v-for="(p, i) in pageNumbers" :key="`${p}-${i}`">
        <span v-if="p === '…'" class="px-1 text-ink-subtle" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="hidden pagination-btn sm:flex"
          :class="{ 'pagination-btn-active !flex': p === page }"
          :aria-current="p === page ? 'page' : undefined"
          :aria-label="`Page ${p}`"
          :disabled="disabled"
          @click="go(p)"
        >
          {{ p }}
        </button>
      </template>

      <button
        type="button"
        class="pagination-btn"
        :disabled="page >= totalPages || disabled"
        aria-label="Next page"
        @click="go(page + 1)"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </nav>
</template>
