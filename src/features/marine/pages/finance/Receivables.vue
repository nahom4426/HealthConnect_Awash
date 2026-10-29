<script setup>
// Premium receivables: debit notes raised on bind, amendments, open cover deposits and year-end
// adjustments, with ageing. Recording the receipt in full releases a waiting certificate.
import { onMounted } from "vue";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import FilterBar from "../../components/FilterBar.vue";
import ListTable from "../../components/ListTable.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import { cardClass } from "../../components/styles";
import { useListQuery } from "../../composables/useListQuery";
import { useResource } from "../../composables/useResource";
import { useCan } from "../../composables/useCan";
import { getAgeing, listNotes } from "../../api/marineApi";
import { AGEING_BUCKETS, NOTE_SOURCES, NOTE_STATUSES } from "../../constants";
import { formatAmount, formatMoney } from "../../utils/money";
import { formatDate } from "../../utils/format";
import { statusLabel } from "../../i18n";

const { can } = useCan();
const list = useListQuery((p) => listNotes({ ...p, kind: "DEBIT" }), { filters: { q: "", status: [], source: "", overdue: "" }, sort: "issuedAt,desc" });
const ageing = useResource(getAgeing);
onMounted(() => ageing.load());

const columns = [
  { key: "noteNo", label: "Debit note", sortable: true },
  { key: "customer", label: "Customer", class: "min-w-[12rem]" },
  { key: "source", label: "For", class: "min-w-[13rem]" },
  { key: "issuedAt", label: "Issued", sortable: true },
  { key: "dueDate", label: "Due", sortable: true },
  { key: "total", label: "Amount (ETB)", align: "right" },
  { key: "outstanding", label: "Outstanding", align: "right" },
  { key: "status", label: "Status" },
  { key: "actions", label: "" },
];

function receive(n) {
  openModal(
    "MarineRecordPayment",
    {
      kind: "receipt",
      id: n.id,
      title: `Receipt for ${n.noteNo}`,
      amount: n.outstanding,
      maxAmount: n.outstanding,
      editableAmount: true,
      details: [
        { label: "Customer", value: n.customer?.name },
        { label: "For", value: `${NOTE_SOURCES[n.source]} ${n.policy?.policyNo ?? n.openCover?.coverNo ?? ""}` },
        { label: "Net premium", value: formatMoney(n.net) },
        { label: "VAT and stamp duty", value: formatMoney((Number(n.vat) + Number(n.stamp)).toFixed(2)) },
        { label: "Outstanding", value: formatMoney(n.outstanding) },
      ],
    },
    (done) => {
      if (!done) return;
      list.load();
      ageing.load();
    }
  );
}
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader title="Premium receivables" subtitle="Debit notes waiting for payment. A certificate is issued once its premium is received in full." :crumbs="[{ label: 'Marine' }, { label: 'Finance' }, { label: 'Receivables' }]" />

    <section class="grid grid-cols-2 gap-3 mb-5 lg:grid-cols-5" aria-label="Ageing">
      <div :class="[cardClass, 'p-3.5 border-l-4 !border-l-sky-600 !bg-sky-50 dark:!bg-sky-900/30']">
        <p class="text-[11px] font-semibold tracking-wider uppercase text-ink-muted">Total outstanding</p>
        <p class="mt-1 text-lg font-bold tabular-nums text-ink">ETB {{ formatAmount(ageing.data.value?.total ?? "0") }}</p>
      </div>
      <div v-for="(b, i) in AGEING_BUCKETS" :key="b.key" :class="[cardClass, 'p-3.5 border-l-4', ['!border-l-emerald-400', '!border-l-amber-300', '!border-l-amber-500', '!border-l-red-500'][i]]">
        <p class="text-[11px] font-semibold tracking-wider uppercase text-ink-muted">{{ b.label }}</p>
        <p class="mt-1 text-base font-bold tabular-nums text-ink">ETB {{ formatAmount(ageing.data.value?.buckets[b.key].amount ?? "0") }}</p>
        <p class="text-xs text-ink-muted">{{ ageing.data.value?.buckets[b.key].count ?? 0 }} notes</p>
      </div>
    </section>

    <FilterBar
      :fields="[
        { type: 'search', key: 'q', label: 'Search note, customer, policy or certificate' },
        { type: 'multi', key: 'status', label: 'Status', options: NOTE_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })) },
        { type: 'select', key: 'source', label: 'For', options: Object.entries(NOTE_SOURCES).filter(([k]) => k !== 'CANCELLATION').map(([value, label]) => ({ value, label })) },
        { type: 'toggle', key: 'overdue', label: 'Overdue only' },
      ]"
      :list="list"
    />
    <ListTable :columns="columns" :list="list" :row-link="(r) => `/marine/finance/notes/${r.id}`" empty-title="No debit notes yet" filtered-empty-title="Nothing waiting for payment">
      <template #cell-customer="{ row }">
        <RouterLink :to="`/marine/customers/${row.customerId}`" class="hover:text-primary" @click.stop>{{ row.customer?.name ?? "—" }}</RouterLink>
      </template>
      <template #cell-source="{ row }">
        {{ NOTE_SOURCES[row.source] }}
        <p class="text-xs whitespace-nowrap text-ink-muted">{{ row.policy?.policyNo ?? row.openCover?.coverNo ?? "" }}{{ row.certificate ? ` · ${row.certificate.certNo}` : "" }}</p>
      </template>
      <template #cell-issuedAt="{ row }"><span class="whitespace-nowrap">{{ formatDate(row.issuedAt) }}</span><p class="text-xs text-ink-muted">{{ row.ageDays }} days</p></template>
      <template #cell-dueDate="{ row }">
        <span :class="['whitespace-nowrap', row.overdue ? 'px-2 py-0.5 rounded-full bg-error-soft text-error-strong font-medium' : '']">{{ formatDate(row.dueDate) }}</span>
      </template>
      <template #cell-total="{ row }">{{ formatAmount(row.total) }}</template>
      <template #cell-outstanding="{ row }"><span :class="Number(row.outstanding) > 0 && row.status !== 'CANCELLED' ? 'font-semibold' : 'text-ink-muted'">{{ row.status === "CANCELLED" ? "—" : formatAmount(row.outstanding) }}</span></template>
      <template #cell-status="{ row }"><StatusBadge entity="note" :status="row.status" /></template>
      <template #cell-actions="{ row }"><span class="flex justify-end"><Button v-if="can('finance.post') && ['UNPAID', 'PARTLY_PAID'].includes(row.status)" size="sm" variant="success" @click.stop="receive(row)">Record receipt</Button></span></template>
    </ListTable>
  </div>
</template>
