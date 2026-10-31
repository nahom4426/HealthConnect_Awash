<script setup>
// Quote detail (plan 5.3): status banners, summary, premium and change history.
import { computed, ref, watch } from "vue";
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
import DetailTabs from "../../components/DetailTabs.vue";
import UnderwritingPanel from "../../components/UnderwritingPanel.vue";
import { cardClass } from "../../components/styles";
import { useResource } from "../../composables/useResource";
import { useCan } from "../../composables/useCan";
import { bindQuote, getQuote, rateQuote, simulateDemoPayment } from "../../api/marineApi";
import { notifyError } from "../../api/marineClient";
import { useMarineConfig } from "../../composables/useMarineConfig";
import { DEMO_METHODS, demoMethodLabel, demoPaymentVisible } from "../../utils/demoPayment";
import { productLabel } from "../../constants";
import { formatDate, formatDateTime } from "../../utils/format";
import { formatMoney } from "../../utils/money";
import { coverItems, lcItems, partiesItems, shipmentItems } from "../../utils/quoteSummary";
import {
  bindingEligibility,
  customerAnswerSections,
  customerReference,
  declarationPremiumNote,
  filledItems,
  isDeclarationQuote,
  openCoverProfileItems,
  quotationIssued,
  ratingBlockers,
  submittedValue,
} from "../../utils/quotationView";
import { formatAnswerValue } from "@/features/pc/pcModule.js";

const route = useRoute();
const router = useRouter();
const { can } = useCan();
const marineConfig = useMarineConfig();
const demoMethod = ref("DEMO_TELEBIRR");
const simulating = ref(false);
const showDemoPayment = computed(() => demoPaymentVisible(marineConfig.value, q.value));
const rateNotice = ref("");
const autoRateAttempted = ref(false);
const customerRows = computed(() => customerReference(q.value));
const customerSections = computed(() => customerAnswerSections(q.value));
const openCoverRows = computed(() => openCoverProfileItems(q.value));
const partyRows = computed(() => partiesItems(q.value));
const shipmentRows = computed(() => shipmentItems(q.value));
const coverRows = computed(() => coverItems(q.value));
const lcRows = computed(() => lcItems(q.value));
const bindingNote = computed(() => bindingEligibility(q.value));
const issuedNote = computed(() => quotationIssued(q.value));
const declaration = computed(() => isDeclarationQuote(q.value));
const declarationNote = computed(() => declarationPremiumNote(q.value));
const paymentRequired = computed(() => marineConfig.value?.paymentRequired === true);
const premiumBlockers = computed(() => ratingBlockers(q.value));
const quotationStatus = computed(() => q.value?.quotationStage || q.value?.status || "");
const summaryItems = computed(() => {
  const quote = q.value;
  if (!quote) return [];
  return filledItems([
    { label: "Stage", value: String(quotationStatus.value || "").replaceAll("_", " ") },
    { label: "Arrangement", value: quote.arrangement === "OPEN_COVER" ? "Open Cover" : quote.arrangement === "SINGLE_SHIPMENT" ? "Single Shipment" : null },
    { label: "Insured", value: quote.insured?.name || quote.proposerName },
    { label: "Broker", value: quote.broker?.name },
    {
      label: quote.arrangement === "OPEN_COVER" ? "Est. annual value" : "Sum insured",
      value: quote.arrangement === "OPEN_COVER"
        ? (quote.estimatedAnnualValue != null ? formatMoney(quote.estimatedAnnualValue, quote.currency || "ETB") : null)
        : (quote.sumInsuredTotal ? formatMoney(quote.sumInsuredTotal, quote.currency || "ETB") : null),
    },
    {
      label: quote.arrangement === "OPEN_COVER" ? "Conveyances" : "Conveyance",
      value: quote.arrangement === "OPEN_COVER"
        ? formatAnswerValue(quote.conveyanceModes?.split?.(/[,\s]+/).filter(Boolean) || quote.conveyanceModes)
        : (quote.mode ? modeLabelSafe(quote.mode) : null),
    },
  ]);
});
const { data: q, loading, error, notFound, load, reload } = useResource(getQuote);

