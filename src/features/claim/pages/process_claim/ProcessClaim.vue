<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import ClaimByBatchDataProvider from "../../components/ClaimByBatchDataProvider.vue";
import Table from "@/components/Table.vue";
import { formatCurrency, secondDateFormat } from "@/utils/utils";
import Button from "@/components/Button.vue";
import FilterOnDetector from "@/components/FilterOnDetector.vue";
import SearchSelect from "@/components/SearchSelect.vue";
import { getProviders } from "@/features/providers/api/providerApi";
import { getInstitutionsPolicyByStatus } from "@/features/institutions/api/institutionsApi";
import type { Institution } from "@/features/institutions/store/institutionsStore";
import { ref } from "vue";
import type { Provider } from "@/features/providers/store/providersStore";
import { ServiceTypes, Status } from "@/types/interface";
import Toogle from "@/components/Toogle.vue";
import type { BatchClaim } from "../../store/claimByInstitutionBatchStore";
import type { CashBatchClaim } from "../../store/cashClaimByInstitutionBatchStore";
import { useProcessClaimByInstitutionBatch } from "../../store/processClaimByInstitutionBatchStore";

const institutionUuid = ref();
const providerUuid = ref();

const active = ref<ServiceTypes>(ServiceTypes.creditService);

const store = useProcessClaimByInstitutionBatch()
</script>

<template>
  <ClaimByBatchDataProvider
    :store="store"
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
            :searchCb="(data: any) => getInstitutionsPolicyByStatus({...data, status: Status.ACTIVE})"
            :selectCb="(result?: Institution) => {
							institutionUuid = result?.institutionUuid || null
						}"
            :option="{
              label: 'institutionName',
              value: 'institutionUuid',
            }"
          />
          <SearchSelect
            v-if="ServiceTypes.creditService == active"
            placeholder="Filter by a Provider"
            :searchCb="(data: any) => getProviders({...data, status: Status.ACTIVE})"
            :selectCb="(result?: Provider) => {
							providerUuid = result?.providerUuid || null
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
          head:
            ServiceTypes.creditService == active
              ? [
                  'Policy Holder Name',
                  'Provider Name',
                  'Batch Code',
                  'Total Amount',
                  'Requested Date',
                  'Status',
                  'actions',
                ]
              : [
                  'Policy Holder Name',
                  'Provider Name',
                  'Batch Code',
                  'Total Amount',
                  'Requested Date',
                  'Status',
                  'actions',
                ],
          row:
            ServiceTypes.creditService == active
              ? [
                  'institutionName',
                  'providerName',
                  'batchCode',
                  'totalAmount',
                  'requestPaymentDate',
                  'claimStatus',
                ]
              : [
                  'institutionName',
                  'hospitalName',
                  'claimBatchCode',
                  'totalAmount',
                  'actionDate',
                  'status',
                ],
        }"
        :cells="{
          totalAmount: formatCurrency,
          requestPaymentDate: secondDateFormat,
          actionDate: secondDateFormat,
        }"
        :rows="claims"
      >
        <template #actions="{ row }">
          <Button size="xs" type="elevated">
            <RouterLink
              :to=" ServiceTypes.creditService == active ?
               `/process_claims/detail/${(row as BatchClaim).providerUuid}/${encodeURIComponent((row as BatchClaim).batchCode)}` :
               `/process_claims/cash_detail/${encodeURIComponent((row as CashBatchClaim)?.claimBatchCode)}`"
            >
              Detail
            </RouterLink>
          </Button>
        </template>
      </Table>
    </DefaultPage>
  </ClaimByBatchDataProvider>
</template>
