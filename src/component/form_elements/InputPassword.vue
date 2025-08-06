<script setup>
  import { ref } from 'vue';
  import Input from './Input.vue'

  const text = ref(false)

  function toggleType() {
    text.value = !text.value
  }

</script>

<template>
  <Input :type="text ? 'text' : 'password'">
    <template #right>
      <div @click="toggleType" class="select-none w-12 cursor-pointer flex items-center justify-center h-10 border-l">
        <h-icon :name="text ? 'bi-eye-fill': 'bi-eye-slash'" />
      </div>
    </template>
  </Input>
</template>