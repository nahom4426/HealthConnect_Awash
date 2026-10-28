<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from '@/toast/store/toast';
import DefaultPage from '@/components/DefaultPage.vue';
import Table from '@/components/Table.vue';
import { openModal } from '@customizer/modal-x';
import InstitutionContractsDataProvider from '../components/InstitutionContractsDataProvider.vue';
import instutionContractRow from '../components/instutionContractRow.vue';
import { useInstitutionContract } from '../store/institutionContractsStore';
import icons from '@/utils/icons';
import { getInstitution, getInstitutionContracts } from '../api/underwritingApi';

const router = useRouter();
const route = useRoute();
const { addToast } = useToast();
const underwritingStore = useInstitutionContract();

const dataProvider = ref();
const fetchedInstitutionName = ref('');
const institutionName = computed(() => route.params.institutionName || fetchedInstitutionName.value || 'Institution');
const loading = ref(false);
const status = ref('');
const isMobile = ref(false);
const contractsData = ref([]);
const allStatusesChecked = ref(false);
const hasAnyContracts = ref(false);
const checkStatusesError = ref(false);
const isCheckingStatuses = ref(false);

// All statuses to check
const ALL_STATUSES = ['ACTIVE', 'PENDING', 'EXPIRED', 'RENEWED'];

// Check if mobile on mount and resize
function checkMobile() {
  isMobile.value = window.innerWidth < 768;
}

if (typeof window !== 'undefined') {
  checkMobile();
  window.addEventListener('resize', checkMobile);
}

// Computed property to check if data is empty
const hasContracts = computed(() => contractsData.value && contractsData.value.length > 0);

/**
 * Check all statuses to see if any contracts exist
 * If found, switch to that status to display the contracts
 */
async function checkAllStatuses() {
  try {
    isCheckingStatuses.value = true;
    allStatusesChecked.value = false;
    hasAnyContracts.value = false;
    checkStatusesError.value = false;

    console.log('🔍 Checking all statuses:', ALL_STATUSES);

    for (const stat of ALL_STATUSES) {
      try {
        const response = await getInstitutionContracts(route.params.id, { status: stat });
        console.log(`📊 Status [${stat}] Response:`, response);
        
        // Handle array response
        if (Array.isArray(response) && response.length > 0) {
          console.log(`✅ Found ${response.length} contracts for status: ${stat}`);
          hasAnyContracts.value = true;
          status.value = stat; // Switch to this status - watcher will fetch data
          break;
        }
        
        // Handle object response with data property
        if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
          console.log(`✅ Found ${response.data.length} contracts for status: ${stat}`);
          hasAnyContracts.value = true;
          status.value = stat; // Switch to this status - watcher will fetch data
          break;
        }
        
        console.log(`❌ No contracts found for status: ${stat}`);
      } catch (err) {
        console.log(`⚠️ Error checking status [${stat}]:`, err.message);
        checkStatusesError.value = true; // Mark that an error occurred
      }
    }
    
    console.log('✨ All statuses checked. hasAnyContracts:', hasAnyContracts.value, 'Current status:', status.value);
  } catch (err) {
    console.error('Error checking all statuses:', err);
    checkStatusesError.value = true;
  } finally {
    isCheckingStatuses.value = false;
    allStatusesChecked.value = true;
  }
}

/**
 * Retry checking all statuses
 */
async function retryCheckStatuses() {
  await checkAllStatuses();
}

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

onMounted(async () => {
  // Reset store data when page mounts to ensure fresh data
  underwritingStore.reset();
  console.log('🔄 Store reset on page mount');
  
  // Fetch institution name
  try {
    const response = await getInstitution(route.params.id);
    fetchedInstitutionName.value = response?.data?.institutionName || response?.institutionName || 'Institution';
  } catch (err) {
    console.error('Error fetching institution:', err);
  }
  
  // Check all statuses and load data
  await checkAllStatuses();
});
</script>

