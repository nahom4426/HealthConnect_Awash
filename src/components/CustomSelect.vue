<script setup lang="ts">
/** Standalone native select for filters (not part of the form builder). */
import { computed, ref, watch, type PropType } from "vue";

type ArrayOfObjects = { value: string; label: string };

const props = defineProps({
  pending: {
    type: Boolean,
    default: false,
  },
  modelValue: String,
  options: {
    type: Array as PropType<string[] | ArrayOfObjects[]>,
    required: true,
  },
  placeholder: String,
});
const emit = defineEmits(["update:modelValue"]);

const value = ref(props.modelValue ?? "");

// Reflect external changes (e.g. a filter "clear" resetting the model)
watch(
  () => props.modelValue,
  (next) => {
    value.value = next ?? "";
  }
);

const normalizedOptions = computed<ArrayOfObjects[]>(() =>
  (props.options as (string | ArrayOfObjects)[]).map((o) =>
    typeof o === "object" ? o : { value: o, label: o }
  )
);

// Pages often include their own "All" option with an empty value — don't add a second one
const hasEmptyOption = computed(() => normalizedOptions.value.some((o) => o.value === ""));

function onChange() {
  emit("update:modelValue", value.value);
}
</script>

<template>
  <div class="inline-flex relative min-w-48 h-control">
    <select
      v-model="value"
      :aria-label="placeholder || 'Select an option'"
      :aria-busy="pending || undefined"
      class="pr-9 pl-3 w-full h-full min-w-0 text-base truncate rounded-lg border appearance-none cursor-pointer sm:text-sm bg-surface border-line-strong shadow-[0_1px_2px_0_rgb(16_24_40/0.04)] transition-[border-color,box-shadow] hover:border-ink-subtle/60 focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-focus"
      :class="value ? 'text-ink' : 'text-ink-subtle'"
      @change="onChange"
    >
      <option v-if="!hasEmptyOption" value="" disabled>{{ placeholder || "Select" }}</option>
      <option v-for="option in normalizedOptions" :key="option.value" :value="option.value" class="text-ink">
        {{ option.label }}
      </option>
    </select>

    <span class="grid absolute inset-y-0 right-0 place-items-center w-9 pointer-events-none text-ink-subtle" aria-hidden="true">
      <svg v-if="pending" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      </svg>
      <svg v-else class="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="m6 8 4 4 4-4" />
      </svg>
    </span>
  </div>
</template>
