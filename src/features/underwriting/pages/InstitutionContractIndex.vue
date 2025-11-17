<script setup lang="ts">
import SingleInstitutionDataProvider from '@/features/institutions/components/SingleInstitutionDataProvider.vue';
import PageSkeleton from '@/skeleton/PageSkeleton.vue';

</script>
<template>
	<SingleInstitutionDataProvider v-slot="{ instituton, pending }">
		<RouterView v-if="!pending" :instituton="instituton" />
		<PageSkeleton v-else />
	</SingleInstitutionDataProvider>
</template>