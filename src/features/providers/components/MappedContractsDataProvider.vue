<script setup>
import { watch } from "vue";
import { usePagination } from "@/composables/usePagination";
import { removeUndefined } from "@/utils/utils";
import { useRoute } from "vue-router";
import { getAlreadyMappedActiveProviders } from "../api/providerApi";

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
    default: "ACTIVE",
  },
  search: {
    type: String,
    default: "",
  },
});

const route = useRoute();

// The ID coming from route
const getMappedActiveProvider =
  route.params.payerInstitutionContractUuid ||
  route.params.id ||
  "";

// Pagination setup
const pagination = usePagination({
  cb: (data) =>
    getAlreadyMappedActiveProviders(
      getMappedActiveProvider,
      removeUndefined({
        ...data,
        search: props.search.trim(),
        // contractStatus: props.status,
      })
    ),
});

// Watch search
watch(
  () => props.search,
  () => {
    console.log('[MappedContractsDataProvider] search changed -> send', props.search);
    pagination.send();
  }
);

watch(
  () => props.refetch,
  () => {
    console.log('[MappedContractsDataProvider] refetch changed -> send', props.refetch);
    pagination.send();
  }
);

const refresh = () => pagination.send();

defineExpose({
  refresh,
  send: pagination.send,
});
</script>

<template>
  <slot
    :mappedContracts="pagination.data.value"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :page="pagination.page.value"
    :size="pagination.perPage.value"
    :totalPages="pagination.totalPages.value"
    :totalElements="pagination.totalElements.value"
  />
</template>
