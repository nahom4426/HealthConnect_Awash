<script setup>
import InputError from "./InputError.vue";

const props = defineProps(["label", "error", "validation"]);

// Check if field is required
const isRequired = () => {
  if (!props.validation) return false;
  const validationStr = typeof props.validation === 'string' ? props.validation : '';
  return validationStr.includes('required');
};
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full">
    <label
      :title="label"
      class="text-xs font-medium text-gray-600 truncate leading-none"
      v-if="label"
    >
      {{ label }}
      <span v-if="isRequired()" class="text-red-400 ml-0.5">*</span>
    </label>
    <div
      class="relative flex items-center max-w-full overflow-hidden rounded-lg border bg-white transition-all duration-150"
      :class="[
        error
          ? 'border-red-300 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100'
          : 'border-gray-200 hover:border-gray-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10'
      ]"
    >
      <slot></slot>
    </div>
    <InputError :error="error" />
  </div>
</template>

<style>
.custom-input,
.skip_custom-input {
  border: none;
  outline: none;
  width: 100%;
  background-color: transparent;
  padding: 0.5rem 0.75rem;
  box-shadow: none;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #1f2937;
  transition: all 0.15s ease;
}

.custom-input::placeholder,
.skip_custom-input::placeholder {
  color: #9ca3af;
}

.custom-input:focus,
.skip_custom-input:focus {
  box-shadow: none;
  outline: none;
}

textarea.custom-input,
textarea.skip_custom-input {
  padding: 0.625rem 0.75rem;
  resize: vertical;
  min-height: 5rem;
  line-height: 1.5;
}

select.custom-input,
select.skip_custom-input {
  height: 2.5rem;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.625rem center;
  background-repeat: no-repeat;
  background-size: 1.125em 1.125em;
  padding-right: 2.25rem;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.custom-input:disabled,
.skip_custom-input:disabled {
  background-color: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.custom-input[readonly],
.skip_custom-input[readonly] {
  background-color: #f9fafb;
}
</style>