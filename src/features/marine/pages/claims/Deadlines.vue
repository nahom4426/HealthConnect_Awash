<script setup>
// Claim clocks from GET /deadlines, plus records that already carry a date.
// Sections with no stored clock are named and left empty rather than filled with reminders.
import { computed, onMounted, ref } from "vue";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import { cardClass, inputClass } from "../../components/styles";
import { listCertificates, listDeadlines, listOpenCovers, listQuotes } from "../../api/marineApi";
import { DEADLINE_KINDS } from "../../constants";
import { formatDate } from "../../utils/format";
import { isDeclarationQuote } from "../../utils/quotationView";
import { pageRows } from "../../utils/settingsView";

const rows = ref([]);
const loading = ref(true);
const error = ref("");
const q = ref("");
const only = ref("open");

const expiring = ref([]);
const referred = ref([]);
const late = ref([]);
const covers = ref([]);
const pendingCertificates = ref([]);
const clocksError = ref("");
const hidden = ref({ quotes: false, declarations: false, covers: false, certificates: false });

function blocked(res) {
  return !res.ok && (res.error?.status === 401 || res.error?.status === 403);
}

async function load() {
  loading.value = true;
  error.value = "";
  clocksError.value = "";
  const [deadlines, expiringRes, referredRes, declarations, coverRes, certificates] = await Promise.all([
    listDeadlines(),
    listQuotes({ status: "QUOTED,APPROVED", expiring: 5, size: 25, sort: "validUntil,asc" }),
    listQuotes({ status: "REFERRED", size: 25, sort: "updatedAt,desc" }),
    listQuotes({ declaration: true, size: 50, sort: "sailingDate,asc" }),
    listOpenCovers({ status: "ACTIVE", size: 50, sort: "periodTo,asc" }),
    listCertificates({ status: "PENDING", size: 25, sort: "createdAt,desc" }),
  ]);
  loading.value = false;
  if (!deadlines.ok) error.value = "The claim deadlines could not be loaded.";
  else rows.value = pageRows(deadlines.data);
  const failed = [expiringRes, referredRes, declarations, coverRes, certificates].filter((res) => !res.ok && !blocked(res));
  if (failed.length) clocksError.value = "Some operational records could not be loaded.";
  hidden.value = {
    expiring: blocked(expiringRes),
    referred: blocked(referredRes),
    declarations: blocked(declarations),
    covers: blocked(coverRes),
    certificates: blocked(certificates),
  };
  expiring.value = expiringRes.ok ? pageRows(expiringRes.data) : [];
  referred.value = referredRes.ok ? pageRows(referredRes.data) : [];
  late.value = declarations.ok ? pageRows(declarations.data).filter((row) => row.late) : [];
  covers.value = coverRes.ok ? pageRows(coverRes.data) : [];
  pendingCertificates.value = certificates.ok ? pageRows(certificates.data) : [];
}

onMounted(load);

const shown = computed(() => {
  const term = q.value.trim().toLowerCase();
  return rows.value.filter((row) => {
    if (only.value === "overdue" && !row.overdue) return false;
    if (only.value === "open" && row.status !== "OPEN") return false;
    if (!term) return true;
    return `${row.claimNo ?? ""} ${row.kind ?? ""}`.toLowerCase().includes(term);
  });
});
</script>

