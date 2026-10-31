<script setup>
// Controlled textarea on the shared field shell, with an optional character counter (maxlength).
import { useId } from "vue";
import InputLayout from "../new_form_elements/NewInputLayout.vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
  label: String,
  error: String,
  hint: String,
  required: { type: Boolean, default: false },
  rows: { type: [Number, String], default: 3 },
  maxlength: { type: [Number, String], default: undefined },
  /** show "n/max" under the field */
  counter: { type: Boolean, default: false },
  id: String,
  /** v-model modifiers (.number / .trim are applied by Vue); declared so they don't reach the element */
  modelModifiers: { type: Object, default: () => ({}) },
  /** focus the control when it mounts */
  focus: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);
defineOptions({ inheritAttrs: false });
const autoId = useId();
const inputId = props.id || autoId;
</script>

<template>
  <div class="w-full">
    <InputLayout :label="label" :error="error" :hint="hint" :required="required" :input-id="inputId" v-slot="{ errorId, hintId }">
      <textarea
        v-focus="focus"
        :id="inputId"
        v-bind="$attrs"
        :rows="rows"
        :maxlength="maxlength"
        :value="modelValue"
        :aria-invalid="!!error || undefined"
        :aria-describedby="error ? errorId : hint ? hintId : undefined"
        class="flex-1 px-3 py-2 min-w-0 text-sm bg-transparent outline-none resize-y text-ink placeholder:text-ink-subtle disabled:opacity-60"
        @input="emit('update:modelValue', $event.target.value)"
      />
    </InputLayout>
    <p v-if="counter && maxlength" class="mt-1 text-xs text-right text-ink-subtle">{{ (modelValue || "").length }}/{{ maxlength }}</p>
  </div>
</template>
