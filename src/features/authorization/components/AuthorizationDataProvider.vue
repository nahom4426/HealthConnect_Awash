<script setup>
import { watch } from "vue";
import { usePagination } from "@/composables/usePagination";
import { removeUndefined } from "@/utils/utils";
import { getAuthorizations } from "../api/authorizationApi";
import { useAuthorizationStore } from "../store/authorizationStore";

const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },
  search: {
    type: String,
    default: "",
  },
  filters: {
    type: Object,
    default: () => ({}),
  },
});

const store = useAuthorizationStore();

const pagination = usePagination({
  store,
  auto: props.auto,
  cb: (data) =>
    getAuthorizations(
      removeUndefined({
        ...data,
        ...props.filters,
        search: props.search?.trim(),
      })
    ),
});

watch(
  () => props.search,
  () => {
    pagination.send();
  }
);

watch(
  () => props.filters,
  () => {
    pagination.send();
  },
  { deep: true }
);
</script>

<template>
  <slot
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :authorizations="store.authorizations"
    :currentPage="pagination.page.value"
    :itemsPerPage="pagination.perPage.value"
    :totalPages="pagination.totalPages.value"
    :totalElements="pagination.totalElements.value"
  />
</template>
