<script setup>
import DrawerButtonParent from "./DrawerButtonParent.vue";

defineProps({
  navs: {
    type: Array,
    required: true,
  },
});
</script>

<template class="text-black">
  <DrawerButtonParent
    v-for="nav in navs"
    :key="nav.name"
    :navs="nav"
  />
</template>
