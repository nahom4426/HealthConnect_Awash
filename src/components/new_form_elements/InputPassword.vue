<script setup>
import { ref } from "vue";
import Input from "./Input.vue";

const props = defineProps({
  attributes: {
    type: Object,
  },
});

const visible = ref(props.attributes?.type === "text");
</script>

<template>
  <Input
    :attributes="{
      autocomplete: 'current-password',
      ...attributes,
      type: visible ? 'text' : 'password',
    }"
  >
    <template #right>
      <button
        type="button"
        class="grid place-items-center w-10 h-[calc(var(--control-h)-2px)] shrink-0 text-ink-subtle transition-colors hover:text-ink focus-visible:text-primary"
        :aria-label="visible ? 'Hide password' : 'Show password'"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        <svg v-if="visible" class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7a13 13 0 0 1-2.2 3.3M6.6 6.6C4.5 8 3.1 10 2.5 12c1 2.5 4.5 7 9.5 7 1.7 0 3.2-.5 4.5-1.3" />
        </svg>
        <svg v-else class="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2.5 12C3.5 9.5 7 5 12 5s8.5 4.5 9.5 7c-1 2.5-4.5 7-9.5 7s-8.5-4.5-9.5-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </template>
  </Input>
</template>
