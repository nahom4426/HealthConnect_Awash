<script setup>
import { usePagination } from "@/composables/usePagination";
import { useInstitution } from "../store/institutionStore";
import { getActiveInstitutions } from "../api/institutionApi";
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

const store = useInstitution();

const pagination = usePagination({
  store: store,
  cb: (data) =>
    getActiveInstitutions(
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