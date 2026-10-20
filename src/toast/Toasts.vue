<script setup lang="ts">
import { useToast } from "./store/toast";
import Toast from "./Toast.vue";

const { toasts } = useToast();
</script>

<template>
  <div
    aria-live="polite"
    class="flex fixed inset-x-3 bottom-3 z-[10000] flex-col gap-2.5 pointer-events-none sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96"
  >
    <TransitionGroup name="toast-list">
      <Toast
        v-for="{ id, toast } in toasts"
        :key="id"
        :id="id"
        :toast="toast"
        class="pointer-events-auto"
      />
    </TransitionGroup>
  </div>
</template>

<style>
/* Slide in from the right with a little spring; slide out the same way */
.toast-list-enter-active {
  transition: transform 460ms cubic-bezier(0.22, 1.25, 0.36, 1), opacity 260ms ease;
}
.toast-list-leave-active {
  transition: transform 260ms ease-in, opacity 220ms ease-in;
  position: absolute;
  right: 0;
  width: 100%;
}
.toast-list-enter-from {
  opacity: 0;
  transform: translateX(110%) scale(0.96);
}
.toast-list-leave-to {
  opacity: 0;
  transform: translateX(110%);
}
/* The others glide into place */
.toast-list-move {
  transition: transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

@media (prefers-reduced-motion: reduce) {
  .toast-list-enter-active,
  .toast-list-leave-active,
  .toast-list-move {
    transition: opacity 150ms ease;
  }
  .toast-list-enter-from,
  .toast-list-leave-to {
    transform: none;
  }
}
</style>
