<script setup>
//import { mdiAttachment } from "@mdi/js";
import InputParent from "../new_form_builder/InputParent.vue";
//import BaseIcon from "../base/BaseIcon.vue";
import InputLayout from "./NewInputLayout.vue";
import { watch, ref } from "vue";

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

watch(file, () => {
  emit("update:modelValue", file.value);
});
</script>
<template>
  <InputParent
    v-model="file"
    :attributes="{ ...attributes, type: 'file' }"
    v-slot="{ setRef, error, value, name, changeValue }"
  >
    <InputLayout :error="error" :label="$attrs?.label">
      <label class="flex flex-1 items-center gap-2 h-9 px-3 cursor-pointer group">
        <!-- Upload icon -->
        <svg class="w-4 h-4 flex-shrink-0 text-gray-400 group-hover:text-gray-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
        </svg>
        <!-- Filename or placeholder -->
        <span
          class="truncate flex-1 text-sm"
          :class="value?.name ? 'text-gray-800' : 'text-gray-400'"
        >
          {{ value?.name || attributes?.placeholder || 'Choose file...' }}
        </span>
        <input class="hidden" :ref="setRef" />
      </label>
    </InputLayout>
  </InputParent>
</template>

<style></style>
