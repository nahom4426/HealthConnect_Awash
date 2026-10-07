<script setup lang="ts">
import { useToast } from "./store/toast";
import Toast from "./Toast.vue";

const { toasts } = useToast();
</script>

<template>
  <div
    aria-live="polite"
    class="flex fixed inset-x-3 bottom-3 z-[10000] flex-col gap-2 pointer-events-none sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96"
  >
    <Toast
      v-for="{ id, toast } in toasts"
      :key="id"
      :id="id"
      :toast="toast"
      class="pointer-events-auto"
    />
  </div>
</template>
