<script setup>
import Table from "@/components/Table.vue";
import { usePagination } from "@/composables/usePagination";
import { getRequestedClaim } from "../../api/claimApi";
import { formatCurrency, secondDateFormat } from "@/utils/utils";
import { ref } from "vue";
import DefaultPage from "@/components/DefaultPage.vue";
import { getMappedActiveProviders } from "@/features/providers/api/providerApi";
import { getInstitutionsPolicyByStatus } from "@/features/institutions/api/institutionApi";
import { Status } from "@/types/interface";
import SearchSelect from "@/components/SearchSelect.vue";
import { useRequestdClaims } from "../../store/requestedCreditClaimStore";
import FilterOnDetector from "@/components/FilterOnDetector.vue";
import Button from "@/components/Button.vue";

// 👇 import your detail component
import CreditClaimDetail from "./CreditClaimDetail.vue";
import CreditClaimTableRow from "../../components/CreditClaimTableRow.vue";

const institutionUuid = ref();
const contractUuid = ref();
const itemType = ref("SERVICE"); // default to SERVICE

const claimStore = useRequestdClaims();
const pagination = usePagination({
  store: claimStore,
  auto: false,
  cb: (data) =>
    getRequestedClaim({
      ...data,
      institutionUuid: institutionUuid.value,
      contractUuid: contractUuid.value,
      itemType: itemType.value,
    }),
});

// Always fetch fresh data when component is mounted
pagination.send();

// 👇 selected row state
const selectedRow = ref(null);

function viewDetail(row) {
  selectedRow.value = row;
}

function goBack() {
  selectedRow.value = null;
}
</script>

<template>
<DefaultPage v-model="pagination.search.value">
  <!-- Filter Section -->
  <template #header v-if="!selectedRow">
    <FilterOnDetector :watch="[institutionUuid, contractUuid]">
      <SearchSelect
        placeholder="Filter by Institution"
        :searchCb="(data) => getInstitutionsPolicyByStatus({ ...data, status: Status.ACTIVE })"
        :selectCb="(result) => {
          institutionUuid = result?.institutionUuid || null;
          pagination.send();
        }"
        :option="{ label: 'institutionName', value: 'institutionUuid' }"
      />
      <SearchSelect
        placeholder="Filter by Provider / Contract"
        :searchCb="(data) => getMappedActiveProviders({ ...data, status: Status.ACTIVE })"
        :selectCb="(result) => {
          contractUuid = result?.contractUuid || result?.providerUuid || null;
          pagination.send();
        }"
        :option="{ label: 'providerName', value: 'providerUuid' }"
      />
    </FilterOnDetector>
  </template>

  <!-- Conditional content -->
  <Table
    v-if="!selectedRow"
    :pending="pagination.pending.value"
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
      onView: viewDetail
    }"
    :rows="claimStore.requestedClaims"
  />

  <CreditClaimDetail
    v-else
    :row="selectedRow"
    @back="goBack"
  />
</DefaultPage>

</template>
