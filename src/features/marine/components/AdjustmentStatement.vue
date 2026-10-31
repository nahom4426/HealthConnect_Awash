<script setup>
// Year-end adjustment statement of an open cover (plan 7.5, MAR-04).
import { formatMoney } from "../utils/money";

defineProps({ statement: { type: Object, required: true } });
</script>

<template>
  <dl class="grid grid-cols-2 gap-y-2 text-sm">
    <dt class="text-ink-muted">Declarations</dt><dd class="text-right tabular-nums text-ink">{{ statement.declarationCount }}</dd>
    <dt class="text-ink-muted">Total declared sum insured</dt><dd class="text-right tabular-nums text-ink">{{ formatMoney(statement.totalSumInsured, statement.currency) }}</dd>
    <dt class="text-ink-muted">Earned premium</dt><dd class="text-right tabular-nums text-ink">{{ formatMoney(statement.earnedPremium, "ETB") }}</dd>
    <dt class="text-ink-muted">Provisional premium</dt><dd class="text-right tabular-nums text-ink">{{ formatMoney(statement.provisionalPremium, "ETB") }}</dd>
    <dt class="pt-2 font-semibold border-t text-ink border-line">{{ statement.direction === "DUE_FROM_INSURED" ? "Due from insured" : "Refund to insured" }}</dt>
    <dd :class="['pt-2 text-base font-semibold text-right tabular-nums border-t border-line', statement.direction === 'DUE_FROM_INSURED' ? 'text-warning-strong' : 'text-success-strong']">{{ formatMoney(statement.difference, "ETB") }}</dd>
  </dl>
</template>
