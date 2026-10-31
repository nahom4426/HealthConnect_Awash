<script setup>
// Controlled text / number / date / tel / email / search field on the shared field shell
// (new_form_elements/NewInputLayout). Use it with v-model when validation lives in the page or a
// rules module; use new_form_elements/Input with new_form_builder/Form for builder-validated forms.
import { useId } from "vue";
import InputLayout from "../new_form_elements/NewInputLayout.vue";

const props = defineProps({
  modelValue: { type: [String, Number], default: "" },
  label: String,
  error: String,
  hint: String,
  required: { type: Boolean, default: false },
  type: { type: String, default: "text" },
  /** right-align numbers (amounts, rates) */
  numeric: { type: Boolean, default: false },
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
  <InputLayout :label="label" :error="error" :hint="hint" :required="required" :input-id="inputId" v-slot="{ errorId, hintId }">
    <input
      v-focus="focus"
      :id="inputId"
      v-bind="$attrs"
      :type="type"
      :value="modelValue"
      :inputmode="$attrs.inputmode || (numeric ? 'decimal' : undefined)"
      :aria-invalid="!!error || undefined"
      :aria-describedby="error ? errorId : hint ? hintId : undefined"
      :class="['flex-1 px-3 min-w-0 h-10 text-sm bg-transparent outline-none text-ink placeholder:text-ink-subtle disabled:opacity-60', numeric && 'text-right tabular-nums']"
      @input="emit('update:modelValue', $event.target.value)"
    />
  </InputLayout>
</template>
