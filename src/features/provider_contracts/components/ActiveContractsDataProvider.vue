<script setup>
import { usePagination } from "@/composables/usePagination";
import { removeUndefined } from "@/utils/utils";
import { computed, watch } from "vue";
import { useContractStore } from "../store/cotractStore";
import { getActiveContracts } from "../api/contractApi";

const props = defineProps({
  auto: { type: Boolean, default: true },
  search: { type: String, default: "" },
  status: {
    type: String,
    default: "ACTIVE", // Default to 'active' status
  },
});

const store = useContractStore();

const pagination = usePagination({
  store: store,
  cb: (data) =>
    getActiveContracts(
      removeUndefined({
        ...data,
        status: props.status,
        search: props.search?.trim?.() || "",
      })
    ),
  auto: props.auto,
});

watch(
  () => props.search,
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
