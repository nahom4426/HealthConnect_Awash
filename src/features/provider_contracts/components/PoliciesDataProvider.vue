<script setup>
import { watch } from 'vue';
import { usePagination } from '@/composables/usePagination';
import { removeUndefined } from '@/utils/utils';
import { getPolicies } from '../api/contractApi';

const props = defineProps({
  search: { type: String, default: '' },
  refetch: { type: Number, default: 0 },
  status: { type: String, default: 'ACTIVE' },
});

const pagination = usePagination({
  cb: (data) =>
    getPolicies(
      removeUndefined({
        ...data,
        search: props.search.trim(),
        status: props.status,
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
    :policies="pagination.data.value"
    :pending="pagination.pending.value"
    :error="pagination.error.value"
    :currentPage="pagination.page?.value ?? 1"
    :itemsPerPage="pagination.perPage?.value ?? 25"
    :totalPages="pagination.totalPages?.value ?? 1"
  />
</template>
