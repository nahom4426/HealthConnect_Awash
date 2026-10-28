<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from '@/toast/store/toast';
import DefaultPage from '@/components/DefaultPage.vue';
import Table from '@/components/Table.vue';
import { openModal } from '@customizer/modal-x';
import IssuedContractsDataProvider from '../components/IssuedContractsDataProvider.vue';
import amendStatusRow from '../components/amendStatusRow.vue';
import { useUnderwriting } from '../store/underwritingStore';
import icons from '@/utils/icons';
import { getInstitution } from '../api/underwritingApi';

const router = useRouter();
const route = useRoute();
const { addToast } = useToast(); 
const underwritingStore = useUnderwriting(); 
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
  <DefaultPage :title="`${institutionName} Membership Category`" placeholder="Search contracts...">
    <!-- <template #filter>
      <button
        class="flex gap-2 justify-center items-center px-6 py-4 rounded-md text-primary bg-whote"
      >
        <i v-html="icons.filter"></i>
        <p class="text-base">Filters</p>
      </button>
    </template> -->

    <!-- <template #add-action>
      <button
        @click="openModal('CreateInstitutionContract', { institutionUuid: route.params.id, onRefetch: handleRefetch })"
        class="flex gap-2 justify-center items-center px-6 py-4 text-white rounded-md bg-primary"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-base">Add Category</p>
      </button>
    </template> -->

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
            head: [ 
        'Institution Name',
              'Description',
              // 'Benefit',
              // 'Premium',
              'Status',
              'Actions',
            ],
            row: [
              '',
              'institutionName',
              'contractName',
              // 'benefit',
              // 'premium', 
              'status',
            ],
          }"
          :rows="contracts"
          :rowCom="amendStatusRow"
          :rowComProps="{
            showActionButtons: true
          }"
          :pagination="{
            onPageChange: handlePageChange,
            onLimitChange: handleLimitChange,
          }"
        >
          
        </Table>
      </IssuedContractsDataProvider>
    </template>
  </DefaultPage>
</template>
