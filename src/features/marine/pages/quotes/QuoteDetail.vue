<script setup>
// Quote detail (plan 5.3): status banners, summary, premium and change history.
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import MarinePageHeader from "../../components/MarinePageHeader.vue";
import PageState from "../../components/PageState.vue";
import KeyValueGrid from "../../components/KeyValueGrid.vue";
import PremiumBreakdown from "../../components/PremiumBreakdown.vue";
import MoneyDisplay from "../../components/MoneyDisplay.vue";
import AuditTimeline from "../../components/AuditTimeline.vue";
import ChecksPanel from "../../components/ChecksPanel.vue";
import DetailTabs from "../../components/DetailTabs.vue";
import { cardClass } from "../../components/styles";
import { useResource } from "../../composables/useResource";
import { useCan } from "../../composables/useCan";
import { bindQuote, getQuote, rateQuote } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { productLabel } from "../../constants";
import { formatDate } from "../../utils/format";
import { formatMoney } from "../../utils/money";
import { coverItems, lcItems, partiesItems, shipmentItems } from "../../utils/quoteSummary";

const route = useRoute();
const router = useRouter();
const { can } = useCan();
const { data: q, loading, error, notFound, load, reload } = useResource(getQuote);
onMounted(() => load(route.params.id));

const editable = computed(() => ["DRAFT", "QUOTED"].includes(q.value?.status));
const canBind = computed(
  () => q.value && !q.value.sanctionsConfirmed && ((q.value.status === "QUOTED" && !(q.value.referralReasons ?? []).length) || q.value.status === "APPROVED")
);
const isUnderwriter = computed(() => can("certificate.amend"));

function reviewScreening(s) {
  openModal("MarineSanctionsReview", { screening: s }, (done) => done && reload());
}
const rating = ref(false);

async function rerate() {
  rating.value = true;
  const res = await rateQuote(q.value.id);
  rating.value = false;
  if (res.ok) {
    q.value = res.data;
    toasted(true, `${res.data.quoteNo} re-rated`);
  } else if (res.error.status === 422) {
    toasted(false, "Some details are missing. Open Edit to complete the quote.");
  } else notifyError(res.error, { onStale: reload });
}

function bind() {
  openModal(
    "MarineConfirm",
    {
      title: `Bind ${q.value.quoteNo}?`,
      message: "Binding creates the policy and issues the certificate.",
      confirmLabel: "Bind",
      details: [
        { label: "Sum insured", value: formatMoney(q.value.premium.sumInsured.total, q.value.currency) },
        { label: "Premium", value: formatMoney(q.value.premium.total, "ETB") },
      ],
    },
    async (r) => {
      if (!r?.confirmed) return;
      const res = await bindQuote(q.value.id);
      if (!res.ok) return notifyError(res.error, { onStale: reload });
      toasted(true, `Policy ${res.data.policy.policyNo} created, certificate ${res.data.certificate.certNo} issued`);
      router.push(`/marine/policies/${res.data.policy.id}`);
    }
  );
}
</script>

