<script setup>
// Claim work queues for one side: the agency that prepares claims, or the insurer's claims desk.
// Each tab is one status of GET /claim/v2/list.
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
import { claimTypeLabel, tabsFor } from "../../claims/claimRules";
import { getLifeClaims } from "../../api/claimApi";

const route = useRoute();
const router = useRouter();
const side = computed(() => route.meta.side || "insurance");
const tabs = computed(() => tabsFor(side.value));

const status = computed(() => (tabs.value.some((t) => t.status === route.query.status) ? route.query.status : tabs.value[0].status));
const list = useLifePagedList((p) => getLifeClaims({ ...p, status: status.value }));
watch([side, status], () => { list.page.value = 1; list.reload(); }, { immediate: true });

const tab = computed({
  get: () => tabs.value.find((t) => t.status === status.value)?.label,
  set: (label) => router.replace({ query: { ...route.query, status: tabs.value.find((t) => t.label === label)?.status } }),
});
const hint = computed(() => tabs.value.find((t) => t.status === status.value)?.hint);
// Before assessment the claimed amount is all there is; after it, the net payable
const assessed = computed(() => ["APPROVED", "AUTHORIZED", "PAID"].includes(status.value));

const columns = computed(() => [
  { key: "claim", label: "Claim" },
  { key: "insured", label: "Insured" },
  { key: "type", label: "Type" },
  { key: "eventDate", label: "Event date" },
  { key: "amount", label: assessed.value ? "Net payable" : "Claimed", align: "right" },
  { key: "requestedDate", label: "Submitted" },
]);

const open = (c) => router.push({ path: `/life/claims/${c.claimUuid}`, query: { side: side.value } });
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader
      :title="side === 'agency' ? 'Claims submitted by agency' : 'Claims desk'"
      :subtitle="side === 'agency' ? 'Claims your office prepares for insured members and policyholders.' : 'Life claims from registration to payment.'"
    >
      <template v-if="side === 'agency' && lifeCan('Life_Claim_Prepare')" #actions><Button @click="router.push('/life/claims/new')">New claim</Button></template>
    </PageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-2">
      <TabGroup v-model="tab" :tabs="tabs.map((t) => t.label)" />
      <div class="w-72"><TextField v-model="list.search.value" type="search" placeholder="Search claim, policy or name" aria-label="Search claims" /></div>
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
      <template #cell-claim="{ row }">
        <span class="font-medium whitespace-nowrap text-ink">{{ row.claimNumberCode || (row.status === "SAVED" ? "Draft" : "Not registered") }}</span>
        <span v-if="row.policyNumber" class="block text-xs text-ink-subtle">{{ row.policyNumber }}</span>
      </template>
      <template #cell-insured="{ row }"><span class="text-ink">{{ row.insuredName || "—" }}</span></template>
      <template #cell-type="{ row }">
        <span class="text-ink-muted">{{ claimTypeLabel(row.claimType) || "—" }}</span>
        <span v-if="row.riderName" class="block text-xs text-ink-subtle">{{ row.riderName }}</span>
      </template>
      <template #cell-eventDate="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ formatDate(row.eventDate) }}</span></template>
      <template #cell-amount="{ row }"><span class="tabular-nums text-ink">{{ formatAmount(assessed ? row.netPayable : row.claimedAmount) }}</span></template>
      <template #cell-requestedDate="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ formatDate(row.requestedDate ?? row.audit?.createdAt) }}</span></template>
      <template #footer><PageNav v-model:page="list.page.value" :total-pages="list.totalPages.value" :disabled="list.loading.value" /></template>
    </ListTable>
  </div>
</template>
