<script setup>
import { usePagination } from "@/composables/usePagination";
import { useProviders } from "../store/providersStore";
import { getActiveProviders, getMappedActiveProviders } from "../api/providerApi";
import { watch, computed, onMounted } from "vue";
import { removeUndefined } from "@/utils/utils";
import { useRoute } from "vue-router";

const route = useRoute();

const props = defineProps({
  auto: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    default: "ACTIVE", // Default to 'active' status
  },
  search: {
    type: String,
    default: "",
  },
});
const getMappedActiveProvider = route.params.payerInstitutionContractUuid || route.params.id || "";
const store = useProviders();

const pagination = usePagination({
  store: store,
  cb: (data) =>
    getMappedActiveProviders(
      getMappedActiveProvider,
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
