<script setup>
import { ref } from 'vue';
import Table from "@/components/Table.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import ActiveInstitutionDataProvider from "../../underwriting/components/ActiveInstitutionDataProvider.vue";
import { openModal } from "@customizer/modal-x";
import icons from "@/utils/icons";
import InstitutionStatusRow from '../../underwriting/components/InstitutionStatusRow.vue';

const deleteLoading = ref(false);
const institutionToDelete = ref("");

const handleDeleteInstitution = async (id) => {
  // Implementation here
};

const viewDetails = (id) => {
  console.log("View institution details:", id);
};
</script>

<template>
  <DefaultPage placeholder="Search Active Institutions">
    <!--  <template #filter>
      <button class="flex gap-2 justify-center items-center px-6 py-4 bg-gray-100 rounded-md text-primary">
        <i v-html="icons.filter"></i>
        <p class="text-base">Filters</p>
      </button>
    </template> -->

    <template #add-action>
      <button
        @click.prevent="openModal('AddInstitution')"
        class="flex gap-2 justify-center items-center px-6 py-4 text-white rounded-md bg-primary"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-base">Add Institution</p>
      </button>
    </template>

    <template #default="{ search }">
      <ActiveInstitutionDataProvider
        :search="search"
        v-slot="{ institutions, pending }"
      >
        <Table
          :pending="pending"
          :headers="{
            head: ['Institution Name', 'Code', 'Type', 'Location', 'Status', 'Actions'],
            row: ['name', 'code', 'type', 'location', 'status']
          }"
          :rows="institutions"
          :rowCom="InstitutionStatusRow"
        >
          <template #empty>
            <div class="py-12 text-center">
              <div class="flex flex-col justify-center items-center">
                <i v-html="icons.document"></i>
                <p class="text-gray-500">No institutions found</p>
                <p v-if="search" class="mt-1 text-sm text-gray-400">
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
