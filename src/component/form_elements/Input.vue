<script setup>
  import {InputParent} from '@/form_builder'
  import InputLayout from './InputLayout.vue'

  defineProps({
    label: {
      type: String,
    },
    type: {
      type: String,
      default: 'text'
    }
  })
</script>

<template>
  <InputParent v-slot="{ setRef, error, attrs }">

    <InputLayout :class="attrs.class"  :label="label" :error="error">

      <input :type="type" :ref="setRef" />
      <slot name="right" />
    </InputLayout>
    
  </InputParent>
</template>