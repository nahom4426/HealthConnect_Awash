<script setup>
import { usePagination } from "@/composables/usePagination";
import { useCoverage } from "../store/coverageStore";
import { getPackages } from "../api/coverageApi";
import { watch } from "vue";
import { removeUndefined } from "@/utils/utils";

const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
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

const store = useCoverage();

const pagination = usePagination({
  store: store,
  cb: (data) =>
    getPackages(
      removeUndefined({
        ...data,
        status: props.status,
        search: props.search.trim(),
      })
    ),
  storeKey: 'packages'
});

watch(
  () => props.search,
  () => {
    pagination.send();
  }
);

watch(
  () => props.status,
  () => {
    pagination.send();
  }
);

defineExpose({
  refresh: pagination.send,
  setPage: pagination.setPage,
  setLimit: pagination.setLimit,
});
</script>

<template>
  <slot
    :packages="store.packages"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :currentPage="store.currentPage"
    :itemsPerPage="store.itemsPerPage"
    :totalPages="store.totalPages"
  />
</template>