<template>
  <div class="p-4 md:p-6">
    <PageState v-if="loading && !q" kind="loading" />
    <template v-else-if="notFound">
      <MarinePageHeader title="Quote not found" :crumbs="[{ label: 'Marine' }, { label: 'Quotes', to: '/marine/quotes' }]" />
      <PageState kind="notFound"><RouterLink to="/marine/quotes"><Button variant="outline" size="sm">Back to quotes</Button></RouterLink></PageState>
    </template>
    <PageState v-else-if="error" kind="error" :message="error.message" :correlation-id="error.correlationId" @retry="load(route.params.id)" />

    <template v-else-if="q">
      <MarinePageHeader
        :title="q.quoteNo"
        :status="q.status"
        entity="quote"
        :subtitle="`${productLabel(q.product)}${q.validUntil ? ` · valid until ${formatDate(q.validUntil)}` : ''}`"
        :crumbs="[{ label: 'Marine' }, { label: 'Quotes', to: '/marine/quotes' }, { label: q.quoteNo }]"
      >
        <template #actions>
          <template v-if="can('quote.create') && editable">
            <Button variant="outline" @click="router.push(`/marine/quotes/${q.id}/edit`)">Edit</Button>
            <Button variant="outline" :pending="rating" @click="rerate">Re-rate</Button>
          </template>
          <span v-if="can('quote.bind') && q.status !== 'BOUND' && !q.sanctionsConfirmed" :title="canBind ? '' : q.status === 'REFERRED' ? 'Referral pending' : 'Get a quote first'">
            <Button variant="success" :disabled="!canBind" @click="bind">Bind</Button>
          </span>
          <RouterLink v-if="q.policy?.id" :to="`/marine/policies/${q.policy.id}`"><Button variant="outline">Open policy {{ q.policy.policyNo }}</Button></RouterLink>
        </template>
      </MarinePageHeader>

      <div v-if="q.sanctionsConfirmed" role="alert" class="p-4 mb-4 text-sm font-semibold rounded-xl bg-error-soft text-error-strong">Sanctions match confirmed. This quote can't be bound.</div>
      <div v-else-if="q.underReview" role="status" class="p-4 mb-4 text-sm rounded-xl bg-warning-soft text-warning-strong">
        <p class="font-semibold">Under review by underwriting</p>
        <p class="text-ink">You can bind once an underwriter approves it.</p>
      </div>
      <div v-else-if="q.status === 'REFERRED'" role="status" class="flex flex-wrap gap-3 justify-between items-start p-4 mb-4 rounded-xl bg-warning-soft">
        <div>
          <p class="text-sm font-semibold text-warning-strong">Referred: an underwriter must approve before binding</p>
          <p class="mt-1 text-sm text-ink">Assigned to {{ q.referral?.assigneeName ?? "nobody yet" }}<span v-if="q.referral"> · needs {{ q.referral.authorityNeeded === "SENIOR_UNDERWRITER" ? "a senior underwriter" : "an underwriter" }}</span></p>
        </div>
        <RouterLink v-if="isUnderwriter && q.referral?.status === 'OPEN'" :to="`/marine/underwriting/${q.referral.id}`"><Button size="sm">Review referral</Button></RouterLink>
      </div>
      <div v-else-if="q.status === 'APPROVED'" role="status" class="p-4 mb-4 text-sm rounded-xl bg-success-soft text-success-strong">
        <p class="font-semibold">Approved by underwriting</p>
        <p v-if="q.decisionNote" class="text-ink">{{ q.decisionNote }}</p>
      </div>
      <div v-else-if="q.status === 'DECLINED'" role="status" class="p-4 mb-4 text-sm rounded-xl bg-error-soft text-error-strong">
        <p class="font-semibold">Declined</p>
        <p>{{ q.declineNote || "Outside appetite." }}</p>
      </div>
      <div v-else-if="q.status === 'EXPIRED'" role="status" class="flex flex-wrap gap-3 justify-between items-center p-4 mb-4 text-sm rounded-xl bg-surface-raised text-ink">
        <span>This quote expired on {{ formatDate(q.validUntil) }}.</span>
        <RouterLink v-if="can('quote.create')" to="/marine/quotes/new" class="font-medium text-primary hover:underline">Create a new quote</RouterLink>
      </div>

      <DetailTabs :tabs="[{ key: 'details', label: 'Details' }, { key: 'audit', label: 'Audit' }]">
        <template #details>
          <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_26rem] items-start">
            <div class="grid gap-4">
              <section :class="[cardClass, 'p-4']"><h2 class="mb-3 text-sm font-semibold text-ink">Parties</h2><KeyValueGrid :items="partiesItems(q)" /></section>
              <section :class="[cardClass, 'p-4']"><h2 class="mb-3 text-sm font-semibold text-ink">Shipment</h2><KeyValueGrid :items="shipmentItems(q)" /></section>
              <section :class="[cardClass, 'p-4']"><h2 class="mb-3 text-sm font-semibold text-ink">Cover</h2><KeyValueGrid :items="coverItems(q)" /></section>
              <section v-if="q.lc?.enabled" :class="[cardClass, 'p-4']"><h2 class="mb-3 text-sm font-semibold text-ink">Letter of credit</h2><KeyValueGrid :items="lcItems(q)" /></section>
            </div>
            <section :class="[cardClass, 'p-4']" aria-labelledby="qd-premium">
              <h2 id="qd-premium" class="mb-3 text-sm font-semibold text-ink">Premium</h2>
              <template v-if="q.premium">
                <p class="mb-3 text-sm text-ink-muted">Sum insured <MoneyDisplay :amount="q.premium.sumInsured.total" :currency="q.currency" :etb-amount="q.premium.sumInsuredEtb" class="font-semibold text-ink" /></p>
                <PremiumBreakdown :premium="q.premium" :fx="q.fx" />
              </template>
              <p v-else class="text-sm text-ink-muted">Not rated yet.</p>
              <div v-if="q.checks || q.referralReasons?.length" class="pt-4 mt-4 border-t border-line">
                <h3 class="mb-3 text-sm font-semibold text-ink">Checks</h3>
                <ChecksPanel :checks="q.checks" :reasons="q.referralReasons" :reviewable="isUnderwriter && q.status === 'REFERRED'" @review="reviewScreening" />
              </div>
            </section>
          </div>
        </template>
        <template #audit>
          <section :class="[cardClass, 'p-4']"><AuditTimeline entity="quote" :entity-id="q.id" /></section>
        </template>
      </DetailTabs>
    </template>
  </div>
</template>
