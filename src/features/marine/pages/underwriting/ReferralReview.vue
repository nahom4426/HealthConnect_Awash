<script setup>
// Referral review (plan 6.3): the quote read-only on the left, ChecksPanel on the right, and the
// decision bar. Approve waits for every Potential sanctions match to be reviewed; a Confirmed match
// leaves only Decline. Above the user's authority, Approve becomes "Send to senior underwriter".
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import KeyValueGrid from "../../components/KeyValueGrid.vue";
import PremiumBreakdown from "../../components/PremiumBreakdown.vue";
import ChecksPanel from "../../components/ChecksPanel.vue";
import { cardClass } from "../../components/styles";
import { useResource } from "../../composables/useResource";
import { assignReferral, getReferral } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { ROLE_LABELS } from "../../constants";
import { formatDateTime } from "../../utils/format";
import { formatAmount } from "../../utils/money";
import { coverItems, lcItems, partiesItems, shipmentItems } from "../../utils/quoteSummary";

const route = useRoute();
const router = useRouter();
const { data: r, loading, error, notFound, load, reload } = useResource(getReferral);
onMounted(() => load(route.params.id));

const screenings = computed(() => r.value?.quote.checks?.screenings ?? []);
const potential = computed(() => screenings.value.some((s) => s.result === "POTENTIAL"));
const confirmed = computed(() => screenings.value.some((s) => s.result === "CONFIRMED"));
const aboveAuthority = computed(() => {
  const a = r.value?.authority;
  if (!a) return true;
  return Number(r.value.sumInsuredEtb) > Number(a.maxSumInsured) || (r.value.authorityNeeded === "SENIOR_UNDERWRITER" && a.role !== "SENIOR_UNDERWRITER");
});

function review(s) {
  openModal("MarineSanctionsReview", { screening: s }, (done) => done && reload());
}
function decide(initial) {
  openModal("MarineReferralDecision", { referral: r.value, escalate: initial === "APPROVE" && aboveAuthority.value, initial }, (done) => {
    if (done) router.push("/marine/underwriting");
  });
}
async function assign() {
  const res = await assignReferral(r.value.id);
  if (res.ok) {
    toasted(true, "Assigned to you");
    reload();
  } else notifyError(res.error, { onStale: reload });
}
</script>

<template>
  <div class="marine-page">
    <PageState v-if="loading && !r" kind="loading" />
    <PageState v-else-if="notFound" kind="notFound"><RouterLink to="/marine/underwriting"><Button variant="outline" size="sm">Back to the queue</Button></RouterLink></PageState>
    <PageState v-else-if="error" kind="error" :message="error.message" @retry="load(route.params.id)" />
    <template v-else-if="r">
      <MarinePageHeader
        :title="`Referral for ${r.quoteNo}`"
        :status="r.status"
        entity="referral"
        :subtitle="`Raised ${formatDateTime(r.raisedAt)} · needs ${ROLE_LABELS[r.authorityNeeded]} · sum insured ETB ${formatAmount(r.sumInsuredEtb)}`"
        :crumbs="[{ label: 'Marine' }, { label: 'Underwriting', to: '/marine/underwriting' }, { label: r.quoteNo }]"
      >
        <template #badge>
          <RouterLink :to="`/marine/quotes/${r.quoteId}`" class="text-sm font-medium text-primary hover:underline">Open quote</RouterLink>
        </template>
        <template #actions>
          <span class="text-sm text-ink-muted">Assigned to <strong class="text-ink">{{ r.assigneeName ?? "nobody" }}</strong></span>
          <Button v-if="r.status === 'OPEN' && !r.assigneeName" variant="outline" size="sm" @click="assign">Assign to me</Button>
        </template>
      </MarinePageHeader>

      <div v-if="confirmed" role="alert" class="p-3 mb-4 text-sm font-semibold rounded-xl bg-error-soft text-error-strong">Sanctions match confirmed. This quote can't be bound.</div>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_28rem] items-start">
        <div class="grid gap-4">
          <section :class="[cardClass, 'p-4']"><h2 class="mb-3 text-sm font-semibold text-ink">Parties</h2><KeyValueGrid :items="partiesItems(r.quote)" /></section>
          <section :class="[cardClass, 'p-4']"><h2 class="mb-3 text-sm font-semibold text-ink">Shipment</h2><KeyValueGrid :items="shipmentItems(r.quote)" /></section>
          <section :class="[cardClass, 'p-4']"><h2 class="mb-3 text-sm font-semibold text-ink">Cover</h2><KeyValueGrid :items="coverItems(r.quote)" /></section>
          <section v-if="r.quote.lc?.enabled" :class="[cardClass, 'p-4']"><h2 class="mb-3 text-sm font-semibold text-ink">Letter of credit</h2><KeyValueGrid :items="lcItems(r.quote)" /></section>
          <section v-if="r.quote.premium" :class="[cardClass, 'p-4']"><h2 class="mb-3 text-sm font-semibold text-ink">Premium</h2><PremiumBreakdown :premium="r.quote.premium" :fx="r.quote.fx" /></section>
        </div>
        <section :class="[cardClass, 'p-4 xl:sticky xl:top-4']" aria-labelledby="rr-checks">
          <h2 id="rr-checks" class="mb-3 text-sm font-semibold text-ink">Checks</h2>
          <ChecksPanel :checks="r.quote.checks" :reasons="r.reasons" :reviewable="r.status === 'OPEN'" @review="review" />
          <ol v-if="r.history?.length" class="pt-3 mt-4 space-y-1 text-xs border-t border-line text-ink-muted">
            <li v-for="(h, i) in r.history" :key="i">{{ formatDateTime(h.at) }} · {{ h.action }} by {{ h.by }}<span v-if="h.note">: {{ h.note }}</span></li>
          </ol>
        </section>
      </div>

      <div v-if="r.status === 'OPEN'" class="flex sticky bottom-0 flex-wrap gap-2 justify-end items-center p-3 mt-5 rounded-2xl border shadow-pop bg-surface border-line">
        <span v-if="potential" class="mr-auto text-sm text-warning-strong">Resolve sanctions matches first.</span>
        <span v-else-if="aboveAuthority && !confirmed" class="mr-auto text-sm text-ink-muted">Above your authority: approving sends it to a senior underwriter.</span>
        <Button variant="destructive" @click="decide('DECLINE')">Decline</Button>
        <span v-if="!confirmed" :title="potential ? 'Resolve sanctions matches first' : ''">
          <Button variant="success" :disabled="potential" @click="decide('APPROVE')">{{ aboveAuthority ? "Send to senior underwriter" : "Approve" }}</Button>
        </span>
      </div>
      <p v-else class="mt-5 text-sm text-ink-muted">Decided {{ r.decidedAt ? formatDateTime(r.decidedAt) : "" }}{{ r.decidedBy ? ` by ${r.decidedBy}` : "" }}{{ r.note ? `: ${r.note}` : "" }}</p>
    </template>
  </div>
</template>
