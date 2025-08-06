<script setup>
import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { mdiChevronDoubleDown, mdiChevronDoubleUp } from '@mdi/js';
import { getButtonColor } from '@/colors.js';
import BaseIcon from '@/components/base/BaseIcon.vue';
import AsideMenuList from '@/components/aside-menu/AsideMenuList.vue';
import { useBreadcrumbStore } from '../../../stores/useBreadcrumbStore';

const breadcrumbStore = useBreadcrumbStore();

const props = defineProps({
  child: {
    type: Boolean
  },
  item: {
    type: Object,
    required: true,
  },
  isDropdownList: Boolean,
});

const emit = defineEmits(['menu-click']);

const hasColor = computed(() => props.item && props.item.color);

const asideMenuItemActiveStyle = computed(() =>
  hasColor.value
    ? ''
    : 'font-normal bg-[#6E64AB] text-slate-50 py-2 rounded-r-2xl h-[55px] text-md'
);

const asideMenuItemActiveMenuStyle = computed(() =>
  hasColor.value
    ? ''
    : ' font-normal bg-indigo-600 text-slate-50 py-2 rounded-r-2xl h-[55px] text-md'
);

const asideMenuItemActiveIcon = computed(() =>
  hasColor.value
    ? ''
    : ' font-normal bg-[#6E64AB] text-slate-50 text-md py-2 rounded-l-lg h-[55px]'
);

const isDropdownActive = ref(false);

const componentClass = computed(() => [
  props.isDropdownList ? 'py-1 px-6 text-sm ' : 'py-1',
  hasColor.value
    ? getButtonColor(props.item.color, false, true)
    : `aside-menu-item  text-blue-900 py-1`,
]);

const hasDropdown = computed(() => !!props.item.menu || props.child);
const isMenu = computed(() => !props.item.isMenu);

const menuClick = (item, event) => {
  props.item.isOpen = !props.item.isOpen
  if (hasDropdown.value && !props.item.isOpen) {
    isDropdownActive.value = !isDropdownActive.value
  }
  breadcrumbStore.addItem(item.label);

  emit('menu-click', event, props.item);
};
</script>

<template>
  <li>
    <!-- <component :is="item.to ? RouterLink : 'a'" v-slot="vSlot" :to="item.to ?? null" :href="item.href ?? null"
      :target="item.target ?? null" class="flex h-12 items-center cursor-pointer" :class="componentClass"
      @click.stop="menuClick(item)">
      <BaseIcon v-if="item.icon" :path="item.icon" class="flex-none"
        :class="[vSlot && vSlot.isExactActive ? asideMenuItemActiveIcon : '']" w="w-16" h="h-6" :size="18" />
      <span class="grow line-clamp-1 flex items-center" :class="[
        { 'pr-12': !hasDropdown },
        vSlot && vSlot.isExactActive ? asideMenuItemActiveStyle : '',
      ]">{{ item.label }}</span>
      <BaseIcon v-if="hasDropdown" :path="isDropdownActive ? mdiChevronDoubleUp : mdiChevronDoubleDown" class="flex-none"
        :class="[vSlot && vSlot.isExactActive ? asideMenuItemActiveMenuStyle : '']" w="w-12" />
    </component> -->

    <!-- <div v-if="root && item.visible !== false" class="layout-menuitem-root-text">{{ item.label }}</div>
    <a v-if="(!item.to || item.items) && item.visible !== false" :href="item.url" @click="itemClick($event, item, index)"
      :class="item.class" :target="item.target" tabindex="0">
      <i :class="item.icon" class="layout-menuitem-icon"></i>
      <span class="layout-menuitem-text">{{ item.label }}</span>
      <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
    </a>
    <router-link v-if="item.to && !item.items && item.visible !== false" @click="itemClick($event, item, index)"
      :class="[item.class, { 'active-route': checkActiveRoute(item) }]" tabindex="0" :to="item.to">
      <i :class="item.icon" class="layout-menuitem-icon"></i>
      <span class="layout-menuitem-text">{{ item.label }}</span>
      <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
    </router-link>
    <Transition v-if="item.items && item.visible !== false" name="layout-submenu">
      <ul v-show="root ? true : isActiveMenu" class="layout-submenu">
        <app-menu-item v-for="(child, i) in item.items" :key="child" :index="i" :item="child" :parentItemKey="itemKey"
          :root="false"></app-menu-item>
      </ul>
    </Transition> -->

    <AsideMenuList v-if="hasDropdown" :menu="item.menu" :class="[
      'aside-menu-dropdown',
      isDropdownActive
        ? 'block dark:bg-slate-800/50 ' : 'hidden',
    ]" is-dropdown-list />
  </li>
</template>