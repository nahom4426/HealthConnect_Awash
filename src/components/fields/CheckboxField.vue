<script setup>
// Controlled checkbox with its label, for filters and yes/no options.
defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, required: true },
  hint: String,
});
const emit = defineEmits(["update:modelValue"]);
</script>

<template>
  <label class="inline-flex gap-2 items-start text-sm cursor-pointer text-ink-muted">
    <input type="checkbox" class="mt-0.5 w-4 h-4 rounded accent-primary" :checked="modelValue" v-bind="$attrs" @change="emit('update:modelValue', $event.target.checked)" />
    <span>
      {{ label }}
      <span v-if="hint" class="block text-xs text-ink-subtle">{{ hint }}</span>
    </span>
  </label>
</template>
