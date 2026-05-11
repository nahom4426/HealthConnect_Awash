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
import { ref, watch, computed } from "vue";
import { PaymentStatus, ServiceTypes, Status } from "@/types/interface";
import Toogle from "@/components/Toogle.vue";
import { useCompletedClaimByInstitutionBatch } from "../../store/completedClaimByInstitutionBatchStore";
import CompletedClaimRow from "../../components/CompletedClaimRow.vue";
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
const providerUuid = ref();
const search = ref("");

const store = useCompletedClaimByInstitutionBatch();

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
    :status="PaymentStatus.COMPLETED"
    :creditService="active == ServiceTypes.creditService"
    :params="{
      providerUuid: providerUuid,
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
            {
              name: ServiceTypes.creditService,
            },
            {
              name: ServiceTypes.cashService,
            },
          ]"
        />
        <FilterOnDetector :watch="[institutionUuid, providerUuid]">
          <SearchSelect
            placeholder="Filter by Institution"
            :searchCb="(data) => getInstitutionsPolicyByStatus({...data, status: Status.ACTIVE})"
            :selectCb="(result) => {
              institutionUuid.value = result?.institutionUuid || null;
            }"
            :option="{
              label: 'institutionName',
              value: 'institutionUuid',
            }"
          />
          <SearchSelect
            v-if="ServiceTypes.creditService == active"
            placeholder="Filter by a Provider"
            :searchCb="(data) => getProviders({...data, status: Status.ACTIVE})"
            :selectCb="(result) => {
              providerUuid.value = result?.providerUuid || null;
            }"
            :option="{
              label: 'providerName',
              value: 'providerUuid',
            }"
          />
        </FilterOnDetector>
      </template>
      <Table
        :pending="dataPending"
        :headers="tableHeaders"
        :rows="claims"
        :rowCom="CompletedClaimRow"
        placeholder="No completed claims found"
      />
    </DefaultPage>
  </ClaimByBatchDataProvider>
</template>