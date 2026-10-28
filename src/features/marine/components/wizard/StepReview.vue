<script setup>
// Wizard step 4: review, price and bind (plan 5.2). The parent owns the actions; this shows the
// summary blocks with Edit links and the rating result.
import KeyValueGrid from "../KeyValueGrid.vue";
import PremiumBreakdown from "../PremiumBreakdown.vue";
import StatusBadge from "../StatusBadge.vue";
import MoneyDisplay from "../MoneyDisplay.vue";
import ChecksPanel from "../ChecksPanel.vue";
import { cardClass } from "../styles";
import { clauseLabel, modeLabel, productLabel } from "../../constants";
import { formatDate } from "../../utils/format";
import { formatMoney } from "../../utils/money";

defineProps({
  draft: { type: Object, required: true },
  quote: { type: Object, default: null },
  stale: { type: Boolean, default: false },
});
const emit = defineEmits(["edit"]);

const yesNo = (v) => (v ? "Yes" : "No");
const port = (p) => (p ? `${p.code} · ${p.name}` : null);
</script>

<template>
  <div class="grid gap-4">
    <section v-for="block in [
      { title: 'Parties', step: 0, items: [
        { label: 'Product', value: productLabel(draft.product) },
        { label: 'Insured', value: draft.insured?.name },
        { label: 'Insured is the', value: draft.insuredRole ? draft.insuredRole.charAt(0) + draft.insuredRole.slice(1).toLowerCase() : null },
        { label: 'Consignee', value: draft.consignee?.name },
        { label: 'Broker', value: draft.broker?.name },
        { label: 'Incoterm', value: draft.incoterm },
      ] },
      { title: 'Shipment', step: 1, items: [
        { label: 'Mode', value: modeLabel(draft.mode) },
        { label: 'Vessel', value: draft.vessel ? `${draft.vessel.name} (IMO ${draft.vessel.imo}, ${draft.vessel.age} years)` : null },
        { label: 'Voyage', value: [port(draft.loadingPort), ...draft.transshipments.map(port), port(draft.dischargePort)].filter(Boolean).join(' → ') },
        { label: 'Final destination', value: draft.finalDestination },
        { label: 'Sailing date', value: draft.sailingDate ? formatDate(draft.sailingDate) : null },
        { label: 'Commodity', value: draft.commodity ? `${draft.commodity.hsCode} · ${draft.commodity.description}` : null },
        { label: 'Goods', value: draft.goodsDescription, wide: true },
        { label: 'Invoice value', value: formatMoney(draft.invoiceValue, draft.currency) },
        { label: 'Freight', value: formatMoney(draft.freight, draft.currency) },
        { label: 'Invoice / BL no', value: [draft.invoiceNo, draft.blNo].filter(Boolean).join(' / ') },
        { label: 'Containers', value: draft.containers.join(', ') },
      ] },
      { title: 'Cover', step: 2, items: [
        { label: 'Clause', value: clauseLabel(draft.clause) },
        { label: 'War', value: yesNo(draft.warCover) },
        { label: 'Strikes', value: yesNo(draft.strikesCover) },
        { label: 'Deductible', value: draft.deductible ? formatMoney(draft.deductible, draft.currency) : null },
        { label: 'Special conditions', value: draft.specialConditions, wide: true },
      ] },
      ...(draft.lc.enabled ? [{ title: 'Letter of credit', step: 2, items: [
        { label: 'LC number', value: draft.lc.number },
        { label: 'Issuing bank (loss payee)', value: draft.lc.bank?.name },
        { label: 'LC amount', value: formatMoney(draft.lc.amount, draft.currency) },
        { label: 'LC expiry', value: draft.lc.expiry ? formatDate(draft.lc.expiry) : null },
      ] }] : []),
    ]" :key="block.title" :class="[cardClass, 'p-4']">
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-sm font-semibold text-ink">{{ block.title }}</h3>
        <button type="button" class="text-sm font-medium text-primary hover:underline" @click="emit('edit', block.step)">Edit</button>
      </div>
      <KeyValueGrid :items="block.items" />
    </section>

    <section v-if="quote?.premium || quote?.status === 'DECLINED'" :class="[cardClass, 'p-4', stale ? 'opacity-50' : '']" aria-live="polite">
      <div class="flex flex-wrap gap-3 justify-between items-center mb-3">
        <div class="flex gap-2 items-center">
          <h3 class="text-sm font-semibold text-ink">Quote {{ quote.quoteNo }}</h3>
          <StatusBadge entity="quote" :status="quote.status" />
        </div>
        <p v-if="quote.validUntil" class="text-xs text-ink-muted">Valid until <span class="font-medium text-ink">{{ formatDate(quote.validUntil) }}</span></p>
      </div>
      <p v-if="quote.status === 'DECLINED'" class="p-3 mb-3 text-sm rounded-xl bg-error-soft text-error-strong">{{ quote.declineNote || "Outside appetite." }}</p>
      <p v-if="quote.sanctionsConfirmed" role="alert" class="p-3 mb-3 text-sm font-semibold rounded-xl bg-error-soft text-error-strong">Sanctions match confirmed. This quote can't be bound.</p>
      <p v-else-if="quote.underReview" class="p-3 mb-3 text-sm font-semibold rounded-xl bg-warning-soft text-warning-strong">Under review by underwriting. You can bind once an underwriter approves it.</p>
      <p v-else-if="quote.status === 'REFERRED'" class="p-3 mb-3 text-sm font-semibold rounded-xl bg-warning-soft text-warning-strong">An underwriter must approve before binding.</p>
      <div v-if="quote.late" class="p-3 mb-3 text-sm font-semibold rounded-xl bg-warning-soft text-warning-strong">Late declaration: the sailing date is past the cover's declaration days.</div>
      <div v-if="quote.limits" class="grid grid-cols-2 gap-2 p-3 mb-3 text-sm rounded-xl sm:grid-cols-4 bg-surface-muted">
        <div><p class="text-xs text-ink-subtle">Remaining before</p><p class="tabular-nums text-ink">{{ formatMoney(quote.limits.remainingBefore, quote.limits.currency) }}</p></div>
        <div><p class="text-xs text-ink-subtle">This declaration</p><p class="tabular-nums text-ink">{{ formatMoney(quote.limits.thisDeclaration, quote.limits.currency) }}</p></div>
        <div><p class="text-xs text-ink-subtle">Remaining after</p><p :class="['tabular-nums font-semibold', Number(quote.limits.remainingAfter) < 0 ? 'text-error-strong' : 'text-ink']">{{ formatMoney(quote.limits.remainingAfter, quote.limits.currency) }}</p></div>
        <div><p class="text-xs text-ink-subtle">Per-conveyance limit</p><p class="tabular-nums text-ink">{{ formatMoney(quote.limits.perConveyanceLimit, quote.limits.currency) }}</p></div>
      </div>
      <div v-if="quote.checks || quote.referralReasons?.length" class="p-3 mb-3 rounded-xl border border-line">
        <ChecksPanel :checks="quote.checks" :reasons="quote.referralReasons" />
      </div>
      <div v-if="quote.premium" class="grid gap-4 2xl:grid-cols-[1fr_auto]">
        <PremiumBreakdown :premium="quote.premium" :fx="quote.fx" />
        <div class="p-3 text-sm rounded-xl bg-surface-muted 2xl:w-56 2xl:order-none order-first">
          <p class="text-xs text-ink-muted">Sum insured</p>
          <MoneyDisplay :amount="quote.premium.sumInsured.total" :currency="draft.currency" :etb-amount="quote.premium.sumInsuredEtb" stacked class="font-semibold text-ink" />
        </div>
      </div>
    </section>
  </div>
</template>
