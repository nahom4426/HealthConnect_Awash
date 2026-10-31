<script setup>
import { watch } from "vue";
import { usePagination } from "@/composables/usePagination";
import { usePrivilege } from "../store/privilegeStore";
import { getAllPrivilege } from "../Api/PrivilegeApi";
import { catalogQuery } from "../../catalog";

const props = defineProps({
  prePage: {
    type: Number,
    default: 500,
  },
  search: {
    type: String,
    default: "",
  },
  moduleType: String,
  category: String,
  sortBy: { type: String, default: "privilegeName" },
  sortDir: { type: String, default: "asc" },
});
const privilegesStore = usePrivilege();

const pagination = usePagination({
  auto: false,
  perPage: props.prePage,
  store: privilegesStore,
  cb: (data) =>
    getAllPrivilege({
      ...data,
      ...catalogQuery({
        search: props.search.trim(),
        moduleType: props.moduleType,
        category: props.category,
        sortBy: props.sortBy,
        sortDir: props.sortDir,
      }),
    }),
});

pagination.send();

watch(
  () => [props.search, props.moduleType, props.category, props.sortBy, props.sortDir],
  () => {
    pagination.send();
  }
);
</script>
<template>
  <slot
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :privileges="privilegesStore.privilege"
  />
</template>
