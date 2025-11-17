<script setup>
import InputParent from "@/components/new_form_builder/InputParent.vue";
import QuotationInputLayout from "./QuotationInputLayout.vue";

const props = defineProps({
  focus: {
    type: Boolean,
    default: false,
  },
});
</script>
<template>
  <InputParent v-slot="{ setRef, error, value, changeValue }">
    <QuotationInputLayout :error="error" :label="$attrs.label" >
			<slot class="" name="left" />
			<input v-focus="focus" :ref="setRef" />
			<slot name="right" />
		</QuotationInputLayout>
  </InputParent>
</template>
