<script setup>
import { usePagination } from "@/composables/usePagination";
import { useAuthStore } from "@/stores/auth";
import { watch } from "vue";
import { useService } from "../store/serviceStore";
import { getAllServices } from "../api/serviceApi";

const props = defineProps({
  search: String,
});
const authStore = useAuthStore();
const serviceStore = useService();
const pagination = usePagination({
  store: serviceStore,
  cb: () => getAllServices(authStore.auth?.user?.providerUuid),
});

if (!serviceStore.services.length) {
  pagination.send();
}

watch(
  () => props.search,
  () => {
    pagination.send();
  }
);
</script>

<template>
  <slot
    :services="serviceStore.services"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
  />
</template>
