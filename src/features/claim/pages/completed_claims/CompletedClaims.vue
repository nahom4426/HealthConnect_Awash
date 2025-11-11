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
import { ref } from "vue";
import { PaymentStatus, ServiceTypes, Status } from "@/types/interface";
import Toogle from "@/components/Toogle.vue";
import { useCompletedClaimByInstitutionBatch } from "../../store/completedClaimByInstitutionBatchStore";
import CompletedClaimRow from "../../components/CompletedClaimRow.vue";

const institutionUuid = ref();
const providerUuid = ref();

const active = ref(ServiceTypes.creditService);

const store = useCompletedClaimByInstitutionBatch();
</script>

<template>
  <ClaimByBatchDataProvider
    :store="store"
    :status="PaymentStatus.APPROVED"
    :creditService="active == ServiceTypes.creditService"
    :params="{
      providerUuid: providerUuid,
      institutionUuid: institutionUuid,
    }"
    v-slot="{ claims, pending, search }"
  >
    <DefaultPage v-model="search.value">
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
        :pending="pending"
        :headers="{
          head: [ 'Batch Code', 'Provider Name', 'Total Amount', 'Claim Date', 'Level', 'Status', 'Actions'],
          row: ['', 'batchCode', 'providerName', 'totalAmount', 'claimFromDate', 'claimLevel', 'claimStatus', '']
        }"
        :rows="claims"
        :rowCom="CompletedClaimRow"
        placeholder="No completed claims found"
      />
    </DefaultPage>
  </ClaimByBatchDataProvider>
</template>