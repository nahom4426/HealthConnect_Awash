<script setup lang="ts">
import { usePagination } from "@/composables/usePagination";
import { getInstitutionsByStatus } from "../api/institutionApi";
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
  cb: (data: any) => {
    const payload: any = { ...data, status: props.status };
    if (typeof payload.search !== 'string' || payload.search.trim() === '') {
      delete payload.search;
    }
    return getInstitutionsByStatus(payload);
  },
});

if (!institutionStore.institutions.length) {
  // Ensure empty/invalid search is not sent on first load
  pagination.search.value = (typeof props.search === 'string' && props.search.trim() !== '') ? props.search : undefined;
  pagination.send();
}

watch(
  () => props.search,
  () => {
    // Only set search if it's a non-empty string; otherwise remove from params
    pagination.search.value = (typeof props.search === 'string' && props.search.trim() !== '') ? props.search : undefined;
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
