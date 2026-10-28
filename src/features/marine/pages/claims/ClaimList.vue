<script setup>
// Claim list (plan 8.1, MAR-41): soonest deadline first, with an Overdue only toggle.
import { useRouter } from "vue-router";
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

const router = useRouter();
const { roles } = useCan();
const canRegister = () => roles.value.includes("CLAIMS_HANDLER");
const list = useListQuery(listClaims, { filters: { q: "", status: [], type: "", handler: "", lossFrom: "", lossTo: "", overdue: "" }, sort: "" });
const statusLabel = (s) => s.charAt(0) + s.slice(1).toLowerCase();
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
  <div class="p-4 md:p-6">
    <MarinePageHeader title="Claims" :crumbs="[{ label: 'Marine' }, { label: 'Claims' }]">
      <template #actions>
        <Button v-if="canRegister()" @click="router.push('/marine/claims/new')">Register claim</Button>
      </template>
    </MarinePageHeader>
    <FilterBar
      :fields="[
        { type: 'search', key: 'q', label: 'Search claim, certificate, BL no or insured' },
        { type: 'multi', key: 'status', label: 'Status', options: CLAIM_STATUSES.map((s) => ({ value: s, label: statusLabel(s) })) },
        { type: 'select', key: 'type', label: 'Type', options: CLAIM_TYPES },
        { type: 'search', key: 'handler', label: 'Handler' },
        { type: 'dateRange', from: 'lossFrom', to: 'lossTo', label: 'Loss date' },
        { type: 'toggle', key: 'overdue', label: 'Overdue only' },
      ]"
      :list="list"
    />
    <ListTable :columns="columns" :list="list" :row-link="(r) => `/marine/claims/${r.id}`" empty-title="No claims yet" filtered-empty-title="No claims match these filters">
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
        <Button v-if="!filtered && canRegister()" size="sm" @click="router.push('/marine/claims/new')">Register claim</Button>
      </template>
    </ListTable>
  </div>
</template>
