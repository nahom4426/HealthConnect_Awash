<script setup>
import mark from "@/assets/img/nyala-mark.png";

defineProps({
  isLoading: { type: Boolean, default: true },
});
</script>

<template>
  <Transition name="app-loader">
    <div
      v-if="isLoading"
      class="flex fixed inset-0 z-[9999] flex-col gap-5 justify-center items-center bg-canvas"
      role="status"
      aria-live="polite"
    >
      <img :src="mark" alt="" width="56" height="56" class="w-14 h-14" />
      <div class="overflow-hidden w-32 h-1 rounded-full bg-line">
        <div class="app-loader-bar h-full rounded-full bg-primary" />
      </div>
      <span class="sr-only">Loading Nyala Insurance Health Connect…</span>
    </div>
  </Transition>
</template>

<style scoped>
.app-loader-bar {
  width: 40%;
  animation: app-loader-slide 1.1s var(--ease-out) infinite;
}

@keyframes app-loader-slide {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(250%);
  }
}

.app-loader-leave-active {
  transition: opacity 200ms ease;
}
.app-loader-leave-to {
  opacity: 0;
}
</style>
