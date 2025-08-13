<script setup>
import { usePagination } from "@/composables/usePagination";
import { useUnderwriting } from "../store/underwritingStore";
import { getIssuedPolicies } from "../api/underwritingApi";
import { watch } from "vue";
import { removeUndefined } from "@/utils/utils";

const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
  },
  search: {
    type: String,
    default: "",
  },
});

const store = useUnderwriting();

const pagination = usePagination({
  store: store,
  cb: (data) =>
    getIssuedPolicies(
      removeUndefined({
        ...data,
        status: props.status,
        search: props.search.trim(),
      })
    ),
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
    :policies="store.issuedPolicies"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
  />
</template>