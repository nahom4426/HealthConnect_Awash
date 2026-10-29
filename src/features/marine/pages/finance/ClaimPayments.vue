<script setup>
// Claim payments: settlements the claims manager approved, for Finance to pay (two people per
// payment), and carrier recoveries to collect.
import { onMounted } from "vue";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import FilterBar from "../../components/FilterBar.vue";
import ListTable from "../../components/ListTable.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import DetailTabs from "../../components/DetailTabs.vue";
import PageState from "../../components/PageState.vue";
import { cardClass } from "../../components/styles";
import { useListQuery } from "../../composables/useListQuery";
import { useResource } from "../../composables/useResource";
import { useCan } from "../../composables/useCan";
import { listRecoveries, listVouchers } from "../../api/marineApi";
import { VOUCHER_STATUSES } from "../../constants";
import { formatAmount, formatMoney } from "../../utils/money";
import { formatDate, formatDateTime } from "../../utils/format";
import { statusLabel } from "../../i18n";

const { can } = useCan();
const list = useListQuery(listVouchers, { filters: { q: "", status: [] }, sort: "requestedAt,desc" });
const recoveries = useResource(listRecoveries, { initial: [] });
onMounted(() => recoveries.load());

const columns = [
  { key: "voucherNo", label: "Payment request", sortable: true },
  { key: "claimNo", label: "Claim" },
  { key: "payee", label: "Pay to" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "amountEtb", label: "ETB at today's rate", align: "right" },
  { key: "requestedAt", label: "Requested", sortable: true },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

function pay(v) {
  openModal(
    "MarineRecordPayment",
    {
      kind: "voucher",
      id: v.id,
      title: `Pay ${v.voucherNo}`,
      currency: v.currency,
      details: [
        { label: "Claim", value: v.claimNo },
        { label: "Insured", value: v.insured?.name },
        { label: "Pay to", value: v.payee?.name },
        { label: "Amount", value: formatMoney(v.amount, v.currency) },
        ...(v.currency !== "ETB" ? [{ label: "In ETB", value: formatMoney(v.amountEtb) }] : []),
        { label: "Approved by", value: v.requestedBy },
      ],
    },
    (done) => done && list.load()
  );
}
function collect(r) {
  openModal(
    "MarineRecordPayment",
    { kind: "recovery", id: r.claimId, title: `Recovery on ${r.claimNo}`, currency: r.currency, amount: r.toCollect, maxAmount: r.toCollect, editableAmount: true, details: [{ label: "Carrier", value: r.carrier?.name }, { label: "Agreed", value: formatMoney(r.agreed, r.currency) }, { label: "Collected", value: formatMoney(r.collected, r.currency) }] },
    (done) => done && recoveries.load()
  );
}
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader title="Claim payments" subtitle="Settlements approved by the claims manager, waiting for Finance to pay, and carrier recoveries to collect." :crumbs="[{ label: 'Marine' }, { label: 'Finance' }, { label: 'Claim payments' }]" />
    <DetailTabs :tabs="[{ key: 'pay', label: 'To pay' }, { key: 'recoveries', label: 'Recoveries', count: recoveries.data.value.filter((r) => Number(r.toCollect) > 0).length || undefined }]">
      <template #pay>
        <FilterBar
          :fields="[
            { type: 'search', key: 'q', label: 'Search request, claim, payee or insured' },
            { type: 'multi', key: 'status', label: 'Status', options: VOUCHER_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })) },
          ]"
          :list="list"
        />
        <ListTable :columns="columns" :list="list" empty-title="No claim payments yet" filtered-empty-title="No payment requests match these filters">
          <template #cell-voucherNo="{ row }"><span class="font-semibold whitespace-nowrap text-ink">{{ row.voucherNo }}</span></template>
          <template #cell-claimNo="{ row }"><RouterLink :to="`/marine/claims/${row.claimId}?tab=settlement`" class="font-medium text-primary hover:underline">{{ row.claimNo }}</RouterLink><p class="text-xs text-ink-muted">{{ row.insured?.name }}</p></template>
          <template #cell-payee="{ row }">{{ row.payee?.name }}<p v-if="row.payeeNote" class="text-xs text-warning-strong">{{ row.payeeNote }}</p></template>
          <template #cell-amount="{ row }"><span class="whitespace-nowrap">{{ formatMoney(row.amount, row.currency) }}</span></template>
          <template #cell-amountEtb="{ row }">{{ formatAmount(row.amountEtb) }}</template>
          <template #cell-requestedAt="{ row }"><span class="whitespace-nowrap">{{ formatDateTime(row.requestedAt) }}</span><p class="text-xs text-ink-muted">{{ row.requestedBy }}</p></template>
          <template #cell-status="{ row }"><StatusBadge entity="voucher" :status="row.status" /><p v-if="row.paidOn" class="text-xs text-ink-muted">{{ formatDate(row.paidOn) }} · {{ row.reference }}</p></template>
          <template #cell-actions="{ row }"><span class="flex justify-end"><Button v-if="can('finance.post') && row.status === 'REQUESTED'" size="sm" variant="success" @click.stop="pay(row)">Pay</Button></span></template>
          <template #empty><p class="text-sm text-ink-muted">A payment request appears when a claims manager settles a claim.</p></template>
        </ListTable>
      </template>
      <template #recoveries>
        <PageState v-if="recoveries.loading.value && !recoveries.data.value.length" kind="loading" />
        <section v-else :class="[cardClass, 'overflow-hidden']">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-surface-muted"><tr class="text-[11px] font-bold tracking-wider text-left uppercase"><th class="px-4 py-3">Claim</th><th class="px-4 py-3">Carrier</th><th class="px-4 py-3 text-right">Agreed</th><th class="px-4 py-3 text-right">Collected</th><th class="px-4 py-3 text-right">To collect</th><th class="px-4 py-3"></th></tr></thead>
              <tbody>
                <tr v-if="!recoveries.data.value.length"><td colspan="6" class="px-4 py-8 text-center text-ink-subtle">No recoveries yet. They appear when a claim records an amount recovered from the carrier.</td></tr>
                <tr v-for="r in recoveries.data.value" :key="r.claimId" class="border-t border-line">
                  <td class="px-4 py-3"><RouterLink :to="`/marine/claims/${r.claimId}?tab=recovery`" class="font-semibold text-ink hover:text-primary">{{ r.claimNo }}</RouterLink></td>
                  <td class="px-4 py-3">{{ r.carrier?.name }}</td>
                  <td class="px-4 py-3 text-right tabular-nums">{{ formatMoney(r.agreed, r.currency) }}</td>
                  <td class="px-4 py-3 text-right tabular-nums">{{ formatMoney(r.collected, r.currency) }}</td>
                  <td class="px-4 py-3 font-semibold text-right tabular-nums">{{ formatMoney(r.toCollect, r.currency) }}</td>
                  <td class="px-4 py-3 text-right"><Button v-if="can('finance.post') && Number(r.toCollect) > 0" size="sm" variant="success" @click="collect(r)">Record receipt</Button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </DetailTabs>
  </div>
</template>
