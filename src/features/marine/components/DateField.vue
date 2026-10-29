<script setup>
// Date picker emitting an ISO date ("2026-10-28"), with min / max, and the date spelled out
// as "28 Oct 2026" under it so the format never depends on the browser's locale.
import { inputClass, inputBorder } from "./styles";
import { formatDate } from "../utils/format";

defineProps({
  modelValue: { type: String, default: "" },
  min: { type: String, default: undefined },
  max: { type: String, default: undefined },
  id: { type: String, default: "" },
  invalid: { type: Boolean, default: false },
  describedby: { type: String, default: undefined },
});
const emit = defineEmits(["update:modelValue", "blur"]);
</script>

<template>
  <div class="flex gap-2 items-center">
    <input
      :id="id"
      type="date"
      :value="modelValue"
      :min="min"
      :max="max"
      :aria-invalid="invalid || undefined"
      :aria-describedby="describedby"
      :class="[inputClass, inputBorder(invalid), '!w-44']"
      @input="emit('update:modelValue', $event.target.value)"
      @blur="emit('blur')"
    />
    <span v-if="modelValue" class="text-xs text-ink-subtle">{{ formatDate(modelValue) }}</span>
  </div>
</template>
