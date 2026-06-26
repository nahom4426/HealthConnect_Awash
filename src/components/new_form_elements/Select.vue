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
      :class="$attrs.class"
      :error="error"
      :label="$attrs.label"
    >
      <div class="relative flex items-center flex-1">
        <slot name="left"></slot>
        <select
          :ref="setRef"
          class="custom-input appearance-none flex-1 pr-8 h-9"
          :class="{ 'opacity-50': pending }"
          :style="{ opacity: attributes?.placeholder && !value ? 0.6 : 1 }"
          :value="value"
          :disabled="pending"
          @change="(e) => { value = e.target.value }"
          :aria-label="attributes?.label || attributes?.placeholder || 'select'"
        >
          <option value="" disabled>
            {{ attributes?.placeholder || 'Select' }}
          </option>
          <template v-if="!obj">
            <option :value="option" :key="option" v-for="option in options">
              {{ option }}
            </option>
          </template>
          <template v-else>
            <option :value="option.value" :key="option.value" v-for="option in options">
              {{ option.label }}
            </option>
          </template>
        </select>

        <!-- Trailing icon -->
        <div class="absolute right-0 top-0 h-full w-8 flex items-center justify-center pointer-events-none">
          <slot name="right">
            <svg v-if="!pending" class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <svg v-else class="w-4 h-4 text-gray-400 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </slot>
        </div>
      </div>
    </InputLayout>
  </InputParent>
</template>
