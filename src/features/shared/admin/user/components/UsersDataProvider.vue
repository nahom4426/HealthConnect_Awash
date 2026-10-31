<script setup>
import { watch } from "vue";
import { getAllUser } from "../Api/UserApi";
import { useUserStore } from "../store/userStore";
import { usePagination } from "@/composables/usePagination";
import { catalogQuery } from "../../catalog";

const props = defineProps({
  search: String,
  branchUuid: String,
  moduleType: String,
  status: String,
  sortBy: { type: String, default: "firstName" },
  sortDir: { type: String, default: "asc" },
});

const userStore = useUserStore();

const pagination = usePagination({
  store: userStore,
  perPage: 500,
  cb: (data) =>
    getAllUser({
      ...data,
      ...catalogQuery({
        search: props.search,
        branchUuid: props.branchUuid,
        moduleType: props.moduleType,
        status: props.status,
        sortBy: props.sortBy,
        sortDir: props.sortDir,
      }),
    }),
  auto: false,
});

pagination.send();

watch(
  () => [props.search, props.branchUuid, props.moduleType, props.status, props.sortBy, props.sortDir],
  () => {
    pagination.send();
  }
);
</script>

<template>
  <slot
    :users="userStore.users"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :refresh="pagination.send"
  />
</template>
