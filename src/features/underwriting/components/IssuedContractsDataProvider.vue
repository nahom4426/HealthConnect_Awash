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
  () => props.status,
  () => {
    pagination.send();
  }
);
</script>

<template>
  <slot
    :contracts="store.contracts"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :currentPage="store.currentPage"
    :itemsPerPage="store.itemsPerPage"
    :totalPages="store.totalPages"
  />
</template>
