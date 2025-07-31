<script setup lang="ts">
import { usePagination } from "@/composables/usePagination";
import { getAllPolicyPendingInstitutions } from "../api/payerInstitutionContractApi";
import { watch, type PropType } from "vue";
import { usePayerInstitutionContractStore } from "../store/payerInstitutionContractStore";
import type { Status } from "@/types/interface";

const props = defineProps({
	search: {
		type: String,
	},
	status: {
		type: String as PropType<Status>
	}
})

const institutionStore = usePayerInstitutionContractStore()
const pagination: any = usePagination({
	store: institutionStore,
	auto: false,
	cb: getAllPolicyPendingInstitutions
});

if(!institutionStore.institutions.length) {
	pagination.send()
}

watch(props, () => {
	pagination.search.value = props.search
	pagination.send()
})

</script>
<template>
  <slot
		:institutions="institutionStore.institutions"
		:pending="pagination.pending.value"
		:error="pagination.error.value"
	/>
</template>
