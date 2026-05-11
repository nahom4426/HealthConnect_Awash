<script setup>
import DrawerButtonParent from "./DrawerButtonParent.vue";

defineProps({
  navs: { type: Array, required: true },
  collapsed: { type: Boolean, default: false },
});
</script>

<template>
  <DrawerButtonParent
    v-for="nav in navs"
    :key="nav.name || nav.path"
    :navs="nav"
    :collapsed="collapsed"
  />
</template>
