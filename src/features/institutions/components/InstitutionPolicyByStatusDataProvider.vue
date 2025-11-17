<script setup>
import { usePagination } from "@/composables/usePagination";
import { useInstitutionPolicyStore } from "../store/institutionPolicyStore";
import { getInstitutionsPolicyByStatus } from "../api/institutionApi";
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

const store = useInstitutionPolicyStore();

const pagination = usePagination({
  store,
  auto: props.auto,
  cb: (data) =>
    getInstitutionsPolicyByStatus(
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
    console.log("hhhh");
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
