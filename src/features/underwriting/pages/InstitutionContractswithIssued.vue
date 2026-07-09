<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from '@/toast/store/toast';
import DefaultPage from '@/components/DefaultPage.vue';
import TabGroup from '@/components/TabGroup.vue';
import Table from '@/components/Table.vue';
import { openModal } from '@customizer/modal-x';
import IssuedContractsDataProvider from '../components/IssuedContractsDataProvider.vue';
import MembershipCategoryRow from '../components/MembershipCategoryRow.vue';
import { useUnderwriting } from '../store/underwritingStore';
import icons from '@/utils/icons';
import { getInstitution } from '../api/underwritingApi';
import ActiveInstitutionDataProvider from '@/features/institutions/components/ActiveInstitutionDataProvider.vue';

const router = useRouter();
const route = useRoute();
const { addToast } = useToast();
const underwritingStore = useUnderwriting();

const dataProvider = ref();
const activeTab = ref('GENERAL');
const institutionName = ref('');
const loading = ref(false);
const status = ref('ACTIVE');
const isMobile = ref(false);
const contractsData = ref([]);

const refetchContracts = ref(0);

const showInstitutionPicker = ref(false);
const institutionSearch = ref('');

const institutionsWithPolicies = computed(() => {
  const list = Array.isArray(underwritingStore.contracts) ? underwritingStore.contracts : [];
  return new Set(list.map((c) => c?.institutionUuid).filter(Boolean));
});

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

const handleRefetch = () => {
  refetchContracts.value += 1;
  refreshData();
};

function onContractCreated(e) {
  handleRefetch();
}

if (typeof window !== 'undefined') {
  window.addEventListener('underwriting:institution-contract-created', onContractCreated);
}

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('underwriting:institution-contract-created', onContractCreated);
  }
});

function openInstitutionPicker() {
  showInstitutionPicker.value = true;
  institutionSearch.value = '';
}

function closeInstitutionPicker() {
  showInstitutionPicker.value = false;
  institutionSearch.value = '';
}

function selectInstitutionAndOpenPolicyModal(institution) {
  if (!institution?.institutionUuid) return;

  if (institutionsWithPolicies.value.has(institution.institutionUuid)) return;

  openModal('CreateInstitutionContract', {
    institutionUuid: institution.institutionUuid,
    institutionName: institution.institutionName,
    onRefetch: handleRefetch,
  });

  closeInstitutionPicker();
}

// Fetch institution name on mount
onMounted(async () => {
  try {
    const institution = await getInstitution(route.params.id);
    if (institution) {
      institutionName.value = institution.institutionName || '';
    }
  } catch (error) {
    console.error('Failed to fetch institution:', error);
  }
});
</script>

<template>
  <DefaultPage :title="`${institutionName} Membership Polices`" placeholder="Search Polices...">
    <template #add-action>
      <button
        @click.prevent="openInstitutionPicker"
        class="flex gap-2 justify-center items-center px-6 py-4 text-white rounded-md bg-primary"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-base">Add Policy</p>
      </button>
    </template>

    <template #default="{ search }">
      <!-- Primary colored tabs for Individual / General policies -->
      <TabGroup :tabs="['GENERAL','INDIVIDUAL']" v-model="activeTab" />

      <!-- Institution Picker -->
      <div v-if="showInstitutionPicker" class="p-4 mb-4 bg-gray-50 rounded-lg border border-gray-200">
        <div class="flex gap-3 items-center">
          <div class="flex-1">
            <div class="flex overflow-hidden items-center w-full h-10 bg-white rounded-lg border border-gray-200 focus-within:border-primary">
              <span class="grid place-items-center w-10 h-10 text-base border-r text-base-clr" v-html='icons.search' />
              <input
                v-model="institutionSearch"
                placeholder="Search institutions..."
                class="!shadow-none flex-1 px-3 h-full text-sm"
              />
            </div>
          </div>
          <button
            type="button"
            class="px-4 py-2 bg-white rounded-md border border-gray-300"
            @click="closeInstitutionPicker"
          >
            Cancel
          </button>
        </div>

        <div class="mt-4">
          <ActiveInstitutionDataProvider
            :search="institutionSearch"
            v-slot="{ institutions, pending }"
          >
            <Table
              :pending="pending"
              :headers="{
                head: ['Institution Name', 'Tin', 'Institution Insurance Number', 'Phone', 'Status', 'Actions'],
                row: ['institutionName', 'tinNumber', 'institutionInsuranceNumber', 'telephone', 'status']
              }"
              :rows="(institutions || []).filter((inst) => !institutionsWithPolicies.has(inst?.institutionUuid))"
            >
              <template #actions="{ row }">
                <button
                  type="button"
                  class="italic font-medium underline hover:text-primary"
                  @click.stop="selectInstitutionAndOpenPolicyModal(row)"
                >
                  Select
                </button>
              </template>
            </Table>
          </ActiveInstitutionDataProvider>
        </div>
      </div>

      <!-- Individual Policies -->
      <IssuedContractsDataProvider
        ref="dataProvider"
        :institutionUuid="route.params.id"
        :status="status"
        :search="search"
        :policyType="activeTab"
        :refetch="refetchContracts"
        v-slot="{ contracts, pending, currentPage, itemsPerPage, totalPages, totalElements }"
      >
        <!-- Update contractsData when contracts change -->
        <div v-if="contracts && contracts.length > 0">
          <!-- This will capture the contracts data for the hasContracts computed property -->
          <span style="display: none;">{{ contractsData = contracts }}</span>
        </div>

        <!-- Empty State -->
        <div v-if="!pending && (!contracts || contracts.length === 0)" class="py-12 text-center">
          <div class="flex flex-col justify-center items-center">
            <svg class="mb-4 w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.5a1 1 0 00-.8.4l-3-4a1 1 0 00-1.6 1.2l2.5 3.333H7a2 2 0 00-2 2v4a2 2 0 002 2z" />
            </svg>
            <p class="text-lg font-semibold text-gray-600">No Membership Polices</p>
            <p class="mt-2 text-sm text-gray-400">No Polices are currently available</p>
          </div>
        </div>

        <!-- Polices Table/Cards -->
        <div v-else>
          <Table
            :pending="pending"
            :headers="{
              head: ['Institution Name', 'Contract Name', 'Status', 'Actions'],
              row: ['institutionName', 'contractName', 'status'],
            }"
            :rows="contracts"
            :rowCom="MembershipCategoryRow"
            :pagination="{
              currentPage,
              itemsPerPage,
              totalPages,
              totalElements,
              onPageChange: handlePageChange,
              onLimitChange: handleLimitChange,
            }"
            :isMobile="isMobile"
          >
            <template #row>
              <MembershipCategoryRow
                :rowData="contracts"
                :rowKeys="[
                  'institutionName',
                  'contractName',
                  'status',
                ]"
                :headKeys="[
                  'Institution Name',
                  'Category Name',
                  'Status',
                  'Actions',
                ]"
                :institutionUuid="route.params.id"
                :isMobile="isMobile"
                :onRowClick="(row) => {}"
              />
            </template>
          </Table>
        </div>
      </IssuedContractsDataProvider>
    </template>
  </DefaultPage>
</template>

<style scoped>
/* Tailwind primary color is used via utility classes */
</style>