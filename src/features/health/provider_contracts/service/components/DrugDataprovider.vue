<script setup>
import { usePagination } from "@/composables/usePagination";
import { watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useDrugStore } from "../store/drugStore";
import { getAllDrugs } from "../api/drugApi";
import { removeUndefined } from "@/utils/utils";

const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },
  prePage: {
    type: Number,
    default: 25,
  },
  search: {
    type: String,
    default: "",
  },
  id: {
    type: String,
  },
});

const authStore = useAuthStore();

const drugStore = useDrugStore();

const pagination = usePagination({
  auto: props.auto,
  store: drugStore,
  cb: (data) =>
    getAllDrugs(
      props.id || authStore.auth?.user?.providerUuid,
      removeUndefined({ searchKey: props.search, ...data })
    ),
});
watch(
  () => props.search,
  () => {
    if (props.id || authStore.auth?.user?.providerUuid) {
      pagination.send();
    }
  }
);
watch(
  () => props.id,
  () => {
    pagination.send();
  }
);

if (drugStore.drugs.length == 0 && authStore.auth?.user?.providerUuid) {
  pagination.send();
}
</script>
<template>
  <slot
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :drugs="drugStore.drugs"
  />
</template>
