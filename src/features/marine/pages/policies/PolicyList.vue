<script setup>
// Policy list (plan 5.4).
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import FilterBar from "../../components/FilterBar.vue";
import ListTable from "../../components/ListTable.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import { useListQuery } from "../../composables/useListQuery";
import { listPolicies } from "../../api/marineApi";
import { POLICY_STATUSES, PRODUCTS, productLabel } from "../../constants";
import { formatAmount, formatMoney } from "../../utils/money";
import { formatDate } from "../../utils/format";

const list = useListQuery(listPolicies, { filters: { q: "", status: [], product: "", periodFrom: "", periodTo: "" }, sort: "updatedAt,desc" });
const statusLabel = (s) => s.charAt(0) + s.slice(1).toLowerCase();
const columns = [
  { key: "policyNo", label: "Policy no", sortable: true },
  { key: "product", label: "Product" },
  { key: "insured", label: "Insured" },
  { key: "vessel", label: "Vessel" },
  { key: "sailingDate", label: "Sailing date", sortable: true },
  { key: "sumInsuredTotal", label: "Sum insured", align: "right" },
  { key: "premiumTotal", label: "Premium (ETB)", align: "right" },
  { key: "status", label: "Status" },
  { key: "period", label: "Period" },
];
</script>

<template>
  <div class="p-4 md:p-6">
    <MarinePageHeader title="Policies" :crumbs="[{ label: 'Marine' }, { label: 'Policies' }]" />
    <FilterBar
      :fields="[
        { type: 'search', key: 'q', label: 'Search policy no, insured or IMO' },
        { type: 'multi', key: 'status', label: 'Status', options: POLICY_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })) },
        { type: 'select', key: 'product', label: 'Product', options: PRODUCTS.filter((p) => !p.flag).map((p) => ({ value: p.value, label: p.label })) },
        { type: 'dateRange', from: 'periodFrom', to: 'periodTo', label: 'Period starts' },
      ]"
      :list="list"
    />
    <ListTable :columns="columns" :list="list" :row-link="(r) => `/marine/policies/${r.id}`" empty-title="No policies yet" filtered-empty-title="No policies match these filters">
      <template #cell-product="{ row }">{{ productLabel(row.product) }}</template>
      <template #cell-insured="{ row }">{{ row.insured?.name ?? "—" }}</template>
      <template #cell-vessel="{ row }">{{ row.vessel?.name ?? (row.mode === "AIR" ? "By air" : "—") }}</template>
      <template #cell-sailingDate="{ row }">{{ formatDate(row.sailingDate) }}</template>
      <template #cell-sumInsuredTotal="{ row }">{{ formatMoney(row.sumInsuredTotal, row.currency) }}</template>
      <template #cell-premiumTotal="{ row }">{{ formatAmount(row.premiumTotal) }}</template>
      <template #cell-status="{ row }"><StatusBadge entity="policy" :status="row.status" /></template>
      <template #cell-period="{ row }"><span class="whitespace-nowrap">{{ formatDate(row.periodFrom) }} – {{ formatDate(row.periodTo) }}</span></template>
      <template #empty><p class="text-sm text-ink-muted">Policies appear here when a quote is bound.</p></template>
    </ListTable>
  </div>
</template>
