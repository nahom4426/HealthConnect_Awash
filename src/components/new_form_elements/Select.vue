<script setup>
import { computed, ref, useAttrs, useId, watch } from "vue";
import InputParent from "../new_form_builder/InputParent.vue";
import InputLayout from "./NewInputLayout.vue";

const props = defineProps({
  /** Shows a spinner and disables the control while options load */
  pending: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: [String, Number, Array],
  },
  /** When true, options are `{ label, value }` objects */
  obj: {
    type: Boolean,
    default: false,
  },
  options: {
    type: Array,
    required: true,
  },
  emptyText: {
    type: String,
    default: "No options available",
  },
});

const emit = defineEmits(["update:modelValue"]);
const attrs = useAttrs();
const generatedId = useId();
const inputId = computed(() => attrs?.attributes?.id || generatedId);

const value = ref(props.modelValue ?? "");

watch(value, () => emit("update:modelValue", value.value));
watch(
  () => props.modelValue,
  () => {
    value.value = props.modelValue;
  }
);
</script>

<template>
  <InputParent v-model="value" v-slot="{ setRef, error, value: current, attributes }">
    <InputLayout
      :class="$attrs.class"
      :error="error"
      :label="$attrs.label"
      :validation="$attrs.validation"
      :hint="$attrs.hint"
      :input-id="inputId"
      v-slot="{ errorId, hintId }"
    >
      <div class="flex relative items-center w-full">
        <slot name="left" />
        <select
          :id="inputId"
          :ref="setRef"
          class="flex-1"
          :data-empty="!current || undefined"
          :value="current"
          :disabled="pending || attributes?.disabled || undefined"
          :aria-busy="pending || undefined"
          :aria-invalid="!!error || undefined"
          :aria-describedby="error ? errorId : hintId"
          :aria-label="$attrs.label ? undefined : attributes?.placeholder || 'Select an option'"
          @change="(e) => { value = e.target.value }"
        >
          <option value="" disabled>
            {{ pending ? "Loading…" : options.length ? attributes?.placeholder || "Select" : emptyText }}
          </option>
          <template v-if="!obj">
            <option v-for="option in options" :key="option" :value="option" class="text-ink">
              {{ option }}
            </option>
          </template>
          <template v-else>
            <option v-for="option in options" :key="option.value" :value="option.value" class="text-ink">
              {{ option.label }}
            </option>
          </template>
        </select>

        <slot name="right">
          <span
            v-if="pending"
            class="grid absolute right-8 inset-y-0 place-items-center pointer-events-none text-ink-subtle"
            aria-hidden="true"
          >
            <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="3" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
            </svg>
          </span>
        </slot>
      </div>
    </InputLayout>
  </InputParent>
</template>
