<script setup>
import { ref, watch } from 'vue';
import { useCommissionStore } from '../stores/commissionStore';

const props = defineProps({
  brokerId: {
    type: String,
    required: true,
  },
  refetch: {
    type: Number,
    default: 0,
  },
});

const commissionStore = useCommissionStore();
const isFetching = ref(false);

async function fetchData() {
  if (!props.brokerId) return;
  
  if (isFetching.value) return;
  isFetching.value = true;
  
  try {
    await Promise.all([
      commissionStore.fetchBalance(props.brokerId),
      commissionStore.fetchPendingCommissions(props.brokerId),
      commissionStore.fetchTransactions(props.brokerId),
      commissionStore.fetchPayments(props.brokerId),
    ]);
  } catch (err) {
    console.error('Failed to fetch commission data', err);
  } finally {
    isFetching.value = false;
  }
}

watch(
  () => props.brokerId,
  () => {
    fetchData();
  },
  { immediate: true }
);

watch(
  () => props.refetch,
  (newVal, oldVal) => {
    if (newVal !== oldVal && newVal > 0) {
      fetchData();
    }
  }
);
</script>

<template>
  <slot
    :pendingCommissions="commissionStore.pendingCommissions"
    :transactions="commissionStore.transactions"
    :payments="commissionStore.payments"
    :balance="commissionStore.currentBalance"
    :pending="commissionStore.loading"
    :error="commissionStore.error"
  />
</template>
