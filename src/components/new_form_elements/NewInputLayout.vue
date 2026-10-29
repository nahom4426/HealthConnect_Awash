<script setup>
import { computed } from "vue";
import InputError from "./InputError.vue";

const props = defineProps({
  label: String,
  error: String,
  validation: [String, Object],
  /** id of the control inside the slot — links the <label> and error message */
  inputId: String,
  hint: String,
  required: { type: Boolean, default: false },
});

const isRequired = computed(() => {
  if (props.required) return true;
  const v = props.validation;
  if (!v) return false;
  if (typeof v === "string") return v.split("|").some((r) => r.trim().startsWith("required"));
  return Boolean(v.required);
});

const errorId = computed(() => (props.inputId ? `${props.inputId}-error` : undefined));
const hintId = computed(() => (props.inputId && props.hint ? `${props.inputId}-hint` : undefined));
</script>

<template>
  <div class="flex flex-col gap-1.5 items-stretch w-full min-w-0">
    <label
      v-if="label"
      :for="inputId"
      :title="label"
      class="text-sm font-medium truncate text-ink"
    >
      {{ label }}<span v-if="isRequired" class="ml-0.5 text-error" aria-hidden="true">*</span>
    </label>

    <div
      class="input-shell"
      :class="{ 'input-shell--error': error }"
    >
      <slot :error-id="errorId" :hint-id="hintId" />
    </div>

    <p v-if="hint && !error" :id="hintId" class="text-xs text-ink-subtle">{{ hint }}</p>
    <InputError :id="errorId" :error="error" />
  </div>
</template>

<style>
/* Field shell: border, focus and error states for every form control */
.input-shell {
  display: flex;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid rgb(var(--line-strong));
  border-radius: 0.5rem;
  background-color: rgb(var(--surface));
  box-shadow: 0 1px 2px 0 rgb(16 24 40 / 0.04);
  transition: border-color var(--duration-fast) ease, box-shadow var(--duration-fast) ease;
}
.input-shell > * {
  flex: 1 1 auto;
  min-width: 0;
}
.input-shell:hover {
  border-color: rgb(var(--ink-subtle) / 0.55);
}
/* The shell draws the focus ring; the control inside must not add the global :focus-visible outline */
.input-shell :focus-visible {
  outline: none;
}
.input-shell:focus-within {
  border-color: rgb(var(--primary));
  box-shadow: var(--focus-ring);
}
.input-shell--error,
.input-shell--error:hover {
  border-color: rgb(var(--error));
}
.input-shell--error:focus-within {
  border-color: rgb(var(--error));
  box-shadow: 0 0 0 3px rgb(var(--error) / 0.15);
}
.input-shell:has(:disabled) {
  background-color: rgb(var(--surface-muted));
  border-color: rgb(var(--line));
  box-shadow: none;
}

/* Native controls rendered inside a shell (classes are added by InputParent) */
.custom-input,
.skip_custom-input {
  border: none;
  outline: none;
  width: 100%;
  min-width: 0;
  background-color: transparent;
  padding: 0 0.75rem;
  height: calc(var(--control-h) - 2px);
  box-shadow: none;
  color: rgb(var(--ink));
  /* 16px on phones prevents iOS zoom-on-focus */
  font-size: 1rem;
  line-height: 1.25rem;
}
@media (min-width: 640px) {
  .custom-input,
  .skip_custom-input {
    font-size: 0.875rem;
  }
}

.custom-input:focus,
.skip_custom-input:focus,
.custom-input:focus-visible,
.skip_custom-input:focus-visible {
  outline: none;
  box-shadow: none;
}

.custom-input::placeholder,
.skip_custom-input::placeholder {
  color: rgb(var(--ink-subtle) / 0.85);
}

textarea.custom-input,
textarea.skip_custom-input {
  height: auto;
  padding: 0.625rem 0.75rem;
  resize: vertical;
  min-height: 6rem;
  line-height: 1.5;
}

select.custom-input,
select.skip_custom-input {
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.625rem center;
  background-repeat: no-repeat;
  background-size: 1.125rem 1.125rem;
  padding-right: 2.25rem;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

select[data-empty].custom-input,
select[data-empty].skip_custom-input {
  color: rgb(var(--ink-subtle));
}
select.custom-input option,
select.skip_custom-input option {
  color: rgb(var(--ink));
}

/* Checkboxes / radios built with InputParent keep their native size */
input[type="checkbox"].custom-input,
input[type="radio"].custom-input,
input[type="checkbox"].skip_custom-input,
input[type="radio"].skip_custom-input {
  width: 1rem;
  height: 1rem;
  padding: 0;
  accent-color: rgb(var(--primary));
}

.custom-input:disabled,
.skip_custom-input:disabled {
  cursor: not-allowed;
  color: rgb(var(--ink-subtle));
}

.custom-input[readonly],
.skip_custom-input[readonly] {
  color: rgb(var(--ink-muted));
}
</style>
