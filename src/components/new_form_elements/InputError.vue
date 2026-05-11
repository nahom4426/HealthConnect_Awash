<script setup>
	const props = defineProps(['error', 'glass'])
</script>
<template>
	<p v-if='error' :title='error'
		:class="glass
			? 'capitalize px-1 text-xs font-semibold text-red-300'
			: 'capitalize px-1 text-xs text-red-700'"
	>
		{{error}}
	</p>
</template>