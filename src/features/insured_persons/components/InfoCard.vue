<!-- components/InfoRow.vue -->
<template>
  <div class="flex items-center gap-4 py-2">
    <h3 class="text-xs font-normal text-[#75778B] w-28">{{ label }}</h3>
    <p class="text-sm font-medium text-[#373946]">{{ value }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string
}>();
</script>
