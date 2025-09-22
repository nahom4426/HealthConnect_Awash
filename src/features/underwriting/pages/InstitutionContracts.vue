<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from '@/toast/store/toast';
import DefaultPage from '@/components/DefaultPage.vue';
import Table from '@/components/Table.vue';
import { openModal } from '@customizer/modal-x';
import InstitutionContractsDataProvider from '../components/InstitutionContractsDataProvider.vue';
import instutionContractRow from '../components/instutionContractRow.vue';
import { useInstitutionContract } from '../store/institutionContractsStore';
import icons from '@/utils/icons';
import { getInstitution } from '../api/underwritingApi';

const router = useRouter();
const route = useRoute();
const { addToast } = useToast();
const underwritingStore = useInstitutionContract();

const dataProvider = ref();
const institutionName = ref('');
const loading = ref(false);
const status = ref('ACTIVE');

// const fetchInstitution = async () => {
//   loading.value = true;
//   try {
//     const response = await getInstitution(route.params.id);
//     institutionName.value = response.institutionName;
//   } catch (error) {
//     addToast(error.message, '', 'error');
//   } finally {
//     loading.value = false;
//   }
// };

function refreshData() {
  console.log("Refreshing contract data");
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

// onMounted(() => {
//   fetchInstitution();
//   status.value = route.params.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING';
// });
</script>

<template>
  <DefaultPage :title="`${institutionName} Contracts`" placeholder="Search contracts...">
    <template #filter>
      <button
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 text-primary bg-base-clr3"
      >
        <i v-html="icons.filter"></i>
        <p class="text-base">Filters</p>
      </button>
    </template>

    <template #add-action>
      <button
        @click="openModal('CreateInstitutionContract', { institutionUuid: route.params.id, onRefetch: handleRefetch })"
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 bg-primary text-white"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-base">Add Contract</p>
      </button>
    </template>

    <template #default="{ search }">
  
<InstitutionContractsDataProvider
  ref="dataProvider"
  :institutionUuid="route.params.id"
  :status="status"
  :search="search"
  v-slot="{ institutionContract, pending, currentPage, itemsPerPage, totalPages }"
>
  {{ console.log('Pending state:', pending) }}
  {{ console.log('Contracts data:', institutionContract) }}
  <!-- rest of your template -->
        <Table
          :pending="pending"
          :headers="{
            head: [ 
         
              'Description',
              'Benefit',
              // 'Premium',
              // 'Effective Date',
              'Status',
              'Actions',
            ],
            row: [
              '',
              
              'contractName',
              'benefit',
              // 'premium', 
              // 'dateRange',
              'status',
            ],
          }"
          :rows="institutionContract"
          :rowCom="instutionContractRow"
          :pagination="{
            currentPage,
            itemsPerPage,
            totalPages,
            onPageChange: handlePageChange,
            onLimitChange: handleLimitChange,
          }"
        >
          <template #row>
            <instutionContractRow
              :rowData="institutionContract"
              :rowKeys="[
                'index',
                'contractCode',
                'contractName',
                // 'benefit',
                // 'premium',
                'dateRange',
                'status',
              ]"
              :headKeys="[
                '#',
                'Category Code',
                'Description',
                'Effective Date',
                // 'Benefit',
                // 'Premium',
                'Status',
                'Actions',
              ]"
              :institutionUuid="route.params.id"
              :onRowClick="(row) => {}"
            />
          </template>
        </Table>
      </InstitutionContractsDataProvider>
    </template>
  </DefaultPage>
</template>
