<script setup>
import { ref, computed } from 'vue';
import { containerMaxW } from '@/config.js';
import { useRoute } from 'vue-router';
import NavBarMenuList from '@/components/nav-bar/NavBarMenuList.vue';


defineProps({
  menu: {
    type: Array,
    required: true,
  },
});

const route = useRoute();
const emit = defineEmits(['menu-click']);

const menuClick = (event, item) => {
  emit('menu-click', event, item);
};

const isMenuNavBarActive = ref(false);

const breadcrumbs = computed(() => {
  const matchedRoutes = route.matched;
  console.log(matchedRoutes);
  const customCrumb = {
    label: 'HealthConnect',
    to: '/',
  };

  const dynamicCrumbs = matchedRoutes
    .filter(route => route.meta?.breadcrumb)
    .map(route => ({
      label: route.meta.breadcrumb,
      to: route.path,
    }));

  if (route.name === 'institution-contracts') {
    const policyId = route.params.Uuid;
    dynamicCrumbs.push({
      label: `Policy Detail ${policyId}`,
      to: route.path,
    });
  }

  return [customCrumb, ...dynamicCrumbs];
});

</script>

<template>
  <nav class=" bg-white flex justify-between items-center h-[100%] p-4 w-full lg:w-auto dark:bg-slate-800">
    <div class="flex flex-nowrap m-4 p-2">
      <span v-for="(crumb, index) in breadcrumbs" :key="index"
        :class="{ 'text-primary': index === breadcrumbs.length - 1 }" class="whitespace-nowrap">
        <router-link :to="crumb.to">{{ crumb.label }}</router-link>
        <span v-if="index < breadcrumbs.length - 1" class="p-2"> > </span>
      </span>
    </div>
    <div class="flex justify-between w-full px-2 lg:items-stretch" :class="containerMaxW">
      <div class="flex flex-1 items-stretch h-14">
        <slot />
      </div>
      <div
        class="max-h-screen-menu overflow-y-auto lg:overflow-visible absolute w-screen top-14 left-0 shadow-lg lg:w-auto lg:flex lg:static lg:shadow-none dark:bg-slate-800"
        :class="[isMenuNavBarActive ? 'block' : 'hidden']">
        <NavBarMenuList :menu="menu" @menu-click="menuClick" />
      </div>
    </div>
  </nav>
</template>
