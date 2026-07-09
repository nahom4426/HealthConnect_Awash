// BrokerDataProvider.vue
<script setup>
import { usePagination } from '@/composables/usePagination';
import { getBrokers } from '../api/brokerApi';
import { watch, ref } from 'vue';
import { removeUndefined } from '@/utils/utils';
import { useBrokerStore } from '../stores/brokerStore';

const brokerStore = useBrokerStore();
const isFetching = ref(false);

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
    default: 'ALL',
  },
  search: {
    type: String,
    default: '',
  },
});

const pagination = usePagination({
  auto: props.auto,
  cb: async (data) => {
    isFetching.value = true;
    try {
      const res = await getBrokers(
        removeUndefined({
          page: data.page,
          size: data.limit,
          sortBy: 'createdAt',
          sortDir: 'DESC',
          ...(props.status && props.status !== 'ALL' ? { status: props.status } : {}),
          ...(props.search.trim() ? { search: props.search.trim() } : {}),
        })
      );
      const paginated = res?.data || res;
      if (paginated?.content) {
        brokerStore.brokers = paginated.content;
      } else {
        brokerStore.brokers = paginated;
      }
      return res;
    } finally {
      isFetching.value = false;
    }
  },
});

watch(
  () => props.search,
  () => {
    pagination.send();
  }
);

watch(
  () => props.status,
  () => {
    pagination.send();
  }
);

watch(
  () => props.refetch,
  () => {
    if (isFetching.value) return;
    isFetching.value = true;
    pagination.send().finally(() => {
      isFetching.value = false;
    });
  },
  { immediate: true }
);
</script>

<template>
  <slot
    :brokers="brokerStore.brokers"
    :pending="pagination.pending.value || isFetching || brokerStore.loading"
    :error="pagination.error.value || brokerStore.error"
  />
</template>
