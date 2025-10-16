<script setup>
import icons from "@/utils/icons";
import InputParent from "../new_form_builder/InputParent.vue";
//import Icon from "../Icon.vue";
import InputLayout from "./NewInputLayout.vue";
import { watch, ref } from 'vue'

const props = defineProps({
  pending: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: [String, Array]
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
    <InputLayout
      :class="$attrs.class + ' relative'"
      :error="error"
      :label="$attrs.label"
    >
      <div class="flex items-center h-10 flex-1">
        <slot name="left"></slot>
        <select
          :style="{
            opacity: attributes?.placeholder && !value ? .65 : 1
          }"
          :ref="setRef"
          class="appearance-none flex-1 text-text-clr h-full text-sm"
          :value="value"
          @change="(e) => { value = e.target.value }"
          :aria-label="attributes?.label || attributes?.placeholder || 'select'"
        >
          <option
            value=""
            disabled
          >
            {{ attributes?.placeholder || 'Select' }}
          </option>
          <template v-if="!obj">
            <option
              class="text-sm px-4"
              :value="option"
              :key="option"
              v-for="option in options"
            >
              {{ option }}
            </option>
          </template>
          <template v-else>
            <option
              :value="option.value"
              :key="option.value"
              v-for="option in options"
            >
              {{ option.label }}
            </option>
          </template>
        </select>
        <div class="absolute pointer-events-none top-0 right-0 h-full">
          <slot name="right">
            <div class="h-full ml-auto w-8 flex items-center justify-center">
              <i v-if="!pending" v-html="icons.downAngl" />
              <i v-else class="animate-spin" v-html="icons.spinner" />
            </div>
          </slot>
        </div>
      </div>
    </InputLayout>
  </InputParent>
</template>
