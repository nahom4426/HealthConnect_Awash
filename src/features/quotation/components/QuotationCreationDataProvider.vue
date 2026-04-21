<script setup lang="ts" >
import { useApiRequest } from '@/composables/useApiRequest';
import { getAllFamilyLevelPacakages } from '@/features/claim/api/packagesApi';
import { allRequest } from '@/utils/utils';
import { usePagination } from '@/composables/usePagination';
import { removeUndefined } from '@/utils/utils';
import { ref } from 'vue';
import { watch } from 'vue';
import { usePackages } from '@/features/claim/store/packagesStore';


const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    default: "ACTIVE",
  },
  search: {
    type: String,
    default: "",
  },
});
const store = usePackages();

	const req = useApiRequest()

	// req.send(
	// 	() => allRequest({
	// 		packages: getAllFamilyLevelPacakages()
	// 	}),
	// 	res => {
			
	// 	}
	// )


	
const pagination = usePagination({
  store: store,
  cb: (data: any) =>
    getAllFamilyLevelPacakages(
      removeUndefined({
        ...data,
        status: props.status,
        search: props.search.trim(),
      })
    ),
  storeKey: 'packages'
});

watch(
  () => props.search,
  () => {
    pagination.send();
  }
);

watch(
  () => props.status,
  () => {
    pagination.send();
  }
);

const setPage = (p: number) => { pagination.page.value = p; pagination.fetch(); };
const setLimit = (l: number) => { pagination.perPage.value = l as any; pagination.send(); };

defineExpose({
  refresh: pagination.send,
  setPage,
  setLimit,
});
</script>
<template>
	<slot
		:packages="pagination.data.value || store.getAll() || []"
		:pending="pagination.pending.value"/>
</template>