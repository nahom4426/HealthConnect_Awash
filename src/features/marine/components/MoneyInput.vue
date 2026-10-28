<script setup>
// Amount with currency. The amount is a decimal string with 2 places and thousands separators
// while not focused; JavaScript numbers are never used for it.
import { computed, ref } from "vue";
import { CURRENCIES } from "../constants";
import { formatAmount, normalizeAmount } from "../utils/money";
import { inputClass, inputBorder } from "./styles";

const props = defineProps({
  amount: { type: [String, Number], default: "" },
  currency: { type: String, default: "USD" },
  lockCurrency: { type: Boolean, default: false },
  currencies: { type: Array, default: () => CURRENCIES },
  id: { type: String, default: "" },
  invalid: { type: Boolean, default: false },
  describedby: { type: String, default: undefined },
  placeholder: { type: String, default: "0.00" },
});
const emit = defineEmits(["update:amount", "update:currency", "blur"]);

const focused = ref(false);
const display = computed(() => (focused.value || props.amount === "" || props.amount === null ? props.amount ?? "" : formatAmount(props.amount)));

function onInput(e) {
  // Digits and one dot only; at most 2 decimals
  let v = e.target.value.replace(/[^\d.]/g, "");
  const [i, ...rest] = v.split(".");
  v = rest.length ? `${i}.${rest.join("").slice(0, 2)}` : i;
  e.target.value = v;
  emit("update:amount", v);
}
function onBlur() {
  focused.value = false;
  if (props.amount !== "" && props.amount !== null) emit("update:amount", normalizeAmount(props.amount));
  emit("blur");
}
</script>

<template>
  <div :class="['flex rounded-lg', invalid ? 'ring-1 ring-error' : '']">
    <select
      :value="currency"
      :disabled="lockCurrency"
      aria-label="Currency"
      :class="[inputClass, inputBorder(invalid), '!w-24 rounded-r-none border-r-0 font-medium']"
      @change="emit('update:currency', $event.target.value)"
    >
      <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
    </select>
    <input
      :id="id"
      :value="display"
      inputmode="decimal"
      :placeholder="placeholder"
      :aria-invalid="invalid || undefined"
      :aria-describedby="describedby"
      :class="[inputClass, inputBorder(invalid), 'rounded-l-none text-right tabular-nums']"
      @focus="focused = true"
      @input="onInput"
      @blur="onBlur"
    />
  </div>
</template>
