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
import { PaymentStatus, ServiceTypes } from "@/types/interface";
import Toogle from "@/components/Toogle.vue";
import { useCompletedClaimByInstitutionBatch } from "../../store/completedClaimByInstitutionBatchStore";
import { openModal } from '@customizer/modal-x';
import CompletedPaymentModal from '@/features/claim/modal/CompletedPaymentModal.mdl.vue';

const institutionUuid = ref();
const providerUuid = ref();

const active = ref(ServiceTypes.creditService);

const store = useCompletedClaimByInstitutionBatch();

const openPaymentModal = (row) => {
  console.log('Row data:', row); // Debug: Check what data we have in the row
  
  if (!row.claimUuid) {
    console.error('claimUuid is missing in row data');
    if (typeof toasted === 'function') {
      toasted(false, 'Error: Missing claim information');
    }
    return;
  }

  openModal('ConfirmPayment', {
    title: 'Request Payment',
    message: `Are you sure you want to request payment for this claim?`,
    claimUuid: row.claimUuid,
    batchCode: row.batchCode || '',
    comment: `Payment requested for claim ${row.claimNumber || row.claimUuid}`,
    onConfirm: () => {
      store.fetchClaims(); // Refresh the claims list
      if (typeof toasted === 'function') {
        toasted(true, 'Payment request submitted successfully');
      }
    },
    onCancel: () => {
      console.log('Payment request cancelled');
    }
  });
};
</script>

<template>
  <ClaimByBatchDataProvider :store="store" :status="PaymentStatus.APPROVED"
    :creditService="active == ServiceTypes.creditService" :params="{
      providerUuid: providerUuid,
      institutionUuid: institutionUuid,
    }" v-slot="{ claims, pending, search }">
    <DefaultPage v-model="search.value">
      <template #header>
        <Toogle v-model="active" :items="[
          {
            name: ServiceTypes.creditService,
          },
          {
            name: ServiceTypes.cashService,
          },
        ]" />
        <FilterOnDetector :watch="[institutionUuid, providerUuid]">
          <SearchSelect placeholder="Filter by Institution"
            :searchCb="(data) => getInstitutionsPolicyByStatus({ ...data, status: Status.ACTIVE })" :selectCb="(result) => {
              institutionUuid.value = result?.institutionUuid || null;
            }" :option="{
              label: 'institutionName',
              value: 'institutionUuid',
            }" />
          <SearchSelect v-if="ServiceTypes.creditService == active" placeholder="Filter by a Provider"
            :searchCb="(data) => getProviders({ ...data, status: Status.ACTIVE })" :selectCb="(result) => {
              providerUuid.value = result?.providerUuid || null;
            }" :option="{
              label: 'providerName',
              value: 'providerUuid',
            }" />
        </FilterOnDetector>
      </template>
      <Table :pending="pending" :headers="{
        head: [
          'Provider Name',
          'Total Amount',
          // 'Requested Date',
          'Status',
          'Actions',
        ],
        row: [
          'providerName',
          'totalAmount',
          // 'requestPaymentDate',
          'claimStatus',
        
        ],
      }" :cells="{
          totalAmount: formatCurrency,
          requestPaymentDate: secondDateFormat,
          claimStatus: (status) => status || 'APPROVED',
        }" :rows="claims">
        <template #actions="{ row }">
          <div class="flex gap-2 ml-auto ">
            <Button size="xs" class="bg-blue-600 text-white hover:bg-blue-700">
              <RouterLink :to="active === ServiceTypes.creditService ?
                `/completed_claims/detail/${row.claimUuid}` :
                `/completed_claims/cash_detail/${encodeURIComponent(row.batchCode)}`" class=" text-sm ">
                Details
              </RouterLink>
            </Button>

            <Button size="xs" class="bg-green-600 text-white hover:bg-green-700" @click="openPaymentModal(row)">
              Pay request
            </Button>
          </div>
        </template>
      </Table>
    </DefaultPage>
  </ClaimByBatchDataProvider>
</template>