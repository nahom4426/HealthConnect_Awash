<script setup>
import { watch } from "vue";
import { getAllRole } from "../Api/RoleApi";
import { useRoles } from "../store/roleStore";
import { usePagination } from "@/composables/usePagination";
import { catalogQuery } from "../../catalog";

const props = defineProps({
  search: String,
  moduleType: String,
  sortBy: { type: String, default: "roleName" },
  sortDir: { type: String, default: "asc" },
});

const roles = useRoles();

const pagination = usePagination({
  store: roles,
  perPage: 500,
  cb: (data) =>
    getAllRole({
      ...data,
      ...catalogQuery({
        search: props.search,
        moduleType: props.moduleType,
        sortBy: props.sortBy,
        sortDir: props.sortDir,
      }),
    }),
  auto: false,
});

pagination.send();

watch(
  () => [props.search, props.moduleType, props.sortBy, props.sortDir],
  () => {
    pagination.send();
  }
);
</script>
<template>
  <slot
    :roles="roles.roles"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :refresh="pagination.send"
  />
</template>
