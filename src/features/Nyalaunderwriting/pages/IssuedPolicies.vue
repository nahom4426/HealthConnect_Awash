<script setup>
import { ref } from 'vue';
import Table from "@/components/Table.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import IssuedPolicyDataProvider from "../components/IssuedPolicyDataProvider.vue";
import { openModal } from "@customizer/modal-x";
import icons from "@/utils/icons";
import PolicyStatusRow from '../components/PolicyStatusRow.vue';

const handleAmendPolicy = (id) => {
  openModal('AmendPolicy', { policyId: id });
};

const viewDetails = (id) => {
  console.log("View policy details:", id);
};
</script>

<template>
  <DefaultPage placeholder="Search Issued Policies">
    <!--  <template #filter>
      <button class="flex gap-2 justify-center items-center px-6 py-4 bg-gray-100 rounded-md text-primary">
        <i v-html="icons.filter"></i>
        <p class="text-base">Filters</p>
      </button>
    </template> -->

    <template #add-action>
      <button
        @click.prevent="openModal('ImportPolicy')"
        class="flex gap-2 justify-center items-center px-6 py-4 text-white rounded-md bg-primary"
      >
        <i v-html="icons.upload"></i>
        <p class="text-base">Import Policies</p>
      </button>
    </template>

    <template #default="{ search }">
      <IssuedPolicyDataProvider
        :search="search"
        v-slot="{ policies, pending }"
      >
        <Table
          :pending="pending"
          :headers="{
            head: ['Policy Number', 'Institution', 'Premium', 'Status', 'Issue Date', 'Actions'],
            row: ['policyNumber', 'institutionName', 'premium', 'status', 'issueDate']
          }"
          :rows="policies"
          :rowCom="PolicyStatusRow"
        >
          <template #empty>
            <div class="py-12 text-center">
              <div class="flex flex-col justify-center items-center">
                <i v-html="icons.document"></i>
                <p class="text-gray-500">No issued policies found</p>
                <p v-if="search" class="mt-1 text-sm text-gray-400">
                  No results match your search criteria
                </p>
              </div>
            </div>
          </template>
        </Table>
      </IssuedPolicyDataProvider>
    </template>
  </DefaultPage>
</template>