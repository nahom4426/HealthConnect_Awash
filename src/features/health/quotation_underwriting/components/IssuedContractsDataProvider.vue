<script setup>
import { usePagination } from "@/composables/usePagination";
import { useUnderwriting } from "../store/underwritingStore";
import { getIssuedContracts } from "../api/underwritingApi";
import { watch, ref } from "vue";
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
  institutionUuid: {
    type: String,
    required: true,
  },
  policyType: {
    type: String,
    default: "GENERAL",
  },
});

const store = useUnderwriting();
const loading = ref(false);

const pagination = usePagination({
  store,
  auto: props.auto,
  cb: async (data) => {
    loading.value = true;
    try {
      const response = await getIssuedContracts(
        removeUndefined({
          ...data,
          status: props.status,
          search: props.search.trim(),
          institutionUuid: props.institutionUuid,
          policyType: props.policyType,
        })
      );
      store.setPagination(response);
      return response;
    } finally {
      loading.value = false;
    }
  },
});

watch(
  () => props.search,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      pagination.send();
    }
  }
);

watch(
  () => props.status,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      pagination.send();
    }
  }
);

watch(
  () => props.policyType,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      pagination.send();
    }
  }
);

defineExpose({
  refresh: pagination.send,
  setPage: (page) => {
    store.currentPage = page;
    pagination.send();
  },
  setLimit: (limit) => {
    store.itemsPerPage = limit;
    pagination.send();
  },
});
</script>

<template>
  <slot
    :contracts="store.contracts"
    :pending="loading"
    :error="pagination.error.value"
    :currentPage="store.currentPage"
    :itemsPerPage="store.itemsPerPage"
    :totalPages="store.totalPages"
  />
</template>
