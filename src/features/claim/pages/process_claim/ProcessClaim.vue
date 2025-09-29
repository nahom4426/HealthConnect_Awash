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
import { ServiceTypes, Status, PaymentStatus } from "@/types/interface";
import Toogle from "@/components/Toogle.vue";
import { useProcessClaimByInstitutionBatch } from "../../store/processClaimByInstitutionBatchStore";

const institutionUuid = ref();
const contractUuid = ref();
const active = ref(ServiceTypes.creditService);
const store = useProcessClaimByInstitutionBatch();
</script>

<template>
  <ClaimByBatchDataProvider
    :store="store"
    :creditService="active == ServiceTypes.creditService"
    :status="PaymentStatus.PENDING"
   :params="{
      providerUuid: providerUuid,
      institutionUuid: institutionUuid,
    }"
    v-slot="{ claims, pending, search }"
  >
    <DefaultPage v-if="search" v-model="search.value">
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
        :pending="pending"
        :headers="{ head: [ 'Policy Holder Name','Provider Name','Batch Code','Total Amount','Requested Date','Status','actions' ], row: ['institutionName','providerName','batchCode','totalAmount','requestPaymentDate','claimStatus'] }"
        :cells="{ totalAmount: formatCurrency, requestPaymentDate: secondDateFormat }"
        :rows="claims"
      >
        <template #actions="{ row }">
          <Button size="xs" type="elevated">
            <RouterLink :to="`/process_claims/detail/${(row).claimUuid || ''}`">Detail</RouterLink>
          </Button>
        </template>
      </Table>
    </DefaultPage>
  </ClaimByBatchDataProvider>
</template>