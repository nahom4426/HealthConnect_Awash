<script setup>
// Generic yes/no confirmation. data: { title, message, confirmText?, cancelText?, tone?: "primary" | "danger" }
// Resolves the modal with true (yes) or false (no).
import { closeModal } from "@customizer/modal-x";

const props = defineProps({
  data: Object,
});

function yes() {
  closeModal(true);
}

function no() {
  closeModal(false);
}
</script>
<template>
  <div class="grid place-items-center p-4 h-full bg-ink/40" @click.self="no">
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      class="overflow-hidden w-full max-w-md rounded-2xl border shadow-pop bg-surface border-line confirm-pop"
    >
      <div class="flex gap-4 items-start p-5">
        <span
          :class="[
            'grid place-items-center w-10 h-10 rounded-full shrink-0',
            data?.tone === 'danger' ? 'bg-error-soft text-error' : 'bg-primary/10 text-primary',
          ]"
          aria-hidden="true"
        >
          <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 6.5v4.5M10 14h.01" /><circle cx="10" cy="10" r="7.5" />
          </svg>
        </span>
        <div class="flex-1 min-w-0">
          <h2 id="confirm-title" class="text-base font-semibold text-ink">{{ data?.title || "Are you sure?" }}</h2>
          <p id="confirm-message" class="mt-1 text-sm leading-relaxed text-ink-muted">{{ data?.message }}</p>
        </div>
      </div>
      <div class="flex gap-2 justify-end px-5 py-3 border-t bg-surface-muted border-line">
        <button
          type="button"
          class="px-4 h-9 text-sm font-medium rounded-lg border transition-colors border-line-strong text-ink hover:bg-surface"
          @click="no"
        >
          {{ data?.cancelText || "No" }}
        </button>
        <button
          type="button"
          :class="[
            'px-4 h-9 text-sm font-semibold text-white rounded-lg shadow-sm transition-colors',
            data?.tone === 'danger' ? 'bg-error hover:bg-error-strong' : 'bg-primary hover:bg-primary-hover',
          ]"
          autofocus
          @click="yes"
        >
          {{ data?.confirmText || "Yes" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-pop {
  animation: confirm-pop 220ms cubic-bezier(0.22, 1.2, 0.36, 1) both;
}
@keyframes confirm-pop {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }
}
@media (prefers-reduced-motion: reduce) {
  .confirm-pop {
    animation: none;
  }
}
</style>
