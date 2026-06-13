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
  <InputParent v-slot="{ setRef, error, value, attributes, changeValue }">
    <QuotationInputLayout :error="error" :label="$attrs.label" :class="$attrs.class" >
			<slot class="" name="left" />
			<input
        v-focus="focus"
        :ref="setRef"
        class="flex-1 h-full px-2 bg-transparent outline-none text-sm"
        :class="attributes?.class"
      />
			<slot name="right" />
		</QuotationInputLayout>
  </InputParent>
</template>
