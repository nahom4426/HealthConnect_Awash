<script setup>
// Claim work queues for one side: the agency that prepares claims, or the insurer's claims desk.
// Each tab is one backend list; the queue is passed to the claim page so it knows the stage.
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import { lifeCan } from "@/features/life/privileges";
import TabGroup from "@/components/TabGroup.vue";
import PageHeader from "@/components/PageHeader.vue";
import PageNav from "@/components/PageNav.vue";
import ListTable from "@/components/ListTable.vue";
import TextField from "@/components/fields/TextField.vue";
import { useLifePagedList } from "../../composables/useLifePagedList";
import { formatAmount, formatDate } from "../../constants/labels";
import { personName, queuesFor } from "../../claims/claimRules";
import * as api from "../../api/claimApi";

const route = useRoute();
const router = useRouter();
const side = computed(() => route.meta.side || "insurance");
const queues = computed(() => queuesFor(side.value));

const FETCH = {
  agency: { saved: api.getSavedClaims, requested: api.getAgencyRequestedClaims, approved: api.getAgencyApprovedClaims, paid: api.getAgencyPaidClaims, rejected: api.getAgencyRejectedClaims },
  insurance: {
    requested: api.getRequestedClaims, registered: api.getRegisteredClaims, reviewed: api.getReviewedClaimsByPayer, approved: api.getAuditedClaimsByPayer,
    "for-authorization": api.getClaimsForAuthorization, authorized: api.getAuthorizedClaimsByInsurance, paid: api.getInsurancePaidClaims, rejected: api.getRejectedClaimsByPayer,
  },
};

const queue = computed(() => (queues.value.some((q) => q.key === route.query.queue) ? route.query.queue : queues.value[0].key));
const list = useLifePagedList((p) => FETCH[side.value][queue.value](p));
watch([side, queue], () => { list.page.value = 1; list.reload(); }, { immediate: true });

const tab = computed({
  get: () => queues.value.find((q) => q.key === queue.value)?.label,
  set: (label) => router.replace({ query: { ...route.query, queue: queues.value.find((q) => q.label === label)?.key } }),
});
const hint = computed(() => queues.value.find((q) => q.key === queue.value)?.hint);
const showAmount = computed(() => ["authorized", "paid", "for-authorization"].includes(queue.value));

const columns = computed(() => [
  { key: "claimNumber", label: "Claim" },
  { key: "member", label: "Member" },
  { key: "policy", label: side.value === "agency" ? "Policy" : "Agency" },
  { key: "incidentDate", label: "Event date" },
  { key: "claimDate", label: "Claimed" },
  ...(showAmount.value ? [{ key: "totalAuthorizeamount", label: "Authorized amount", align: "right" }] : []),
  { key: "actionDate", label: "Last action" },
]);

const open = (c) => router.push({ path: `/life/claims/${c.claimUuid}`, query: { side: side.value, queue: queue.value } });
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader
      :title="side === 'agency' ? 'Claims submitted by agency' : 'Claims desk'"
      :subtitle="side === 'agency' ? 'Claims your office prepares for members of group policies.' : 'Life claims from registration to payment.'"
    >
      <template v-if="side === 'agency' && lifeCan('Life_Claim_Prepare')" #actions><Button @click="router.push('/life/claims/new')">New claim</Button></template>
    </PageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-2">
      <TabGroup v-model="tab" :tabs="queues.map((q) => q.label)" />
      <div class="w-72"><TextField v-model="list.search.value" type="search" placeholder="Search claim or member" aria-label="Search claims" /></div>
    </div>
    <p class="mb-4 text-xs text-ink-subtle">{{ hint }}</p>

    <ListTable
      :columns="columns"
      :rows="list.rows.value"
      row-key="claimUuid"
      :loading="list.loading.value"
      :error="list.error.value"
      error-title="Couldn't load claims"
      :empty-title="list.search.value ? 'No claims match your search' : `No ${tab?.toLowerCase()} claims`"
      :skeleton-rows="6"
      clickable
      @row-click="open"
      @retry="list.reload()"
    >
      <template #cell-claimNumber="{ row }"><span class="font-medium whitespace-nowrap text-ink">{{ row.claimNumber || "Draft" }}</span></template>
      <template #cell-member="{ row }">
        <span class="text-ink">{{ personName(row) || "—" }}</span>
        <span v-if="row.certificateNumber" class="block text-xs text-ink-subtle">Certificate {{ row.certificateNumber }}</span>
      </template>
      <template #cell-policy="{ row }">
        <span class="text-ink-muted">
          <template v-if="side === 'agency'">{{ row.agencyPolicyNumber || "—" }}</template>
          <template v-else>{{ row.agencyName || "—" }}<span v-if="row.agencyPolicyNumber" class="block text-xs text-ink-subtle">{{ row.agencyPolicyNumber }}</span></template>
        </span>
      </template>
      <template #cell-incidentDate="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ formatDate(row.incidentDate) }}</span></template>
      <template #cell-claimDate="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ formatDate(row.claimDate) }}</span></template>
      <template #cell-totalAuthorizeamount="{ row }"><span class="tabular-nums text-ink">{{ formatAmount(row.totalAuthorizeamount) }}</span></template>
      <template #cell-actionDate="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ formatDate(row.actionDate) }}</span></template>
      <template #footer><PageNav v-model:page="list.page.value" :total-pages="list.totalPages.value" :disabled="list.loading.value" /></template>
    </ListTable>
  </div>
</template>
