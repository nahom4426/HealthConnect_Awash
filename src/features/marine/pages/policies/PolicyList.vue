<script setup>
// Policy list (plan 5.4): shipment policies and bound Open Cover agreements (same OC record as Open Covers).
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import FilterBar from "../../components/FilterBar.vue";
import ListTable from "../../components/ListTable.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import { useListQuery } from "../../composables/useListQuery";
import { listPolicies } from "../../api/marineApi";
import { POLICY_STATUSES, POLICY_TYPES, policyTypeLabel } from "../../constants";
import { formatAmount, formatMoney } from "../../utils/money";
import { formatDate } from "../../utils/format";
import { statusLabel } from "../../i18n";

const list = useListQuery(listPolicies, {
  filters: { q: "", status: [], policyType: "", periodFrom: "", periodTo: "" },
  sort: "createdAt,desc",
});

const columns = [
  { key: "policyNo", label: "Policy no", sortable: true },
  { key: "policyType", label: "Type" },
  { key: "insured", label: "Insured" },
  { key: "vessel", label: "Vessel / cover" },
  { key: "sailingDate", label: "Sailing date", sortable: true },
  { key: "sumInsuredTotal", label: "Sum insured / capacity", align: "right" },
  { key: "premiumTotal", label: "Premium (ETB)", align: "right" },
  { key: "status", label: "Status" },
  { key: "period", label: "Period" },
];

function policyHref(row) {
  if (row.policyType === "OPEN_COVER" && row.openCoverId) {
    return `/marine/open-covers/${row.openCoverId}`;
  }
  if (row.id?.startsWith?.("oc-") && row.openCoverId) {
    return `/marine/open-covers/${row.openCoverId}`;
  }
  return `/marine/policies/${row.id}`;
}
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader title="Policies" :crumbs="[{ label: 'Marine' }, { label: 'Policies' }]" />
    <FilterBar
      :fields="[
        { type: 'search', key: 'q', label: 'Search policy no, cover no, insured or IMO' },
        { type: 'multi', key: 'status', label: 'Status', options: POLICY_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })) },
        { type: 'select', key: 'policyType', label: 'Type', options: POLICY_TYPES.map((t) => ({ value: t.value, label: t.label })) },
        { type: 'dateRange', from: 'periodFrom', to: 'periodTo', label: 'Period starts' },
      ]"
      :list="list"
    />
    <ListTable :columns="columns" :list="list" :row-link="policyHref" empty-title="No policies yet" filtered-empty-title="No policies match these filters">
      <template #cell-policyType="{ row }">{{ policyTypeLabel(row.policyType || row.product) }}</template>
      <template #cell-insured="{ row }">{{ row.insured?.name ?? "—" }}</template>
      <template #cell-vessel="{ row }">
        <template v-if="row.policyType === 'OPEN_COVER'">{{ row.coverNo || row.openCover?.coverNo || "Open Cover" }}</template>
        <template v-else>{{ row.vessel?.name ?? (row.mode === "AIR" ? "By air" : "—") }}</template>
      </template>
      <template #cell-sailingDate="{ row }">{{ row.policyType === "OPEN_COVER" ? "—" : formatDate(row.sailingDate) }}</template>
      <template #cell-sumInsuredTotal="{ row }">{{ formatMoney(row.sumInsuredTotal, row.currency) }}</template>
      <template #cell-premiumTotal="{ row }">{{ row.policyType === "OPEN_COVER" ? "—" : formatAmount(row.premiumTotal) }}</template>
      <template #cell-status="{ row }"><StatusBadge entity="policy" :status="row.status" /></template>
      <template #cell-period="{ row }"><span class="whitespace-nowrap">{{ formatDate(row.periodFrom) }} – {{ formatDate(row.periodTo) }}</span></template>
      <template #empty>
        <p class="text-sm text-ink-muted">Shipment policies appear when a quote is bound. Open Cover policies appear when an Open Cover quotation is finalised.</p>
      </template>
    </ListTable>
  </div>
</template>
