<script setup>
import Input from "./Input.vue";

defineProps({
  attributes: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <Input
    :attributes="{
      autocomplete: 'email',
      inputmode: 'email',
      ...attributes,
      type: 'text',
    }"
  >
    <template #left>
      <span class="grid place-items-center pl-3 shrink-0 text-ink-subtle" aria-hidden="true">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </span>
    </template>
  </Input>
</template>
