<script setup>
// Dashboard (plan 6.1): widgets chosen by role, each with a count, up to 5 rows and a View all link.
import { computed, onMounted } from "vue";
import MarinePageHeader from "../components/MarinePageHeader.vue";
import PageState from "../components/PageState.vue";
import DeadlineChip from "../components/DeadlineChip.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { cardClass } from "../components/styles";
import { useDashboard } from "../composables/useDashboard";
import { DEADLINE_KINDS, reasonLabel } from "../constants";
import { formatDate, formatDateTime } from "../utils/format";

const { data, refresh } = useDashboard();
onMounted(refresh);

const WIDGETS = [
  { key: "myReferrals", title: "My open referrals", all: "/marine/underwriting?assignee=me" },
  { key: "unassignedReferrals", title: "Unassigned referrals", all: "/marine/underwriting?assignee=none" },
  { key: "expiringQuotes", title: "Quotes expiring in 5 days", all: "/marine/quotes?expiring=5" },
  { key: "missingFx", title: "Missing FX rates today", all: "/marine/admin/fx-rates" },
  { key: "lateDeclarations", title: "Late declarations", all: "/marine/open-covers" },
  { key: "deadlines", title: "Deadlines due or overdue", all: "/marine/claims?overdue=true" },
  { key: "recentCertificates", title: "Recent certificates", all: "/marine/certificates" },
];
const shown = computed(() => WIDGETS.filter((w) => data.value?.widgets?.[w.key]));
</script>

<template>
  <div class="p-4 md:p-6">
    <MarinePageHeader title="Dashboard" subtitle="What needs your attention in Marine & Cargo." :crumbs="[{ label: 'Marine' }, { label: 'Dashboard' }]" />
    <PageState v-if="!data" kind="loading" />
    <PageState v-else-if="!shown.length" kind="empty" title="Nothing on your dashboard" message="Your roles have no dashboard widgets. Use the sidebar to open quotes, policies or certificates." />
    <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <section v-for="w in shown" :key="w.key" :class="[cardClass, 'p-4 flex flex-col']" :aria-labelledby="`w-${w.key}`">
        <div class="flex justify-between items-baseline mb-2">
          <h2 :id="`w-${w.key}`" class="text-sm font-semibold text-ink">{{ w.title }}</h2>
          <span class="text-2xl font-semibold tabular-nums text-ink">{{ data.widgets[w.key].count }}</span>
        </div>
        <ul class="flex-1 text-sm divide-y divide-line">
          <li v-if="!data.widgets[w.key].rows.length" class="py-2 text-ink-subtle">None</li>
          <li v-for="(r, i) in data.widgets[w.key].rows" :key="r.id ?? r.currency ?? i" class="py-2">
            <template v-if="w.key === 'myReferrals' || w.key === 'unassignedReferrals'">
              <RouterLink :to="`/marine/underwriting/${r.id}`" class="font-medium text-ink hover:text-primary">{{ r.quoteNo }}</RouterLink>
              <span class="text-ink-muted"> · {{ r.insured?.name }}</span>
              <p class="text-xs text-ink-subtle">{{ r.reasonCodes.map(reasonLabel).join(", ") }} · waiting {{ r.waitingHours }} h</p>
            </template>
            <template v-else-if="w.key === 'expiringQuotes'">
              <RouterLink :to="`/marine/quotes/${r.id}`" class="font-medium text-ink hover:text-primary">{{ r.quoteNo }}</RouterLink>
              <span class="text-ink-muted"> · {{ r.insured?.name }} · until {{ formatDate(r.validUntil) }}</span>
            </template>
            <template v-else-if="w.key === 'missingFx'">
              <RouterLink :to="w.all" class="font-medium text-ink hover:text-primary">{{ r.currency }}</RouterLink> <span class="text-ink-muted">has no rate for today</span>
            </template>
            <template v-else-if="w.key === 'lateDeclarations'">
              <RouterLink :to="`/marine/open-covers/${r.coverId}`" class="font-medium text-ink hover:text-primary">{{ r.coverNo }}</RouterLink>
              <span class="text-ink-muted"> · {{ r.insured?.name }} · sailed {{ formatDate(r.sailingDate) }}</span>
            </template>
            <template v-else-if="w.key === 'deadlines'">
              <div class="flex gap-2 justify-between items-center">
                <span><RouterLink :to="`/marine/claims/${r.claimId}?tab=deadlines`" class="font-medium text-ink hover:text-primary">{{ r.claimNo }}</RouterLink> <span class="text-ink-muted">· {{ DEADLINE_KINDS[r.kind] }}</span></span>
                <DeadlineChip :due-date="r.dueDate" :status="r.status" />
              </div>
            </template>
            <template v-else-if="w.key === 'recentCertificates'">
              <div class="flex gap-2 justify-between items-center">
                <RouterLink :to="`/marine/certificates/${r.id}`" class="font-medium text-ink hover:text-primary">{{ r.certNo }} v{{ r.version }}</RouterLink>
                <StatusBadge entity="certificate" :status="r.status" />
              </div>
              <p class="text-xs text-ink-subtle">{{ r.issuedAt ? formatDateTime(r.issuedAt) : "Being generated" }}</p>
            </template>
          </li>
        </ul>
        <RouterLink :to="w.all" class="mt-3 text-sm font-semibold text-primary hover:underline">View all</RouterLink>
      </section>
    </div>
  </div>
</template>
