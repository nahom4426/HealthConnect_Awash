<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useApiRequest } from '@/composables/useApiRequest';
import { useToast } from '@/toast/store/toast';
import { getPendingContracts } from '../api/contractApi';
import Table from '@/components/Table.vue';
import ContractStatusRow from '../components/ContractStatusRow.vue';
import DefaultPage from '@/components/DefaultPage.vue';
import { useRowStore } from '@/stores/threePageValue';
import { toasted } from '@/utils/utils';
import icons from '@/utils/icons';
import { useContractStore } from '../store/cotractStore';

const router = useRouter();
const toast = useToast();
const rowStore = useRowStore();
const contractStore = useContractStore();
const dataProvider = ref();
const searchQuery = ref('');
const isLoading = ref(false);

const fetchContracts = async () => {
  isLoading.value = true;
  try {
    const response = await getPendingContracts();
    // Populate the store so other components (like ContractStatusRow) can update reactively
    contractStore.set(response.data.content || []);
  } catch (error) {
    toasted(false, "", error.message || "Failed to load contracts");
  } finally {
    isLoading.value = false;
  }
};

const filteredContracts = computed(() => {
  const list = contractStore.contracts || [];
  if (!searchQuery.value) return list;
  const query = searchQuery.value.toLowerCase();
  return list.filter(contract => 
    contract.contractName?.toLowerCase().includes(query) ||
    contract.providerName?.toLowerCase().includes(query) ||
    contract.contractCode?.toLowerCase().includes(query))
});

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

onMounted(fetchContracts);
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
    </template> -->
     <template #add-action>
      <button
        @click.prevent="$router.push(`/create_contract/new`)"
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 bg-primary text-white"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-base">Create Contract</p>
      </button>
    </template>

    <template #default="{ search }">
      <Table
        :headers="{
          head: ['Contract Name', 'Provider', 'Code', 'Phone', 'Period', 'Status', 'Actions'],
          row: ['contractName', 'providerName', 'contractCode', 'providerPhone', 'period', 'status']
        }"
        :rows="filteredContracts"
        :rowCom="ContractStatusRow"
        :loading="isLoading"
        @row-click="navigateToServicesPage"
      >
        <template #row>
          <ContractStatusRow
            :rowData="filteredContracts"
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
    </template>
  </DefaultPage>
</template>