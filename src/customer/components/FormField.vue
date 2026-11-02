<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  rows: { type: Number, default: 0 },
  max: { type: String, default: undefined },
  min: { type: String, default: undefined },
  inputmode: { type: String, default: undefined },
  autocomplete: { type: String, default: 'off' },
  /** Renders a <select> from [{ value, label }] */
  options: { type: Array, default: null },
});
const emit = defineEmits(['update:modelValue']);

const id = `f-${Math.random().toString(36).slice(2, 9)}`;
const base = 'mt-1 w-full rounded-xl border bg-canvas px-3 text-sm outline-none focus:border-primary focus:shadow-focus';
const cls = computed(() => [base, props.error ? 'border-error' : 'border-line']);
const onInput = (e) => emit('update:modelValue', e.target.value);
</script>

<template>
  <div class="text-sm">
    <label :for="id" class="font-medium">{{ label }}</label>
    <select v-if="options" :id="id" :value="modelValue" :class="[cls, 'h-11']" :aria-invalid="!!error" @change="onInput">
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <textarea v-else-if="rows" :id="id" :value="modelValue" :rows="rows" :class="[cls, 'py-2']" :aria-invalid="!!error" :aria-describedby="error ? `${id}-e` : undefined" @input="onInput" />
    <input
      v-else :id="id" :value="modelValue" :type="type" :max="max" :min="min" :inputmode="inputmode" :autocomplete="autocomplete"
      :class="[cls, 'h-11']" :aria-invalid="!!error" :aria-describedby="error ? `${id}-e` : undefined" @input="onInput"
    />
    <p v-if="hint && !error" class="mt-1 text-xs text-ink-subtle">{{ hint }}</p>
    <p v-if="error" :id="`${id}-e`" class="mt-1 text-xs text-error-strong">{{ error }}</p>
  </div>
</template>
