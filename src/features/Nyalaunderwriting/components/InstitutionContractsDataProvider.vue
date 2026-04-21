<script setup lang="ts">
import { usePagination } from "@/composables/usePagination";
import { useInstitutionContract } from "../store/institutionContractsStore";
import { getInstitutionContracts } from "../api/underwritingApi";
import { watch, ref } from "vue";
import { removeUndefined } from "@/utils/utils";

const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },
  institutionUuid: {
    type: String,
    required: true,
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

const institutionContractStore = useInstitutionContract();
const loading = ref(false); // Add local loading state

const pagination = usePagination({
  store: {
    state: {
      items: institutionContractStore.institutionContract,
      currentPage: institutionContractStore.currentPage,
      itemsPerPage: institutionContractStore.itemsPerPage,
      totalPages: institutionContractStore.totalPages,
      totalItems: institutionContractStore.totalItems,
    },
    getAll: () => institutionContractStore.getAll(),
    set: (data) => institutionContractStore.set(data),
  },
  cb: async (params) => {
    loading.value = true; // Set loading to true before request
    try {
      const response = await getInstitutionContracts(
        props.institutionUuid,
        removeUndefined({
          status: props.status,
          // ...params,
          search: props.search.trim(),
        })
      );
      institutionContractStore.setPagination(response);
      return response;
    } finally {
      loading.value = false; // Ensure loading is set to false after request
    }
  },
  auto: props.auto,
});

// Debounce the search to prevent too many requests
let searchTimeout: number;
watch(
  () => props.search,
  (newVal) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      pagination.send();
    }, 300);
  }
);

watch(
  () => props.status,
  () => {
    pagination.send();
  },
  { immediate: true }
);

defineExpose({
  refresh: pagination.send,
  setPage: (page: number) => {
    institutionContractStore.currentPage = page;
    pagination.send();
  },
  setLimit: (limit: number) => {
    institutionContractStore.itemsPerPage = limit;
    pagination.send();
  },
});
</script>

<template>
  <slot
    :institutionContract="institutionContractStore.institutionContract"
    :pending="loading"
    :error="pagination.error"
    :currentPage="institutionContractStore.currentPage"
    :itemsPerPage="institutionContractStore.itemsPerPage"
    :totalPages="institutionContractStore.totalPages"
  />
</template>