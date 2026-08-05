<script setup>
import { watch } from 'vue';
import { usePagination } from '@/composables/usePagination';
import { removeUndefined } from '@/utils/utils';
import { getMappedInstitutionsForContract } from '../api/contractApi';

const props = defineProps({
  payerProviderContractUuid: { type: String, required: true },
  search: { type: String, default: '' },
  refetch: { type: Number, default: 0 },
});

const pagination = usePagination({
  cb: (data) =>
    getMappedInstitutionsForContract(
      props.payerProviderContractUuid,
      removeUndefined({
        ...data,
        search: props.search.trim(),
        status: 'ACTIVE',
      })
    ),
});

watch(
  () => props.search,
  () => pagination.send()
);

watch(
  () => props.refetch,
  () => pagination.send()
);

defineExpose({ refresh: () => pagination.send() });
</script>

<template>
  <slot
    :institutions="pagination.data.value"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :currentPage="pagination.page?.value ?? 1"
    :itemsPerPage="pagination.perPage?.value ?? 25"
    :totalPages="pagination.totalPages?.value ?? 1"
  />
</template>
