<script setup>
// Claim work queues for one side: the agency that prepares claims, or the insurer's claims desk.
// Each tab is one backend list; the queue is passed to the claim page so it knows the stage.
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import LifePageHeader from "../../components/LifePageHeader.vue";
import LifePager from "../../components/LifePager.vue";
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

const open = (c) => router.push({ path: `/life/claims/${c.claimUuid}`, query: { side: side.value, queue: queue.value } });
</script>

<template>
  <div class="p-4 md:p-6">
    <LifePageHeader
      :title="side === 'agency' ? 'Claims submitted by agency' : 'Claims desk'"
      :subtitle="side === 'agency' ? 'Claims your office prepares for members of group policies.' : 'Life claims from registration to payment.'"
    >
      <template v-if="side === 'agency'" #actions><Button @click="router.push('/life/claims/new')">New claim</Button></template>
    </LifePageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-2">
      <TabGroup v-model="tab" :tabs="queues.map((q) => q.label)" />
      <input v-model="list.search.value" type="search" placeholder="Search claim or member" aria-label="Search claims" class="px-3 w-72 h-9 text-sm rounded-lg border outline-none bg-surface border-line text-ink focus:border-primary focus:ring-2 focus:ring-primary/15" />
    </div>
    <p class="mb-4 text-xs text-ink-subtle">{{ hint }}</p>

    <section class="overflow-hidden rounded-2xl border bg-surface border-line shadow-card">
      <div v-if="list.error.value && !list.loading.value" class="flex flex-col gap-3 items-center px-6 py-12 text-center">
        <p class="text-sm font-semibold text-ink">Couldn't load claims</p>
        <p class="max-w-md text-sm text-ink-muted">{{ list.error.value }}</p>
        <Button variant="outline" size="sm" @click="list.reload()">Try again</Button>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-surface-muted">
            <tr class="text-xs font-semibold tracking-wide text-left uppercase text-ink-subtle">
              <th class="px-4 py-3">Claim</th>
              <th class="px-4 py-3">Member</th>
              <th class="px-4 py-3">{{ side === "agency" ? "Policy" : "Agency" }}</th>
              <th class="px-4 py-3">Event date</th>
              <th class="px-4 py-3">Claimed</th>
              <th v-if="showAmount" class="px-4 py-3 text-right">Authorized amount</th>
              <th class="px-4 py-3">Last action</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="list.loading.value">
              <tr v-for="i in 6" :key="i" class="border-t border-line"><td v-for="j in (showAmount ? 7 : 6)" :key="j" class="px-4 py-3.5"><div class="h-4 rounded animate-pulse bg-surface-raised"></div></td></tr>
            </template>
            <tr v-else-if="!list.rows.value.length">
              <td :colspan="showAmount ? 7 : 6" class="px-6 py-14 text-center">
                <p class="text-sm font-semibold text-ink">{{ list.search.value ? "No claims match your search" : `No ${tab?.toLowerCase()} claims` }}</p>
              </td>
            </tr>
            <tr v-for="c in list.rows.value" v-else :key="c.claimUuid" tabindex="0" class="border-t cursor-pointer border-line hover:bg-surface-muted/60 focus:outline-none focus:bg-surface-muted" @click="open(c)" @keydown.enter="open(c)">
              <td class="px-4 py-3 font-medium whitespace-nowrap text-ink">{{ c.claimNumber || "Draft" }}</td>
              <td class="px-4 py-3">
                <span class="text-ink">{{ personName(c) || "—" }}</span>
                <span v-if="c.certificateNumber" class="block text-xs text-ink-subtle">Certificate {{ c.certificateNumber }}</span>
              </td>
              <td class="px-4 py-3 text-ink-muted">
                <template v-if="side === 'agency'">{{ c.agencyPolicyNumber || "—" }}</template>
                <template v-else>{{ c.agencyName || "—" }}<span v-if="c.agencyPolicyNumber" class="block text-xs text-ink-subtle">{{ c.agencyPolicyNumber }}</span></template>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-ink-muted">{{ formatDate(c.incidentDate) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-ink-muted">{{ formatDate(c.claimDate) }}</td>
              <td v-if="showAmount" class="px-4 py-3 text-right tabular-nums text-ink">{{ formatAmount(c.totalAuthorizeamount) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-ink-muted">{{ formatDate(c.actionDate) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <LifePager v-model:page="list.page.value" :total-pages="list.totalPages.value" :disabled="list.loading.value" />
    </section>
  </div>
</template>