function modeLabelSafe(mode) {
  const labels = { SEA: "Sea", AIR: "Air", ROAD: "Road", SEA_ROAD: "Sea then road" };
  return labels[mode] || mode;
}

const editable = computed(() => ["DRAFT", "QUOTED"].includes(q.value?.status));
const canRate = computed(() => can("quote.create") && editable.value && q.value?.arrangement !== "OPEN_COVER");
const rateLabel = computed(() => {
  if (q.value?.premium) return "Re-rate";
  return declaration.value ? "Rate declaration" : "Rate";
});
const canBind = computed(
  () => q.value && !q.value.sanctionsConfirmed && ((q.value.status === "QUOTED" && !(q.value.referralReasons ?? []).length) || q.value.status === "APPROVED")
);
const isUnderwriter = computed(() => can("certificate.amend"));

const rating = ref(false);

watch(
  () => route.params.id,
  (id) => {
    autoRateAttempted.value = false;
    rateNotice.value = "";
    if (id) load(id);
  },
  { immediate: true }
);
const quoteTabs = [
  { key: "proposal", label: "Proposal and risk" },
  { key: "underwriting", label: "Underwriting" },
  { key: "premium", label: "Rating and premium" },
  { key: "terms", label: "Quotation terms" },
  { key: "acceptance", label: "Acceptance and payment" },
  { key: "activity", label: "Activity and audit" },
];

const tabAliases = {
  overview: "proposal",
  shipment: "proposal",
  parties: "proposal",
  coverage: "terms",
  payment: "acceptance",
  binding: "acceptance",
  history: "activity",
};

watch(() => route.query.tab, (tab) => {
  const next = tabAliases[tab];
  if (next) router.replace({ query: { ...route.query, tab: next } });
}, { immediate: true });

function openUnderwriting() {
  router.replace({ query: { ...route.query, tab: "underwriting" } });
}

function customerNote(answerKey, current) {
  const original = submittedValue(q.value, answerKey, current);
  return original ? `Customer submitted: ${original}` : "";
}

async function rerate() {
  if (!q.value || rating.value) return;
  rating.value = true;
  rateNotice.value = "";
  const hadPremium = Boolean(q.value.premium);
  const res = await rateQuote(q.value.id);
  rating.value = false;
  if (res.ok) {
    q.value = res.data;
    toasted(true, `${res.data.quoteNo} ${hadPremium ? "re-rated" : "rated"}`);
    if (res.data.status === "REFERRED") {
      router.replace({ query: { ...route.query, tab: "underwriting" } });
    } else if (!res.data.premium) {
      router.replace({ query: { ...route.query, tab: "premium" } });
    }
    return;
  }
  if (res.error?.code === "NO_RATE_TABLE") {
    rateNotice.value = "NO_RATE_TABLE. No active rate table applies, so no premium was calculated.";
    router.replace({ query: { ...route.query, tab: "premium" } });
    return;
  }
  if (res.error?.status === 422) {
    const fieldMsg = (res.error.fields || []).map((f) => f.message).filter(Boolean).join(" ");
    const msg = fieldMsg || res.error.message || "Some details are missing. Open Edit to complete the quotation.";
    rateNotice.value = msg;
    toasted(false, null, msg);
    router.replace({ query: { ...route.query, tab: "premium" } });
    return;
  }
  notifyError(res.error, { onStale: reload });
}

watch([() => q.value?.id, () => q.value?.status, () => q.value?.premium, canRate], () => {
  const quote = q.value;
  if (!quote || autoRateAttempted.value || rating.value) return;
  if (!isDeclarationQuote(quote) || quote.status !== "DRAFT" || quote.premium) return;
  if (!canRate.value) return;
  autoRateAttempted.value = true;
  rerate();
});

