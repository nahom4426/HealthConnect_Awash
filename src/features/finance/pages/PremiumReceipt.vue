<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import PremiumReceiptDataProvider from "@/features/finance/components/PremiumReceiptDataProvider.vue";
import PremiumReceiptRow from "@/features/finance/components/PremiumReceiptRow.vue";
import { openModal } from "@customizer/modal-x";
import { ref } from "vue";

const reloadKey = ref(0);

function openPay(row: any) {
  openModal("premiumpayment", row);
}
</script>
<template>
  <DefaultPage>
    <template #header>
      <h1>Premium Receipt</h1>
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
              'Institution',
              'Phone',
              'Total Premium',
              'Total Sum Insured',
              'Created Date',
              'Status',
              'actions',
            ],
            row: [
              'quotationCode',
              'institutionName',
              'institutionPhone',
              'totalPremium',
              'totalSumInsured',
              'createdDate',
              'status',
            ],
          }"
          :cells="{
            totalPremium: (_: any, r: any) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ETB' }).format(r.totalPremium || 0),
            totalSumInsured: (_: any, r: any) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'ETB' }).format(r.totalSumInsured || 0),
            createdDate: (_: any, r: any) => new Date(r.createdDate).toLocaleDateString(),
          }"
          :rows="quotations"
        />
      </PremiumReceiptDataProvider>
    </div>
  </DefaultPage>
</template>