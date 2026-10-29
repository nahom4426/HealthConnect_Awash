<script setup>
// Sticky card beside the wizard: invoice + freight, the uplift, the total in the shipment currency
// and an ETB estimate at today's rate (MAR-23, MAR-24). The premium itself is the backend's.
import { computed } from "vue";
import { formatMoney, sumInsured, toEtb } from "../../utils/money";
import { cardClass } from "../styles";

const props = defineProps({
  invoice: { type: [String, Number], default: "" },
  freight: { type: [String, Number], default: "" },
  currency: { type: String, default: "USD" },
  upliftPct: { type: String, default: "10" },
  /** today's { rate } for the currency, or null */
  fx: { type: Object, default: null },
});

const si = computed(() => sumInsured(props.invoice || "0", props.freight || "0", props.upliftPct));
const etb = computed(() => (props.currency === "ETB" ? si.value.total : props.fx?.rate ? toEtb(si.value.total, props.fx.rate) : null));
</script>

<template>
  <aside :class="[cardClass, 'p-4']" aria-labelledby="si-title">
    <h2 id="si-title" class="text-sm font-semibold text-ink">Sum insured</h2>
    <dl class="mt-3 space-y-1.5 text-sm">
      <div class="flex justify-between gap-3"><dt class="text-ink-muted">Invoice + freight</dt><dd class="tabular-nums text-ink">{{ formatMoney(si.base, currency) }}</dd></div>
      <div class="flex justify-between gap-3"><dt class="text-ink-muted">Uplift {{ upliftPct }}%</dt><dd class="tabular-nums text-ink">{{ formatMoney(si.uplift, currency) }}</dd></div>
      <div class="flex gap-3 justify-between px-3 py-2.5 mt-3 rounded-xl bg-sky-50 dark:bg-sky-900/30"><dt class="font-semibold text-sky-900 dark:text-sky-100">Total</dt><dd class="text-base font-bold tabular-nums text-sky-900 dark:text-sky-100">{{ formatMoney(si.total, currency) }}</dd></div>
    </dl>
    <div v-if="currency !== 'ETB'" class="p-3 mt-3 rounded-xl bg-surface-muted">
      <p class="text-xs text-ink-muted">ETB estimate</p>
      <p class="text-sm font-semibold tabular-nums text-ink">{{ etb ? formatMoney(etb, "ETB") : "No rate for today" }}</p>
      <p class="mt-1 text-xs text-ink-subtle">Estimate; the rate is fixed when you get a quote.</p>
    </div>
  </aside>
</template>
