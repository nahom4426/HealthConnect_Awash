<script setup>
import { ref } from 'vue';
import Table from "@/components/Table.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import UnderwritingDataProvider from "../components/UnderwritingDataProvider.vue";
import { openModal } from "@customizer/modal-x";
import icons from "@/utils/icons";
import PolicyStatusRow from '../components/PolicyStatusRow.vue';

const handleDeletePolicy = async (id) => {
  console.log("Delete policy:", id);
};

const viewDetails = (id) => {
  console.log("View policy details:", id);
};
</script>

<template>
  <DefaultPage placeholder="Search Quoted Policies">
    <template #filter>
      <button class="flex justify-center items-center gap-2 rounded-md px-6 py-4 text-primary bg-gray-100">
        <i v-html="icons.filter"></i>
        <p class="text-base">Filters</p>
      </button>
    </template>

    <template #add-action>
      <button
        @click.prevent="openModal('AddPolicy')"
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 bg-primary text-white"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-base">Add Policy</p>
      </button>
    </template>

    <template #default="{ search }">
      <UnderwritingDataProvider
        :search="search"
        status="QUOTED"
        v-slot="{ policies, pending }"
      >
        <Table
          :pending="pending"
          :headers="{
            head: ['Policy Number', 'Institution', 'Premium', 'Status', 'Date', 'Actions'],
            row: ['policyNumber', 'institutionName', 'premium', 'status', 'createdAt']
          }"
          :rows="policies"
          :rowCom="PolicyStatusRow"
        >
          <template #empty>
            <div class="py-12 text-center">
              <div class="flex flex-col items-center justify-center">
                <i v-html="icons.document"></i>
                <p class="text-gray-500">No quoted policies found</p>
                <p v-if="search" class="text-sm text-gray-400 mt-1">
                  No results match your search criteria
                </p>
              </div>
            </div>
          </template>
        </Table>
      </UnderwritingDataProvider>
    </template>
  </DefaultPage>
</template>