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

let timeout: ReturnType<typeof setTimeout> | undefined;

const tone = computed(() => (props.toast?.type === "success" ? "success" : props.toast?.type === "info" ? "info" : "error"));
const duration = computed(() => DURATION_MS[tone.value] ?? 3000);

const paused = ref(false);
const run = ref(0); // restarts the countdown bar

// The list's <TransitionGroup> plays the exit animation
function dismiss() {
  clearTimeout(timeout);
  if (props.id) removeToast(props.id);
}

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
    :class="['toast', `toast--${tone}`]"
    @mouseenter="pause"
    @mouseleave="resume"
    @focusin="pause"
    @focusout="resume"
  >
    <span class="toast__icon" aria-hidden="true">
      <span class="toast__ring"></span>
      <svg v-if="tone === 'success'" class="toast__glyph" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
        <path class="toast__check" d="m4.5 10.5 3.5 3.5 7.5-8" />
      </svg>
      <svg v-else-if="tone === 'error'" class="toast__glyph" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 5.5v5.5M10 14.5h.01" />
      </svg>
      <svg v-else class="toast__glyph" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
        <path d="M10 9v5M10 5.5h.01" />
      </svg>
    </span>

    <div class="flex-1 self-center min-w-0">
      <template v-if="toast?.title">
        <p class="toast__title">{{ toast.title }}</p>
        <p class="toast__text">{{ toast?.message }}</p>
      </template>
      <p v-else class="toast__title">{{ toast?.message }}</p>
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
  padding: 0.875rem 0.625rem 1rem 0.875rem;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 1rem;
  box-shadow: 0 18px 40px -16px rgb(15 23 42 / 0.35), 0 4px 10px -4px rgb(15 23 42 / 0.12);
  transition: transform 200ms var(--ease-out), box-shadow 200ms var(--ease-out);
}
.toast:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 48px -16px rgb(15 23 42 / 0.4), 0 6px 14px -6px rgb(15 23 42 / 0.16);
}

.toast__title {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.25rem;
}
.toast__text {
  margin-top: 0.0625rem;
  font-size: 0.8125rem;
  line-height: 1.25rem;
  overflow-wrap: anywhere;
}

/* Icon: pops in, with a soft pulse ring */
.toast__icon {
  position: relative;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  animation: toast-icon-pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1) 80ms both;
}
.toast__glyph {
  width: 1rem;
  height: 1rem;
}
.toast__ring {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  animation: toast-ring 1.4s ease-out 200ms 2;
}
.toast__check {
  stroke-dasharray: 22;
  stroke-dashoffset: 22;
  animation: toast-check 360ms ease-out 260ms forwards;
}
.toast--error .toast__glyph {
  animation: toast-shake 420ms ease-in-out 300ms;
}

.toast__close {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  opacity: 0.75;
  transition: background-color 150ms ease, opacity 150ms ease, transform 150ms ease;
}
.toast__close:hover {
  opacity: 1;
  transform: rotate(90deg);
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

/* Error: lighter danger gradient */
.toast--error {
  background: linear-gradient(135deg, #ef4444 0%, #f56565 55%, #f87171 100%);
  border-color: rgb(255 255 255 / 0.18);
  color: #fff;
  box-shadow: 0 18px 40px -16px rgb(239 68 68 / 0.6), 0 4px 10px -4px rgb(185 28 28 / 0.25);
}
.toast--error .toast__icon {
  background: rgb(255 255 255 / 0.22);
  color: #fff;
}
.toast--error .toast__ring {
  box-shadow: 0 0 0 0 rgb(255 255 255 / 0.55);
}
.toast--error .toast__text {
  color: rgb(255 255 255 / 0.92);
}
.toast--error .toast__close {
  color: #fff;
}
.toast--error .toast__close:hover {
  background: rgb(255 255 255 / 0.18);
}
.toast--error .toast__timer {
  background: rgb(255 255 255 / 0.5);
}

/* Success / info: frosted card with a tinted wash */
.toast--success,
.toast--info {
  background-color: rgb(var(--surface) / 0.9);
  -webkit-backdrop-filter: blur(14px) saturate(160%);
  backdrop-filter: blur(14px) saturate(160%);
  border-color: rgb(var(--line));
  color: rgb(var(--ink));
}
.toast--success {
  background-image: linear-gradient(110deg, rgb(var(--success) / 0.14), rgb(var(--success) / 0.02) 60%);
}
.toast--info {
  background-image: linear-gradient(110deg, rgb(var(--primary) / 0.12), rgb(var(--primary) / 0.02) 60%);
}
.toast--success .toast__icon {
  background: linear-gradient(135deg, rgb(var(--success)), rgb(var(--success) / 0.75));
  color: #fff;
}
.toast--success .toast__ring {
  box-shadow: 0 0 0 0 rgb(var(--success) / 0.45);
}
.toast--success .toast__title {
  color: rgb(var(--success-strong));
}
.toast--info .toast__icon {
  background: linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary) / 0.75));
  color: #fff;
}
.toast--info .toast__ring {
  box-shadow: 0 0 0 0 rgb(var(--primary) / 0.4);
}
.toast--info .toast__title {
  color: rgb(var(--primary));
}
.toast--success .toast__text,
.toast--info .toast__text {
  color: rgb(var(--ink-muted));
}
.toast--success .toast__close,
.toast--info .toast__close {
  color: rgb(var(--ink-subtle));
}
.toast--success .toast__close:hover,
.toast--info .toast__close:hover {
  background: rgb(var(--ink) / 0.06);
}
.toast--success .toast__timer {
  background: linear-gradient(90deg, rgb(var(--success)), rgb(var(--success) / 0.4));
}
.toast--info .toast__timer {
  background: linear-gradient(90deg, rgb(var(--primary)), rgb(var(--primary) / 0.4));
}

@keyframes toast-icon-pop {
  from {
    opacity: 0;
    transform: scale(0.4) rotate(-20deg);
  }
}
@keyframes toast-ring {
  to {
    box-shadow: 0 0 0 10px rgb(255 255 255 / 0);
  }
}
@keyframes toast-check {
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes toast-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-2px);
  }
  40%,
  80% {
    transform: translateX(2px);
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
  .toast__icon,
  .toast__ring,
  .toast--error .toast__glyph {
    animation: none;
    transition: none;
  }
  .toast__check {
    animation: none;
    stroke-dashoffset: 0;
  }
  .toast__timer {
    display: none;
  }
}
</style>
