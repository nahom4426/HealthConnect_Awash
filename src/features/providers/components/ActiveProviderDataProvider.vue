<script setup>
import { usePagination } from "@/composables/usePagination";
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
  refetch: {
    type: Number,
    default: 0,
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

const pagination = usePagination({
  cb: (data) =>
    getMappedActiveProviders(
      getMappedActiveProvider,
      removeUndefined({
        ...data,
        contractStatus: props.status,
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

watch(
  () => props.refetch,
  () => {
    console.log('[ActiveProviderDataProvider] refetch changed -> send', props.refetch);
    pagination.send();
  }
);
</script>
<template>
  <slot
    :providers="pagination.data.value"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
  />
</template>
