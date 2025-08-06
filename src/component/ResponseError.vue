<script setup lang="ts">
	const props = defineProps(['error'])
</script>
<template>
	<p v-if='error' class="text-left border-l-4 w-full text-error-text border-error-border bg-error-bg px-2 py-1 text-sm">
		{{error}}
	</p>
</template>