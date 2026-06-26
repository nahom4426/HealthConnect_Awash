<script setup>
import { useAttrs } from "vue";

const attrs = useAttrs();
const props = defineProps(["label", "error"]);
</script>

<template>
  <div class="flex flex-col items-stretch w-full">
    <div class="flex flex-col w-full">
      <span v-if="label" class="text-xs font-semibold mb-1 text-slate-500">{{ label }}</span>
      <div
        :class="`${attrs?.class || ''} flex items-center w-full relative`"
      >
        <slot></slot>
      </div>
    </div>
    <span v-if="error" class="mt-[2px] text-xs text-red-500">{{ error }}</span>
  </div>
</template>
