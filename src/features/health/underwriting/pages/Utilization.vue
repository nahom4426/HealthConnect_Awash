<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import DefaultPage from '@/components/DefaultPage.vue';
import Table from '@/components/Table.vue';
import IssuedContractsDataProvider from '../components/IssuedContractsDataProvider.vue';
import utilizationStatusRow from '../components/utilizationStatusRow.vue';

const route = useRoute();

const dataProvider = ref();
const institutionName = ref('');
const status = ref('ACTIVE');

function refreshData() {
  if (dataProvider.value) {
    dataProvider.value.refresh();
  }
}

function handlePageChange(page) {
  if (dataProvider.value) {
    dataProvider.value.setPage(page);
  }
}

function handleLimitChange(limit) {
  if (dataProvider.value) {
    dataProvider.value.setLimit(limit);
  }
}

const handleRefetch = () => {
  refreshData();
};
</script>

<template>
  <DefaultPage :title="`${institutionName} Utilization`" placeholder="Search contracts...">
    <template #default="{ search }">
      <IssuedContractsDataProvider
        ref="dataProvider"
        :institutionUuid="route.params.id"
        :status="status"
        :search="search"
        v-slot="{ contracts, pending }"
      >
        <Table
          :pending="pending"
          :headers="{
            head: ['Institution Name', 'Description', 'Status', 'Actions'],
            row: ['', 'institutionName', 'contractName', 'status'],
          }"
          :rows="contracts"
          :rowCom="utilizationStatusRow"
          :rowComProps="{
            showActionButtons: true,
            onRefetch: handleRefetch,
          }"
          :pagination="{
            onPageChange: handlePageChange,
            onLimitChange: handleLimitChange,
          }"
        />
      </IssuedContractsDataProvider>
    </template>
  </DefaultPage>
</template>
