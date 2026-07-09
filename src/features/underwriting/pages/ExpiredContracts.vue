<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import DefaultPage from '@/components/DefaultPage.vue';
import Table from '@/components/Table.vue';
import IssuedContractsDataProvider from '../components/IssuedContractsDataProvider.vue';
import expiredContractsStatusRow from '../components/expiredContractsStatusRow.vue';

const route = useRoute();

const dataProvider = ref();
const institutionName = ref('');
const status = ref('EXPIRED');
const statusOptions = ['EXPIRED', 'RENEWED',"RENEWAL_IN_PROGRESS","RENEWAL_SCHEDULED"];

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

function handleStatusChange(nextStatus) {
  status.value = nextStatus;
}

const handleRefetch = () => {
  refreshData();
};
</script>

<template>
  <DefaultPage :title="`${institutionName} Expired Contracts`" placeholder="Search contracts...">
    <template #filter>
      <div class="flex gap-2 items-center">
        <label class="text-sm text-gray-600">Status</label>
        <select
          :value="status"
          @change="handleStatusChange($event.target.value)"
          class="px-3 py-2 text-sm bg-white rounded-lg border border-gray-200"
        >
          <option v-for="opt in statusOptions" :key="opt" :value="opt">
            {{ opt }}
          </option>
        </select>
      </div>
    </template>

    <template #default="{ search }">
      <IssuedContractsDataProvider
        ref="dataProvider"
        :institutionUuid="route.params.id"
        :status="status"
        :search="search"
        v-slot="{ contracts, pending, currentPage, itemsPerPage, totalPages }"
      >
        <Table
          :pending="pending"
          :headers="{
            head: ['Institution Name', 'Description', 'Status', 'Actions'],
            row: ['', 'institutionName', 'contractName', 'status'],
          }"
          :rows="contracts"
          :rowCom="expiredContractsStatusRow"
          :rowComProps="{
            showActionButtons: true,
            currentStatus: status,
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
