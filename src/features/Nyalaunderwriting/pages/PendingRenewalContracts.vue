<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import DefaultPage from '@/components/DefaultPage.vue';
import Table from '@/components/Table.vue';
import IssuedContractsDataProvider from '../components/IssuedContractsDataProvider.vue';
import PendingRenewalContractRow from '../components/PendingRenewalContractRow.vue';

const route = useRoute();

const dataProvider = ref();
const status = ref('RENEWAL_IN_PROGRESS');
const statusOptions = ['RENEWAL_IN_PROGRESS','RENEWAL_SCHEDULED'];
const reloadKey = ref(0);

onMounted(() => {
  // Give it a tick to ensure refs are set
  setTimeout(() => refreshData(), 10);
});

const title = computed(() => 'Pending Renewal Contracts');

function refreshData() {
  if (dataProvider.value) {
    dataProvider.value.refresh();
  }
}

function handlePageChange(page: number) {
  if (dataProvider.value) {
    dataProvider.value.setPage(page);
  }
}

function handleLimitChange(limit: number) {
  if (dataProvider.value) {
    dataProvider.value.setLimit(limit);
  }
}
</script>

<template>
  <DefaultPage :title="title" placeholder="Search contracts...">
    <template #filter>
      <div class="flex gap-2 items-center">
        <label class="text-sm text-gray-600">Status</label>
        <select
          :value="status"
          @change="status = $event.target.value"
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
        :key="reloadKey"
        :auto="false"
        :institutionUuid="route.params.id || ''"
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
          :rowCom="PendingRenewalContractRow"
          :rowComProps="{
            currentStatus: status,
          }"
          :pagination="{
            currentPage: currentPage?.value || 1,
            itemsPerPage: itemsPerPage?.value || 25,
            totalPages: totalPages?.value || 1,
            onPageChange: handlePageChange,
            onLimitChange: handleLimitChange,
          }"
        />
      </IssuedContractsDataProvider>
    </template>
  </DefaultPage>
</template>
