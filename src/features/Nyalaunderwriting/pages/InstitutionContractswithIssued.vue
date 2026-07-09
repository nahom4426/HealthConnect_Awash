<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from '@/toast/store/toast';
import DefaultPage from '@/components/DefaultPage.vue';
import Table from '@/components/Table.vue';
import TabGroup from '@/components/TabGroup.vue';
import { openModal } from '@customizer/modal-x';
import IssuedContractsDataProvider from '../components/IssuedContractsDataProvider.vue';
import MembershipCategoryRow from '../components/MembershipCategoryRow.vue';
import { useUnderwriting } from '../store/underwritingStore';
import icons from '@/utils/icons';
import { getInstitution } from '../api/underwritingApi';
import { activeMembershipTab } from '../utils/membershipTabState';

const router = useRouter();
const route = useRoute();
const { addToast } = useToast();
const underwritingStore = useUnderwriting();

const dataProvider = ref();
const institutionName = ref('');
const loading = ref(false);
const status = ref('ACTIVE');

const institutionUuid = computed(() => {
  const id = route.params.id || 
             route.params.institutionUuid || 
             route.query.institutionUuid ||
             (route.matched.length > 1 ? route.matched[route.matched.length - 2]?.params?.id : null);
  return id;
});

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
</script>

<template>
   <div class="h-full">
  <DefaultPage :title="`${institutionName} Membership Category`" placeholder="Search contracts...">
    <template #header>
      <TabGroup
        :tabs="['GENERAL', 'INDIVIDUAL']"
        v-model="activeMembershipTab"
        class="mb-4"
      />
    </template>

    <template #default="{ search }">
      <IssuedContractsDataProvider
        ref="dataProvider"
        :institutionUuid="institutionUuid"
        :status="status"
        :policyType="activeMembershipTab"
        :search="search"
        v-slot="{ contracts, pending, currentPage, itemsPerPage, totalPages }"
      >
        <Table
          :pending="pending"
          :headers="{
            head: [
              activeMembershipTab === 'GENERAL' ? 'Institution Name' : 'Insured Name',
              'Contract Code',
              'Description',
              'Effective Date',
              'Status',
              'Actions',
            ],
            row: [
              'insuredName',
              'contractCode',
              'contractName',
              'dateRange',
              'status',
            ],
          }"
          :rows="contracts"
          :rowCom="MembershipCategoryRow"
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