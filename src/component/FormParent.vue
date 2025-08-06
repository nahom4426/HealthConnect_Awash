<script setup>
  import ResponseError from '@/components/ResponseError.vue';
  import BaseIcon from './base/BaseIcon.vue';
  import { closeModal } from '@/modals'
import { mdiClose } from '@mdi/js';
  defineProps({
    title: {
      type: String,
      required: true
    },
    error: {
      type: String
    },
    showCloseBtn: {
      type: Boolean,
      default: true
    }
  })
</script>
<template>
  <div class="rounded-md relative overflow-scroll flex p-2 flex-col gap-4 shadow-lg border-l bg-table-clr">
    <div class="bg-inherit z-10 h-12 p-2 border-b text-xl font-semibold">
      {{ title }}
    </div>
    <ResponseError :error="error" />
    <slot />
    <button @click="closeModal()" class="z-20 shadow-md bg-gray-200 flex justify-center items-center absolute rounded-full top-[5px] right-1 h-10 w-10">
      <BaseIcon :path="mdiClose" />
    </button>
  </div>
</template>