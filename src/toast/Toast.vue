<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useToast } from "./store/toast.js";

// Successes clear quickly; errors stay a little longer so they can be read
const DURATION_MS = { success: 3000, info: 3000, error: 5000 };

const { removeToast } = useToast();
const props = defineProps({
  toast: {
    type: Object,
  },
  id: String,
});

const leaving = ref(false);
let timeout: ReturnType<typeof setTimeout> | undefined;

const tone = computed(() => (props.toast?.type === "success" ? "success" : props.toast?.type === "info" ? "info" : "error"));

function dismiss() {
  clearTimeout(timeout);
  if (leaving.value) return;
  leaving.value = true;
  setTimeout(() => props.id && removeToast(props.id), 160);
}

function pause() {
  clearTimeout(timeout);
}

function resume() {
  clearTimeout(timeout);
  timeout = setTimeout(dismiss, DURATION_MS[tone.value] ?? 3000);
}

onMounted(resume);
onBeforeUnmount(() => clearTimeout(timeout));
</script>

<template>
  <div
    :role="tone === 'error' ? 'alert' : 'status'"
    class="toast flex gap-3 items-start p-3.5 pr-2.5 w-full rounded-xl border shadow-pop bg-surface border-line"
    :class="{ 'toast--leave': leaving }"
    @mouseenter="pause"
    @mouseleave="resume"
    @focusin="pause"
    @focusout="resume"
  >
    <span
      class="grid place-items-center mt-px w-5 h-5 rounded-full shrink-0"
      :class="{
        'bg-emerald-100 text-emerald-700': tone === 'success',
        'bg-red-100 text-red-700': tone === 'error',
        'bg-blue-100 text-blue-700': tone === 'info',
      }"
      aria-hidden="true"
    >
      <svg v-if="tone === 'success'" class="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="m4.5 10.5 3.5 3.5 7.5-8" />
      </svg>
      <svg v-else class="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
        <path d="M10 5v6M10 15h.01" />
      </svg>
    </span>

    <p class="flex-1 pt-px text-sm break-words text-ink">{{ toast?.message }}</p>

    <button
      type="button"
      class="grid place-items-center -my-1 w-7 h-7 rounded-md transition-colors shrink-0 text-ink-subtle hover:bg-surface-muted hover:text-ink"
      aria-label="Dismiss notification"
      @click="dismiss"
    >
      <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="m5 5 10 10M15 5 5 15" />
      </svg>
    </button>
  </div>
</template>

<style>
.toast {
  animation: toast-in 200ms var(--ease-out) both;
}
.toast--leave {
  animation: toast-out 160ms ease-in both;
}
@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
@keyframes toast-out {
  to {
    opacity: 0;
    transform: translateY(4px);
  }
}
</style>
