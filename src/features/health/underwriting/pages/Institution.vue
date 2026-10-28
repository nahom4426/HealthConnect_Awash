<script setup>
import { ref } from 'vue';
import Table from "@/components/Table.vue";
import TableRowSkeleton from "@/components/TableRowSkeleton.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import { openModal } from "@customizer/modal-x";
import icons from "@/utils/icons";
import InstitutionStatusRow from '../components/InstitutionStatusRow.vue';
import ActiveInstitutionDataProvider from '@/features/institutions/components/ActiveInstitutionDataProvider.vue';

const deleteLoading = ref(false);
const institutionToDelete = ref("");
const isMobile = ref(false);
const refetch = ref(0);

// Check if mobile on mount and resize
function checkMobile() {
  isMobile.value = window.innerWidth < 768;
}

if (typeof window !== 'undefined') {
  checkMobile();
  window.addEventListener('resize', checkMobile);
}

const handleDeleteInstitution = async (id) => {
  console.log("Delete institution:", id);
};

const viewDetails = (id) => {
  console.log("View institution details:", id);
};

const openImportInstitutions = () => {
  openModal('Import', {
    type: 'institution',
    onRefetch: () => {
      refetch.value += 1;
    },
  });
};
</script>

<template>
  <DefaultPage placeholder="Search Active Institutions">
    <!-- <template #filter>
      <button class="flex gap-2 justify-center items-center px-6 py-3 font-semibold bg-gray-100 rounded-lg transition-colors text-primary hover:bg-gray-200">
        <i v-html="icons.filter"></i>
        <p class="text-sm sm:text-base">Filters</p>
      </button>
    </template> -->

    <template #add-action>
      <div class="flex gap-2">
        <button
          @click.prevent="openImportInstitutions"
          class="flex gap-2 justify-center items-center px-6 py-3 font-semibold text-white rounded-lg transition-colors bg-amber-500 hover:bg-amber-600"
        >
          <i v-html="icons.upload || icons.import"></i>
          <p class="text-sm sm:text-base">Import Institutions</p>
        </button>

        <button
          @click.prevent="openModal('AddInstitution')"
          class="flex gap-2 justify-center items-center px-6 py-3 font-semibold text-white rounded-lg transition-colors bg-primary hover:bg-primary/90"
        >
          <i v-html="icons.plus_circle"></i>
          <p class="text-sm sm:text-base">Add Policy Owner</p>
        </button>
      </div>
    </template>

    <template #default="{ search }">
      <ActiveInstitutionDataProvider
        :search="search"
        :refetch="refetch"
        v-slot="{ institutions, pending }"
      >
        <Table
          :pending="pending"
          :headers="{
            head: ['Institution Name', 'CIF Number','Branch Name', 'Phone', 'Status', 'Actions'],
            row: ['institutionName', 'cifNumber','branchName', 'telephone', 'status']
          }"
          :rows="institutions"
          :rowCom="InstitutionStatusRow"
          :Fallback="TableRowSkeleton"
          :isMobile="isMobile"
        >
          <template #empty>
            <div class="py-12 text-center">
              <div class="flex flex-col justify-center items-center">
                <svg class="mb-4 w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="font-semibold text-gray-600">No institutions found</p>
                <p v-if="search" class="mt-2 text-sm text-gray-400">
                  No results match your search criteria
                </p>
              </div>
            </div>
          </template>
        </Table>
      </ActiveInstitutionDataProvider>
    </template>
  </DefaultPage>
</template>