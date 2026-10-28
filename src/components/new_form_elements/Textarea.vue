<script setup>
import { computed, useAttrs, useId } from "vue";
import { InputParent } from "../new_form_builder";
import InputLayout from "@/components/new_form_elements/NewInputLayout.vue";

const attrs = useAttrs();
const generatedId = useId();
const inputId = computed(() => attrs?.attributes?.id || generatedId);
</script>

<template>
  <InputParent v-slot="{ setRef, error }">
    <InputLayout
      :class="$attrs?.class"
      :label="$attrs.label"
      :validation="$attrs.validation"
      :hint="$attrs.hint"
      :input-id="inputId"
      :error="error"
      v-slot="{ errorId, hintId }"
    >
      <textarea
        :id="inputId"
        :ref="setRef"
        :aria-invalid="!!error || undefined"
        :aria-describedby="error ? errorId : hintId"
      />
      <slot name="right" />
    </InputLayout>
  </InputParent>
</template>
