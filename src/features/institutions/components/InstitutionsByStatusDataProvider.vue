<script setup lang="ts">
import { usePagination } from "@/composables/usePagination";
import { getInstitutionsByStatus } from "../api/institutionsApi";
import { watch, type PropType } from "vue";
import { useInstitutionStore } from "../store/institutionsStore";
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

const institutionStore = useInstitutionStore();
const pagination: any = usePagination({
  store: institutionStore,
  auto: false,
  cb: (data: any) => getInstitutionsByStatus({ ...data, status: props.status }),
});

if (!institutionStore.institutions.length) {
  pagination.send();
}

watch(
  () => props.search,
  () => {
    pagination.search.value = props.search;
  }
);
</script>
<template>
  <slot
    :institutions="institutionStore.institutions"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :search="pagination.search"
  />
</template>
