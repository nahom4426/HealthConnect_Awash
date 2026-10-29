<script setup>
// Refunds: credit notes from cancellations, premium-reducing amendments and year-end adjustments in
// the customer's favour. Finance pays them out.
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import FilterBar from "../../components/FilterBar.vue";
import ListTable from "../../components/ListTable.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import { useListQuery } from "../../composables/useListQuery";
import { useCan } from "../../composables/useCan";
import { listNotes } from "../../api/marineApi";
import { NOTE_SOURCES } from "../../constants";
import { formatAmount, formatMoney } from "../../utils/money";
import { formatDate } from "../../utils/format";
import { statusLabel } from "../../i18n";

const { can } = useCan();
const list = useListQuery((p) => listNotes({ ...p, kind: "CREDIT" }), { filters: { q: "", status: [] }, sort: "issuedAt,desc" });
const columns = [
  { key: "noteNo", label: "Credit note", sortable: true },
  { key: "customer", label: "Customer" },
  { key: "source", label: "Reason" },
  { key: "issuedAt", label: "Raised", sortable: true },
  { key: "total", label: "Refund (ETB)", align: "right" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

function pay(n) {
  openModal(
    "MarineRecordPayment",
    {
      kind: "refund",
      id: n.id,
      title: `Pay refund ${n.noteNo}`,
      details: [
        { label: "Customer", value: n.customer?.name },
        { label: "Reason", value: `${NOTE_SOURCES[n.source]} ${n.policy?.policyNo ?? n.openCover?.coverNo ?? ""}` },
        { label: "Refund", value: formatMoney(n.total) },
      ],
    },
    (done) => done && list.load()
  );
}
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader title="Refunds" subtitle="Premium owed back to customers: cancellations, amendments that lower the premium and year-end adjustments." :crumbs="[{ label: 'Marine' }, { label: 'Finance' }, { label: 'Refunds' }]" />
    <FilterBar
      :fields="[
        { type: 'search', key: 'q', label: 'Search note, customer or policy' },
        { type: 'multi', key: 'status', label: 'Status', options: ['UNPAID', 'PAID'].map((s) => ({ value: s, label: s === 'UNPAID' ? 'To pay' : statusLabel(s) })) },
      ]"
      :list="list"
    />
    <ListTable :columns="columns" :list="list" :row-link="(r) => `/marine/finance/notes/${r.id}`" empty-title="No refunds" filtered-empty-title="No refunds match these filters">
      <template #cell-customer="{ row }">{{ row.customer?.name ?? "—" }}</template>
      <template #cell-source="{ row }">{{ NOTE_SOURCES[row.source] }}<p class="text-xs text-ink-muted">{{ row.policy?.policyNo ?? row.openCover?.coverNo ?? "" }}</p></template>
      <template #cell-issuedAt="{ row }"><span class="whitespace-nowrap">{{ formatDate(row.issuedAt) }}</span></template>
      <template #cell-total="{ row }">{{ formatAmount(row.total) }}</template>
      <template #cell-status="{ row }"><StatusBadge entity="note" :status="row.status" /></template>
      <template #cell-actions="{ row }"><span class="flex justify-end"><Button v-if="can('finance.post') && row.status === 'UNPAID'" size="sm" variant="success" @click.stop="pay(row)">Pay refund</Button></span></template>
      <template #empty><p class="text-sm text-ink-muted">A credit note appears here when a paid certificate is cancelled or its premium goes down.</p></template>
    </ListTable>
  </div>
</template>
