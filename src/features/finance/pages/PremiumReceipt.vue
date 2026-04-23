<script setup lang="ts">
import DefaultPage from "@/components/DefaultPage.vue";
import Button from "@/components/Button.vue";
import Table from "@/components/Table.vue";
import Input from "@/components/new_form_elements/Input.vue";
import Select from "@/components/new_form_elements/Select.vue";
import { computed, ref } from "vue";
import PremiumReceiptDataProvider from "@/features/finance/components/PremiumReceiptDataProvider.vue";
import PremiumReceiptRow from "@/features/finance/components/PremiumReceiptRow.vue";
import PremiumPaymentModal from "@/features/finance/modal/premiumpayment.mdl.vue";
import { paypremium } from "@/features/finance/api/FinanceApi";
import { toasted } from "@/utils/utils";

type PaymentMode = "Cash" | "Transfer" | "Cheque" | "Mobile";

const form = ref({
  policyNumber: "",
  payer: "",
  amount: "",
  mode: "Cash" as PaymentMode,
  date: "",
  receiptRef: "",
});

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

const filters = ref({
  from: "",
  to: "",
  policy: "",
  payer: "",
  mode: "" as "" | PaymentMode,
});

function generateReceiptNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const t = String(now.getTime()).slice(-6);
  return `PR-${y}${m}${d}-${t}`;
}

const canSubmit = computed(() => {
  return (
    !!form.value.policyNumber &&
    !!form.value.payer &&
    !!form.value.amount &&
    !!form.value.date &&
    !!form.value.mode
  );
});

function recordPayment() {
  if (!canSubmit.value) return;

  const receiptNo = generateReceiptNo();
  receipts.value.unshift({
    id: crypto.randomUUID(),
    receiptNo,
    policyNumber: form.value.policyNumber,
    payer: form.value.payer,
    amount: Number(form.value.amount),
    mode: form.value.mode,
    date: form.value.date,
    status: "Paid",
  });

  form.value.receiptRef = receiptNo;
}

const filteredReceipts = computed(() => {
  return receipts.value.filter((r) => {
    const inRange = (() => {
      if (!filters.value.from && !filters.value.to) return true;
      const rd = new Date(r.date).getTime();
      const f = filters.value.from ? new Date(filters.value.from).getTime() : -Infinity;
      const t = filters.value.to ? new Date(filters.value.to).getTime() : Infinity;
      return rd >= f && rd <= t;
    })();
    const matchesPolicy = filters.value.policy
      ? r.policyNumber.toLowerCase().includes(filters.value.policy.toLowerCase())
      : true;
    const matchesPayer = filters.value.payer
      ? r.payer.toLowerCase().includes(filters.value.payer.toLowerCase())
      : true;
    const matchesMode = filters.value.mode ? r.mode === filters.value.mode : true;
    return inRange && matchesPolicy && matchesPayer && matchesMode;
  });
});

// Modal state for Pay action
const payOpen = ref(false)
const selectedQuotation = ref<any | null>(null)
const reloadKey = ref(0)
function openPay(row: any) {
  selectedQuotation.value = row
  payOpen.value = true
}
function closePay() {
  payOpen.value = false
}
function submitPay(payload: any) {
  const qid = selectedQuotation.value?.quotationUuid || selectedQuotation.value?.id || ''
  const data = {
    requestedPremium: parseFloat(String(payload?.requestedPremium ?? 0)),
    receiptDate: String(payload?.receiptDate || ''),
    netPremium: parseFloat(String(payload?.netPremium ?? 0)),
    revenueStamp: parseFloat(String(payload?.revenueStamp ?? 0)),
    withHoldingTax: parseFloat(String(payload?.withHoldingTax ?? 0)),
    receiptNumber: payload?.receiptNumber || '',
    quotationUuid: qid,
  }
  paypremium(qid, data)
    .then(() => {
      toasted(true, 'Payment recorded successfully')
      payOpen.value = false
      reloadKey.value++
    })
    .catch((err: any) => {
      const apiErr = err?.response?.data || err
      toasted(false, 'Failed to record payment', apiErr)
    })
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
      <PremiumPaymentModal
        :open="payOpen"
        :requestedPremium="selectedQuotation?.totalPremium || 0"
        :onClose="closePay"
        :onPay="submitPay"
      />
    </div>
  </DefaultPage>
</template>