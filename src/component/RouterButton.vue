<script setup>
import IconButton from './IconButton.vue';

const props = defineProps({
  route: {
    type: Object,
    required: true
  },
  drawerOpened: {
    type: Boolean,
    default: true
  }
})
</script>

<template>
  <div class="flex flex-col">
    <IconButton :drawerOpened="drawerOpened" :route="route" />
  </div>
</template>