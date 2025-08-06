<script setup>
  import {InputParent} from '@/form_builder'
  import InputLayout from './InputLayout.vue'
  import BaseIcon from '../base/BaseIcon.vue';
  import { mdiMenuDown } from '@mdi/js';

  defineProps({
    label: {
      type: String,
    },
    options: {
      type: Array,
      default: []
    },
    obj: {
      type: Boolean
    }
  })
</script>

<template>
  <InputParent v-slot="{ setRef, error, attrs, modelValue }">

    <InputLayout :class="attrs.class + ' relative'"  :label="label" :error="error">

      <select class="capitalize text-sm" :ref="setRef">
        <option class="text-xs" disabled selected value="">select your option</option>
        <option :selected="modelValue == option" v-if="!obj" :value="option" v-for="option in options">
          {{ option }}
        </option>
        <option :selected="modelValue == option.value" v-else :value="option.value" v-for="option in options">
          {{ option.label }}
        </option>
      </select>
    </InputLayout>
    
  </InputParent>
</template>