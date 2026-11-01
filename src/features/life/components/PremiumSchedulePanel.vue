<script setup>
// The premium schedule of a group policy (one paid item) or an individual policy (instalments by
// payment frequency), with the payments received (contract 2026-10, G6). Every amount is the backend's.
import { computed, ref } from "vue";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import ListTable from "@/components/ListTable.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { useLifeResource } from "../composables/useLifeResource";
import { openBlob } from "../composables/openBlob";
import { formatAmount, formatDate } from "../constants/labels";
import { PAYMENT_METHODS, payable } from "../servicing/servicingRules";
import { getPremiumPayments, getPremiumReceipt, getPremiumSchedule } from "../api/premiumApi";

const props = defineProps({
  /** { quotationUuid } or { benefitUuid } */
  subject: { type: Object, required: true },
  canPay: { type: Boolean, default: false },
});

const list = (d) => (Array.isArray(d) ? d : d?.content || []);
const schedule = useLifeResource(() => getPremiumSchedule(props.subject), { initial: [], map: list });
const payments = useLifeResource(() => getPremiumPayments({ ...props.subject, page: 1, limit: 50 }), { initial: [], map: list });
const load = () => { schedule.load(); payments.load(); };
load();

const outstanding = computed(() => schedule.data.value.filter(payable).reduce((n, i) => n + 1, 0));
const scheduleColumns = computed(() => [
  { key: "installment", label: "#" },
  { key: "dueDate", label: "Due" },
  { key: "gross", label: "Gross", align: "right" },
  { key: "net", label: "Net", align: "right" },
  { key: "due", label: "Amount due", align: "right" },
  { key: "paid", label: "Paid", align: "right" },
  { key: "status", label: "Status" },
  ...(props.canPay ? [{ key: "actions", label: "Actions", srOnly: true, align: "right" }] : []),
]);
const paymentColumns = [
  { key: "receipt", label: "Receipt" },
  { key: "date", label: "Received" },
  { key: "method", label: "Method" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "actions", label: "Actions", srOnly: true, align: "right" },
];
const methodLabel = (m) => PAYMENT_METHODS.find((x) => x.value === m)?.label || m || "";
const kindNote = (i) => (i.kind === "ENDORSEMENT" ? "Endorsement" : i.kind === "REFUND" ? "Refund" : "");

const pay = (item) => openModal("LifePremiumPayment", { item }, (done) => done && load());
const opening = ref("");
async function receipt(p) {
  opening.value = p.paymentUuid;
  openBlob(await getPremiumReceipt(p.paymentUuid), `receipt-${p.receiptNumber || p.paymentUuid}.pdf`);
  opening.value = "";
}
defineExpose({ reload: load });
</script>

<template>
  <div class="grid gap-5">
    <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
      <h2 class="text-sm font-semibold text-ink">Premium schedule</h2>
      <p class="text-xs text-ink-muted">
        Created when the policy is issued. Overdue means unpaid past the grace period.<template v-if="outstanding"> {{ outstanding }} instalment{{ outstanding === 1 ? "" : "s" }} to collect.</template>
      </p>
      <ListTable bare class="mt-3" :columns="scheduleColumns" :rows="schedule.data.value" row-key="scheduleItemUuid" :loading="schedule.loading.value" :error="schedule.error.value" error-title="Couldn't load the schedule" empty-title="No premium schedule yet." :skeleton-rows="2" @retry="schedule.load()">
        <template #cell-installment="{ row }"><span class="tabular-nums text-ink">{{ row.installmentNumber }}</span><span v-if="kindNote(row)" class="block text-xs text-ink-subtle">{{ kindNote(row) }}</span></template>
        <template #cell-dueDate="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ formatDate(row.dueDate) }}</span></template>
        <template #cell-gross="{ row }"><span class="tabular-nums text-ink">{{ formatAmount(row.grossPremium) }}</span></template>
        <template #cell-net="{ row }"><span class="tabular-nums text-ink-muted">{{ row.netPremium != null ? formatAmount(row.netPremium) : "—" }}</span></template>
        <template #cell-due="{ row }"><span class="tabular-nums text-ink">{{ formatAmount(row.amountDue) }}</span></template>
        <template #cell-paid="{ row }"><span class="tabular-nums text-ink-muted">{{ formatAmount(row.amountPaid ?? 0) }}</span></template>
        <template #cell-status="{ row }">
          <StatusBadge :status="row.status" />
          <span v-if="row.daysOverdue" class="block text-xs text-error">{{ row.daysOverdue }} days overdue</span>
        </template>
        <template #cell-actions="{ row }"><Button v-if="payable(row)" variant="ghost" size="sm" @click="pay(row)">Record payment</Button></template>
      </ListTable>
      <p class="mt-2 text-xs text-ink-subtle">Withholding tax and revenue stamp show once finance configures the tax rates.</p>
    </section>

    <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
      <h2 class="text-sm font-semibold text-ink">Payments received</h2>
      <ListTable bare class="mt-3" :columns="paymentColumns" :rows="payments.data.value" row-key="paymentUuid" :loading="payments.loading.value" :error="payments.error.value" error-title="Couldn't load payments" empty-title="No payments yet." :skeleton-rows="1" @retry="payments.load()">
        <template #cell-receipt="{ row }"><span class="text-ink">{{ row.receiptNumber }}</span><span v-if="row.reference" class="block text-xs text-ink-subtle">{{ row.reference }}</span></template>
        <template #cell-date="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ formatDate(row.receiptDate) }}</span></template>
        <template #cell-method="{ row }"><span class="text-ink-muted">{{ methodLabel(row.method) }}</span></template>
        <template #cell-amount="{ row }"><span class="tabular-nums text-ink">{{ formatAmount(row.amount) }}</span></template>
        <template #cell-actions="{ row }"><Button variant="ghost" size="sm" :pending="opening === row.paymentUuid" @click="receipt(row)">Receipt</Button></template>
      </ListTable>
    </section>
  </div>
</template>
