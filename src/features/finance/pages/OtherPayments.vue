<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import Table from "@/components/Table.vue";
import { ref } from "vue";

type PaymentMode = "Cash" | "Transfer" | "Cheque" | "Mobile";

const receipts = ref<Array<{
  id: string;
  receiptNo: string;
  policyNumber: string;
  payer: string;
  amount: number;
  mode: PaymentMode;
  date: string;
  status: "Paid" | "Pending" | "Overdue";
}>>([]);
</script>
<template>
  <DefaultPage>
    <template #header>
      <h1>Other Payments</h1>
    </template>
    <div class="mt-2">
      <Table
        :headers="{
          head: ['Receipt No', 'Policy', 'Payer', 'Amount', 'Mode', 'Date', 'Status'],
          row: ['receiptNo', 'policyNumber', 'payer', 'amount', 'mode', 'date', 'status']
        }"
        :rows="receipts"
      />
    </div>
  </DefaultPage>
</template>
