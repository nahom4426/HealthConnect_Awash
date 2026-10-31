<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import PremiumReceiptDataProvider from "@/features/health/finance/components/PremiumReceiptDataProvider.vue";
import PremiumReceiptRow from "@/features/health/finance/components/PremiumReceiptRow.vue";
import { openModal } from "@customizer/modal-x";
import { ref, onMounted, onUnmounted } from "vue";

const reloadKey = ref(0);
const status = ref<"UNPAID" | "PAID">("UNPAID");

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
      <div class="flex flex-wrap gap-3 justify-between items-center">
        <h1 class="text-2xl font-bold text-ink">Premium Receipt</h1>
        <div class="inline-flex p-1 bg-surface-muted rounded-xl border border-line" role="tablist">
          <button
            v-for="opt in [{ v: 'UNPAID', l: 'Unpaid · Debit notes' }, { v: 'PAID', l: 'Paid · Receipts' }]"
            :key="opt.v"
            type="button"
            role="tab"
            :aria-selected="status === opt.v"
            class="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
            :class="status === opt.v ? 'bg-white text-primary shadow-sm' : 'text-ink-muted hover:text-ink'"
            @click="status = opt.v as 'UNPAID' | 'PAID'"
          >
            {{ opt.l }}
          </button>
        </div>
      </div>
    </template>
    <div class="mt-2">
      <PremiumReceiptDataProvider v-slot="{ quotations, pending }" :status="status" :key="`${status}-${reloadKey}`">
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
              status: r.status || status
            }),
          }"
          :rows="quotations"
        />
      </PremiumReceiptDataProvider>
    </div>
  </DefaultPage>
</template>