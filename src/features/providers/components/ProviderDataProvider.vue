<script setup lang="ts">
import { useApiRequest } from "@/composables/useApiRequest";
import { useProviders } from "../store/providersStore";
import { getProviders } from "../api/providerApi";
import { usePagination } from "@/composables/usePagination";
import type { PropType } from "vue";
import { Status } from "@/types/interface";

const props = defineProps({
	auto: {
		type: Boolean,
		default: true
	},
	status: {
		type: String as PropType<Status>,
		default: Status.ACTIVE
	}
})
const providersStore = useProviders();

const providerReq = useApiRequest()

const pagination = usePagination({
	auto: false,
	cb: (data: any) => getProviders({
		...data,
		status: props.status
	})
})

if(!providersStore.providers.length) {
	if(props.auto) {
		pagination.send()
	}
}
</script>
<template>
  <slot
    :providers="providersStore.providers"
    :pending="providerReq.pending.value"
    :error="providerReq.error.value"
		:search="pagination.search"
  />
</template>
