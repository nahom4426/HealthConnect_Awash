<script setup>
import { mdiLoading } from '@mdi/js';
import { inject, watch } from 'vue';
import BaseIcon from './base/BaseIcon.vue';

  defineProps({
    btnText: {
      type: String
    },
    pending: {
      type: Boolean,
      default: false
    }
  })

  const pendingRequest = inject('pending', false)

</script>
<template>
  <button class="w-full capitalize h-10 bg-primary rounded-md text-white">
    <span v-if="!pending && !pendingRequest">{{ btnText }}</span>
    <BaseIcon v-else :path="mdiLoading" class="animate-spin" />
  </button>
</template>