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
import {
  bindOpenCoverQuote,
  bindQuote,
  cancelPremiumPayment,
  confirmPremiumPayment,
  getQuote,
  rateOpenCoverQuote,
  rateQuote,
  rejectPremiumPayment,
  simulateDemoPayment,
  startPremiumPayment,
} from "../../api/marineApi";
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

// ── premium collection ──
// Starting a collection records what is owed; only finance confirms that it arrived. The two are
// separate rights, so the buttons are gated separately rather than on one "can pay" flag.
const canCollect = computed(() => can("premium.collect"));
const canConfirmPremium = computed(() => can("premium.confirm"));
const bankRef = ref("");
const collecting = ref(false);
const confirmingReceipt = ref(false);
const pricingDeposit = ref(false);
const openCover = computed(() => q.value?.arrangement === "OPEN_COVER");
const payment = computed(() => q.value?.payment ?? null);
const premiumPaid = computed(() => payment.value?.status === "CONFIRMED" && payment.value?.matchesPremium !== false);
/** What is owed before the policy is issued: the shipment premium, or an Open Cover's deposit. */
const premiumDue = computed(() => q.value?.premiumTotal ?? q.value?.premium?.total ?? null);
const premiumDueLabel = computed(() =>
  premiumDue.value == null ? "Not priced yet" : formatMoney(premiumDue.value, q.value?.currency || q.value?.premium?.currency || "ETB")
);
/** An Open Cover's deposit has to be priced before it can be collected or the cover issued. */
const depositPriced = computed(() => openCover.value && premiumDue.value != null);
const canRateDeposit = computed(
  () => openCover.value && can("quote.create") && !["BOUND", "DECLINED"].includes(q.value?.status)
);
/**
 * Why the Open Cover cannot be issued yet, or "" when it can. Cover is not on risk until the
 * deposit is in, so a nil deposit is the only case that needs no collection.
 */
const openCoverBlocker = computed(() => {
  if (!openCover.value) return "";
  if (!depositPriced.value) return "Price the deposit premium first";
  if (!paymentRequired.value) return "";
  if (Number(premiumDue.value) <= 0) return "";
  if (!payment.value) return "Start the premium collection first";
  if (!premiumPaid.value) return "Finance has not confirmed the deposit premium arrived";
  return "";
});
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

const finalising = ref(false);

/**
 * Issues the Open Cover policy from the terms answered on the proposal. The body is deliberately
 * empty: the backend reads the approved limits, declaration days, agreed commodity rates and
 * provisional premium from the proposal this quotation was opened from, so there is no second
 * terms form to fill in.
 */
async function finaliseOpenCover() {
  finalising.value = true;
  // No body: axios turns an explicit null into a form-urlencoded POST, which Spring refuses with
  // 415. Omitting it sends no body at all, which is what @RequestBody(required = false) expects.
  const res = await bindOpenCoverQuote(q.value.id);
  finalising.value = false;
  if (!res.ok) return notifyError(res.error, { onStale: reload });
  const coverNo = res.data?.openCover?.coverNo ?? res.data?.coverNo ?? "";
  toasted(true, coverNo ? `Open Cover ${coverNo} created successfully` : "Open Cover created successfully");
  reload();
}

/**
 * Prices an Open Cover quotation at the deposit premium agreed on its proposal. An Open Cover is
 * not rated voyage by voyage, so this is its equivalent of "Rate": it fixes the amount due at
 * inception, which finance then collects before the cover is signed.
 */
async function priceDeposit() {
  pricingDeposit.value = true;
  const res = await rateOpenCoverQuote(q.value.id);
  pricingDeposit.value = false;
  if (!res.ok) return notifyError(res.error, { onStale: reload });
  toasted(true, "Deposit premium priced");
  reload();
}

async function startCollection() {
  collecting.value = true;
  const res = await startPremiumPayment(q.value.id, { idempotencyKey: `prem-${q.value.id}-${Date.now()}` });
  collecting.value = false;
  if (!res.ok) return notifyError(res.error, { onStale: reload });
  toasted(true, `Premium collection started · ${res.data.financeRef}`);
  reload();
}

