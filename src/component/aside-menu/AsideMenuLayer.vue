<script setup>
import { mdiLogout, mdiClose } from '@mdi/js';
import { computed } from 'vue';
import AsideMenuList from '@/components/aside-menu/AsideMenuList.vue';
import AsideMenuItem from '@/components/aside-menu/AsideMenuItem.vue';
import BaseIcon from '@/components/base/BaseIcon.vue';
//import letterlogo from '../../../public/new_logo-removebg-preview.png';

defineProps({
  menu: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['menu-click', 'aside-lg-close-click']);

const logoutItem = computed(() => ({
  label: 'Logout',
  icon: mdiLogout,
  color: 'info',
  isLogout: true,
}));

const menuClick = (event, item) => {
  emit('menu-click', event, item);
};

const asideLgCloseClick = (event) => {
  emit('aside-lg-close-click', event);
};
</script>

<template>
  <aside id="aside" class="w-72 fixed flex items-center justify-center  bg-slate-50 top-0 h-screen overflow-hidden">
    <div class="aside flex-1 flex flex-col overflow-hidden h-full dark:bg-slate-900">
      <div class="h-36 w-full flex items-center justify-center p-2">
        <div class="border-4 w-16 h-16 rounded-full flex items-center justify-center p-2 border-primary">
          <img :src="letterlogo" alt="" />
        </div>
        <button class="hidden lg:inline-block xl:hidden p-3 absolute top-0 right-0" @click.prevent="asideLgCloseClick">
          <BaseIcon :path="mdiClose" />
        </button>
      </div>

      <div class="aside-brand flex flex-row h-4 items-center justify-between dark:bg-slate-900">
        <div
          class="text-center py-2 flex-1 flex items-center justify-center lg:text-left lg:pl-6 xl:text-center xl:pl-0">
          <span class="text-2xl font-semibold">HealthConnect </span>
          <span class="ml-2 -mt-4 text-xs font-semibold">TM</span>
        </div>
      </div>

      <div
        class="flex-1 flex justify-center mt-4 py-2 overflow-y-auto overflow-x-hidden aside-scrollbars dark:aside-scrollbars-[slate]">
        <AsideMenuList :menu="menu" @menu-click="menuClick" />
      </div>

      <ul>
        <AsideMenuItem :item="logoutItem" @menu-click="menuClick" />
      </ul>
    </div>
  </aside>
</template>
