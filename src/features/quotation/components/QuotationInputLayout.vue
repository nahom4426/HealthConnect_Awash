<script setup>
import { useAttrs } from "vue";

const attrs = useAttrs();
const props = defineProps(["label", "error"]);
</script>

<template>
  <div class="flex flex-col items-start">
    <div class="flex flex-col">
      <span v-if="label" class="text-xs font-semibold mb-1">{{ label }}</span>
      <div
        :class="`${attrs?.class || ''} focus-within:sys-focus bg-base-clr4 flex items-center w-full border min-h-9 h-9 rounded-md`"
      >
        <slot></slot>
      </div>
    </div>
    <span v-if="error" class="mt-[2px] text-xs text-red-500">{{ error }}</span>
  </div>
</template>
