<script setup>
import { ModalParent } from '../modals'
import { closeModal } from '../modals'
import BaseIcon from './base/BaseIcon.vue';
import { mdiClose } from '@mdi/js';

const modalName = ''

function yes() {
  closeModal(true)
}

function no() {
  closeModal(false)
}

</script>
<template>
  <ModalParent v-slot="{ data }" name='Confirmation'
    class='flex justify-center items-center inset-0 bg-black/50 lg:conta p-2'>
    <div class="overflow-hidden relative p-4 flex flex-col gap-3 justify-center items-start w-80 rounded-md bg-white">
      <button @click="(ev) => closeModal()" class="absolute rounded-full bg-gray-100 text-gray-800 w-6 h-6 right-2 top-2">
        <BaseIcon :path="mdiClose" />
      </button>
      <p class="text-lg font-bold text-left w-full">{{ data?.title || 'HealthConnect'}}</p>
      <p class="text-left px-2 text-sm text-txt-clr border-l-4 border-orange-500">
        {{ data?.message }}
      </p>
      <div class="flex justify-end w-full gap-2">
        <button @click="no" class="text-sm px-4 py-1 text-txt-clr rounded-md border">No</button>
        <button @click='yes' class="text-sm px-4 py-1 bg-primary rounded-md text-white">Yes</button>
      </div>
    </div>
  </ModalParent>
</template>