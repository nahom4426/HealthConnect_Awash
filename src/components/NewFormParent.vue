<script setup lang="ts">
import { closeModal } from "@customizer/modal-x";

defineProps({
  size: {
    type: String,
    default: "md",
  },
  title: String,
  subtitle: String,
  goBack: {
    type: Boolean,
    default: false,
  },
  onGoBack: {
    type: Function,
  },
  error: {
    type: String,
  },
  showCloseModal: {
    type: Boolean,
    default: true,
  },
  isEdit: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <div :class="[$style[size]]" class="flex overflow-hidden flex-col justify-between max-w-full bg-surface">
    <header class="flex gap-3 justify-between items-center py-3 pr-3 pl-5 border-b border-line shrink-0">
      <div class="flex gap-2 items-center min-w-0">
        <button
          v-if="goBack"
          type="button"
          class="grid place-items-center -ml-2 w-8 h-8 rounded-lg text-ink-muted hover:bg-surface-muted hover:text-ink"
          aria-label="Go back"
          @click="() => onGoBack && onGoBack()"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M16 10H4m0 0 5-5m-5 5 5 5" />
          </svg>
        </button>
        <div class="min-w-0">
          <h2 class="!px-0 text-base font-semibold truncate text-ink">{{ title }}</h2>
          <p v-if="subtitle" class="text-xs truncate text-ink-muted">{{ subtitle }}</p>
        </div>
      </div>
      <div class="flex gap-2 items-center shrink-0">
        <slot name="right-actions" />
        <button
          v-if="showCloseModal"
          type="button"
          class="grid place-items-center w-8 h-8 rounded-lg text-ink-subtle hover:bg-surface-muted hover:text-ink"
          aria-label="Close"
          @click.prevent="closeModal()"
        >
          <svg class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
            <path d="m5 5 10 10M15 5 5 15" />
          </svg>
        </button>
      </div>
    </header>

    <div class="flex overflow-y-auto flex-col flex-1 gap-4 p-4 form-scrollbar sm:p-5" style="max-height: calc(100dvh - 6rem)">
      <slot />
    </div>
    <slot name="bottom" />
  </div>
</template>

<style module>
.md {
  width: 35rem;
  max-height: calc(100dvh - 2rem);
}
.mdd {
  width: 55rem;
  max-height: calc(100dvh - 2rem);
}
.lg {
  width: 60rem;
  max-height: calc(100dvh - 2rem);
}
.xmd {
  width: 75rem;
  max-height: calc(100dvh - 2rem);
}
.xl {
  width: 100%;
  max-height: calc(100dvh - 2rem);
}
.xs {
  max-width: 80%;
}
</style>

<style>
.form-layout {
  display: grid;
}
</style>
