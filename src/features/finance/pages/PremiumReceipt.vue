<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import PremiumReceiptDataProvider from "@/features/finance/components/PremiumReceiptDataProvider.vue";
import PremiumReceiptRow from "@/features/finance/components/PremiumReceiptRow.vue";
import { openModal } from "@customizer/modal-x";
import { ref, onMounted, onUnmounted } from "vue";

const reloadKey = ref(0);

function openPay(row: any) {
  openModal("premiumpayment", row);
}

function handlePaymentSuccess() {
  reloadKey.value++;
}

onMounted(() => {
  window.addEventListener('paymentSuccess', handlePaymentSuccess);
});

onUnmounted(() => {
  window.removeEventListener('paymentSuccess', handlePaymentSuccess);
});
</script>
<template>
  <DefaultPage>
    <template #header>
      <h1 class="text-2xl font-bold text-gray-900">Premium Receipt</h1>
    </template>
    <div class="mt-2">
      <PremiumReceiptDataProvider v-slot="{ quotations, pending }" :status="'UNPAID'" :key="reloadKey">
        <Table
          :pending="pending"
          :rowCom="PremiumReceiptRow"
          :rowComProps="{ onPay: openPay }"
          :headers="{
            head: [
          
              'Quotation Code',
              'Policy Holder',
              'Premium / Sum Insured',
              'Issue Date / Status',
              'Actions',
            ],
            row: [
         
              'quotationCode',
              'policyHolderInfo',
              'premiumInfo',
              'dateStatusInfo',
              'actions',
            ],
          }"
          :cells="{
            policyHolderInfo: (_: any, r: any) => ({
              name: r.institutionName || r.insuredName || '—',
              phone: r.institutionPhone || '—',
              policyType: r.policyType || 'N/A'
            }),
            premiumInfo: (_: any, r: any) => ({
              totalPremium: new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', minimumFractionDigits: 2 }).format(r.totalPremium || 0),
              totalSumInsured: new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', minimumFractionDigits: 2 }).format(r.totalSumInsured || 0)
            }),
            dateStatusInfo: (_: any, r: any) => ({
              issuedDate: r.issuedDate ? new Date(r.issuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—',
              status: r.status || 'UNPAID'
            }),
          }"
          :rows="quotations"
        />
      </PremiumReceiptDataProvider>
    </div>
  </DefaultPage>
</template>