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
const contractUuid = ref();
const itemType = ref('SERVICE'); // default to SERVICE

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
</script>

<template>
  <DefaultPage v-model="pagination.search.value">
    <template #more>
      <FilterOnDetector :watch="[institutionUuid, contractUuid]">
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
          placeholder="Filter by a Provider / Contract"
          :searchCb="(data) => getProviders({...data, status: Status.ACTIVE})"
          :selectCb="(result) => {
            // API returns contractUuid on the record — fallback to providerUuid if not present
            contractUuid.value = result?.contractUuid || result?.providerUuid || '';
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
        fullname: (_, row) => {
          // use insuredName from API, fallback to dependantName
          return row?.insuredName || row?.dependantName || '';
        },
        amount: formatCurrency,
        status: () => 'Pending',
        providedDate: secondDateFormat
      }"
      :rows="claimStore.requestedClaims"
    >
      <template #actions="{ row }">
        <Button type="link">
          <RouterLink :to="`/credit_claims/detail/${row.serviceProvidedUuid || row.claimUuid}`">
            View Detail
          </RouterLink> 
        </Button>
      </template>
    </Table>
  </DefaultPage>
</template>