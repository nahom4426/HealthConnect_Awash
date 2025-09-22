<script setup>
import Table from "@/components/Table.vue";
import { usePagination } from "@/composables/usePagination";// Fixed the file extension
import { getRequestedClaim } from "../../api/claimApi";
import { formatCurrency, secondDateFormat } from "@/utils/utils";
import { ref } from "vue";
import DefaultPage from "@/components/DefaultPage.vue";
import { getProviders } from "@/features/providers/api/providerApi";
import { Status } from "@/types/interface";
import SearchSelect from "@/components/SearchSelect.vue";
import { useRequestdClaims } from "../../store/requestedCreditClaimStore";
 // Fixed spelling
import FilterOnDetector from "@/components/FilterOnDetector.vue";

const institutionUuid = ref();
const providerUuid = ref();

const claimStore = useRequestdClaims();
const pagination = usePagination({
  store: claimStore,
  auto: false,
  cb: (data) =>
    getRequestedClaim({
      ...data,
      institutionUuid: institutionUuid.value,
      providerUuid: providerUuid.value,
    }),
});

if (!claimStore.requestedClaims.length) {
  pagination.send();
}
</script>

<template>
  <DefaultPage v-model="pagination.search.value">
    <template #more>
      <FilterOnDetector :watch="[institutionUuid, providerUuid]">
        <SearchSelect
          placeholder="Filter by Institution"
          :searchCb="(data) => getInstitutionsPolicyByStatus({...data, status: Status.ACTIVE})"
          :selectCb="(result) => {
            institutionUuid.value = result?.institutionUuid || '';
            pagination.send();
          }"
          :option="{
            label: 'institutionName',
            value: 'institutionUuid',
          }"
        />
        <SearchSelect
          placeholder="Filter by a Provider"
          :searchCb="(data) => getProviders({...data, status: Status.ACTIVE})"
          :selectCb="(result) => {
            providerUuid.value = result?.providerUuid || '';
            pagination.send();
          }"
          :option="{
            label: 'providerName',
            value: 'providerUuid',
          }"
        />
      </FilterOnDetector>
    </template>
    <Table
      :pending="pagination.pending.value"
      :headers="{
        head: [
          'Policy Holder Name',
          'Provider Name',
          'Provider Phone',
          'Group Name',
          'Total Amount',
          'Status',
          'Claim Date',
          'Actions',
        ],
        row: [
          'fullname',
          'providerName',
          'providerPhone',
          'institutionName',
          'totalAmount',
          'status',
          'claimDate',
        ],
      }"
      :cells="{
        fullname: (_, row) => {
          return !row?.relationship ? `${row?.title} ${row?.firstName} ${row?.fatherName} ${row?.grandFatherName}` : `${row?.dependantFirstName} ${row?.dependantFatherName} ${row?.dependantGrandFatherName}`;
        },
        totalAmount: formatCurrency,
        status: () => 'Pending',
        claimDate: secondDateFormat
      }"
      :rows="claimStore.requestedClaims"
    >
      <template #actions="{ row }">
        <Button type="link">
          <RouterLink :to="`/credit_claims/detail/${row.claimUuid}`">
            View Detail
          </RouterLink> 
        </Button>
      </template>
    </Table>
  </DefaultPage>
</template>