<template>
  <DefaultPage :title="`${institutionName} Contracts`" placeholder="Search contracts...">
    <template #header>
      <div
        v-if="institutionName"
        class="flex gap-3 items-center px-4 py-2 bg-gradient-to-r rounded-lg border shadow-sm from-base-clr/10 to-base-clr/5 border-base-clr/20"
      >
        <span class="w-2.5 h-2.5 rounded-full shadow bg-base-clr"></span>
        <div class="flex flex-col leading-tight">
          <span class="text-[11px] font-medium text-gray-500">Institution</span>
          <span class="max-w-[16rem] text-sm font-semibold tracking-tight truncate md:text-base text-base-clr">
            {{ institutionName }}
          </span>
        </div>
      </div>
    </template>

    <!-- Add Policy Button - Only show if contracts exist -->
    <template  #add-action>
      <button
        @click="openModal('CreateInstitutionContract', { institutionUuid: route.params.id, onRefetch: handleRefetch })"
        class="flex gap-2 justify-center items-center px-6 py-3 font-semibold text-white rounded-lg transition-colors bg-primary hover:bg-primary/90"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-sm sm:text-base">Add Policy</p>
      </button>
    </template>
    

    <template #default="{ search }">
      <!-- Error State - Show if all APIs failed -->
      <div v-if="checkStatusesError && allStatusesChecked && !hasAnyContracts" class="py-12 text-center">
        <div class="flex flex-col justify-center items-center">
          <svg class="mb-4 w-20 h-20 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-lg font-semibold text-gray-600">Failed to Load Contracts</p>
          <p class="mt-2 text-sm text-gray-400">There was an error fetching your contracts</p>
          <button
            @click="retryCheckStatuses"
            class="flex gap-2 justify-center items-center px-6 py-3 mt-6 font-semibold text-white bg-red-600 rounded-lg transition-colors hover:bg-red-700"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Retry</span>
          </button>
        </div>
      </div>

      <!-- Normal Flow - Show table or empty state -->
      <InstitutionContractsDataProvider
        v-else
        ref="dataProvider"
        :institutionUuid="route.params.id"
        :status="status"
        :search="search"
        v-slot="{ institutionContract, pending, currentPage, itemsPerPage, totalPages }"
      >
        <!-- Show loading skeleton while checking statuses or fetching data -->
        <!-- Show table with built-in loading skeleton and empty state -->
        <div v-if="isCheckingStatuses || (status && !allStatusesChecked)">
          <!-- Loading skeleton from Table component -->
          <Table
            :pending="true"
            :virtual="true"
            :itemKey="'payerInstitutionContractUuid'"
            :virtualHeight="600"
            :virtualItemSize="64"
            :headers="{
              head: ['Contract', 'Code', 'policyNumber', 'Dates', 'Status', 'Actions'],
              row: ['contractName', 'contractCode', 'policyNumber', 'dateRange', 'status'],
            }"
            :rows="[]"
            :rowCom="instutionContractRow"
            :pagination="{
              currentPage: 1,
              itemsPerPage: 10,
              totalPages: 1,
              onPageChange: handlePageChange,
              onLimitChange: handleLimitChange,
            }"
            :isMobile="isMobile"
          />
        </div>

        <!-- Show table with actual data or empty state -->
        <div v-else>
          <Table
            :pending="pending"
            :virtual="true"
            :itemKey="'payerInstitutionContractUuid'"
            :virtualHeight="600"
            :virtualItemSize="64"
            :headers="{
              head: ['Contract', 'Code', 'policyNumber',  'Dates', 'Status', 'Actions'],
              row: ['contractName', 'contractCode', 'policyNumber',  'dateRange', 'status'],
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
            :isMobile="isMobile"
          >
            <template #row>
              <instutionContractRow
                :rowData="institutionContract"
                :rowKeys="[
                  'contractName',
                  'contractCode',
                  'policyNumber',
                  
                  'dateRange',
                  'status',
                ]"
                :headKeys="[
                  'Contract Name',
                  'Code',
                  'policyNumber',
                  
                  'Effective Dates',
                  'Status',
                  'Actions',
                ]"
                :institutionUuid="route.params.id"
                :isMobile="isMobile"
                :onRowClick="(row) => {}"
              />
            </template>
            <!-- Custom empty state -->
            <template #placeholder>
              <div class="py-12 text-center">
                <div class="flex flex-col justify-center items-center">
                  <svg class="mb-4 w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p class="text-lg font-semibold text-gray-600">No Contracts Found</p>
                  <p class="mt-2 text-sm text-gray-400">Start by adding your first policy contract</p>
                  <button
                    @click="openModal('CreateInstitutionContract', { institutionUuid: route.params.id, onRefetch: handleRefetch })"
                    class="flex gap-2 justify-center items-center px-6 py-3 mt-6 font-semibold text-white rounded-lg transition-colors bg-primary hover:bg-primary/90"
                  >
                    <i v-html="icons.plus_circle"></i>
                    <span>Add Policy</span>
                  </button>
                </div>
              </div>
            </template>
          </Table>
        </div>
      </InstitutionContractsDataProvider>
    </template>
  </DefaultPage>
</template>
