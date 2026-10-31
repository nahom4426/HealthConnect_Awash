<script setup>
// Open cover list (plan 7.1, MAR-02).
import { useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import FilterBar from "../../components/FilterBar.vue";
import ListTable from "../../components/ListTable.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import UsageBar from "../../components/UsageBar.vue";
import { useListQuery } from "../../composables/useListQuery";
import { useCan } from "../../composables/useCan";
import { listOpenCovers } from "../../api/marineApi";
import { formatAmount, formatMoney } from "../../utils/money";
import { formatDate } from "../../utils/format";

const router = useRouter();
const { roles } = useCan();
const canCreate = () => roles.value.some((r) => ["UNDERWRITER", "SENIOR_UNDERWRITER"].includes(r));
const list = useListQuery(listOpenCovers, { filters: { q: "", status: [], activeOn: "" }, sort: "updatedAt,desc" });
const columns = [
  { key: "coverNo", label: "Cover no", sortable: true },
  { key: "insured", label: "Insured" },
  { key: "broker", label: "Broker" },
  { key: "period", label: "Period" },
  { key: "annualLimit", label: "Annual limit", align: "right" },
  { key: "used", label: "Used" },
  { key: "remaining", label: "Remaining", align: "right" },
  { key: "declarationCount", label: "Declarations", align: "right" },
  { key: "lateCount", label: "Late", align: "right" },
  { key: "status", label: "Status" },
];
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader title="Open cover agreements" subtitle="Approved arrangements. Each shipment is declared against an active agreement." :crumbs="[{ label: 'Marine' }, { label: 'Open cover' }, { label: 'Agreements' }]">
      <template #actions>
        <Button v-if="canCreate()" @click="router.push('/marine/open-covers/new')">New open cover</Button>
      </template>
    </MarinePageHeader>
    <FilterBar
      :fields="[
        { type: 'search', key: 'q', label: 'Search cover no or insured' },
        { type: 'multi', key: 'status', label: 'Status', options: [{ value: 'ACTIVE', label: 'Active' }, { value: 'EXPIRED', label: 'Expired' }, { value: 'ADJUSTED', label: 'Adjusted' }] },
      ]"
      :list="list"
    >
      <label class="inline-flex gap-2 items-center text-sm text-ink-muted">Active on <input v-model="list.filters.activeOn" type="date" class="px-2 h-9 rounded-lg border border-line bg-surface text-ink" /></label>
    </FilterBar>
    <ListTable :columns="columns" :list="list" :row-link="(r) => `/marine/open-covers/${r.id}`" empty-title="No open covers yet" filtered-empty-title="No open covers match these filters">
      <template #cell-insured="{ row }">{{ row.insured?.name ?? "—" }}</template>
      <template #cell-broker="{ row }">{{ row.broker?.name ?? "—" }}</template>
      <template #cell-period="{ row }"><span class="whitespace-nowrap">{{ formatDate(row.periodFrom) }} – {{ formatDate(row.periodTo) }}</span></template>
      <template #cell-annualLimit="{ row }">{{ formatMoney(row.annualLimit, row.currency) }}</template>
      <template #cell-used="{ row }"><UsageBar :pct="row.usedPct" :label="`${row.coverNo} used of annual limit`" /></template>
      <template #cell-remaining="{ row }">{{ formatAmount(row.remaining) }}</template>
      <template #cell-lateCount="{ row }"><span :class="row.lateCount ? 'px-2 py-0.5 rounded-full bg-warning-soft text-warning-strong font-semibold' : 'text-ink-subtle'">{{ row.lateCount }}</span></template>
      <template #cell-status="{ row }"><StatusBadge entity="openCover" :status="row.status" /></template>
    </ListTable>
  </div>
</template>
