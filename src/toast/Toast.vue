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

const paused = ref(false);
const run = ref(0); // restarts the countdown bar
const duration = computed(() => DURATION_MS[tone.value] ?? 3000);

function pause() {
  clearTimeout(timeout);
  paused.value = true;
}

function resume() {
  clearTimeout(timeout);
  paused.value = false;
  run.value += 1;
  timeout = setTimeout(dismiss, duration.value);
}

onMounted(resume);
onBeforeUnmount(() => clearTimeout(timeout));
</script>

<template>
  <div
    :role="tone === 'error' ? 'alert' : 'status'"
    :class="['toast', `toast--${tone}`, { 'toast--leave': leaving }]"
    @mouseenter="pause"
    @mouseleave="resume"
    @focusin="pause"
    @focusout="resume"
  >
    <span class="toast__icon" aria-hidden="true">
      <svg v-if="tone === 'success'" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="m4.5 10.5 3.5 3.5 7.5-8" />
      </svg>
      <svg v-else-if="tone === 'error'" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 6v5M10 14.5h.01" />
      </svg>
      <svg v-else class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
        <path d="M10 9v5M10 5.5h.01" />
      </svg>
    </span>

    <div class="flex-1 min-w-0 pt-px">
      <p v-if="toast?.title" class="text-sm font-semibold toast__title">{{ toast.title }}</p>
      <p class="text-sm break-words toast__text">{{ toast?.message }}</p>
    </div>

    <button type="button" class="toast__close" aria-label="Dismiss notification" @click="dismiss">
      <svg class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="m5 5 10 10M15 5 5 15" />
      </svg>
    </button>

    <!-- Time left before it closes (pauses on hover) -->
    <span
      :key="run"
      class="toast__timer"
      :style="{ animationDuration: `${duration}ms`, animationPlayState: paused ? 'paused' : 'running' }"
      aria-hidden="true"
    ></span>
  </div>
</template>

<style>
.toast {
  position: relative;
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  width: 100%;
  padding: 0.875rem 0.625rem 0.875rem 0.875rem;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 0.875rem;
  box-shadow: var(--shadow-pop);
  animation: toast-in 220ms var(--ease-out) both;
}
.toast--leave {
  animation: toast-out 160ms ease-in both;
}

.toast__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
}
.toast__close {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  margin: -0.25rem 0;
  border-radius: 0.5rem;
  transition: background-color 150ms ease, color 150ms ease;
}
.toast__timer {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  transform-origin: left;
  animation-name: toast-timer;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

/* Error: solid danger */
.toast--error {
  background: rgb(var(--error));
  color: #fff;
}
.toast--error .toast__icon {
  background: rgb(255 255 255 / 0.2);
  color: #fff;
}
.toast--error .toast__close {
  color: rgb(255 255 255 / 0.8);
}
.toast--error .toast__close:hover {
  background: rgb(255 255 255 / 0.15);
  color: #fff;
}
.toast--error .toast__timer {
  background: rgb(255 255 255 / 0.45);
}

/* Success: soft green with an accent edge */
.toast--success {
  background: rgb(var(--success-soft));
  border-color: rgb(var(--success) / 0.25);
  border-left: 4px solid rgb(var(--success));
  color: rgb(var(--success-strong));
}
.toast--success .toast__icon {
  background: rgb(var(--success));
  color: #fff;
}
.toast--success .toast__text {
  color: rgb(var(--ink));
}
.toast--success .toast__timer {
  background: rgb(var(--success) / 0.5);
}

/* Info: soft brand */
.toast--info {
  background: rgb(var(--surface));
  border-color: rgb(var(--primary) / 0.25);
  border-left: 4px solid rgb(var(--primary));
}
.toast--info .toast__icon {
  background: rgb(var(--primary));
  color: #fff;
}
.toast--info .toast__text {
  color: rgb(var(--ink));
}
.toast--info .toast__timer {
  background: rgb(var(--primary) / 0.45);
}

.toast--success .toast__close,
.toast--info .toast__close {
  color: rgb(var(--ink-subtle));
}
.toast--success .toast__close:hover,
.toast--info .toast__close:hover {
  background: rgb(var(--ink) / 0.06);
  color: rgb(var(--ink));
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
}
@keyframes toast-out {
  to {
    opacity: 0;
    transform: translateY(4px);
  }
}
@keyframes toast-timer {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .toast,
  .toast--leave {
    animation: none;
  }
  .toast__timer {
    display: none;
  }
}
</style>
