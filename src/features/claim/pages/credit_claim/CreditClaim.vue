<script setup>
import Table from "@/components/Table.vue";
import { formatCurrency, secondDateFormat } from "@/utils/utils";
import { ref } from "vue";
import DefaultPage from "@/components/DefaultPage.vue";
import { getActiveContracts } from "@/features/provider_contracts/api/contractApi";
import { getInstitutionsPolicyByStatus } from "@/features/institutions/api/institutionApi";
import { Status } from "@/types/interface";
import SearchSelect from "@/components/SearchSelect.vue";
import FilterOnDetector from "@/components/FilterOnDetector.vue";
import Button from "@/components/Button.vue";
import { openModal } from "@customizer/modal-x";

// 👇 import your detail component
import CreditClaimDetail from "./CreditClaimDetail.vue";
import CreditClaimTableRow from "../../components/CreditClaimTableRow.vue";
import CreditClaimDataProvider from "../../components/CreditClaimDataProvider.vue";

const institutionUuid = ref("");
const contractUuid = ref("");
const itemType = ref(""); // empty by default to show both SERVICE and DRUG
const serviceType= ref("CREDIT"); // default to CREDIT
const fromDate = ref("");
const toDate = ref("");
const showFilters = ref(false);

// 👇 selected row state
const selectedRow = ref(null);

function viewDetail(row) {
  selectedRow.value = row;
}

function editManual(row) {
  openModal('UtilizeUsage', {
    mode: 'edit_manual_credit',
    serviceProvidedUuid: row?.serviceProvidedUuid,
    sourceRow: row,
    contractUuid: row?.contractUuid,
    providerName: row?.providerName,
    providedDate: row?.providedDate,
    insuredUuid: row?.insuredPersonUuid,
    dependantUuid: row?.dependantUuid,
  });
}

function goBack() {
  selectedRow.value = null;
}

function handleInstitutionSelect(result) {
  institutionUuid.value = result?.institutionUuid || '';
}
const search = ref("");
function handleContractSelect(result) {
  contractUuid.value = result?.payerProviderContractUuid || '';
}
</script>

<template>
<CreditClaimDataProvider 
  :params="{ 
    institutionUuid, 
    contractUuid, 
    itemType,
    serviceType,
    fromDate,
    toDate
  }"
    :search="search"
  :auto="true"
>
    <template #default="{ claims, pending: dataPending, search: paginationSearch, send }">
    <DefaultPage v-model="search" :hideSearch="selectedRow ? true : false">
      <!-- Filter Section -->
      <template #header v-if="!selectedRow">
        <FilterOnDetector :watch="[() => institutionUuid.value, () => contractUuid.value]">
          <SearchSelect
            placeholder="Filter by Institution"
            :searchCb="(data) => getInstitutionsPolicyByStatus({ ...data, status: Status.ACTIVE })"
            :selectCb="handleInstitutionSelect"
            :option="{ label: 'institutionName', value: 'institutionUuid' }"
          />
          <SearchSelect
            placeholder="Filter by Provider / Contract"
            :searchCb="(data) => getActiveContracts({ ...data, status: Status.ACTIVE })"
            :selectCb="handleContractSelect"
            :option="{ label: 'contractName', value: 'payerProviderContractUuid' }"
          />
        </FilterOnDetector>
      </template>

      <template #more v-if="!selectedRow">
        <button 
          @click="showFilters = !showFilters" 
          class="flex gap-2 items-center px-4 h-10 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200 shadow-sm transition-colors hover:bg-gray-100"
          title="Toggle Date and Type Filters"
        >
          <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 5.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </button>
      </template>

      <!-- Collapsible Additional Filters -->
      <div v-if="showFilters && !selectedRow" class="grid grid-cols-1 gap-4 p-4 mb-4 bg-gray-50 rounded-xl border border-gray-100 transition-all md:grid-cols-3">
        <!-- Service Type Filter -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-gray-500">Service Type</label>
          <select 
            v-model="itemType" 
            class="px-3 h-10 text-sm bg-white rounded-lg border border-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="SERVICE">SERVICE</option>
            <option value="DRUG">DRUG</option>
          </select>
        </div>

        <!-- From Date Filter -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-gray-500">From Date</label>
          <input 
            type="date" 
            v-model="fromDate" 
            class="px-3 h-10 text-sm bg-white rounded-lg border border-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <!-- To Date Filter -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-gray-500">To Date</label>
          <input 
            type="date" 
            v-model="toDate" 
            class="px-3 h-10 text-sm bg-white rounded-lg border border-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <!-- Conditional content -->
      <Table
        v-if="!selectedRow"
        :pending="dataPending"
        :rowCom="CreditClaimTableRow"
        :headers="{
          head: [
            'Insured Name',
            'Provider Name',
            'Institution',
            'Service Type',
            'Services',
            'Total Amount',
            'Status',
            'Claim Date',
            'Actions',
          ],
          row: [
            'fullname',
            'providerName',
            'institutionName',
            'itemType',
            'providedItems',
            'amount',
            'status',
            'providedDate',
          ],
        }"
        :cells="{
          onView: viewDetail,
          onEdit: editManual
        }"
        :rows="claims"
      />

      <CreditClaimDetail
        v-else
        :row="selectedRow"
        @back="goBack"
      />
    </DefaultPage>
  </template>
</CreditClaimDataProvider>

</template>
