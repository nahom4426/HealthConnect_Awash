<script setup>
// Premium lines as the backend computed them: base, factors, loadings, war, strikes, minimum
// premium adjustment, VAT, stamp duty and total, each with its rate and amount (ETB).
import { formatAmount } from "../utils/money";
import { formatDate } from "../utils/format";

defineProps({
  premium: { type: Object, required: true },
  fx: { type: Object, default: null },
});
</script>

<template>
  <div>
    <table class="w-full text-sm">
      <caption class="sr-only">Premium breakdown in ETB</caption>
      <thead>
        <tr class="text-xs font-semibold tracking-wide text-left uppercase text-ink-subtle">
          <th scope="col" class="py-2 pr-3">Line</th>
          <th scope="col" class="py-2 pr-3 text-right">Rate</th>
          <th scope="col" class="py-2 text-right">ETB</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="l in premium.lines" :key="l.key" class="border-t border-line">
          <td class="py-2 pr-3 text-ink">{{ l.label }}</td>
          <td class="py-2 pr-3 text-right whitespace-nowrap text-ink-muted">{{ l.rate }}</td>
          <td :class="['py-2 text-right tabular-nums', Number(l.amount) === 0 ? 'text-ink-subtle' : 'text-ink']">{{ formatAmount(l.amount) }}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr class="border-t-2 border-line-strong">
          <th scope="row" colspan="2" class="py-2.5 text-left font-semibold text-ink">Total premium</th>
          <td class="py-2.5 text-base font-semibold text-right tabular-nums text-ink">ETB {{ formatAmount(premium.total) }}</td>
        </tr>
      </tfoot>
    </table>
    <dl class="grid gap-x-6 gap-y-1 mt-3 text-xs sm:grid-cols-2 text-ink-muted">
      <div><dt class="inline">Rate table:</dt> <dd class="inline font-medium text-ink">{{ premium.rateTableVersion }}</dd></div>
      <div v-if="fx && fx.currency !== 'ETB'">
        <dt class="inline">FX:</dt>
        <dd class="inline font-medium text-ink">1 {{ fx.currency }} = ETB {{ formatAmount(fx.rate, 4) }} ({{ formatDate(fx.date) }})</dd>
        <span v-if="fx.fallback" class="ml-1.5 px-1.5 py-0.5 rounded-full font-semibold bg-warning-soft text-warning-strong">Previous day's rate used</span>
      </div>
    </dl>
  </div>
</template>
