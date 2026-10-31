<script setup>
// Referral queue (plan 6.2, MAR-35): open referrals oldest first, filterable by reason and assignee.
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import FilterBar from "../../components/FilterBar.vue";
import ListTable from "../../components/ListTable.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import { useListQuery } from "../../composables/useListQuery";
import { assignReferral, listReferrals } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { REFERRAL_REASONS, ROLE_LABELS, reasonLabel } from "../../constants";
import { formatAmount } from "../../utils/money";

const list = useListQuery(listReferrals, {
  filters: { status: ["OPEN"], reason: [], assignee: "", informationRequested: "false", raisedFrom: "", raisedTo: "" },
  sort: "raisedAt,asc",
});
const views = [
  { id: "pending", label: "Pending referrals", status: ["OPEN"], assignee: "", informationRequested: "false" },
  { id: "mine", label: "My assigned reviews", status: ["OPEN"], assignee: "me", informationRequested: "" },
  { id: "information", label: "Awaiting additional information", status: ["OPEN"], assignee: "", informationRequested: "true" },
  { id: "approved", label: "Approved reviews", status: ["APPROVED"], assignee: "", informationRequested: "" },
  { id: "declined", label: "Declined reviews", status: ["DECLINED"], assignee: "", informationRequested: "" },
];

function show(view) {
  list.filters.status = [...view.status];
  list.filters.assignee = view.assignee;
  list.filters.informationRequested = view.informationRequested;
}
const waiting = (h) => (h < 48 ? `${h} h` : `${Math.round(h / 24)} days`);

async function assign(row) {
  const res = await assignReferral(row.id);
  if (res.ok) {
    toasted(true, `${row.quoteNo} assigned to you`);
    list.load();
  } else notifyError(res.error, { onStale: list.load });
}

const columns = [
  { key: "quoteNo", label: "Quote no" },
  { key: "insured", label: "Insured" },
  { key: "sumInsuredEtb", label: "Sum insured (ETB)", align: "right" },
  { key: "reasons", label: "Reasons" },
  { key: "authorityNeeded", label: "Authority needed" },
  { key: "assigneeName", label: "Assigned to" },
  { key: "raisedAt", label: "Waiting for", sortable: true },
  { key: "status", label: "Status" },
];
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader title="Underwriting queue" subtitle="Reviews of existing quotations, oldest first. Opening a row opens that quotation." :crumbs="[{ label: 'Marine' }, { label: 'Quotations', to: '/marine/quotes' }, { label: 'Underwriting queue' }]">
    </MarinePageHeader>
    <div class="flex flex-wrap gap-2 mb-3">
      <button v-for="view in views" :key="view.id" type="button" class="px-3 py-1 text-sm font-medium rounded-full border border-line text-ink hover:bg-surface-muted" @click="show(view)">{{ view.label }}</button>
    </div>
    <FilterBar
      :fields="[
        { type: 'multi', key: 'status', label: 'Status', options: [{ value: 'OPEN', label: 'Open' }, { value: 'APPROVED', label: 'Approved' }, { value: 'DECLINED', label: 'Declined' }] },
        { type: 'multi', key: 'reason', label: 'Reason', options: REFERRAL_REASONS },
        { type: 'select', key: 'assignee', label: 'Assignee', options: [{ value: 'me', label: 'Me' }, { value: 'none', label: 'Unassigned' }] },
        { type: 'dateRange', from: 'raisedFrom', to: 'raisedTo', label: 'Raised' },
      ]"
      :list="list"
    />
    <ListTable :columns="columns" :list="list" :row-link="(r) => `/marine/quotes/${r.quoteId}?tab=underwriting`" empty-title="No referrals waiting" filtered-empty-title="No referrals match these filters">
      <template #cell-insured="{ row }">{{ row.insured?.name ?? "—" }}</template>
      <template #cell-sumInsuredEtb="{ row }">{{ formatAmount(row.sumInsuredEtb) }}</template>
      <template #cell-reasons="{ row }">
        <span class="flex flex-wrap gap-1">
          <span v-for="c in row.reasonCodes" :key="c" class="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-warning-soft text-warning-strong">{{ reasonLabel(c) }}</span>
        </span>
      </template>
      <template #cell-authorityNeeded="{ row }">{{ ROLE_LABELS[row.authorityNeeded] }}</template>
      <template #cell-assigneeName="{ row }">
        <span v-if="row.assigneeName">{{ row.assigneeName }}</span>
        <button v-else-if="row.status === 'OPEN'" type="button" class="text-sm font-semibold text-primary hover:underline" @click.stop="assign(row)">Assign to me</button>
        <span v-else class="text-ink-subtle">—</span>
      </template>
      <template #cell-raisedAt="{ row }">
        <span :class="row.status === 'OPEN' && row.waitingHours > 24 ? 'px-2 py-0.5 rounded-full bg-warning-soft text-warning-strong font-medium' : ''">{{ waiting(row.waitingHours) }}</span>
      </template>
      <template #cell-status="{ row }">
        <StatusBadge entity="referral" :status="row.status" />
        <span v-if="row.informationRequested" class="ml-1 text-xs font-medium text-warning-strong">Information requested</span>
      </template>
    </ListTable>
  </div>
</template>
