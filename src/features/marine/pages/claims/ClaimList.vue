<script setup>
// Claim list (plan 8.1, MAR-41): soonest deadline first, with an Overdue only toggle.
// Process / Approved / Completed routes lock the status bucket via route.meta (same pattern as Fire).
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import FilterBar from "../../components/FilterBar.vue";
import ListTable from "../../components/ListTable.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import DeadlineChip from "../../components/DeadlineChip.vue";
import { useListQuery } from "../../composables/useListQuery";
import { useCan } from "../../composables/useCan";
import { listClaims } from "../../api/marineApi";
import { CLAIM_STATUSES, CLAIM_TYPES, DEADLINE_KINDS, label } from "../../constants";
import { formatAmount } from "../../utils/money";
import { formatDate } from "../../utils/format";
import { statusLabel } from "../../i18n";

const route = useRoute();
const router = useRouter();
const { roles } = useCan();
const canRegister = () => roles.value.includes("CLAIMS_HANDLER");

function statusesFromMeta(meta = route.meta) {
  const raw = meta.claimStatuses;
  if (Array.isArray(raw) && raw.length) return raw.map(String);
  if (typeof raw === "string" && raw.trim()) return raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (meta.claimStatus) return [String(meta.claimStatus)];
  return [];
}

const presetStatuses = computed(() => statusesFromMeta(route.meta));
const pageTitle = computed(() => route.meta.claimTitle || "Claims");
const statusOptions = computed(() => {
  const allowed = presetStatuses.value.length ? presetStatuses.value : CLAIM_STATUSES;
  return allowed.map((s) => ({ value: s, label: statusLabel(s) }));
});

const list = useListQuery(listClaims, {
  filters: {
    q: "",
    status: statusesFromMeta(),
    type: "",
    handler: "",
    lossFrom: "",
    lossTo: "",
    overdue: "",
  },
  sort: "",
});

watch(
  () => `${route.path}|${presetStatuses.value.join(",")}`,
  () => {
    list.filters.q = "";
    list.filters.status = [...presetStatuses.value];
    list.filters.type = "";
    list.filters.handler = "";
    list.filters.lossFrom = "";
    list.filters.lossTo = "";
    list.filters.overdue = "";
    list.page = 1;
    list.load();
  }
);

const columns = [
  { key: "claimNo", label: "Claim no" },
  { key: "certNo", label: "Certificate no" },
  { key: "insured", label: "Insured" },
  { key: "type", label: "Type" },
  { key: "lossDate", label: "Loss date", sortable: true },
  { key: "status", label: "Status" },
  { key: "reserve", label: "Reserve", align: "right" },
  { key: "paid", label: "Paid", align: "right" },
  { key: "nextDeadline", label: "Next deadline" },
  { key: "handlerName", label: "Handler" },
];
</script>

<template>
  <div class="marine-page claim-page">
    <MarinePageHeader :title="pageTitle" :crumbs="[{ label: 'Marine' }, { label: 'Claims' }, { label: pageTitle }]">
      <template #actions>
        <Button v-if="canRegister()" @click="router.push('/marine/claims/new')">New claim</Button>
      </template>
    </MarinePageHeader>
    <nav class="grid gap-2 mb-4 sm:grid-cols-3" aria-label="Claim queues">
      <RouterLink
        v-for="bucket in [
          { to: '/marine/claims/process', label: 'Process', hint: 'Registered, surveyed, recovery' },
          { to: '/marine/claims/approved', label: 'Approved', hint: 'Ready to settle' },
          { to: '/marine/claims/completed', label: 'Completed', hint: 'Paid, closed, declined' },
        ]"
        :key="bucket.to"
        :to="bucket.to"
        :class="[
          'rounded-xl border px-4 py-3 transition-colors',
          route.path === bucket.to ? 'border-sky-500 bg-sky-50 text-ink dark:bg-sky-950/40' : 'border-line bg-surface hover:border-sky-300',
        ]"
      >
        <p class="text-sm font-semibold">{{ bucket.label }}</p>
        <p class="mt-0.5 text-xs text-ink-muted">{{ bucket.hint }}</p>
      </RouterLink>
    </nav>
    <FilterBar
      :fields="[
        { type: 'search', key: 'q', label: 'Search claim, certificate, BL no or insured' },
        { type: 'multi', key: 'status', label: 'Status', options: statusOptions },
        { type: 'select', key: 'type', label: 'Type', options: CLAIM_TYPES },
        { type: 'search', key: 'handler', label: 'Handler' },
        { type: 'dateRange', from: 'lossFrom', to: 'lossTo', label: 'Loss date' },
        { type: 'toggle', key: 'overdue', label: 'Overdue only' },
      ]"
      :list="list"
    />
    <ListTable :columns="columns" :list="list" :row-link="(r) => `/marine/claims/${r.id}`" empty-title="No claims in this queue yet" filtered-empty-title="No claims match these filters">
      <template #cell-certNo="{ row }"><RouterLink :to="`/marine/certificates/${row.certificateId}`" class="text-primary hover:underline" @click.stop>{{ row.certNo }}</RouterLink></template>
      <template #cell-insured="{ row }">{{ row.insured?.name ?? "—" }}</template>
      <template #cell-type="{ row }">{{ label(CLAIM_TYPES, row.type) }}</template>
      <template #cell-lossDate="{ row }"><span class="whitespace-nowrap">{{ formatDate(row.lossDate) }}</span></template>
      <template #cell-status="{ row }"><StatusBadge entity="claim" :status="row.status" /></template>
      <template #cell-reserve="{ row }">{{ row.reserve ? `${row.currency} ${formatAmount(row.reserve)}` : "—" }}</template>
      <template #cell-paid="{ row }">{{ Number(row.paid) ? `${row.currency} ${formatAmount(row.paid)}` : "—" }}</template>
      <template #cell-nextDeadline="{ row }">
        <span v-if="row.nextDeadline" class="flex flex-col gap-0.5"><DeadlineChip :due-date="row.nextDeadline.dueDate" :status="row.nextDeadline.status" /><span class="text-xs text-ink-subtle">{{ DEADLINE_KINDS[row.nextDeadline.kind] }}</span></span>
        <span v-else class="text-ink-subtle">—</span>
      </template>
      <template #empty="{ filtered }">
        <Button v-if="!filtered && canRegister()" size="sm" @click="router.push('/marine/claims/new')">New claim</Button>
      </template>
    </ListTable>
  </div>
</template>
