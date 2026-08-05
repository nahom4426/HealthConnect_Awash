<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/toast/store/toast';
import Table from '@/components/Table.vue';
import ContractStatusRow from '../components/ContractStatusRow.vue';
import ActiveContractsDataProvider from '../components/ActiveContractsDataProvider.vue';
import DefaultPage from '@/components/DefaultPage.vue';
import { useRowStore } from '@/stores/threePageValue';
import icons from '@/utils/icons';

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
      payerProviderContractUuid: contract.payerProviderContractUuid,
      contractName: contract.contractName || contract.payerProviderContractName || 'Contract',
    },
  });
};
</script>

<template>
  <DefaultPage placeholder="Search Active Contracts">
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
          :rowComProps="{
            onView: navigateToServicesPage,
            onRowClick: navigateToServicesPage,
            onAddInstitutions: navigateToInstitutionsPage
          }"
          :pending="pending"
          @row-click="navigateToServicesPage"
          :pagination="{
            currentPage,
            itemsPerPage,
            totalPages,
          }"
        >
          <template #empty>
            <div class="py-12 text-center">
              <div class="flex flex-col justify-center items-center">
                <i v-html="icons.document"></i>
                <p class="text-gray-500">No contracts found</p>
              </div>
            </div>
          </template>
        </Table>
      </ActiveContractsDataProvider>
    </template>
  </DefaultPage>
</template>