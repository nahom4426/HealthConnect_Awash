<script setup lang="ts">
import { usePagination } from "@/composables/usePagination";
import { getInstitutionsByStatus } from "../api/institutionApi";
import { watch, type PropType, ref, onMounted, onUnmounted } from "vue";
import { useInstitutionStore } from "../store/institutionsStore";
import type { Status } from "@/types/interface";
import { useRoute } from "vue-router";

const props = defineProps({
  search: {
    type: String,
  },
  status: {
    type: String as PropType<Status>,
    default: "ACTIVE",
  },
});

const route = useRoute();
const institutionStore = useInstitutionStore();
let debounceTimer: ReturnType<typeof setTimeout>;

// Reset store data when navigating to this page
const resetAndFetch = () => {
  institutionStore.set([]); // Clear existing data
  pagination.send(); // Fetch new data
};

const pagination: any = usePagination({
  store: institutionStore,
  auto: false,
  cb: (data: any) => getInstitutionsByStatus({ 
    ...data, 
    status: props.status,
    search: props.search || ""
  }),
});

// Fetch data when component mounts (every time page is visited)
onMounted(() => {
  resetAndFetch();
});

// Watch for route changes to refetch (in case user navigates away and back)
watch(
  () => route.path,
  () => {
    resetAndFetch();
  }
);

// Watch for search changes with debouncing
watch(
  () => props.search,
  (newSearch) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      pagination.send();
    }, 300);
  }
);

// Watch for status changes
watch(
  () => props.status,
  () => {
    pagination.send();
  }
);

// Cleanup on unmount
onUnmounted(() => {
  clearTimeout(debounceTimer);
});
</script>

<template>
  <slot
    :institutions="institutionStore.institutions"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :search="pagination.search"
  />
</template>