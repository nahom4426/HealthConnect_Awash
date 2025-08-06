<script setup>
import { usePagination } from "@/composables/usePagination";
import { useProviders } from "../store/providersStore";
import { getProviders } from "../api/providerApi";
import { watch, computed, onMounted } from "vue";
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

const store = useProviders();

const pagination = usePagination({
  store: store,
  cb: (data) =>
    getProviders(
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
    :providers="store.providers"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
  />
</template>
