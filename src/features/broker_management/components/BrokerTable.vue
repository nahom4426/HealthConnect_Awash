<script setup>
import { useRouter } from 'vue-router';
import Table from '@/components/Table.vue';
import BrokerStatusRow from './BrokerStatusRow.vue';

const props = defineProps({
  brokers: { type: Array, required: true },
  loading: { type: Boolean, default: false }
});

const router = useRouter();

const viewBroker = (row) => {
  router.push(`/brokers/${row.stakeholderUuid}`);
};
</script>

<template>
  <Table
    :pending="loading"
    :headers="{
      head: ['Broker Name', 'License / Contact', 'Date Joined', 'Balance', 'Status', 'Actions'],
      row: ['firstName', 'licenseNumber', 'createdAt', 'currentBalance', 'status'],
    }"
    :rows="brokers"
    :hideIndex="true"
    :lastCol="true"
    placeholder="No brokers found."
    :rowCom="BrokerStatusRow"
    :rowComProps="{
      onRowClick: viewBroker,
    }"
    @row="viewBroker"
  />
</template>