<template>
  <div class="marine-page">
    <MarinePageHeader
      title="Deadlines and alerts"
      subtitle="Stored claim clocks, and records that already carry a date. This page does not create reminders."
      :crumbs="[{ label: 'Marine' }, { label: 'Marine Settings' }, { label: 'Deadlines and alerts' }]"
    />

    <section class="mb-8" aria-labelledby="claim-clocks">
      <h2 id="claim-clocks" class="mb-2 text-sm font-semibold text-ink">Claim deadlines</h2>
      <div class="flex flex-wrap gap-3 mb-4">
        <input v-model="q" :class="inputClass" class="min-w-[16rem]" type="search" placeholder="Search claim no or kind" />
        <select v-model="only" :class="inputClass">
          <option value="open">Open</option>
          <option value="overdue">Overdue</option>
          <option value="all">All</option>
        </select>
      </div>
      <PageState v-if="loading" kind="loading" />
      <PageState v-else-if="error" kind="error" title="Deadlines unavailable" :message="error" @retry="load" />
      <PageState v-else-if="!shown.length" kind="empty" title="No claim deadlines" message="Nothing matches this filter." />
      <div v-else :class="cardClass" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-ink-muted">
              <th class="px-4 py-3 font-medium">Claim</th>
              <th class="px-4 py-3 font-medium">Kind</th>
              <th class="px-4 py-3 font-medium">Due</th>
              <th class="px-4 py-3 font-medium">Days left</th>
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 font-medium">Alerts sent</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in shown" :key="row.id" class="border-t border-line">
              <td class="px-4 py-3">
                <RouterLink v-if="row.claimId" class="font-medium text-primary hover:underline" :to="`/marine/claims/${row.claimId}?tab=deadlines`">{{ row.claimNo || "Open claim" }}</RouterLink>
                <span v-else>{{ row.claimNo || "—" }}</span>
              </td>
              <td class="px-4 py-3">{{ DEADLINE_KINDS[row.kind] || row.kind }}</td>
              <td class="px-4 py-3 whitespace-nowrap">{{ formatDate(row.dueDate) }}</td>
              <td class="px-4 py-3" :class="row.overdue ? 'text-error font-medium' : ''">{{ row.daysLeft }}</td>
              <td class="px-4 py-3"><StatusBadge entity="deadline" :status="row.status" /></td>
              <td class="px-4 py-3">{{ (row.alertsSent || []).length }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <p v-if="clocksError" role="status" class="p-3 mb-4 text-sm rounded-xl bg-warning-soft text-warning-strong">{{ clocksError }}</p>

    <section class="mb-8" aria-labelledby="quote-expiry">
      <h2 id="quote-expiry" class="mb-1 text-sm font-semibold text-ink">Quotation expiry</h2>
      <p class="mb-2 text-sm text-ink-muted">Quoted or approved quotations whose validity ends within 5 days. That is the window the dashboard already uses.</p>
      <p v-if="hidden.expiring" class="text-sm text-ink-muted">Not available for this sign-in.</p>
      <p v-else-if="!loading && !expiring.length" class="text-sm text-ink-muted">None.</p>
      <ul v-else class="text-sm">
        <li v-for="row in expiring" :key="row.id" class="py-1">
          <RouterLink class="font-medium text-primary hover:underline" :to="`/marine/quotes/${row.id}?tab=terms`">{{ row.quoteNo }}</RouterLink>
          <span class="text-ink-muted"> · valid until {{ formatDate(row.validUntil) }}</span>
        </li>
      </ul>
    </section>

    <section class="mb-8" aria-labelledby="pending-underwriting">
      <h2 id="pending-underwriting" class="mb-1 text-sm font-semibold text-ink">Pending underwriting</h2>
      <p class="mb-2 text-sm text-ink-muted">Referred quotations and declarations. The decision stays on that page. There is no separate approval queue.</p>
      <p v-if="hidden.referred" class="text-sm text-ink-muted">Not available for this sign-in.</p>
      <p v-else-if="!loading && !referred.length" class="text-sm text-ink-muted">None.</p>
      <ul v-else class="text-sm">
        <li v-for="row in referred" :key="row.id" class="py-1">
          <RouterLink class="font-medium text-primary hover:underline" :to="`/marine/quotes/${row.id}?tab=underwriting`">{{ row.quoteNo }}</RouterLink>
          <span class="text-ink-muted"> · {{ isDeclarationQuote(row) ? "declaration" : "quotation" }}</span>
        </li>
      </ul>
    </section>

    <section class="mb-8" aria-labelledby="late-declarations">
      <h2 id="late-declarations" class="mb-1 text-sm font-semibold text-ink">Declaration timing</h2>
      <p class="mb-2 text-sm text-ink-muted">A declaration the cover already marks late, because it was saved after the cover's declaration days.</p>
      <p v-if="hidden.declarations" class="text-sm text-ink-muted">Not available for this sign-in.</p>
      <p v-else-if="!loading && !late.length" class="text-sm text-ink-muted">None.</p>
      <ul v-else class="text-sm">
        <li v-for="row in late" :key="row.id" class="py-1">
          <RouterLink class="font-medium text-primary hover:underline" :to="`/marine/quotes/${row.id}`">{{ row.quoteNo }}</RouterLink>
          <RouterLink v-if="row.openCover?.id" class="text-ink-muted hover:underline" :to="`/marine/open-covers/${row.openCover.id}`"> · {{ row.openCover.coverNo }}</RouterLink>
        </li>
      </ul>
    </section>

    <section class="mb-8" aria-labelledby="cover-period">
      <h2 id="cover-period" class="mb-1 text-sm font-semibold text-ink">Open Cover period end</h2>
      <p class="mb-2 text-sm text-ink-muted">The period end stored on each active cover. Renewal, suspension, and cancellation are not stored statuses.</p>
      <p v-if="hidden.covers" class="text-sm text-ink-muted">Not available for this sign-in.</p>
      <p v-else-if="!loading && !covers.length" class="text-sm text-ink-muted">No active Open Cover.</p>
      <ul v-else class="text-sm">
        <li v-for="row in covers" :key="row.id" class="py-1">
          <RouterLink class="font-medium text-primary hover:underline" :to="`/marine/open-covers/${row.id}`">{{ row.coverNo }}</RouterLink>
          <span class="text-ink-muted"> · ends {{ formatDate(row.periodTo) }}</span>
        </li>
      </ul>
    </section>

    <section class="mb-8" aria-labelledby="pending-certificates">
      <h2 id="pending-certificates" class="mb-1 text-sm font-semibold text-ink">Certificates not yet issued</h2>
      <p class="mb-2 text-sm text-ink-muted">Certificates already created with status pending. Binding a shipment or declaration issues its certificate. There is no separate issuance clock.</p>
      <p v-if="hidden.certificates" class="text-sm text-ink-muted">Not available for this sign-in.</p>
      <p v-else-if="!loading && !pendingCertificates.length" class="text-sm text-ink-muted">None.</p>
      <ul v-else class="text-sm">
        <li v-for="row in pendingCertificates" :key="row.id" class="py-1">
          <RouterLink class="font-medium text-primary hover:underline" :to="`/marine/certificates/${row.id}`">{{ row.certNo || row.id }}</RouterLink>
        </li>
      </ul>
    </section>

    <p class="text-sm text-ink-muted">
      Proposal processing time, required documents, and outstanding premium are not deadline records. No payment provider is approved, so unpaid premium is not listed. Policy issuance is the bind action on the quotation.
    </p>
  </div>
</template>
