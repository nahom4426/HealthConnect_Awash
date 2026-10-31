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
    set: (data: any) => institutionContractStore.set(data),
  },
  cb: async (params: any) => {
    loading.value = true; // Set loading to true before request
    try {
      const response = await getInstitutionContracts(
        props.institutionUuid,
        removeUndefined({
          status: props.status,
          // ...params,
          // search: props.search.trim(),
        })
      );
      
      
      // Handle array response (direct array from API)
      if (Array.isArray(response)) {
        // For array responses, set pagination to defaults
        institutionContractStore.setPagination({
          currentPage: 1,
          itemsPerPage: 10,
          totalPages: 1,
          totalItems: response.length
        });
        return response;
      }
      
      // Handle object response with data property
      if (response?.data) {
        // Set pagination with defaults if data is an array
        if (Array.isArray(response.data)) {
          institutionContractStore.setPagination({
            currentPage: 1,
            itemsPerPage: 10,
            totalPages: 1,
            totalItems: response.data.length
          });
        } else {
          institutionContractStore.setPagination(response);
        }
        return response.data;
      }
      
      // Handle object response directly
      institutionContractStore.setPagination(response);
      return response;
    } finally {
      loading.value = false; // Ensure loading is set to false after request
    }
  },
  auto: false, // Don't auto-fetch - let parent component control when to fetch
});

// Debounce the search to prevent too many requests
let searchTimeout: ReturnType<typeof setTimeout> | undefined;
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
  (newStatus) => {
    pagination.send();
  },
  { immediate: false } // Changed to false - don't fetch on initial mount
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