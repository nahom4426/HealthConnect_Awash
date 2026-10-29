<script setup>
// Search approved customers (the insured on a quote or open cover). Someone new is registered on the
// Customers page in a new tab, since a customer needs approval before it can be insured.
import Autocomplete from "./Autocomplete.vue";
import { listCustomers } from "../api/marineApi";

defineProps({
  modelValue: { type: Object, default: null },
  id: { type: String, default: "" },
  invalid: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  describedby: { type: String, default: undefined },
  canRegister: { type: Boolean, default: true },
});
const emit = defineEmits(["update:modelValue", "blur"]);

async function search(q) {
  const res = await listCustomers({ status: "APPROVED", q, size: 10 });
  return res.ok ? res.data.content : [];
}

function register(close) {
  close();
  window.open("/marine/customers/new", "_blank", "noopener");
}
</script>

<template>
  <Autocomplete
    :model-value="modelValue"
    :search="search"
    item-key="id"
    :item-label="(p) => p.name"
    :item-sub="(p) => [p.customerNo, p.tin && `TIN ${p.tin}`, p.phone].filter(Boolean).join(' · ')"
    placeholder="Search approved customers by name, TIN or customer no"
    :id="id"
    :invalid="invalid"
    :disabled="disabled"
    :describedby="describedby"
    @update:model-value="emit('update:modelValue', $event)"
    @blur="emit('blur')"
  >
    <template v-if="canRegister" #footer="{ close }">
      <button type="button" class="px-3 py-2 w-full text-sm font-medium text-left rounded-lg text-primary hover:bg-surface-muted" @click="register(close)">
        + Register a new customer (opens in a new tab; needs approval first)
      </button>
    </template>
  </Autocomplete>
</template>
