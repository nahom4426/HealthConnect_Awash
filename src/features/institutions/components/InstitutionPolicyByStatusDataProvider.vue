<script setup lang="ts">
import { usePagination } from "@/composables/usePagination";
import { useInstitutionPolicyStore } from "../store/institutionPolicyStore";
import {
	getInstitutionsPolicyByStatus,
} from "../api/institutionsApi";
import { watch } from "vue";
import type { PropType } from "vue";
import type { Status } from "@/types/interface";

const props = defineProps({
  search: {
    type: String,
  },
  status: {
    type: String as PropType<Status>,
    default: "ACTIVE",
  },
});

const institutionStore = useInstitutionPolicyStore();
const pagination: any = usePagination({
  store: institutionStore,
  auto: false,
  cb: (data: any) => getInstitutionsPolicyByStatus({ ...data, status: props.status }),
});

if (!institutionStore.institutions.length) {
  pagination.send();
}

watch(props, () => {
  pagination.search.value = props.search;
	pagination.send();
});
</script>
<template>
  <slot
    :institutions="institutionStore.institutions"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
  />
</template>
