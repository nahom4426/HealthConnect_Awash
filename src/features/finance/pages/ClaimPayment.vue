<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import { ref, computed } from "vue";
import { formatCurrency, secondDateFormat } from "@/utils/utils";
import { PaymentStatus, ServiceTypes } from "@/types/interface";
import type { ClaimDetail as Claim } from "@/features/claim/types/claimTypes";
import { useClaimByInstitutionBatch } from "@/features/claim/store/claimByInstitutionBatchStore";
import ClaimByBatchDataProvider from '@/features/claim/components/ClaimByBatchDataProvider.vue';
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { ModalName } from "@customizer/modal-x";




const openPaymentModal = (claim: Claim) => {
  openModal({
    name: "ClaimPayment", // Make sure this matches a valid modal name in your ModalName type
    props: {
      batchCode: claim.batchCode,
      providerUuid: claim.providerUuid,
      claimUuid: claim.claimUuid,
      totalAmount: claim.totalAmount,
    }
  });
};

const store = useClaimByInstitutionBatch();
const searchQuery = ref("");
const active = ref(ServiceTypes.creditService);



// Computed property for filtered claims
const filteredClaims = computed(() => {
  if (!searchQuery.value) return store.claims;

  const query = searchQuery.value.toLowerCase();
  return store.claims.filter(
    (claim) =>
      claim.batchCode?.toLowerCase().includes(query) ||
      claim.institutionName?.toLowerCase().includes(query) ||
      claim.providerName?.toLowerCase().includes(query)
  );
});
</script>

<template>
  <ClaimByBatchDataProvider :store="store" :status="PaymentStatus.PAYMENT_REQUESTED"
    :creditService="active === ServiceTypes.creditService" v-slot="{ claims, pending, search }">
    <DefaultPage>
      <template #header>
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-semibold">Claims Payment</h1>
          <div class="flex space-x-4">
            <div class="relative">
              <input v-model="searchQuery" type="text" placeholder="Search claims..."
                class="px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                @input="(e: Event) => searchQuery = (e.target as HTMLInputElement).value" />
            </div>
          </div>
        </div>
      </template>

      <div class="overflow-hidden bg-white rounded-lg shadow">
       
        <Table :pending="pending" :headers="{
          head: [
            'Provider Name',
            'Total Amount',
            'Requested Date',
            'Status',
            'Actions',
          ],
          row: [
            'providerName',
            'totalAmount',
            'claimFromDate',
            'claimStatus',

          ],
        }" :cells="{
        totalAmount: formatCurrency,
        requestPaymentDate: secondDateFormat,
        claimStatus: (status: string) => status || 'APPROVED',
      }" :rows="claims">
          <template #actions="{ row }">
            <div class="flex gap-2 ml-auto">

              <Button 
              
                class="flex gap-2 items-center px-6 py-4 text-white whitespace-nowrap rounded-md bg-primary"
                @click="openModal('ClaimPayment', { batchCode: row.batchCode, providerUuid: row.providerUuid, claimUuid: row.claimUuid, totalAmount: row.totalAmount })">
                pay
              </Button>
              
            </div>
          </template>
        </Table>
      </div>
    </DefaultPage>
  </ClaimByBatchDataProvider>
</template>