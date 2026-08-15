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
import { getInstitution } from '../api/underwritingApi';

const router = useRouter();
const route = useRoute();
const { addToast } = useToast();
const underwritingStore = useInstitutionContract();

const dataProvider = ref();
const fetchedInstitutionName = ref('');
const institutionName = computed(() => route.params.institutionName ? decodeURIComponent(route.params.institutionName) : (fetchedInstitutionName.value || 'Institution'));
const status = ref('ACTIVE');
const isMobile = ref(false);

// Status filter configuration with icons, colors and labels
const STATUS_FILTERS = [
  {
    value: 'ACTIVE',
    label: 'Active',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    bgColor: 'bg-emerald-50',
    activeColor: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    activeTextColor: 'text-white',
    borderColor: 'border-emerald-200',
    hoverColor: 'hover:bg-emerald-100',
    dotColor: 'bg-emerald-500',
  },
  {
    value: 'PENDING',
    label: 'Pending',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    bgColor: 'bg-amber-50',
    activeColor: 'bg-amber-500',
    textColor: 'text-amber-700',
    activeTextColor: 'text-white',
    borderColor: 'border-amber-200',
    hoverColor: 'hover:bg-amber-100',
    dotColor: 'bg-amber-500',
  },
  {
    value: 'EXPIRED',
    label: 'Expired',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    bgColor: 'bg-red-50',
    activeColor: 'bg-red-500',
    textColor: 'text-red-700',
    activeTextColor: 'text-white',
    borderColor: 'border-red-200',
    hoverColor: 'hover:bg-red-100',
    dotColor: 'bg-red-500',
  },
  {
    value: 'RENEWED',
    label: 'Renewed',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>`,
    bgColor: 'bg-blue-50',
    activeColor: 'bg-blue-500',
    textColor: 'text-blue-700',
    activeTextColor: 'text-white',
    borderColor: 'border-blue-200',
    hoverColor: 'hover:bg-blue-100',
    dotColor: 'bg-blue-500',
  },
  {
    value: 'RENEWAL_IN_PROGRESS',
    label: 'In Progress',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>`,
    bgColor: 'bg-orange-50',
    activeColor: 'bg-orange-500',
    textColor: 'text-orange-700',
    activeTextColor: 'text-white',
    borderColor: 'border-orange-200',
    hoverColor: 'hover:bg-orange-100',
    dotColor: 'bg-orange-500',
  },
  {
    value: 'RENEWAL_SCHEDULED',
    label: 'Scheduled',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>`,
    bgColor: 'bg-purple-50',
    activeColor: 'bg-purple-500',
    textColor: 'text-purple-700',
    activeTextColor: 'text-white',
    borderColor: 'border-purple-200',
    hoverColor: 'hover:bg-purple-100',
    dotColor: 'bg-purple-500',
  },
  {
    value: 'VOIDED_MIGRATION',
    label: 'Voided',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    bgColor: 'bg-gray-50',
    activeColor: 'bg-gray-500',
    textColor: 'text-gray-600',
    activeTextColor: 'text-white',
    borderColor: 'border-gray-200',
    hoverColor: 'hover:bg-gray-100',
    dotColor: 'bg-gray-500',
  },
];

function setStatus(newStatus) {
  if (status.value === newStatus) return;
  status.value = newStatus;
}

// Check if mobile on mount and resize
function checkMobile() {
  isMobile.value = window.innerWidth < 768;
}

if (typeof window !== 'undefined') {
  checkMobile();
  window.addEventListener('resize', checkMobile);
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
  
  // Fetch institution name
  try {
    const response = await getInstitution(route.params.id);
    fetchedInstitutionName.value = response?.data?.institutionName || response?.institutionName || 'Institution';
  } catch (err) {
    console.error('Error fetching institution:', err);
  }
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

    <!-- Add Policy Button -->
    <template #add-action>
      <button
        @click="openModal('CreateInstitutionContract', { institutionUuid: route.params.id, onRefetch: handleRefetch })"
        class="flex gap-2 justify-center items-center px-6 py-3 font-semibold text-white rounded-lg transition-colors bg-primary hover:bg-primary/90"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-sm sm:text-base">Add Policy</p>
      </button>
    </template>

    <template #default="{ search }">
      <!-- Modern Status Filter Bar -->
      <div class="mb-5">
        <div class="flex flex-wrap gap-2 items-center">
          <button
            v-for="filter in STATUS_FILTERS"
            :key="filter.value"
            @click="setStatus(filter.value)"
            class="group relative flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all duration-300 ease-out cursor-pointer select-none"
            :class="[
              status === filter.value
                ? [filter.activeColor, filter.activeTextColor, 'border-transparent shadow-lg shadow-' + filter.value.toLowerCase() + '/20 scale-[1.02]']
                : [filter.bgColor, filter.textColor, filter.borderColor, filter.hoverColor, 'hover:shadow-sm']
            ]"
          >
            <!-- Animated dot indicator -->
            <span
              class="w-2 h-2 rounded-full transition-all duration-300"
              :class="[
                status === filter.value
                  ? 'bg-white/80 animate-pulse'
                  : filter.dotColor + ' opacity-60'
              ]"
            ></span>
            
            <!-- Icon -->
            <span
              class="flex items-center transition-transform duration-300 group-hover:scale-110"
              v-html="filter.icon"
            ></span>
            
            <!-- Label -->
            <span class="tracking-wide">{{ filter.label }}</span>
          </button>
        </div>
      </div>

      <!-- Data Table -->
      <InstitutionContractsDataProvider
        ref="dataProvider"
        :institutionUuid="route.params.id"
        :status="status"
        :search="search"
        v-slot="{ institutionContract, pending, currentPage, itemsPerPage, totalPages }"
      >
        <Table
          :pending="pending"
          :virtual="true"
          :itemKey="'payerInstitutionContractUuid'"
          :virtualHeight="600"
          :virtualItemSize="64"
          :headers="{
            head: ['Contract', 'Code', 'policyNumber', 'Dates', 'Status', 'Actions'],
            row: ['contractName', 'contractCode', 'policyNumber', 'dateRange', 'status'],
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
                <p class="mt-2 text-sm text-gray-400">No contracts with status "{{ STATUS_FILTERS.find(f => f.value === status)?.label || status }}"</p>
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
      </InstitutionContractsDataProvider>
    </template>
  </DefaultPage>
</template>