async function simulatePayment(outcome) {
  simulating.value = true;
  const res = await simulateDemoPayment(q.value.id, { method: demoMethod.value, outcome });
  simulating.value = false;
  if (!res.ok) return notifyError(res.error, { onStale: reload });
  q.value = { ...q.value, demoPayment: res.data };
  toasted(outcome === "SUCCESS", outcome === "SUCCESS" ? "Demo payment recorded" : "Demo payment failed");
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
  <div class="marine-page">
    <PageState v-if="loading && !q" kind="loading" />
    <template v-else-if="notFound">
      <MarinePageHeader title="Quote not found" :crumbs="[{ label: 'Marine' }, { label: 'Quotes', to: '/marine/quotes' }]" />
      <PageState kind="notFound"><RouterLink to="/marine/quotes"><Button variant="outline" size="sm">Back to quotes</Button></RouterLink></PageState>
    </template>
    <PageState v-else-if="error" kind="error" :message="error.message" :correlation-id="error.correlationId" @retry="load(route.params.id)" />

    <template v-else-if="q">
      <MarinePageHeader
        :title="q.quoteNo"
        :status="quotationStatus"
        entity="quote"
        :subtitle="`${q.arrangement === 'OPEN_COVER' ? 'Open Cover' : declaration ? `Declaration under ${q.openCover.coverNo}` : productLabel(q.product)}${q.validUntil ? ` · valid until ${formatDate(q.validUntil)}` : ''}`"
        :crumbs="[{ label: 'Marine' }, { label: 'Quotations', to: '/marine/quotes' }, { label: q.quoteNo }]"
      >
        <template #actions>
          <template v-if="can('quote.create') && editable">
            <Button variant="outline" @click="router.push(`/marine/quotes/${q.id}/edit`)">Edit</Button>
            <Button
              v-if="canRate"
              :variant="q.premium ? 'outline' : 'primary'"
              :pending="rating"
              @click="rerate"
            >{{ rateLabel }}</Button>
          </template>
          <Button v-if="q.arrangement === 'OPEN_COVER' && q.status !== 'BOUND' && isUnderwriter" @click="router.push(`/marine/quotes/${q.id}/bind-open-cover`)">Finalise Open Cover terms</Button>
          <span v-if="can('quote.bind') && q.status !== 'BOUND' && !q.sanctionsConfirmed" :title="canBind ? '' : q.status === 'REFERRED' ? 'Referral pending' : 'Get a quote first'">
            <Button variant="success" :disabled="!canBind" @click="bind">Bind</Button>
          </span>
          <RouterLink v-if="q.policy?.id" :to="`/marine/policies/${q.policy.id}`"><Button variant="outline">Open policy {{ q.policy.policyNo }}</Button></RouterLink>
          <RouterLink v-else-if="q.arrangement === 'OPEN_COVER' && q.openCover?.id" :to="`/marine/open-covers/${q.openCover.id}`"><Button variant="outline">Open cover {{ q.openCover.coverNo }}</Button></RouterLink>
        </template>
      </MarinePageHeader>

      <p v-if="declaration" role="status" class="p-4 mb-4 text-sm rounded-xl bg-surface-raised text-ink">
        Declaration under open cover <RouterLink class="font-medium text-primary hover:underline" :to="`/marine/open-covers/${q.openCover.id}`">{{ q.openCover.coverNo }}</RouterLink>.
        The cover's insured, clause, and rates apply. Underwriting stays on this declaration. A certificate is issued only when it is accepted and bound.
      </p>
      <p v-else-if="q.catalogProposalUuid" role="status" class="p-4 mb-4 text-sm rounded-xl bg-surface-raised text-ink">
        Opened from shipment proposal <strong>{{ q.proposerName || q.catalogProposalUuid }}</strong>.
        Underwriting, rating, premium payment and binding continue on this quotation.
        <RouterLink class="font-medium text-primary hover:underline" :to="`/marine/proposals/${q.catalogProposalUuid}`">View the proposal</RouterLink>
      </p>
      <div v-if="q.sanctionsConfirmed" role="alert" class="p-4 mb-4 text-sm font-semibold rounded-xl bg-error-soft text-error-strong">Sanctions match confirmed. This quote can't be bound.</div>
      <div v-else-if="q.underReview" role="status" class="p-4 mb-4 text-sm rounded-xl bg-warning-soft text-warning-strong">
        <p class="font-semibold">Under review by underwriting</p>
        <p class="text-ink">You can bind once an underwriter approves it.</p>
      </div>
      <div v-else-if="q.status === 'REFERRED'" role="status" class="flex flex-wrap gap-3 justify-between items-start p-4 mb-4 rounded-xl bg-warning-soft">
        <div>
          <p class="text-sm font-semibold text-warning-strong">Referred: finish underwriting on this quotation before binding</p>
          <p v-if="q.referral" class="mt-1 text-sm text-ink">Needs {{ q.referral.authorityNeeded === "SENIOR_UNDERWRITER" ? "a senior underwriter" : "an underwriter" }}</p>
          <p v-if="q.referral?.informationRequested" class="mt-1 text-sm text-ink">Additional information has been requested. The quotation stays referred.</p>
        </div>
        <Button v-if="q.referral?.status === 'OPEN'" size="sm" @click="openUnderwriting">Open underwriting</Button>
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

      <section :class="[cardClass, 'p-4 mb-4']">
        <h2 class="mb-3 text-sm font-semibold text-ink">Quotation summary</h2>
        <KeyValueGrid v-if="summaryItems.length" :items="summaryItems" :cols="4" />
        <p class="mt-3 text-sm text-ink-muted">
          This quotation is the operational record. Proposal answers below are the customer's submission.
          Underwriting changes stay in the Underwriting tab.
          <template v-if="q.catalogProposalUuid">
            <RouterLink class="font-medium text-primary hover:underline" :to="`/marine/proposals/${q.catalogProposalUuid}`">Open linked proposal</RouterLink>
          </template>
        </p>
      </section>

      <DetailTabs :tabs="quoteTabs">
        <template #proposal>
          <div class="grid gap-4 lg:grid-cols-2">
            <section
              v-for="section in customerSections"
              :key="section.id"
              :class="[cardClass, 'p-4', section.id === 'trading' || section.id === 'parties' || section.id === 'arrangement' ? 'lg:col-span-1' : '']"
            >
              <h2 class="mb-3 text-sm font-semibold text-ink">{{ section.title }}</h2>
              <KeyValueGrid :items="section.items" :cols="2" />
            </section>

            <section v-if="!customerSections.length" :class="[cardClass, 'p-4 lg:col-span-2']">
              <h2 class="mb-2 text-sm font-semibold text-ink">Submitted proposal</h2>
              <KeyValueGrid v-if="customerRows.length" :items="customerRows" :cols="3" />
              <p v-else class="text-sm text-ink-muted">No proposal answers are stored on this quotation.</p>
            </section>

            <section
              v-if="q.arrangement === 'OPEN_COVER' && openCoverRows.length && !customerSections.some((s) => s.id === 'trading')"
              :class="[cardClass, 'p-4']"
            >
              <h2 class="mb-1 text-sm font-semibold text-ink">Open Cover on the quotation</h2>
              <p class="mb-3 text-xs text-ink-muted">Values lifted onto the quotation record. Trading routes are the customer's request, not an approved territory limit.</p>
              <KeyValueGrid :items="openCoverRows" :cols="2" />
            </section>

            <section v-else-if="q.arrangement !== 'OPEN_COVER' && shipmentRows.length" :class="[cardClass, 'p-4']">
              <h2 class="mb-3 text-sm font-semibold text-ink">Shipment on the quotation</h2>
              <KeyValueGrid :items="shipmentRows" :cols="2" />
              <p v-if="customerNote('goodsDescription', q.goodsDescription)" class="mt-2 text-xs text-ink-muted">{{ customerNote('goodsDescription', q.goodsDescription) }}</p>
              <p v-if="customerNote('portOfLoading', q.portOfLoading)" class="mt-1 text-xs text-ink-muted">{{ customerNote('portOfLoading', q.portOfLoading) }}</p>
              <p v-if="customerNote('portOfDischarge', q.portOfDischarge)" class="mt-1 text-xs text-ink-muted">{{ customerNote('portOfDischarge', q.portOfDischarge) }}</p>
            </section>

            <section v-if="partyRows.length && !customerSections.some((s) => s.id === 'parties')" :class="[cardClass, 'p-4']">
              <h2 class="mb-3 text-sm font-semibold text-ink">Parties on the quotation</h2>
              <KeyValueGrid :items="partyRows" :cols="2" />
              <p v-if="customerNote('incoterm', q.incoterm)" class="mt-2 text-xs text-ink-muted">{{ customerNote('incoterm', q.incoterm) }}</p>
            </section>
          </div>
        </template>
        <template #premium>
          <section :class="[cardClass, 'p-4']" aria-labelledby="qd-premium">
            <h2 id="qd-premium" class="mb-3 text-sm font-semibold text-ink">Rating and premium</h2>
            <p v-if="rateNotice" role="alert" class="p-3 mb-3 text-sm font-semibold rounded-lg bg-warning-soft text-warning-strong">{{ rateNotice }}</p>
            <p v-if="declarationNote" class="mb-3 text-sm text-ink">{{ declarationNote }}</p>
            <div v-if="canRate && !q.premium && q.arrangement !== 'OPEN_COVER'" class="mb-3">
              <Button :pending="rating" @click="rerate">{{ rateLabel }}</Button>
            </div>
            <template v-if="q.premium">
              <p class="mb-3 text-sm text-ink-muted">
                Currency <strong class="text-ink">{{ q.currency || "ETB" }}</strong>
                <template v-if="q.ratedAt"> · rated {{ formatDateTime(q.ratedAt) }}</template>
              </p>
              <p class="mb-3 text-sm text-ink-muted">Sum insured <MoneyDisplay :amount="q.premium.sumInsured.total" :currency="q.currency" :etb-amount="q.premium.sumInsuredEtb" class="font-semibold text-ink" /></p>
              <PremiumBreakdown :premium="q.premium" :fx="q.fx" />
              <p class="mt-3 text-sm text-ink-muted">An approval that changes the rate or waives a warranty reprices this same quotation.</p>
            </template>
            <div v-else-if="premiumBlockers.length" class="grid gap-2 text-sm text-ink">
              <p class="font-semibold">Premium was not calculated.</p>
              <ul class="grid gap-1"><li v-for="blocker in premiumBlockers" :key="blocker">{{ blocker }}</li></ul>
            </div>
            <p v-else-if="q.arrangement === 'OPEN_COVER'" class="text-sm text-ink">
              Rate is not connected here on purpose. An Open Cover has no voyage (ports, commodity HS code or invoice), so the single-shipment tariff cannot price it. Use <strong>Finalise Open Cover terms</strong> to record approved limits, territories and agreed rates. Each declaration under the active cover is rated separately. Deposit or provisional premium stays off until that business arrangement is approved.
            </p>
            <p v-else class="text-sm text-ink-muted">Not rated yet.{{ declaration ? " Declarations use the open cover agreed rate when the commodity is listed." : "" }}</p>
          </section>
        </template>
        <template #underwriting>
          <section :class="[cardClass, 'p-4']">
            <h2 class="mb-1 text-sm font-semibold text-ink">Underwriting</h2>
            <p class="mb-3 text-xs text-ink-muted">Rules are configured under Marine Settings. This section is the review of this quotation. There is no separate underwriting queue.</p>
            <p v-if="rateNotice" role="alert" class="p-3 mb-3 text-sm font-semibold rounded-lg bg-warning-soft text-warning-strong">{{ rateNotice }}</p>
            <p v-if="q.declineNote" class="mb-3 text-sm text-ink">{{ q.declineNote }}</p>
            <UnderwritingPanel
              :quote="q"
              :can-decide="isUnderwriter && q.status === 'REFERRED'"
              :can-rate="canRate"
              :rating="rating"
              @rate="rerate"
              @changed="reload"
            />
          </section>
        </template>
        <template #terms>
          <div class="grid gap-4 lg:grid-cols-2">
            <section :class="[cardClass, 'p-4 grid gap-3']">
              <h2 class="text-sm font-semibold text-ink">Coverage</h2>
              <KeyValueGrid v-if="coverRows.length" :items="coverRows" :cols="2" />
              <p v-else class="text-sm text-ink-muted">No clause or cover options are set on this quotation yet.</p>
              <p class="text-sm text-ink">Validity <strong>{{ q.validUntil ? formatDate(q.validUntil) : "Not set until the quotation is rated" }}</strong>.</p>
              <p class="text-sm text-ink">Payment requirement <strong>{{ paymentRequired ? "A confirmed collection is required before binding" : "Collection is not required. No payment provider is approved." }}</strong></p>
              <p class="text-sm text-ink-muted">Exclusions follow the selected Institute Cargo Clause and any special conditions recorded here.</p>
            </section>
            <section v-if="q.lc?.enabled" :class="[cardClass, 'p-4']">
              <h2 class="mb-3 text-sm font-semibold text-ink">Letter of credit</h2>
              <KeyValueGrid :items="lcRows" :cols="2" />
            </section>
          </div>
        </template>
        <template #acceptance>
          <section :class="[cardClass, 'p-4 grid gap-3']">
            <h2 class="text-sm font-semibold text-ink">Acceptance and payment</h2>
            <p class="text-sm text-ink">{{ issuedNote }}</p>
            <p class="text-sm text-ink-muted">Payment status is separate from underwriting. A payment does not accept the risk, and an approval does not confirm collection.</p>
            <p class="text-sm text-ink">{{ bindingNote }}</p>
            <p v-if="q.policy?.policyNo" class="text-sm text-ink">Policy {{ q.policy.policyNo }} was issued from this quotation.</p>
            <section v-if="showDemoPayment" class="grid gap-3" aria-labelledby="qd-demo-payment">
              <p id="qd-demo-payment" role="status" class="p-3 text-sm font-semibold rounded-lg bg-warning-soft text-warning-strong">DEMO MODE — No real money will be collected.</p>
              <p class="text-sm text-ink">Premium <strong>{{ formatMoney(q.premium.total, q.premium.currency || "ETB") }}</strong></p>
              <p class="text-sm text-ink">Payment status <strong>{{ q.demoPayment?.status || "Not simulated" }}</strong></p>
              <label class="grid gap-1 text-sm text-ink">
                Demo payment method
                <select v-model="demoMethod" class="px-2 py-1 border rounded-md border-line bg-surface">
                  <option v-for="method in DEMO_METHODS" :key="method.value" :value="method.value">{{ method.label }}</option>
                </select>
              </label>
              <div class="flex flex-wrap gap-2">
                <Button size="sm" :pending="simulating" @click="simulatePayment('SUCCESS')">Simulate successful payment</Button>
                <Button size="sm" variant="outline" :pending="simulating" @click="simulatePayment('FAILURE')">Simulate failed payment</Button>
              </div>
              <dl v-if="q.demoPayment" class="grid gap-1 text-sm text-ink">
                <div><dt class="inline text-ink-muted">Payment reference</dt> <dd class="inline font-medium">{{ q.demoPayment.reference }}</dd></div>
                <div><dt class="inline text-ink-muted">Method</dt> <dd class="inline">{{ demoMethodLabel(q.demoPayment.method) }}</dd></div>
                <div><dt class="inline text-ink-muted">Detail</dt> <dd class="inline">{{ q.demoPayment.detail }}</dd></div>
                <div><dt class="inline text-ink-muted">Timestamp</dt> <dd class="inline">{{ formatDateTime(q.demoPayment.simulatedAt) }}</dd></div>
                <div><dt class="inline text-ink-muted">Recorded by</dt> <dd class="inline">{{ q.demoPayment.simulatedBy }}</dd></div>
              </dl>
              <p class="text-sm text-ink-muted">DEMO_PAID is not a collected premium. A typed reference is not a payment.</p>
            </section>
            <template v-else>
              <p v-if="!q.payment" class="text-sm text-ink-muted">No collection provider is approved, so this screen cannot mark the premium paid.</p>
              <p v-else class="text-sm text-ink">{{ q.payment.financeRef }} · {{ q.payment.status }} · {{ formatMoney(q.payment.amount, q.payment.currency) }}</p>
              <p v-if="q.payment?.status === 'PENDING'" class="text-sm text-ink-muted">Started, not confirmed. A pending payment does not allow bind while collection is required.</p>
            </template>
          </section>
        </template>
        <template #activity>
          <section :class="[cardClass, 'p-4 grid gap-3']">
            <h2 class="text-sm font-semibold text-ink">Activity and audit</h2>
            <p class="text-sm text-ink-muted">Proposal submission, rating, underwriting decisions, payment and binding are recorded on this quotation. Invoice {{ q.invoiceNo || "—" }} · Bill of lading or airway bill {{ q.blNo || "—" }}. There is no separate document library.</p>
            <AuditTimeline entity="quote" :entity-id="q.id" />
          </section>
        </template>
      </DetailTabs>
    </template>
  </div>
</template>
