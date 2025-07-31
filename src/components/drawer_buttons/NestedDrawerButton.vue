<script setup lang="ts">
import { PropType } from "vue";
import DrawerButtonParent, { Nav } from "./DrawerButtonParent.vue";

defineProps({
  navs: {
    type: Array as PropType<Nav[]>,
    required: true,
  },
});

</script>
<template>
	<DrawerButtonParent
		:navs="nav" v-for="nav in navs" :key="nav.name"
	/>
</template>
