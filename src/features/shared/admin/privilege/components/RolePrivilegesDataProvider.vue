<script setup>
import { usePagination } from "@/composables/usePagination";
import { watch } from "vue";
import { useRolePrivilege } from "../store/roleprivilegeStore";
import { getAllPrivilege } from "../Api/PrivilegeApi";
import { catalogQuery } from "../../catalog";

const props = defineProps({
  prePage: {
    type: Number,
    default: 5000,
  },
  search: {
    type: String,
    default: "",
  },
  moduleType: {
    type: String,
    default: "",
  },
});
const privilegesStore = useRolePrivilege();

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
        sortBy: "privilegeName",
        sortDir: "asc",
      }),
    }),
});

watch(
  () => [props.search, props.moduleType],
  () => {
    if (props.moduleType) pagination.send();
  },
  { immediate: true }
);
</script>
<template>
  <slot
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :privileges="moduleType ? privilegesStore.privilege : []"
  />
</template>
