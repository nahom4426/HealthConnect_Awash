<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
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
const reloadKey = ref(0);

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
  reloadKey.value++;
};

onMounted(() => {
  window.addEventListener('editContractSuccess', handleRefetch);
  window.addEventListener('renewContractSuccess', handleRefetch);
});

onUnmounted(() => {
  window.removeEventListener('editContractSuccess', handleRefetch);
  window.removeEventListener('renewContractSuccess', handleRefetch);
});
</script>

<template>
   <div class="h-full">
  <DefaultPage :title="`${institutionName} Membership Category`" placeholder="Search contracts...">
    <!-- <template #filter>
      <button
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 text-primary bg-whote"
      >
        <i v-html="icons.filter"></i>
        <p class="text-base">Filters</p>
      </button>
    </template> -->

    <!-- <template #add-action>
      <button
        @click="openModal('CreateInstitutionContract', { institutionUuid: route.params.id, onRefetch: handleRefetch })"
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 bg-primary text-white"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-base">Add Category</p>
      </button>
    </template> -->

    <template #default="{ search }">
  
<IssuedContractsDataProvider
  ref="dataProvider"
  :key="reloadKey"
  :institutionUuid="route.params.id"
  :status="status"
  :search="search"
  v-slot="{ contracts, pending, currentPage, itemsPerPage, totalPages }"
>
  {{ console.log('Pending state:', pending) }}
  {{ console.log('Contracts data:', contracts) }}
  <!-- rest of your template -->
        <Table
          :pending="pending"
          :headers="{
            head: [ 
              'Description',
              'Effective Date',
              'Status',
              'Actions',
            ],
            row: [
              '',
              'contractName',
              'dateRange',
              'status',
            ],
          }"
          :rows="contracts"
          :rowCom="amendStatusRow"
          :rowComProps="{
            institutionUuid: route.params.id,
            onRefetch: handleRefetch,
          }"
          :pagination="{
            currentPage,
            itemsPerPage,
            totalPages,
            onPageChange: handlePageChange,
            onLimitChange: handleLimitChange,
          }"
        />
      </IssuedContractsDataProvider>
    </template>
  </DefaultPage>
  </div>
</template>
