<script setup>
import InputError from "./InputError.vue";

const props = defineProps(["label", "error"]);
</script>

<template>
  <div class="flex flex-col items-start gap-1.5 w-full">
    <div class="flex flex-col gap-1 w-full">
      <span 
        :title="label" 
        class="text-sm font-medium text-gray-700 truncate transition-colors duration-200" 
        v-if="label"
      >
        {{ label }}
      </span>
      <div
        class="focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 
               border-2 border-gray-200 max-w-full overflow-hidden text-base rounded-lg 
               bg-white hover:border-gray-300 transition-all duration-200 shadow-sm"
        :class="{
          'border-red-500': error,
          'focus-within:ring-red-500 focus-within:border-red-500': error
        }"
      >
        <slot></slot>
      </div>
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