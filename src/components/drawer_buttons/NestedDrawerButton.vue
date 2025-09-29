<script setup lang="ts">
import { PropType } from "vue";
import DrawerButtonParent from "./DrawerButtonParent.vue";
import type { Nav } from "./DrawerButtonParent.vue"; // <-- note the 'type' keyword

defineProps({
  navs: {
    type: Array as PropType<Nav[]>,
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
