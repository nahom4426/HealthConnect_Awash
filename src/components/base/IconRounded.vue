<script setup>

import BaseIcon from '@/components/base/BaseIcon.vue';

defineProps({
  icon: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: null,
  },
  w: {
    type: String,
    default: 'w-12',
  },
  h: {
    type: String,
    default: 'h-12',
  },
  bg: Boolean,
});
</script>

<template>
  <BaseIcon
    :path="icon"
    :w="w"
    :h="h"
    size="24"
    class="rounded-full"
    :class="
      bg ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'
    "
  />
</template>
