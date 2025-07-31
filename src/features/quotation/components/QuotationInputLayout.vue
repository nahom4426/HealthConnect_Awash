<script setup>
const props = defineProps(["label", "error"]);
</script>

<template>
  <div class="flex flex-col items-start">
    <div class="flex flex-col">
      <span v-if="label" class="text-xs mb-1">{{ label }}</span>
      <div
        class="focus-within:sys-focus bg-base-clr4 flex w-full border h-8 rounded-md"
      >
        <slot></slot>
      </div>
    </div>
    <span v-if="error" class="mt-[2px] text-xs text-red-500">{{ error }}</span>
  </div>
</template>
