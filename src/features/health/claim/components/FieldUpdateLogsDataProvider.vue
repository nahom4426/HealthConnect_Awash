<script setup>
import { usePagination } from "@/composables/usePagination";
import { watch, unref } from "vue";
import { getFieldUpdateLogs } from "../api/claimApi";

const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },
  params: {
    type: Object,
    default: () => ({}),
  },
  search: {
    type: String,
    default: "",
  },
});

const pagination = usePagination({
  auto: false,
  reset: true,
  cb: (data) => {
    const params = { ...data };

    Object.keys(props.params || {}).forEach((k) => {
      const v = unref(props.params[k]);
      if (v !== null && v !== undefined && v !== "") {
        params[k] = v;
      }
    });

    if (props.search && props.search.trim()) {
      params.search = props.search.trim();
    }

    if (params.search === "" || params.search == null) delete params.search;
    Object.keys(params).forEach((k) => {
      if (params[k] === null || params[k] === undefined) delete params[k];
    });

    return getFieldUpdateLogs(params);
  },
});

if (props.auto) {
  pagination.send();
}

watch(
  () => props.params,
  () => {
    pagination.send();
  },
  { deep: true }
);

watch(
  () => props.search,
  () => {
    pagination.send();
  }
);

defineExpose({
  refresh: pagination.send,
  setPage: (page) => {
    pagination.page.value = page;
    pagination.fetch();
  },
  setLimit: (limit) => {
    pagination.perPage.value = limit;
    pagination.page.value = 1;
    pagination.fetch();
  },
});
</script>

<template>
  <slot
    :logs="pagination.data.value"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :currentPage="pagination.page.value"
    :itemsPerPage="pagination.perPage.value"
    :totalPages="pagination.totalPages.value"
    :totalElements="pagination.totalElements.value"
    :search="pagination.search"
    :send="pagination.send"
  />
</template>
