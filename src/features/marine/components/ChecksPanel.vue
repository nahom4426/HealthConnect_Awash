<script setup>
// Underwriting results for a quote (plan section 3, FE-21): the accumulation bar for this vessel and
// voyage, sanctions results per subject, warranty results, inland exposure, and referral reasons.
import { computed } from "vue";
import StatusBadge from "./StatusBadge.vue";
import { formatAmount } from "../utils/money";
import { formatDateTime } from "../utils/format";
import { reasonLabel } from "../constants";

const props = defineProps({
  checks: { type: Object, default: null },
  reasons: { type: Array, default: () => [] },
  /** Shows a Review button on Potential matches */
  reviewable: { type: Boolean, default: false },
});
defineEmits(["review"]);

const acc = computed(() => props.checks?.accumulation ?? null);
const n = (v) => Number(v ?? 0);
// Scale the bar so the hard limit sits at 80% and an overflowing total still fits
const scale = computed(() => (acc.value ? Math.max(n(acc.value.hardLimit) / 0.8, n(acc.value.total)) : 1));
const pc = (v) => `${Math.min(100, (n(v) / scale.value) * 100)}%`;
const overLimit = (v, limit) => n(v) > n(limit);
</script>

<template>
  <div class="grid gap-4 text-sm">
    <section v-if="reasons.length" aria-labelledby="ck-reasons">
      <h3 id="ck-reasons" class="mb-1.5 text-xs font-semibold tracking-wide uppercase text-ink-subtle">Referral reasons</h3>
      <ul class="space-y-1.5">
        <li v-for="(r, i) in reasons" :key="i" class="flex gap-2 items-start">
          <span class="shrink-0 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-warning-soft text-warning-strong">{{ reasonLabel(r.code) }}</span>
          <span class="text-ink">{{ r.message }}</span>
        </li>
      </ul>
    </section>

    <section v-if="acc" aria-labelledby="ck-acc">
      <h3 id="ck-acc" class="mb-1.5 text-xs font-semibold tracking-wide uppercase text-ink-subtle">Accumulation, this vessel and sailing date</h3>
      <div class="relative h-4 rounded-full bg-surface-raised" role="img" :aria-label="`Already insured ETB ${formatAmount(acc.current)}, this quote ETB ${formatAmount(acc.thisQuote)}, soft limit ETB ${formatAmount(acc.softLimit)}, hard limit ETB ${formatAmount(acc.hardLimit)}`">
        <div class="absolute inset-y-0 left-0 rounded-l-full bg-ink-subtle/60" :style="{ width: pc(acc.current) }"></div>
        <div
          :class="['absolute inset-y-0', acc.level === 'HARD' ? 'bg-error' : acc.level === 'SOFT' ? 'bg-warning' : 'bg-primary']"
          :style="{ left: pc(acc.current), width: `calc(${pc(acc.total)} - ${pc(acc.current)})` }"
        ></div>
        <span class="absolute -top-1 -bottom-1 w-0.5 bg-warning-strong" :style="{ left: pc(acc.softLimit) }" aria-hidden="true"></span>
        <span class="absolute -top-1 -bottom-1 w-0.5 bg-error-strong" :style="{ left: pc(acc.hardLimit) }" aria-hidden="true"></span>
      </div>
      <dl class="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2 text-xs sm:grid-cols-4">
        <div><dt class="text-ink-subtle">Already insured</dt><dd class="tabular-nums text-ink">ETB {{ formatAmount(acc.current) }}</dd></div>
        <div><dt class="text-ink-subtle">This quote</dt><dd class="tabular-nums text-ink">ETB {{ formatAmount(acc.thisQuote) }}</dd></div>
        <div><dt class="text-warning-strong">Soft limit</dt><dd class="tabular-nums text-ink">ETB {{ formatAmount(acc.softLimit) }}</dd></div>
        <div><dt class="text-error-strong">Hard limit</dt><dd class="tabular-nums text-ink">ETB {{ formatAmount(acc.hardLimit) }}</dd></div>
      </dl>
    </section>

    <section v-if="checks?.inland" aria-labelledby="ck-inland">
      <h3 id="ck-inland" class="mb-1.5 text-xs font-semibold tracking-wide uppercase text-ink-subtle">Inland exposure today</h3>
      <ul class="space-y-1 text-xs">
        <li :class="overLimit(checks.inland.vehicle, checks.inland.vehicleLimit) ? 'text-error-strong font-semibold' : 'text-ink'">
          Per vehicle: ETB {{ formatAmount(checks.inland.vehicle) }} of ETB {{ formatAmount(checks.inland.vehicleLimit) }}
        </li>
        <li v-if="checks.inland.convoy !== null" :class="overLimit(checks.inland.convoy, checks.inland.convoyLimit) ? 'text-error-strong font-semibold' : 'text-ink'">
          Per convoy: ETB {{ formatAmount(checks.inland.convoy) }} of ETB {{ formatAmount(checks.inland.convoyLimit) }}
        </li>
      </ul>
    </section>

    <section v-if="checks?.screenings?.length" aria-labelledby="ck-sanctions">
      <h3 id="ck-sanctions" class="mb-1.5 text-xs font-semibold tracking-wide uppercase text-ink-subtle">Sanctions screening</h3>
      <ul class="divide-y divide-line">
        <li v-for="s in checks.screenings" :key="s.id" class="flex flex-wrap gap-2 justify-between items-center py-1.5">
          <div class="min-w-0">
            <p class="text-ink"><span class="text-ink-subtle">{{ s.type }}:</span> {{ s.name }}</p>
            <p v-if="s.matches?.length && s.result !== 'CLEAR'" class="text-xs text-ink-muted">{{ s.matches.length }} possible {{ s.matches.length === 1 ? "match" : "matches" }} · top {{ s.matches[0].score }}% on {{ s.matches[0].list }}</p>
            <p v-if="s.reviewedAt" class="text-xs text-ink-subtle">Reviewed by {{ s.reviewedBy }}, {{ formatDateTime(s.reviewedAt) }}</p>
          </div>
          <div class="flex gap-2 items-center">
            <StatusBadge entity="screening" :status="s.result" />
            <button v-if="reviewable && s.result === 'POTENTIAL'" type="button" class="text-xs font-semibold text-primary hover:underline" @click="$emit('review', s)">Review</button>
          </div>
        </li>
      </ul>
    </section>

    <section v-if="checks?.warranties?.length" aria-labelledby="ck-warranties">
      <h3 id="ck-warranties" class="mb-1.5 text-xs font-semibold tracking-wide uppercase text-ink-subtle">Warranties</h3>
      <ul class="space-y-1">
        <li v-for="w in checks.warranties" :key="w.id" class="flex gap-2 justify-between items-center">
          <span class="text-ink">{{ w.name }} <span class="text-xs text-ink-subtle">· {{ w.detail }}{{ w.result === "BREACH" ? (w.action === "LOAD" ? ` · loads ${w.loadPct}%` : " · refers") : "" }}</span></span>
          <StatusBadge entity="warranty" :status="w.result" />
        </li>
      </ul>
    </section>
  </div>
</template>
