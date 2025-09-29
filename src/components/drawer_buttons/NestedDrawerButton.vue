<script setup>
import DrawerButtonParent from "./DrawerButtonParent.vue";

defineProps({
  navs: {
    type: Array,
    required: true,
  },
});
</script>

<template>
  <DrawerButtonParent
    v-for="nav in navs"
    :key="nav.name"
    :navs="nav"
  />
</template>
