<script setup>
import AsideMenuItem from '@/components/aside-menu/AsideMenuItem.vue';
import { computed } from 'vue';

const props = defineProps({
  isDropdownList: Boolean,
  child: {
    default: false
  },
  menu: {
    type: Array,
    required: true,
  },
});

const filteredMenu = computed(() => {
  return props.menu.filter((item) => item.visible === true);
});

const emit = defineEmits(['menu-click']);

const menuClick = (event, item) => {
  emit('menu-click', event, item);
};
</script>

<template>
  <ul class="flex flex-col">
    <AsideMenuItem :child="child" v-for="(item, index) in filteredMenu" :key="index" :item="item"
      :is-dropdown-list="isDropdownList" @menu-click="menuClick" />
  </ul>
</template>
