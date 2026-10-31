<script setup>
// Underwriting on the quotation. The referral is the review of this quote, not another transaction.
import { computed, ref, watch } from "vue";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import ChecksPanel from "./ChecksPanel.vue";
import { getReferral } from "../api/marineApi";
import { ROLE_LABELS } from "../constants";
import { formatDateTime } from "../utils/format";
import { isDeclarationQuote } from "../utils/quotationView";

const props = defineProps({
  quote: { type: Object, required: true },
  canDecide: { type: Boolean, default: false },
  /** Shown for draft shipments/declarations that still need a first rating. */
  canRate: { type: Boolean, default: false },
  rating: { type: Boolean, default: false },
});
const emit = defineEmits(["changed", "rate"]);

const referral = ref(null);
const loadError = ref("");

const screenings = computed(() => props.quote.checks?.screenings ?? []);
const potential = computed(() => screenings.value.some((s) => s.result === "POTENTIAL"));
const unavailable = computed(() => screenings.value.some((s) => s.result === "UNAVAILABLE"));
const confirmed = computed(() => screenings.value.some((s) => s.result === "CONFIRMED"));
const aboveAuthority = computed(() => {
  const authority = referral.value?.authority;
  if (!authority) return true;
  return Number(referral.value.sumInsuredEtb) > Number(authority.maxSumInsured)
    || (referral.value.authorityNeeded === "SENIOR_UNDERWRITER" && authority.role !== "SENIOR_UNDERWRITER");
});
const open = computed(() => referral.value?.status === "OPEN");
const declaration = computed(() => isDeclarationQuote(props.quote));
const needsFirstRate = computed(
  () => props.quote.status === "DRAFT" && props.quote.arrangement !== "OPEN_COVER" && !props.quote.premium
);

watch(() => props.quote.referral?.id, load, { immediate: true });

async function load(id) {
  referral.value = null;
  loadError.value = "";
  if (!id) return;
  const res = await getReferral(id);
  if (res.ok) referral.value = res.data;
  else loadError.value = res.error?.message || "The underwriting review could not be loaded.";
}

function review(screening) {
  openModal("MarineSanctionsReview", { screening }, (done) => done && emit("changed"));
}

function decide(initial) {
  openModal(
    "MarineReferralDecision",
    { referral: referral.value, escalate: initial === "APPROVE" && aboveAuthority.value, initial },
    (done) => done && emit("changed")
  );
}
</script>

<template>
  <div class="grid gap-4">
    <p v-if="quote.underReview" class="text-sm text-ink">This quotation is with underwriting. The review details are visible to an underwriter.</p>
    <template v-else-if="!quote.referral">
      <p class="text-sm text-ink">
        <template v-if="quote.status === 'QUOTED' || quote.status === 'BOUND'">No manual referral. Automatic rules left this quotation clear to continue, subject to payment and binding checks.</template>
        <template v-else-if="quote.arrangement === 'OPEN_COVER' && quote.status === 'DRAFT'">
          Open Cover is not rated with the single-shipment tariff. An underwriter reviews the trading profile here, then finalises the Open Cover terms (limits, territories and agreed rates). Shipment premiums are rated later on each declaration. Deposit or provisional premium is not applied until that arrangement is approved.
        </template>
        <template v-else-if="declaration && quote.status === 'DRAFT'">
          This declaration is not rated yet. Use <strong>Rate declaration</strong> to apply the open cover's agreed rate, run the underwriting rules, and unlock bind. A certificate is issued only after bind.
        </template>
        <template v-else-if="quote.status === 'DRAFT'">Use <strong>Rate</strong> to run the underwriting rules and calculate premium. Binding stays blocked until this quotation is rated.</template>
        <template v-else>No open underwriting review on this quotation.</template>
      </p>
      <div v-if="canRate && needsFirstRate" class="flex flex-wrap gap-2 items-center">
        <Button :pending="rating" @click="emit('rate')">{{ declaration ? "Rate declaration" : "Rate" }}</Button>
      </div>
    </template>
    <template v-else>
      <dl class="grid gap-2 text-sm sm:grid-cols-2">
        <div><dt class="text-ink-muted">Review status</dt><dd class="font-medium text-ink">{{ referral?.status || quote.referral.status }}</dd></div>
        <div><dt class="text-ink-muted">Authority</dt><dd class="font-medium text-ink">{{ ROLE_LABELS[quote.referral.authorityNeeded] || quote.referral.authorityNeeded }}</dd></div>
        <div v-if="quote.referral.informationRequested"><dt class="text-ink-muted">Additional information</dt><dd class="font-medium text-warning-strong">Requested. The quotation stays referred.</dd></div>
      </dl>
      <p v-if="quote.referral.note" class="text-sm text-ink">{{ quote.referral.note }}</p>
      <p v-if="loadError" class="text-sm text-error">{{ loadError }}</p>
      <ChecksPanel v-if="quote.checks || quote.referralReasons?.length" :checks="quote.checks" :reasons="quote.referralReasons" :reviewable="canDecide && open" @review="review" />
      <ol v-if="referral?.history?.length" class="grid gap-1 text-xs text-ink-muted">
        <li v-for="(entry, index) in referral.history" :key="index">{{ formatDateTime(entry.at) }} · {{ entry.action }} by {{ entry.by }}<span v-if="entry.note">: {{ entry.note }}</span></li>
      </ol>
      <div v-if="canDecide && open" class="flex flex-wrap gap-2 items-center">
        <Button variant="outline" size="sm" @click="decide('INFO')">Request information</Button>
        <Button variant="destructive" size="sm" @click="decide('DECLINE')">Decline</Button>
        <span v-if="!confirmed" :title="unavailable ? 'Sanctions screening is unavailable' : potential ? 'Resolve sanctions matches first' : ''">
          <Button variant="success" size="sm" :disabled="potential || unavailable" @click="decide('APPROVE')">{{ aboveAuthority ? "Send to senior underwriter" : "Approve" }}</Button>
        </span>
        <p v-if="unavailable" class="text-sm text-warning-strong">Sanctions screening is unavailable. This is not a clear result, so approval stays blocked.</p>
      </div>
      <p v-else-if="open" class="text-sm text-ink-muted">Decision actions are limited to an underwriter or senior underwriter.</p>
    </template>
  </div>
</template>
