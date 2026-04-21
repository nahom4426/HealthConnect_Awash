<script setup>
import DefaultPage from "@/components/DefaultPage.vue";
import ClaimByBatchDataProvider from "../../components/ClaimByBatchDataProvider.vue";
import Table from "@/components/Table.vue";
import { formatCurrency, secondDateFormat } from "@/utils/utils";
import Button from "@/components/Button.vue";
import FilterOnDetector from "@/components/FilterOnDetector.vue";
import SearchSelect from "@/components/SearchSelect.vue";
import { getProviders } from "@/features/providers/api/providerApi";
import { getInstitutionsPolicyByStatus } from "@/features/institutions/api/institutionApi";
import { ref, computed } from "vue";
import { ServiceTypes, Status, PaymentStatus, ClaimLevel } from "@/types/interface";
import Toogle from "@/components/Toogle.vue";
import { useApproveClaimByInstitutionBatch } from "../../store/approveClaimByInstitutionBatchStore";
import ApproveClaimRow from "../../components/ApproveClaimRow.vue";
import { watch } from "vue";
const serviceType= ref("CREDIT");
const active = ref(ServiceTypes.creditService);
watch(active, (newActive) => {
  if (newActive === ServiceTypes.creditService) {
    serviceType.value = "CREDIT";
    console.log('🔄 Switched to CREDIT service');
  } else if (newActive === ServiceTypes.cashService) {
    serviceType.value = "CASH";
    console.log('🔄 Switched to CASH service');
  }
});
const institutionUuid = ref();
const contractUuid = ref();
const store = useApproveClaimByInstitutionBatch();
const search = ref("");

const tableRowKeys = computed(() => {
  const nameKey = active.value === ServiceTypes.cashService ? "institutionName" : "providerName";
  return [nameKey, "totalAmount", "claimFromDate", "claimLevel", "claimStatus"];
});

const tableHeaders = computed(() => {
  const nameHeader = active.value === ServiceTypes.cashService ? "Institution Name" : "Provider Name";
  return {
    head: [nameHeader, "Total Amount", "Claim Date", "Level", "Status", "Actions"],
    row: tableRowKeys.value,
  };
});
</script>

<template>
  <ClaimByBatchDataProvider
    :store="store"
    :creditService="active == ServiceTypes.creditService"
    :status="PaymentStatus.CONFIRMED"
   :params="{
      providerUuid: contractUuid,
      institutionUuid: institutionUuid,
      serviceType
    }"
    :search="search"
    v-slot="{ claims, pending: dataPending, search: paginationSearch }"
  >
    <DefaultPage v-model="search">
      <template #header>
        <Toogle
          v-model="active"
          :items="[
            { name: ServiceTypes.creditService },
            { name: ServiceTypes.cashService }
          ]"
        />
        <FilterOnDetector :watch="[institutionUuid, contractUuid]">
          <SearchSelect
            placeholder="Filter by Institution"
            :searchCb="(data) => getInstitutionsPolicyByStatus({...data, status: Status.ACTIVE})"
            :selectCb="(result) => { institutionUuid.value = result?.institutionUuid || null; }"
            :option="{ label: 'institutionName', value: 'institutionUuid' }"
          />
          <SearchSelect
            v-if="ServiceTypes.creditService == active"
            placeholder="Filter by a Provider / Contract"
            :searchCb="(data) => getProviders({...data, status: Status.ACTIVE})"
            :selectCb="(result) => { contractUuid.value = result?.contractUuid || result?.providerUuid || null; }"
            :option="{ label: 'providerName', value: 'providerUuid' }"
          />
        </FilterOnDetector>
      </template>

      <Table
        :pending="dataPending"
        :virtual="true"
        :itemKey="'claimUuid'"
        :virtualHeight="600"
        :virtualItemSize="64"
        :headers="tableHeaders"
        :rows="claims"
        :rowCom="ApproveClaimRow"
        placeholder="No claims to approve"
      />
    </DefaultPage>
  </ClaimByBatchDataProvider>
</template>