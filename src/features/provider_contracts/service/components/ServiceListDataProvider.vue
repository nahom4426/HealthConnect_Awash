<script setup>
import { usePagination } from "@/composables/usePagination";
import { watch } from "vue";
import { useServiceListStore } from "../store/serviceListStore";
import { getAllServices } from "../api/serviceApi.js";
import { useAuthStore } from "@/stores/auth";
import { removeUndefined } from "@/utils/utils";
import { useRoute } from "vue-router";

const route = useRoute();
const authStore = useAuthStore();
const serviceListStore = useServiceListStore();

const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },
  refetch: {
    type: Number,
    default: 0,
  },
  prePage: {
    type: Number,
    default: 25,
  },
  search: {
    type: String,
    default: "",
  },
  id: {
    type: String,
    default: "",
  },
});

const pagination = usePagination({
  store: serviceListStore,
  auto: props.auto,
  cb: (data) => {
    const params = removeUndefined({ search: props.search , ...data });
    console.log("Sending to backend:", { params, search: props.search  });
    return getAllServices(
      route.params.id || props.id || authStore.auth?.user?.providerUuid,
      params
    );
  },
});

// Watch for search changes and update pagination.search
watch(
  () => props.search,
  (newSearch) => {
    console.log("Search changed to:", newSearch);
    pagination.search.value = newSearch;
    if (route.params.id || props.id || authStore.auth?.user?.providerUuid) {
      // Reset to first page when searching
      pagination.send();
    }
  },
  { immediate: false }
);

// Watch for id changes
watch(
  () => props.id,
  () => {
    pagination.send();
  }
);

watch(
  () => props.refetch,
  () => {
    pagination.send();
  }
);

watch(
  () => pagination.totalElements.value,
  (v) => {
    console.log('[ServiceListDataProvider] totalElements=', v);
  }
);

// Initial load if no data
if (
  serviceListStore.serviceList.length == 0 ||
  authStore.auth?.user?.userUuid
) {
  pagination.send();
}
</script>
<template>
  <slot
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :serviceList="serviceListStore.serviceList"
    :contracts="serviceListStore.serviceList"
    :currentPage="pagination.page.value"
    :itemsPerPage="pagination.perPage.value"
    :totalPages="pagination.totalPages.value"
    :totalElements="pagination.totalElements.value"
  />
</template>
