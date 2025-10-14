<script setup>
  import { ref } from 'vue';
  import Input from './Input.vue'
import icons from '@/utils/icons';

  const props = defineProps({
    attributes: {
      type: Object,
    }
  })

  const text = ref(props.attributes?.type == 'text' ? true : false)

  function toggleType() {
    text.value = !text.value
  }

</script>

<template>
  <Input :attributes="{
    ...attributes,
    type: text ? 'text' : 'password'
  }" >
    <template #left>
      <div @click="toggleType" class="h-full w-12 pt-2 grid place-items-center border-r">
        <span v-html="text ? icons.eye : icons.eyeSlash" />
      </div>
    </template>
  </Input>
</template>