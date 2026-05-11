<script setup>
import InputError from "./InputError.vue";

const props = defineProps(["label", "error", "validation", "glass"]);

// Check if field is required
const isRequired = () => {
  if (!props.validation) return false;
  const validationStr = typeof props.validation === 'string' ? props.validation : '';
  return validationStr.includes('required');
};
</script>

<template>
  <div :class="glass ? 'glass-field' : 'flex flex-col items-start gap-1.5 w-full'">
    <div :class="glass ? 'glass-field-inner' : 'flex flex-col gap-1 w-full'">
      <span
        :title="label"
        :class="glass
          ? 'glass-label'
          : 'text-sm font-medium text-gray-700 truncate transition-colors duration-200'"
        v-if="label"
      >
        {{ label }}
        <span v-if="isRequired()" :class="glass ? 'glass-required' : 'text-red-500 ml-1'">*</span>
      </span>
      <div
        v-if="!glass"
        class="focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary
               border border-slate-200 max-w-full overflow-hidden text-base rounded-lg
               bg-white hover:border-slate-300 transition-all duration-200 shadow-sm"
        :class="{
          'border-red-400 focus-within:ring-red-300 focus-within:border-red-400': error,
          'border-slate-200': !error
        }"
      >
        <slot></slot>
      </div>
      <div
        v-else
        class="glass-input-wrap"
        :class="{ 'glass-input-wrap--error': error }"
      >
        <slot></slot>
      </div>
    </div>
    <InputError :error="error" :glass="glass" />
  </div>
</template>

<style>
/* ── Glass variant styles ── */
.glass-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}
.glass-field-inner {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: 100%;
}
.glass-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.01em;
  display: block;
}
.glass-required {
  color: #fca5a5;
  margin-left: 2px;
}
.glass-input-wrap {
  display: flex;
  align-items: center;
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
  backdrop-filter: blur(10px);
}
.glass-input-wrap:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.32);
}
.glass-input-wrap:focus-within {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(59, 130, 246, 0.7);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
}
.glass-input-wrap--error {
  border-color: rgba(239, 68, 68, 0.6) !important;
}
.glass-input-wrap--error:focus-within {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.18) !important;
  border-color: rgba(239, 68, 68, 0.7) !important;
}

/* Glass variant: style inputs inside glass wrapper */
.glass-input-wrap .custom-input,
.glass-input-wrap .skip_custom-input,
.glass-input-wrap input {
  border: none !important;
  outline: none !important;
  width: 100%;
  background: transparent !important;
  padding: 0.875rem 1rem !important;
  box-shadow: none !important;
  color: #fff !important;
  font-size: 0.9375rem !important;
  flex: 1;
}

.glass-input-wrap .custom-input::placeholder,
.glass-input-wrap .skip_custom-input::placeholder,
.glass-input-wrap input::placeholder {
  color: rgba(255, 255, 255, 0.45) !important;
}

/* Glass variant: eye toggle button */
.glass-input-wrap .border-r {
  border-color: rgba(255, 255, 255, 0.15) !important;
}

.glass-input-wrap button {
  background: transparent !important;
  color: rgba(255, 255, 255, 0.6) !important;
  border: none !important;
  padding: 0 0.875rem !important;
  cursor: pointer;
  flex-shrink: 0;
}

.glass-input-wrap button:hover {
  color: #fff !important;
}

.custom-input,
.skip_custom-input {
  border: none;
  outline: none;
  width: 100%;
  background-color: transparent;
  padding: 0.5rem 0.75rem;
  box-shadow: none;
  @apply text-sm text-gray-800 placeholder-gray-400;
  transition: all 0.2s ease-in-out;
}

.custom-input:focus,
.skip_custom-input:focus {
  box-shadow: none;
}

textarea.custom-input,
textarea.skip_custom-input {
  padding: 0.75rem;
  resize: vertical;
  min-height: 6rem;
  line-height: 1.5;
}

select.custom-input,
select.skip_custom-input {
  height: 2.75rem;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1.25em 1.25em;
  padding-right: 2.5rem;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.custom-input::placeholder,
.skip_custom-input::placeholder {
  color: theme("colors.gray.400");
}

/* Disabled state */
.custom-input:disabled,
.skip_custom-input:disabled {
  @apply bg-gray-100 cursor-not-allowed;
}

/* Readonly state */
.custom-input[readonly],
.skip_custom-input[readonly] {
  @apply bg-gray-50;
}
</style>