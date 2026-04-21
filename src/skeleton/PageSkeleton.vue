<script setup lang="ts">
import TableRowSkeleton from '@/components/TableRowSkeleton.vue';
</script>

<template>
	<div class="p-2 flex flex-col w-full h-full">
		<div class="flex items-center border-b py-2 justify-between h-10">
			<div class="bg-gray-200 h-full animate-pulse rounded w-[15rem]"></div>
			<div class="bg-gray-200 h-full animate-pulse rounded w-[25rem]"></div>
		</div>
		<table class="min-w-full rounded-lg">
			<tbody>
				<TableRowSkeleton class="w-full":key="num" v-for="num in 10" :cols="10" />
			</tbody>
		</table>
	</div>
</template>