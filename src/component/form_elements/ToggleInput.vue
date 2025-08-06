<script setup>
  import { InputParent } from '@/form_builder';
  import { ref } from 'vue';

  const props = defineProps(['modelValue'])
  const emit = defineEmits(['update:modelValue'])

  const on = ref(props.modelValue || false)

  function toggle() {
    on.value = !on.value
    emit('update:modelValue', on.value)
  }
</script>
<template>
  <InputParent v-model="on" v-slot="{ setRef }">
    <div :ref="setRef" @click="toggle" tabindex="0" @keydown.enter="toggle" class="border focus:border focus:border-primary cursor-pointer flex bg-gray-400 h-5 w-8 rounded-full relative p-1">
      <div :class="[!on ? 'left-0 bg-gray-600' : 'left-full bg-primary']" class="top-1/2 transition-all duration-200 ease-linear -translate-y-1/2 -translate-x-1/2 absolute h-6 w-6 rounded-full shadow-lg "></div>
    </div>
  </InputParent>
</template>