<script setup>
// Controlled native select on the shared field shell. options: strings or { value, label }.
import { computed, useId } from "vue";
import InputLayout from "../new_form_elements/NewInputLayout.vue";

const props = defineProps({
  modelValue: { type: [String, Number, Boolean], default: "" },
  options: { type: Array, default: () => [] },
  label: String,
  error: String,
  hint: String,
  required: { type: Boolean, default: false },
  /** first, disabled option; null hides it */
  placeholder: { type: String, default: "Select…" },
  id: String,
  /** v-model modifiers (.number / .trim are applied by Vue); declared so they don't reach the element */
  modelModifiers: { type: Object, default: () => ({}) },
  /** focus the control when it mounts */
  focus: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue", "change"]);
defineOptions({ inheritAttrs: false });
const autoId = useId();
const inputId = props.id || autoId;
const items = computed(() => props.options.map((o) => (o !== null && typeof o === "object" ? o : { value: o, label: String(o) })));

function onChange(e) {
  const item = items.value[e.target.selectedIndex - (props.placeholder !== null ? 1 : 0)];
  const value = item ? item.value : "";
  emit("update:modelValue", value);
  emit("change", value);
}
</script>

<template>
  <InputLayout :label="label" :error="error" :hint="hint" :required="required" :input-id="inputId" v-slot="{ errorId, hintId }">
    <select
      v-focus="focus"
      :id="inputId"
      v-bind="$attrs"
      :aria-invalid="!!error || undefined"
      :aria-describedby="error ? errorId : hint ? hintId : undefined"
      class="flex-1 px-3 min-w-0 h-10 text-sm bg-transparent outline-none text-ink disabled:opacity-60"
      @change="onChange"
    >
      <option v-if="placeholder !== null" value="" disabled :selected="modelValue === '' || modelValue === null || modelValue === undefined">{{ placeholder }}</option>
      <option v-for="o in items" :key="String(o.value)" :value="String(o.value)" :selected="o.value === modelValue">{{ o.label }}</option>
    </select>
  </InputLayout>
</template>
