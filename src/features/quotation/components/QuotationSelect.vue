<script setup>
import icons from "@/utils/icons";
import InputParent from "@/components/new_form_builder/InputParent.vue";
//import Icon from "../Icon.vue";
import { watch, ref } from 'vue'
import QuotationInputLayout from "./QuotationInputLayout.vue";

const props = defineProps({
  pending: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: [String, Array, Number, Boolean]
  },
  obj: {
    type: Boolean,
    default: false,
  },
  options: {
    type: Array,
    required: true,
  },
})

const value = ref(props.modelValue || '')
const emit = defineEmits(['update:modelValue'])

watch(value, () => {
  emit('update:modelValue', value.value)
})

watch(() => props.modelValue, () => {
  value.value = props.modelValue
})
</script>
<template>
  <InputParent v-model="value" v-slot="{ setRef, error, value, attributes, changeValue }">
    <QuotationInputLayout
      :class="$attrs.class + ' relative'"
      :error="error"
      :label="$attrs.label"
    >
      <div class="relative flex items-center h-full flex-1">
        <slot name="left"></slot>
        <select
          :style="{
            opacity: attributes?.placeholder && !value ? .6 : 1
          }"
          :ref="setRef"
          class="appearance-none flex-1 text-text-clr h-full text-sm"
        >
          <option
            selected
            value=""
            disabled
          >
            {{ attributes?.placeholder }}
          </option>
          <template v-if="!obj">
            <option
              class="text-sm px-4"
              :selected="value == option"
              :key="option"
              v-for="option in options"
            >
              {{ option }}
            </option>
          </template>
          <template v-else>
            <option
              :selected="value == option.value"
              :value="option.value"
              :key="option.value"
              v-for="option in options"
            >
              {{ option.label }}
            </option>
          </template>
        </select>
        <div class="absolute h-full bg-base-clr4 rounded-md pointer-events-none top-0 right-0">
          <slot name="right">
            <div class="h-full ml-auto w-8 flex items-center justify-center">
              <i v-if="!pending" v-html="icons.downAngle" />
              <i v-else class="animate-spin" v-html="icons.spinner" />
            </div>
          </slot>
        </div>
      </div>
    </QuotationInputLayout>
  </InputParent>
</template>
