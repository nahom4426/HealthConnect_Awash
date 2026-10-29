<script setup>
// Amount with currency. The amount is a decimal string with 2 places and thousands separators
// while not being edited; JavaScript numbers are never used for it.
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

// Shown formatted ("120,000.00") until the user types; then their raw text until they leave the
// field. Focusing alone doesn't change the text, so typing never races a re-render.
const editing = ref(false);
const display = computed(() => (editing.value || props.amount === "" || props.amount === null ? props.amount ?? "" : formatAmount(props.amount)));

function onInput(e) {
  editing.value = true;
  // Digits and one dot only; at most 2 decimals
  let v = e.target.value.replace(/[^\d.]/g, "");
  const [i, ...rest] = v.split(".");
  v = rest.length ? `${i}.${rest.join("").slice(0, 2)}` : i;
  e.target.value = v;
  emit("update:amount", v);
}
function onBlur(e) {
  editing.value = false;
  // Read the element, not props.amount: a fast Tab can blur before the parent re-renders the new value
  const typed = e.target.value.replace(/,/g, "");
  if (typed !== "") emit("update:amount", normalizeAmount(typed));
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
      @input="onInput"
      @blur="onBlur"
    />
  </div>
</template>
