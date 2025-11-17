<script setup lang="ts" >
import { ref, watch, type PropType } from 'vue';

	const props = defineProps({
		modelVale: String,
		items: {
			type: Array as PropType<{name: string}[]>,
			required: true
		}
	})
	const emit = defineEmits(['update:modelValue'])
	const active = ref(props.items[0].name)
	const activeIndex = ref(0)

	watch(active, () => {
		activeIndex.value = props.items.findIndex(el => el.name == active.value)
		emit('update:modelValue', active.value)
	})
</script>
<template>
	<div v-ripple class="isolate cursor-pointer relative flex w-64 h-10 bg-black/10 shadow-md rounded-full" >
		<div @click="active = item.name" :key="item.name" v-for="item in items" :class="[active == item.name ? 'text-base-clr4' : 'text-text-clr']" class="w-1/2 transition-all duration-200 ease-linear h-full flex items-center justify-center" >
			{{ item.name }}
		</div>
		<div :class="[activeIndex == 0 ? 'translate-x-0' : 'translate-x-full']" class="transition-all duration-75 ease-in -z-20 absolute w-1/2 h-full rounded-full bg-dark" ></div>
	</div>
</template>