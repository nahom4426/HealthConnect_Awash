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
    <template #filter>
      <button
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 text-primary bg-gray-100"
      >
        <i v-html="icons.filter"></i>
        <p class="text-base">Filters</p>
      </button>
    </template>

    <template #add-action>
      <button
        @click.prevent="openModal('CreatePackage')"
        class="flex justify-center items-center gap-2 rounded-md px-6 py-4 bg-primary text-white"
      >
        <i v-html="icons.plus_circle"></i>
        <p class="text-base">Add Package</p>
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
              'Package Name',
              'Category',
              'Description',
              'Min Limit',
              'Max Limit',
              'Gender',
              'Services Count',
              'Status',
              'Actions',
            ],
            row: [
              '',
              'packageName',
              'packageCategory',
              'packageDescription',
              'minLimit',
              'maxLimit',
              'gender',
              'packageEligibleServices',
              'status',
            ],
          }"
          :rows="packages"
          :rowCom="PackageStatusRow"
          :pagination="{
            currentPage,
            itemsPerPage,
            totalPages,
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
                'packageDescription',
                'minLimit',
                'maxLimit',
                'gender',
                'packageEligibleServices',
                'status',
              ]"
              :headKeys="[
                '#',
                'Package Name',
                'Category',
                'Description',
                'Min Limit',
                'Max Limit',
                'Gender',
                'Services Count',
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
