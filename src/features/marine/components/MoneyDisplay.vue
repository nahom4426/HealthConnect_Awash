<script setup>
// "USD 120,000.00", with the ETB equivalent beside foreign amounts in muted text.
import { computed } from "vue";
import { formatMoney, toEtb } from "../utils/money";

const props = defineProps({
  amount: { type: [String, Number], default: null },
  currency: { type: String, default: "ETB" },
  /** ETB per unit of `currency`; when given, the ETB equivalent is shown */
  etbRate: { type: [String, Number], default: null },
  /** or the ETB amount itself */
  etbAmount: { type: [String, Number], default: null },
  stacked: { type: Boolean, default: false },
});

const etb = computed(() => {
  if (props.currency === "ETB") return null;
  if (props.etbAmount !== null && props.etbAmount !== undefined) return props.etbAmount;
  if (props.etbRate && props.amount !== null && props.amount !== undefined) return toEtb(props.amount, props.etbRate);
  return null;
});
</script>

<template>
  <span :class="['tabular-nums', stacked ? 'inline-flex flex-col' : 'whitespace-nowrap']">
    <span>{{ formatMoney(amount, currency) }}</span>
    <span v-if="etb" :class="['text-xs text-ink-subtle', stacked ? '' : 'ml-1.5']">≈ {{ formatMoney(etb, "ETB") }}</span>
  </span>
</template>
