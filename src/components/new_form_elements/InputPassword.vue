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
    <template #right>
      <div @click="toggleType" class="cursor-pointer" style="position:absolute; right:16px; top:50%; transform:translateY(-50%); display:flex; align-items:center; justify-content:center; z-index: 10;">
        <span v-html="text ? icons.eye : icons.eyeSlash" />
      </div>
    </template>
  </Input>
</template>