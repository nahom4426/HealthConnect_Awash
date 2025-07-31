<script setup lang="ts" >
	import Navs from './Navs.vue';
	import DrawerButtonParent from '@/components/drawer_buttons/DrawerButtonParent.vue'
	
	const props = defineProps({
		navs: {
			type: Array,
			required: true
		}
	})
</script>
<template>
	<DrawerButtonParent :navs="nav" v-for="nav in navs" />
</template>