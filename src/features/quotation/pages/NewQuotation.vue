<script setup lang="ts">
import { ref, computed } from "vue";
import { RouterLink } from "vue-router";
import Button from "@/components/Button.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import InstitutionsByStatusDataProvider from "@/features/institutions/components/InstitutionsByStatusDataProvider.vue";
import NewQuotationInstitutionRow from "@/features/quotation/components/NewQuotationInstitutionRow.vue";
import IndividualPersonsDataProvider from "@/features/insured_persons/components/IndividualPersonsDataProvider.vue";
import NewQuotationIndividualRow from "@/features/quotation/components/NewQuotationIndividualRow.vue";
import icons from "@/utils/icons";
import { openModal } from "@customizer/modal-x";

// Types
interface InsuredPerson {
  id: string;
  fullName: string;
  idNumber: string;
  phone: string;
  status: string;
}

// Constants
const TABS = {
  INSTITUTION: 'institution',
  INDIVIDUAL: 'individual'
} as const;

type TabType = typeof TABS[keyof typeof TABS];

// State
const activeTab = ref<TabType>(TABS.INSTITUTION);
const institutionProviderRef = ref<any>(null);
const individualProviderRef = ref<any>(null);

// Computed
const tabConfig = computed(() => ({
  [TABS.INSTITUTION]: {
    label: 'Institution Quotation',
    addButtonText: 'Add Institution',
    addButtonIcon: icons.plus,
    provider: institutionProviderRef,
    headers: {
      head: ['Institution Name', 'Address', 'Telephone', 'Status', 'actions'],
      row: ['institutionName', 'address', 'telephone', 'status']
    }
  },
  [TABS.INDIVIDUAL]: {
    label: 'Individual Quotation',
    addButtonText: 'Create Individual',
    addButtonIcon: icons.plus,
    provider: individualProviderRef,
    headers: {
      head: ['Full Name', 'ID Number', 'Dependents', 'Phone', 'Status', 'actions'],
      row: ['fullName', 'idNumber', 'dependents', 'phone', 'status']
    }
  }
}));

const currentTabConfig = computed(() => tabConfig.value[activeTab.value]);

// Methods
const switchTab = (tab: TabType) => {
  if (activeTab.value === tab) return;
  activeTab.value = tab;
};

const openAddIndividualModal = () => {
  openModal('AddInsured', {
    onAdded: (newInsured: InsuredPerson) => {
      // Refresh the table data
      if (individualProviderRef.value?.refresh) {
        individualProviderRef.value.refresh();
      }
    }
  });
};
</script>

<template>
  <DefaultPage>
    <template #add-action>
      <RouterLink
        v-if="activeTab === TABS.INSTITUTION"
        :to="{ path: '/institutions/add', query: { from: 'new_quotation' } }"
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-md bg-primary hover:bg-primary/90"
      >
        <i v-html="icons.plus" class="text-base"></i>
        <span>Add Institution</span>
      </RouterLink>
      
      <button
        v-if="activeTab === TABS.INDIVIDUAL"
        @click="openAddIndividualModal"
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors rounded-md bg-primary hover:bg-primary/90"
      >
        <i v-html="icons.plus" class="text-base"></i>
        <span>Create Individual</span>
      </button>
    </template>
    <template #header>
      <div class="flex border-b border-gray-200 ">
        <button
          v-for="(config, tab) in tabConfig"
          :key="tab"
          @click="switchTab(tab as TabType)"
          class="px-6 py-3 text-sm font-medium transition-colors border-b-2"
          :class="[
            activeTab === tab 
              ? 'border-primary text-primary' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          ]"
        >
          {{ config.label }}
        </button>
      </div>

    </template>
    <template #default="{ search }">
  
      <!-- Institution Tab Content -->
      <div v-show="activeTab === TABS.INSTITUTION">
        <InstitutionsByStatusDataProvider
          ref="institutionProviderRef"
          :search="search"
          v-slot="{ institutions, pending }"
        >
          <Table
            :pending="pending"
            :rowCom="NewQuotationInstitutionRow"
            :headers="currentTabConfig.headers"
            :cells="{
              address: (_: any, row: any) => `woreda ${row.address1}, ${row.address2}, ${row.address3}` 
            }"
            :rows="institutions"
          />
        </InstitutionsByStatusDataProvider>
      </div>

      <!-- Individual Tab Content -->
      <div v-show="activeTab === TABS.INDIVIDUAL">
        <IndividualPersonsDataProvider
          ref="individualProviderRef"
          :search="search"
          v-slot="{ insuredMembers, pending }"
        >
          <Table
            :pending="pending"
            :rowCom="NewQuotationIndividualRow"
            :headers="currentTabConfig.headers"
            :rows="insuredMembers"
          />
        </IndividualPersonsDataProvider>
      </div>
    </template>
  </DefaultPage>
</template>

