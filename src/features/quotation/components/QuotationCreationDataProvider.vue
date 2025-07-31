<script setup lang="ts" >
import { useApiRequest } from '@/composables/useApiRequest';
import { getAllFamilyLevelPacakages } from '@/features/claim/api/packagesApi';
import { allRequest } from '@/utils/utils';

	const req = useApiRequest()

	req.send(
		() => allRequest({
			packages: getAllFamilyLevelPacakages()
		}),
		res => {
			
		}
	)
</script>
<template>
	<slot
		:packages="req.response.value?.packages || []"
		:pending="req.pending.value"
	/>
</template>