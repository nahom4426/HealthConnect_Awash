<!-- DefaultPage.vue — standard page surface: optional toolbar (search + actions) and content -->
<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: String,
  placeholder: String,
  first: {
    type: Boolean,
    default: true,
  },
  hideSearch: {
    type: Boolean,
    default: false,
  },
  button: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);

const search = ref(props.modelValue || "");

watch(search, () => {
  emit("update:modelValue", search.value);
});
</script>

<template>
  <div class="flex flex-col gap-4 p-3 max-w-full card sm:p-5">
    <div
      v-if="(!props.hideSearch && props.first) || $slots.first || $slots.header || $slots.filter || $slots['add-action'] || $slots.more"
      class="flex flex-col flex-shrink-0 gap-3 justify-between items-stretch md:flex-row md:items-center md:gap-6"
    >
      <!-- Search -->
      <div
        v-if="props.first && !props.hideSearch"
        role="search"
        class="flex overflow-hidden items-center w-full rounded-lg border transition-shadow md:max-w-sm h-control border-line-strong bg-surface focus-within:border-primary focus-within:shadow-focus"
      >
        <span class="grid place-items-center pl-3 text-ink-subtle" aria-hidden="true">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </span>
        <input
          v-model="search"
          type="search"
          :placeholder="placeholder || 'Search…'"
          :aria-label="placeholder || 'Search'"
          class="flex-1 px-2.5 h-full min-w-0 text-base bg-transparent sm:text-sm placeholder:text-ink-subtle/80 focus-visible:outline-none"
        />
        <button v-if="button" type="button" class="px-3 h-full text-sm font-medium border-l border-line text-ink-muted hover:bg-surface-muted">
          {{ button }}
        </button>
      </div>
      <slot v-else name="first" />

      <div class="flex flex-col flex-wrap gap-2 justify-end items-stretch w-full sm:flex-row sm:items-center sm:gap-3 md:w-auto">
        <slot name="header" />
        <slot name="filter" />
        <slot name="add-action" />
        <slot name="more" />
      </div>
    </div>

    <slot :search="search" />
  </div>
</template>
