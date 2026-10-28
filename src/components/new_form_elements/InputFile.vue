<script setup>
import { ref, useId, watch } from "vue";
import InputParent from "../new_form_builder/InputParent.vue";
import InputLayout from "./NewInputLayout.vue";

const props = defineProps({
  modelValue: {
    required: false,
  },
  attributes: {
    type: Object,
  },
});
const emit = defineEmits(["update:modelValue"]);
const file = ref(props.modelValue || "");
const inputId = props.attributes?.id || useId();

watch(file, () => {
  emit("update:modelValue", file.value);
});
</script>

<template>
  <InputParent
    v-model="file"
    :attributes="{ ...attributes, type: 'file' }"
    v-slot="{ setRef, error, value }"
  >
    <InputLayout
      :error="error"
      :label="$attrs?.label"
      :validation="$attrs?.validation"
      :input-id="inputId"
    >
      <label
        :for="inputId"
        class="flex relative gap-2 items-center px-3 w-full cursor-pointer h-[calc(var(--control-h)-2px)]"
      >
        <svg class="w-4 h-4 shrink-0 text-ink-subtle" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />
        </svg>
        <span class="flex-1 text-sm truncate" :class="value?.name ? 'text-ink' : 'text-ink-subtle'">
          {{ value?.name || attributes?.placeholder || "Choose a file" }}
        </span>
        <span class="text-xs font-medium text-primary shrink-0">Browse</span>
        <input :id="inputId" class="sr-only" :ref="setRef" />
      </label>
    </InputLayout>
  </InputParent>
</template>
