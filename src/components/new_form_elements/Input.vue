<script setup>
import InputParent from "../new_form_builder/InputParent.vue";
import InputLayout from "./NewInputLayout.vue";

const props = defineProps({
  focus: {
    type: Boolean,
    default: false
  },
})
</script>
<template>
  <InputParent v-slot="{ setRef, error, value, changeValue }">
    <InputLayout :error="error" :label="$attrs?.label">
      <div class="flex w-full">
        <slot class="" name="left" />
        <input
          v-focus='focus'
          :ref="setRef"
        />
        <slot name="right" />
      </div>
    </InputLayout>
  </InputParent>
</template>