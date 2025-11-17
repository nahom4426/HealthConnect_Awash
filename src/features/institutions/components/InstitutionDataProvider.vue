<script setup>
import { usePagination } from "@/composables/usePagination";
import { useInstitutions } from "../store/institutionsStore";
import { getInstitutions } from "../api/institutionApi";
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

const store = useInstitutions();

const pagination = usePagination({
  store: store,
  cb: (data) =>
    getInstitutions(
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
    :institutions="store.institutions"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
  />
</template>