async function cancelCollection() {
  collecting.value = true;
  const res = await cancelPremiumPayment(q.value.id, payment.value.id);
  collecting.value = false;
  if (!res.ok) return notifyError(res.error, { onStale: reload });
  toasted(true, "Premium collection cancelled");
  reload();
}

/** Finance records that the premium arrived, against the bank credit or receipt reference. */
async function confirmReceipt() {
  confirmingReceipt.value = true;
  const res = await confirmPremiumPayment(q.value.id, payment.value.id, { bankRef: bankRef.value });
  confirmingReceipt.value = false;
  if (!res.ok) return notifyError(res.error, { onStale: reload });
  bankRef.value = "";
  toasted(true, "Premium receipt confirmed");
  reload();
}

async function rejectReceipt() {
  confirmingReceipt.value = true;
  const res = await rejectPremiumPayment(q.value.id, payment.value.id);
  confirmingReceipt.value = false;
  if (!res.ok) return notifyError(res.error, { onStale: reload });
  toasted(true, "Premium recorded as not received");
  reload();
}

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
          <Button v-if="openCover && q.status !== 'BOUND' && canRateDeposit && !depositPriced" :pending="pricingDeposit" @click="priceDeposit">Price deposit premium</Button>
          <span v-if="openCover && q.status !== 'BOUND' && isUnderwriter" :title="openCoverBlocker">
            <Button :disabled="!!openCoverBlocker" :pending="finalising" @click="finaliseOpenCover">Finalise Open Cover terms</Button>
          </span>
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
            <section v-if="q.openCoverPricing" class="p-3 mb-3 rounded-lg border border-line">
              <h3 class="text-sm font-semibold text-ink">Estimated annual premium</h3>
              <p class="mt-1 text-2xl font-semibold tabular-nums text-ink">
                {{ q.openCoverPricing.estimatedAnnualPremium }}
                <span class="text-sm font-normal text-ink-muted">at {{ q.openCoverPricing.ratePct }}%</span>
              </p>
              <p class="mt-1 text-sm text-ink-muted">
                Estimated annual value {{ q.openCoverPricing.estimatedAnnualValue }} priced at the highest
                agreed rate among the commodities below. Each declaration is rated on its own insured
                value, so this is the expected earning of the cover, not a charge.
              </p>
              <table class="mt-3 w-full text-sm">
                <thead><tr class="text-xs font-semibold text-left uppercase text-ink-subtle"><th class="py-1">Commodity</th><th class="py-1">Class</th><th class="py-1 text-right">Rate %</th><th class="py-1 text-right">At that rate</th></tr></thead>
                <tbody>
                  <tr v-for="row in q.openCoverPricing.rows" :key="row.hsCode" class="border-t border-line">
                    <td class="py-1 text-ink">{{ row.description }}</td>
                    <td class="py-1 text-ink-subtle">{{ row.commodityClass }}</td>
                    <td class="py-1 text-right tabular-nums">{{ row.ratePct }}</td>
                    <td class="py-1 text-right tabular-nums">{{ row.premium }}</td>
                  </tr>
                </tbody>
              </table>
            </section>

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
              <section class="grid gap-3" aria-labelledby="qd-premium-collection">
                <h3 id="qd-premium-collection" class="text-sm font-semibold text-ink">Premium collection</h3>
                <p class="text-sm text-ink">
                  {{ openCover ? "Deposit premium due at inception" : "Premium due" }}
                  <strong>{{ premiumDueLabel }}</strong>
                </p>
                <p v-if="openCover" class="text-sm text-ink-muted">
                  An Open Cover is collected in two parts: this deposit, due before the cover is signed, and the rated
                  premium of each declaration made under it afterwards. A cover agreed on a pure declaration basis has a
                  deposit of nil and nothing is due now.
                </p>

                <!-- Open Cover: the deposit has to be priced before it can be collected -->
                <div v-if="openCover && !depositPriced && canRateDeposit" class="flex flex-wrap gap-2 items-center">
                  <Button size="sm" :pending="pricingDeposit" @click="priceDeposit">Price deposit premium</Button>
                  <span class="text-sm text-ink-muted">Reads the provisional premium agreed on the proposal.</span>
                </div>

                <p v-if="!payment" class="text-sm text-ink-muted">No premium collection has been started on this quotation.</p>
                <dl v-else class="grid gap-1 text-sm text-ink">
                  <div><dt class="inline text-ink-muted">Finance reference</dt> <dd class="inline font-medium">{{ payment.financeRef }}</dd></div>
                  <div><dt class="inline text-ink-muted">Status</dt> <dd class="inline font-medium">{{ payment.status }}</dd></div>
                  <div><dt class="inline text-ink-muted">Amount</dt> <dd class="inline">{{ formatMoney(payment.amount, payment.currency) }}</dd></div>
                  <div v-if="payment.providerRef"><dt class="inline text-ink-muted">Bank reference</dt> <dd class="inline">{{ payment.providerRef }}</dd></div>
                  <div v-if="payment.confirmedAt"><dt class="inline text-ink-muted">Confirmed</dt> <dd class="inline">{{ formatDateTime(payment.confirmedAt) }}</dd></div>
                  <div v-if="payment.failureReason"><dt class="inline text-ink-muted">Not collected</dt> <dd class="inline">{{ payment.failureReason }}</dd></div>
                </dl>

                <p v-if="payment?.status === 'PENDING'" class="text-sm text-ink-muted">
                  Started, not confirmed. A quotation is not bound on a started collection: finance confirms the money
                  arrived before the policy is issued.
                </p>
                <p v-else-if="payment && !payment.matchesPremium" class="p-3 text-sm font-semibold rounded-lg bg-warning-soft text-warning-strong">
                  This collection is for a different amount than the premium now on the quotation. Start a new one.
                </p>

                <!-- front office: start or cancel a collection -->
                <div v-if="canCollect" class="flex flex-wrap gap-2">
                  <Button
                    v-if="!payment || payment.status !== 'PENDING'"
                    size="sm"
                    :disabled="premiumDue == null || q.status === 'BOUND' || premiumPaid"
                    :pending="collecting"
                    @click="startCollection"
                  >
                    Start premium collection
                  </Button>
                  <Button v-if="payment?.status === 'PENDING'" size="sm" variant="outline" :pending="collecting" @click="cancelCollection">
                    Cancel collection
                  </Button>
                </div>

                <!-- finance: confirm the money arrived -->
                <section v-if="canConfirmPremium && payment?.status === 'PENDING'" class="grid gap-2 p-3 rounded-xl border border-line bg-surface-muted">
                  <p class="text-sm font-semibold text-ink">Finance: confirm receipt</p>
                  <p class="text-sm text-ink-muted">
                    Confirm only once the funds appear on the bank statement. The reference is recorded on the policy, so a
                    confirmed premium can always be traced back to a statement line.
                  </p>
                  <label class="grid gap-1 text-sm text-ink">
                    Bank credit or receipt reference
                    <input
                      v-model="bankRef"
                      class="px-2 py-1 rounded-md border border-line bg-surface"
                      placeholder="e.g. CBE/FT24103100123"
                    />
                  </label>
                  <div class="flex flex-wrap gap-2">
                    <Button size="sm" variant="success" :disabled="bankRef.trim().length < 4" :pending="confirmingReceipt" @click="confirmReceipt">
                      Confirm premium received
                    </Button>
                    <Button size="sm" variant="outline" :pending="confirmingReceipt" @click="rejectReceipt">Not received</Button>
                  </div>
                </section>
                <p v-else-if="payment?.status === 'PENDING'" class="text-sm text-ink-muted">
                  Waiting on the finance team to confirm the premium arrived.
                </p>
              </section>
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
