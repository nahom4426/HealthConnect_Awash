<script setup>
import Table from "@/components/Table.vue";
import { formatCurrency, secondDateFormat } from "@/utils/utils";
import { ref } from "vue";
import DefaultPage from "@/components/DefaultPage.vue";
import { getMappedActiveProviders } from "@/features/providers/api/providerApi";
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
const itemType = ref("SERVICE");
const serviceType= ref("CREDIT"); // default to CREDIT

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
  contractUuid.value = result?.contractUuid || result?.providerUuid || '';
}
</script>

<template>
<CreditClaimDataProvider 
  :params="{ 
    institutionUuid, 
    contractUuid, 
    itemType,
    serviceType
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
            :searchCb="(data) => getMappedActiveProviders({ ...data, status: Status.ACTIVE })"
            :selectCb="handleContractSelect"
            :option="{ label: 'providerName', value: 'providerUuid' }"
          />
        </FilterOnDetector>
      </template>

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
