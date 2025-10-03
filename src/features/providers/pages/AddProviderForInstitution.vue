<script setup>
import { ref, defineEmits } from "vue";
import { useRouter } from "vue-router";
import Table from "@/components/Table.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import ActiveProvidersDataProvider from "../components/ActiveProviderDataProvider.vue";
import { useApiRequest } from "@/composables/useApiRequest";
import providerStatusRow from "../components/providerInstutionStatusRow.vue";
import { openModal } from "@customizer/modal-x";
import { useProviders } from "../store/providersStore";
import icons from "@/utils/icons";
// Define emits to handle the navigate event
const emit = defineEmits(["navigate"]);

const router = useRouter();
const dataProvider = ref();
const providersStore = useProviders();
const statusReq = useApiRequest();
const deleteReq = useApiRequest();

function refreshData() {
  console.log("Refreshing provider data");
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

function viewDetails(id) {
  router.push(`/providers/${id}`);
}

</script>

<template>
  <DefaultPage placeholder="Search Active Providers">
    <template #filter>
      <button
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 text-primary bg-gray-100"
      >
        <i v-html="icons.filter"></i>
        <p class="text-base">Filters</p>
      </button>
    </template>

    <!-- <template #add-action>
      <button
        @click.prevent="openModal('AddProvider')"
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 bg-primary text-white"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-base">Add Provider</p>
      </button>
    </template> -->
    <template #default="{ search }">
      <ActiveProvidersDataProvider
        ref="dataProvider"
        :search="search"
        v-slot="{ providers, pending }"
      >
        <Table
          :pending="pending"
          :headers="{
            head: [
              'Provider Name',
              'Contract Name',
              'Contract Code',
              'Actions',
            ],
            row: [
              'providerName',
              'payerProviderContractName',
              'payerProviderContractCode',
             
            ],
          }"
          :rows="providers"
          :rowCom="providerStatusRow"
          :pagination="{
            currentPage,
            itemsPerPage,
            totalPages,
            onPageChange: handlePageChange,
            onLimitChange: handleLimitChange,
          }"
        >
          <template #row>
            <providerStatusRow
              :rowData="providers"
              :rowKeys="[
                'providerName',
                'email',
                'telephone',
                'category',
                'level',
                'status',
              ]"
              :headKeys="[
                '',
                'Provider Name',
                'Email',
                'Telephone',
                'Category',
                'Level',
                'Status',
                'Actions',
              ]"
              :onView="viewDetails"
              
              :onRowClick="(row) => {}"
            />
          </template>
        </Table>
      </ActiveProvidersDataProvider>
    </template>
  </DefaultPage>
</template>
