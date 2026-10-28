<script setup>
import { ref } from 'vue';
import Table from "@/components/Table.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import IssuedPolicyDataProvider from "../components/IssuedPolicyDataProvider.vue";
import { openModal } from "@customizer/modal-x";
import icons from "@/utils/icons";
import PolicyStatusRow from '../components/PolicyStatusRow.vue';
import ActiveInstitutionDataProvider from '@/features/institutions/components/ActiveInstitutionDataProvider.vue';

const handleAmendPolicy = (id) => {
  openModal('AmendPolicy', { policyId: id });
};

const viewDetails = (id) => {
  console.log("View policy details:", id);
};

const showInstitutionPicker = ref(false);
const institutionSearch = ref('');
const refetchPolicies = ref(0);

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

  openModal('CreateInstitutionContract', {
    institutionUuid: institution.institutionUuid,
    institutionName: institution.institutionName,
    onRefetch: () => {
      refetchPolicies.value += 1;
    },
  });

  closeInstitutionPicker();
}
</script>

<template>
  <DefaultPage placeholder="Search Issued Policies">
    <!-- <template #filter>
      <button class="flex gap-2 justify-center items-center px-6 py-4 bg-gray-100 rounded-md text-primary">
        <i v-html="icons.filter"></i>
        <p class="text-base">Filters</p>
      </button>
    </template> -->

    <template #add-action>
      <div class="flex gap-2">
        <button
          @click.prevent="openInstitutionPicker"
          class="flex gap-2 justify-center items-center px-6 py-4 text-white rounded-md bg-primary"
        >
          <i v-html="icons.plus_circle"></i>
          <p class="text-base">Add Policy</p>
        </button>

        <button
          @click.prevent="openModal('ImportPolicy')"
          class="flex gap-2 justify-center items-center px-6 py-4 text-white rounded-md bg-primary"
        >
          <i v-html="icons.upload"></i>
          <p class="text-base">Import Policies</p>
        </button>
      </div>
    </template>

    <template #default="{ search }">
      <div v-if="showInstitutionPicker" class="p-4 bg-gray-50 rounded-lg border border-gray-200">
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
              :rows="institutions"
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

      <IssuedPolicyDataProvider
        v-else
        :search="search"
        :refetch="refetchPolicies"
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