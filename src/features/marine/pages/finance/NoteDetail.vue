<script setup>
// One debit or credit note: the amounts (net, VAT, stamp duty), what it's for, its receipts or refund
// payment, and the action Finance can take on it.
import { computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import KeyValueGrid from "../../components/KeyValueGrid.vue";
import AuditTimeline from "../../components/AuditTimeline.vue";
import { cardClass } from "../../components/styles";
import { useResource } from "../../composables/useResource";
import { useCan } from "../../composables/useCan";
import { getNote } from "../../api/marineApi";
import { NOTE_SOURCES, PAYMENT_METHODS, label } from "../../constants";
import { formatAmount, formatMoney } from "../../utils/money";
import { formatDate, formatDateTime } from "../../utils/format";

const route = useRoute();
const { can } = useCan();
const { data: n, loading, error, notFound, load, reload } = useResource(getNote);
onMounted(() => load(route.params.id));
watch(() => route.params.id, (id) => id && load(id));

const debit = computed(() => n.value?.kind === "DEBIT");
const open = computed(() => ["UNPAID", "PARTLY_PAID"].includes(n.value?.status));

const items = computed(() => {
  const x = n.value;
  if (!x) return [];
  return [
    { label: "Customer", value: x.customer?.name, to: `/marine/customers/${x.customerId}` },
    { label: "For", value: NOTE_SOURCES[x.source] },
    { label: "Policy", value: x.policy?.policyNo, to: x.policy ? `/marine/policies/${x.policy.id}` : null },
    { label: "Certificate", value: x.certificate ? `${x.certificate.certNo} v${x.certificate.version}` : "", to: x.certificate ? `/marine/certificates/${x.certificate.id}` : null },
    { label: "Open cover", value: x.openCover?.coverNo, to: x.openCover ? `/marine/open-covers/${x.openCover.id}` : null },
    { label: "Broker", value: x.broker?.name },
    { label: "Issued", value: `${formatDateTime(x.issuedAt)} by ${x.raisedBy}` },
    { label: debit.value ? "Due" : "Raised", value: debit.value ? formatDate(x.dueDate) : formatDate(x.issuedAt) },
    { label: "Description", value: x.description, wide: true },
    ...(x.cancelReason ? [{ label: "Cancelled", value: `${x.cancelReason}, ${formatDateTime(x.cancelledAt)}`, wide: true }] : []),
  ];
});

function act() {
  const x = n.value;
  openModal(
    "MarineRecordPayment",
    debit.value
      ? { kind: "receipt", id: x.id, title: `Receipt for ${x.noteNo}`, amount: x.outstanding, maxAmount: x.outstanding, editableAmount: true, details: [{ label: "Customer", value: x.customer?.name }, { label: "Outstanding", value: formatMoney(x.outstanding) }] }
      : { kind: "refund", id: x.id, title: `Pay refund ${x.noteNo}`, details: [{ label: "Customer", value: x.customer?.name }, { label: "Refund", value: formatMoney(x.total) }] },
    (done) => done && reload()
  );
}
</script>

<template>
  <div class="marine-page">
    <PageState v-if="loading && !n" kind="loading" />
    <template v-else-if="notFound">
      <MarinePageHeader title="Note not found" :crumbs="[{ label: 'Marine' }, { label: 'Finance' }]" />
      <PageState kind="notFound" />
    </template>
    <PageState v-else-if="error" kind="error" :message="error.message" @retry="load(route.params.id)" />
    <template v-else-if="n">
      <MarinePageHeader
        :title="n.noteNo"
        :status="n.status"
        entity="note"
        :subtitle="`${debit ? 'Debit note' : 'Credit note'} · ${n.customer?.name}`"
        :crumbs="[{ label: 'Marine' }, { label: 'Finance' }, { label: debit ? 'Receivables' : 'Refunds', to: debit ? '/marine/finance/receivables' : '/marine/finance/refunds' }, { label: n.noteNo }]"
      >
        <template #actions>
          <Button v-if="can('finance.post') && ((debit && open) || (!debit && n.status === 'UNPAID'))" variant="success" @click="act">{{ debit ? "Record receipt" : "Pay refund" }}</Button>
        </template>
      </MarinePageHeader>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] items-start">
        <div class="grid gap-4">
          <section :class="[cardClass, 'p-4']"><h2 class="mb-3 text-sm font-semibold text-ink">Details</h2><KeyValueGrid :items="items" /></section>
          <section :class="[cardClass, 'p-4']">
            <h2 class="mb-3 text-sm font-semibold text-ink">{{ debit ? "Receipts" : "Refund payment" }}</h2>
            <template v-if="debit">
              <p v-if="!n.receipts.length" class="text-sm text-ink-subtle">No receipts yet.</p>
              <ul v-else class="text-sm divide-y divide-line">
                <li v-for="r in n.receipts" :key="r.id" class="flex flex-wrap gap-2 justify-between py-2">
                  <span><span class="font-semibold text-ink">{{ r.receiptNo }}</span> <span class="text-ink-muted">· {{ label(PAYMENT_METHODS, r.method) }}{{ r.reference ? ` ${r.reference}` : "" }}{{ r.bank ? ` · ${r.bank}` : "" }} · {{ r.recordedBy }}</span></span>
                  <span class="tabular-nums">ETB {{ formatAmount(r.amount) }} <span class="text-ink-muted">· {{ formatDate(r.date) }}</span></span>
                </li>
              </ul>
            </template>
            <p v-else-if="n.payment" class="text-sm">
              Paid {{ formatDate(n.payment.date) }} by {{ label(PAYMENT_METHODS, n.payment.method) }}{{ n.payment.reference ? `, reference ${n.payment.reference}` : "" }} · {{ n.payment.paidBy }}
            </p>
            <p v-else class="text-sm text-ink-subtle">Not paid yet.</p>
          </section>
          <section :class="[cardClass, 'p-4']"><h2 class="mb-3 text-sm font-semibold text-ink">History</h2><AuditTimeline entity="note" :entity-id="n.id" /></section>
        </div>
        <aside :class="[cardClass, 'p-4 xl:sticky xl:top-4']">
          <h2 class="mb-3 text-sm font-semibold text-ink">Amount</h2>
          <dl class="space-y-1.5 text-sm">
            <div class="flex justify-between"><dt class="text-ink-muted">Net premium</dt><dd class="tabular-nums">{{ formatAmount(n.net) }}</dd></div>
            <div class="flex justify-between"><dt class="text-ink-muted">VAT</dt><dd class="tabular-nums">{{ formatAmount(n.vat) }}</dd></div>
            <div class="flex justify-between"><dt class="text-ink-muted">Stamp duty</dt><dd class="tabular-nums">{{ formatAmount(n.stamp) }}</dd></div>
            <div class="flex justify-between px-3 py-2.5 mt-3 rounded-xl bg-sky-50 dark:bg-sky-900/30"><dt class="font-semibold text-sky-900 dark:text-sky-100">Total</dt><dd class="font-bold tabular-nums text-sky-900 dark:text-sky-100">ETB {{ formatAmount(n.total) }}</dd></div>
            <template v-if="debit">
              <div class="flex justify-between pt-2"><dt class="text-ink-muted">Received</dt><dd class="tabular-nums">{{ formatAmount(n.paid) }}</dd></div>
              <div class="flex justify-between"><dt class="font-semibold text-ink">Outstanding</dt><dd :class="['font-bold tabular-nums', Number(n.outstanding) > 0 && open ? 'text-warning-strong' : '']">{{ n.status === "CANCELLED" ? "—" : formatAmount(n.outstanding) }}</dd></div>
            </template>
          </dl>
        </aside>
      </div>
    </template>
  </div>
</template>
