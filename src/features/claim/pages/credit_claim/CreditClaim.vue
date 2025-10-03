<script setup>
import Table from "@/components/Table.vue";
import { usePagination } from "@/composables/usePagination";
import { getRequestedClaim } from "../../api/claimApi";
import { formatCurrency, secondDateFormat } from "@/utils/utils";
import { ref } from "vue";
import DefaultPage from "@/components/DefaultPage.vue";
import { getProviders } from "@/features/providers/api/providerApi";
import { Status } from "@/types/interface";
import SearchSelect from "@/components/SearchSelect.vue";
import { useRequestdClaims } from "../../store/requestedCreditClaimStore";
import FilterOnDetector from "@/components/FilterOnDetector.vue";
import Button from "@/components/Button.vue";

// 👇 import your detail component
import CreditClaimDetail from "./CreditClaimDetail.vue";

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

if (!claimStore.requestedClaims.length) {
  pagination.send();
}

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
  <!-- Always define slot -->
  <template #more>
    <FilterOnDetector :watch="[institutionUuid, contractUuid]" v-if="!selectedRow">
      <SearchSelect
        placeholder="Filter by Institution"
        :searchCb="(data) => getInstitutionsPolicyByStatus({ ...data, status: Status.ACTIVE })"
        :selectCb="(result) => {
          institutionUuid.value = result?.institutionUuid || '';
          pagination.send();
        }"
        :option="{ label: 'institutionName', value: 'institutionUuid' }"
      />
      <SearchSelect
        placeholder="Filter by a Provider / Contract"
        :searchCb="(data) => getProviders({ ...data, status: Status.ACTIVE })"
        :selectCb="(result) => {
          contractUuid.value = result?.contractUuid || result?.providerUuid || '';
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
    :headers="{
      head: [
        'Insured Name',
        'Provider Name',
        'Group Name',
        'Total Amount',
        'Status',
        'Claim Date',
        'Actions',
      ],
      row: [
        'fullname',
        'providerName',
        'institutionName',
        'amount',
        'status',
        'providedDate',
      ],
    }"
    :cells="{
      fullname: (_, row) => row?.insuredName || row?.dependantName || '',
      amount: formatCurrency,
      status: () => 'Pending',
      providedDate: secondDateFormat,
    }"
    :rows="claimStore.requestedClaims"
  >
    <template #actions="{ row }">
      <Button type="link" @click="viewDetail(row)">View Details</Button>
    </template>
  </Table>

  <CreditClaimDetail
    v-else
    :row="selectedRow"
    @back="goBack"
  />
</DefaultPage>

</template>
