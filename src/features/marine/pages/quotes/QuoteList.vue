<script setup>
// Quote list (plan 5.1): URL-synced filters, newest first; valid-until turns amber within 5 days.
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import FilterBar from "../../components/FilterBar.vue";
import ListTable from "../../components/ListTable.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import { useListQuery } from "../../composables/useListQuery";
import { useCan } from "../../composables/useCan";
import { listQuotes } from "../../api/marineApi";
import { PRODUCTS, QUOTE_STATUSES, productLabel } from "../../constants";
import { formatAmount, formatMoney } from "../../utils/money";
import { addDays, formatDate, formatDateTime, todayIso } from "../../utils/format";
import { statusLabel } from "../../i18n";

const route = useRoute();
const router = useRouter();
const { can } = useCan();
const declarations = computed(() => route.meta.declaration === true);
const list = useListQuery(
  (params) => listQuotes({ ...params, declaration: declarations.value }),
  { filters: { q: "", status: [], product: "", createdFrom: "", createdTo: "", expiring: "" }, sort: "updatedAt,desc" },
);

const expiringSoon = (row) => row.validUntil && ["QUOTED", "APPROVED"].includes(row.status) && row.validUntil <= addDays(todayIso(), 5);

const columns = computed(() => [
  { key: "quoteNo", label: declarations.value ? "Declaration" : "Quote no", sortable: true },
  { key: "product", label: "Product" },
  { key: "insured", label: "Insured" },
  { key: "broker", label: "Broker" },
  { key: "vessel", label: "Vessel" },
  ...(declarations.value ? [{ key: "cover", label: "Open cover" }] : []),
  { key: "sumInsuredTotal", label: "Sum insured", align: "right" },
  { key: "premiumTotal", label: "Premium (ETB)", align: "right" },
  { key: "status", label: "Status", sortable: true },
  { key: "validUntil", label: "Valid until", sortable: true },
  { key: "updatedAt", label: "Updated", sortable: true },
]);
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader
      :title="declarations ? 'Declarations' : 'Quotations'"
      :crumbs="[{ label: 'Marine' }, { label: declarations ? 'Declarations' : 'Quotations' }]"
    >
      <template #actions>
        <Button v-if="!declarations && can('quote.create')" @click="router.push('/marine/quotes/new')">New quote</Button>
        <Button v-if="declarations && can('quote.create')" @click="router.push('/marine/declarations/new')">Create declaration</Button>
      </template>
    </MarinePageHeader>
    <FilterBar
      :fields="[
        { type: 'search', key: 'q', label: 'Search quote no or insured' },
        { type: 'multi', key: 'status', label: 'Status', options: QUOTE_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })) },
        { type: 'select', key: 'product', label: 'Product', options: PRODUCTS.filter((p) => !p.flag).map((p) => ({ value: p.value, label: p.label })) },
        { type: 'dateRange', from: 'createdFrom', to: 'createdTo', label: 'Created' },
      ]"
      :list="list"
    />
    <ListTable
      :columns="columns"
      :list="list"
      :row-link="(r) => `/marine/quotes/${r.id}`"
      :empty-title="declarations ? 'No declarations yet' : 'No quotations yet'"
      filtered-empty-title="No records match these filters"
    >
      <template #cell-product="{ row }">{{ productLabel(row.product) }}</template>
      <template #cell-insured="{ row }"><span :class="row.insured || row.proposerName ? '' : 'text-ink-subtle'">{{ row.insured?.name ?? row.proposerName ?? "—" }}</span></template>
      <template #cell-broker="{ row }"><span :class="row.broker ? '' : 'text-ink-subtle'">{{ row.broker?.name ?? "—" }}</span></template>
      <template #cell-vessel="{ row }"><span :class="row.vessel ? '' : 'text-ink-subtle'">{{ row.vessel?.name ?? (row.mode === "AIR" ? "By air" : "—") }}</span></template>
      <template #cell-cover="{ row }">{{ row.openCover?.coverNo ?? "—" }}</template>
      <template #cell-sumInsuredTotal="{ row }">{{ row.sumInsuredTotal ? formatMoney(row.sumInsuredTotal, row.currency) : row.invoiceValue ? formatMoney(row.invoiceValue, row.currency) + "*" : "—" }}</template>
      <template #cell-premiumTotal="{ row }">{{ row.premiumTotal ? formatAmount(row.premiumTotal) : "—" }}</template>
      <template #cell-status="{ row }"><StatusBadge entity="quote" :status="row.quotationStage || row.status" /></template>
      <template #cell-validUntil="{ row }">
        <span v-if="row.validUntil" :class="expiringSoon(row) ? 'px-2 py-0.5 rounded-full bg-warning-soft text-warning-strong font-medium' : ''">{{ formatDate(row.validUntil) }}</span>
        <span v-else class="text-ink-subtle">—</span>
      </template>
      <template #cell-updatedAt="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ formatDateTime(row.updatedAt) }}</span></template>
      <template #empty="{ filtered }">
        <Button v-if="!filtered && !declarations && can('quote.create')" size="sm" @click="router.push('/marine/quotes/new')">New quote</Button>
        <Button v-if="!filtered && declarations && can('quote.create')" size="sm" @click="router.push('/marine/declarations/new')">Create declaration</Button>
      </template>
    </ListTable>
    <p class="mt-2 text-xs text-ink-subtle">* Invoice value; the sum insured is set when the quote is rated.</p>
  </div>
</template>
