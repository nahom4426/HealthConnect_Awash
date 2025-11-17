<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApiRequest } from '@/composables/useApiRequest';
import { useToast } from '@/toast/store/toast';
import { getActiveContracts } from '../api/contractApi';
import Table from '@/components/Table.vue';
import ContractStatusRow from '../components/ContractStatusRow.vue';
import ActiveContractsDataProvider from '../components/ActiveContractsDataProvider.vue';
import DefaultPage from '@/components/DefaultPage.vue';
import { useRowStore } from '@/stores/threePageValue';
import { toasted } from '@/utils/utils';
import icons from '@/utils/icons';
import { useContractStore } from '../store/cotractStore';

const router = useRouter();
const toast = useToast();
const rowStore = useRowStore();
const dataProvider = ref();

const navigateToServicesPage = (contract) => {
  rowStore.setRowDetails(contract);
  router.push({
    name: 'contractServices',
    params: {
      providerId: contract.providerUuid,
      payerProviderContractUuid: contract.payerProviderContractUuid,
    },
  });
};

const navigateToInstitutionsPage = (contract) => {
  router.push({
    name: 'contractInstitutions',
    params: {
      payerProviderContractCode: contract.contractCode,
      payerProviderContractUuid: contract.payerProviderContractUuid,
    },
  });
};

onMounted(() => {});
</script>

<template>
  <DefaultPage placeholder="Search Active Contracts">
      <!-- <template #filter>
      <button
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 text-primary bg-gray-100"
      > 
        <i v-html="icons.filter"></i>
        <p class="text-base">Filters</p>
      </button>
    </template>
  -->

    <template #default="{ search }">
      <ActiveContractsDataProvider
        ref="dataProvider"
        :status="'ACTIVE'"
        :search="search"
        v-slot="{ contracts, pending, currentPage, itemsPerPage, totalPages }"
      >
        <Table
          :headers="{
            head: ['Contract Name', 'Provider', 'Code', 'Phone', 'Period', 'Status', 'Actions'],
            row: ['contractName', 'providerName', 'contractCode', 'providerPhone', 'period', 'status']
          }"
          :rows="contracts"
          :rowCom="ContractStatusRow"
          :loading="pending"
          @row-click="navigateToServicesPage"
          :pagination="{
            currentPage,
            itemsPerPage,
            totalPages,
          }"
        >
          <template #row>
            <ContractStatusRow
              :rowData="contracts"
              :rowKeys="['contractName', 'providerName', 'contractCode', 'providerPhone', 'period', 'status']"
              :onView="navigateToServicesPage"
              :onRowClick="navigateToServicesPage"
            />
          </template>
          <template #empty>
            <div class="py-12 text-center">
              <div class="flex flex-col items-center justify-center">
                <i v-html="icons.document"></i>
                <p class="text-gray-500">No contracts found</p>
                <p v-if="search" class="text-sm text-gray-400 mt-1">
                  No results match your search criteria
                </p>
              </div>
            </div>
          </template>
        </Table>
      </ActiveContractsDataProvider>
    </template>
  </DefaultPage>
</template>