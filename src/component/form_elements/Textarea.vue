<script setup>
  import {InputParent} from '@/form_builder'
  import InputLayout from './InputLayout.vue'

  defineProps({
    label: {
      type: String,
    },
  })
</script>

<template>
  <InputParent v-slot="{ setRef, error, attrs }">

    <InputLayout :class="attrs.class"  :label="label" :error="error">

      <textarea class="resize-none h-28" :ref="setRef" />
      <slot name="right" />
    </InputLayout>
    
  </InputParent>
</template>