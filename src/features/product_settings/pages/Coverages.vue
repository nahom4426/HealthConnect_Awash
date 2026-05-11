<script setup>
import { ref } from "vue";
import Table from "@/components/Table.vue";
import DefaultPage from "@/components/DefaultPage.vue";
import CoverageDataProvider from "../components/CoverageDataProvider.vue";
import PackageStatusRow from "../components/PackageStatusRow.vue";
import { openModal } from "@customizer/modal-x";
import { useCoverage } from "../store/coverageStore";
import icons from "@/utils/icons";

const dataProvider = ref();
const coverageStore = useCoverage();

function refreshData() {
  console.log("Refreshing coverage data");
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

function viewDetails(packageUuid) {
  // Navigate to package details if needed
  console.log("View package details:", packageUuid);
}
</script>

<template>
  <DefaultPage title="Coverage Packages" placeholder="Search packages...">
      <!-- <template #filter>
      <button
        class="flex gap-2 justify-center items-center px-6 py-4 bg-gray-100 rounded-md text-primary"
      > 
        <i v-html="icons.filter"></i>
        <p class="text-base">Filters</p>
      </button>
    </template>
  -->
    <template #add-action>
      <button
        @click.prevent="openModal('CreatePackage')"
        class="flex gap-2 justify-center items-center px-6 py-4 text-white rounded-md bg-primary"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-base">Add Benefits</p>
      </button>
    </template>

    <template #default="{ search }">
      <CoverageDataProvider
        ref="dataProvider"
        :search="search"
        v-slot="{ packages, pending, currentPage, itemsPerPage, totalPages }"
      >
        <Table
          :pending="pending"
          :headers="{
            head: [
              'Benefit Name',
              'Category',
              'Benefit Pooling',
              'Exclusive Benefit',
              'Gender',
              'All Services',
              'Status',
              'Actions',
            ],
            row: [  
              '',
              'packageName',
              'packageCategory',
              'benefit_pooling',
              'exclusive_benefit',
              'gender',
             'allServices',
              'status',
            ],
          }"
          :rows="packages"
          :rowCom="PackageStatusRow"
          :pagination="{
            onPageChange: handlePageChange,
            onLimitChange: handleLimitChange,
          }"
        >
          <template #row>
            <PackageStatusRow
              :rowData="packages"
              :rowKeys="[
                'index',
                'packageName',
                'packageCategory',
                'benefit_pooling',
                'exclusive_benefit',
                'gender',
              
                'status',
              ]"
              :headKeys="[
                '#',
                'Benefit Name',
                'Category',
                'Benefit Pooling',
                'Exclusive Benefit',
                'Gender',
              
                'Status',
                'Actions',
              ]"
              :onView="viewDetails"
              :onRowClick="(row) => {}"
            />
          </template>
        </Table>
      </CoverageDataProvider>
    </template>
  </DefaultPage>
</template>
