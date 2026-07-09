<script setup>
import { usePagination } from "@/composables/usePagination";
import { useUnderwriting } from "../store/underwritingStore";
import { getIssuedContracts } from "../api/underwritingApi";
import { watch } from "vue";
import { removeUndefined } from "@/utils/utils";

const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },
  refetch: {
    type: Number,
    default: 0,
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
    required: false,
    default: undefined,
  },
  policyType: {
    type: String,
    required: false,
    default: "GENERAL",
  },
});

const store = useUnderwriting();

const pagination = usePagination({
  store,
  auto: props.auto,
  cb: (data) =>
    getIssuedContracts(
      removeUndefined({
        ...data,
        status: props.status,
        search: props.search.trim(),
        institutionUuid: props.institutionUuid,
        policyType: props.policyType,
      })
    ),
});

watch(
  () => props.search,
  () => {
    console.log('[IssuedContractsDataProvider] search changed -> send()', props.search);
    pagination.page.value = 1;
    pagination.send();
  }
);

watch(
  () => props.status,
  () => {
    console.log('[IssuedContractsDataProvider] status changed -> send()', props.status);
    pagination.page.value = 1;
    pagination.send();
  }
);

watch(
  () => props.refetch,
  () => {
    console.log('[IssuedContractsDataProvider] refetch changed -> send()', props.refetch);
    pagination.send();
  }
);

watch(
  () => props.policyType,
  () => {
    pagination.page.value = 1;
    pagination.send();
  }
);

defineExpose({
  refresh: pagination.send,
  setPage: (page) => {
    console.log('[IssuedContractsDataProvider] setPage', page);
    pagination.page.value = page;
    pagination.send();
  },
  setLimit: (limit) => {
    console.log('[IssuedContractsDataProvider] setLimit', limit);
    pagination.perPage.value = limit;
    pagination.send();
  },
});
</script>

<template>
  <slot
    :contracts="store.contracts"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :currentPage="pagination.page.value"
    :itemsPerPage="pagination.perPage.value"
    :totalPages="pagination.totalPages.value"
    :totalElements="pagination.totalElements.value"
  />
</template>
