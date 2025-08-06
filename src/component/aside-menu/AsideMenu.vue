<script setup>
import Logo from '/src/assets/img/new_logo.jpg';
import HealthConnectLogo from '/src/assets/img/letter-logo.png';
import { useRouter } from 'vue-router';
import RouterButton from '../RouterButton.vue';
import * as session from '@/scripts/session';
import SvgIcon from '@jamescoyle/vue-icon';
import { mdiMoonWaxingCrescent } from '@mdi/js';

const router = useRouter();
const props = defineProps({
  open: {
    type: Boolean,
    default: true
  },
  menu: {
    type: Array,
    required: true,
  },
  isAsideMobileExpanded: Boolean,
  isAsideLgActive: Boolean,
});

const emit = defineEmits(['menu-click', 'aside-lg-close-click']);


function logout() {
  session.logoutUser();
  router.push('/login');
}

</script>

<template>
  <div class="h-full pl-[24px] pt-[60px] pr-[16px] pb-[24px] ">
    <div class="overflow-y-scroll flex-col pt-10 pb-12 bg-white h-[84%] flex">
      <div :class="[open ? '' : 'h-8']"
        class="w-full duration-200 z-30 sticky top-[-30px] bg-white flex flex-col justify-start items-start">
        <div v-if="open" class="flex py-2 items-center">
          <div class="items-start justify-start">
            <img :src="Logo" alt="" class="w-12 h-auto" />
          </div>
          <div class="">
            <p>Family INSURANCE S.C.</p>
          </div>
        </div>
        <div class="w-[227px] opacity-[20%] border-t border-borderColor">
        </div>
      </div>

      <div class="h-[774.98px] p-4 bg-opacity-1">
        <RouterButton :drawer-opened="open" :route="route" :key="route.label" v-for="route in menu">
        </RouterButton>
      </div>
    </div>
    <div class="flex mx-auto space-x-4 p-6 mt-auto">
      <svg-icon type="mdi" :path="mdiMoonWaxingCrescent" style="transform: rotate(45deg);"></svg-icon>
      <span>Night Mode</span>
      <input type="checkbox">
    </div>
    <div :class="[open ? 'w-40' : 'w-16']"
      class="absolute flex flex-col bottom-0 w-full gap-0 z-40 bg-gray-50 h-[80px]">
      <div class="border-t border-borderColor w-[70%] mx-4 p-2 gap-4">
        <div class="flex justify-start space-x-3">
          <div class="w-8 h-12 rounded-full">
            <img :src="HealthConnectLogo" alt="" />
          </div>
          <span v-if="open" class="text-base font-semibold">HealthConnect </span>
        </div>
      </div>
    </div>
  </div>
</template>
