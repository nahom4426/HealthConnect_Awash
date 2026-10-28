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
    console.log('🌐 API CALL - Status:', props.status, 'Params:', params);
    try {
      const response = await getInstitutionContracts(
        props.institutionUuid,
        removeUndefined({
          status: props.status,
          // ...params,
          // search: props.search.trim(),
        })
      );
      
      console.log('✅ API Response for status [' + props.status + ']:', response);
      
      // Handle array response (direct array from API)
      if (Array.isArray(response)) {
        // For array responses, set pagination to defaults
        console.log('📦 Array response - Setting pagination');
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
        console.log('📦 Object response with data property');
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
      console.log('📦 Direct object response');
      institutionContractStore.setPagination(response);
      return response;
    } finally {
      loading.value = false; // Ensure loading is set to false after request
    }
  },
  auto: false, // Don't auto-fetch - let parent component control when to fetch
});

// Debounce the search to prevent too many requests
let searchTimeout: number;
watch(
  () => props.search,
  (newVal) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      console.log('🔍 Search changed, fetching:', newVal);
      pagination.send();
    }, 300);
  }
);

watch(
  () => props.status,
  (newStatus) => {
    console.log('📊 Status changed to:', newStatus, '- Fetching data');
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