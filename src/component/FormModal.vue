<script setup>
  import { ModalParent } from '@/modals'
  import { closeModal } from '@/modals';
import BaseIcon from './base/BaseIcon.vue';
import { mdiClose } from '@mdi/js';

  defineProps({
    name: {
      type: String,
      requried: true
    }
  })

</script>
<template>
  <Transition name="pop">
    <ModalParent class="overflow-y-scroll inset-0 flex p-3 justify-center bg-gray-500/75" v-slot="{ data }" :name="name">
      <slot :modal="data" />
    </ModalParent>
  </Transition>
</template>

<style>
  .pop-enter-active,
  .pop-leave-active {
    transition: all 0.2s ease;
  }

  .pop-enter-from,
  .pop-leave-to {
    transform: scale(1.2);
  }
</style>