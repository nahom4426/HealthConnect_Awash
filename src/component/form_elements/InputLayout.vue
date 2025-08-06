<script setup>
import InputError from "./InputError.vue";

const props = defineProps(["label", "error"]);
</script>
<template>
  <div class="flex flex-col items-start gap-1">
    <div class="flex flex-col gap-2 w-full">
      <span
        class="text-sm capitalize font-medium px-1"
        v-if="label"
        >{{ label }}</span
      >
      <div
        :class="$attrs.class"
        class="flex my-input w-full rounded-md border-0 min-h-[2.07rem] shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary"
      >
        <slot></slot>
      </div>
    </div>
    <InputError :error="error" />
  </div>
</template>

<style>
  .my-input  input,
  .my-input  textarea,
  .my-input  select {
    border: none;
    outline: none;
    width: 100%;
    background-color: transparent;
    padding: 0 .5rem;
  }

  .my-input ::placeholder{
    font-size: 14px;
  }

  .my-input  input:focus,
  .my-input  textarea:focus,
  .my-input  select:focus {
    border: none;
    outline: none;
    box-shadow: none;
  }
</style>