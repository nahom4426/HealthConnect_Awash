<script setup>
// Pick a commodity by HS code or description. Restricted commodities get an amber
// "Referral likely" chip (MAR-19).
import Autocomplete from "./Autocomplete.vue";
import { listCommodities } from "../api/marineApi";

defineProps({
  modelValue: { type: Object, default: null },
  id: { type: String, default: "" },
  invalid: { type: Boolean, default: false },
  describedby: { type: String, default: undefined },
});
const emit = defineEmits(["update:modelValue", "blur"]);

async function search(q) {
  const res = await listCommodities({ q, size: 12 });
  return res.ok ? res.data.content : [];
}
const cls = (c) => c.commodityClass.charAt(0) + c.commodityClass.slice(1).toLowerCase();
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <Autocomplete
      :model-value="modelValue"
      :search="search"
      item-key="hsCode"
      :item-label="(c) => `${c.hsCode} · ${c.description}`"
      :item-sub="(c) => `Class: ${cls(c)}${c.restricted ? ' · restricted' : ''}`"
      placeholder="Search by HS code or description"
      :id="id"
      :invalid="invalid"
      :describedby="describedby"
      @update:model-value="emit('update:modelValue', $event)"
      @blur="emit('blur')"
    >
      <template #item="{ item }">
        <div class="flex gap-2 justify-between items-start">
          <div class="min-w-0">
            <p class="text-sm text-ink">{{ item.hsCode }} · {{ item.description }}</p>
            <p class="text-xs text-ink-subtle">Class: {{ cls(item) }}</p>
          </div>
          <span v-if="item.restricted" class="shrink-0 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-warning-soft text-warning-strong">Referral likely</span>
        </div>
      </template>
    </Autocomplete>
    <span v-if="modelValue?.restricted" class="self-start px-2 py-0.5 text-xs font-semibold rounded-full bg-warning-soft text-warning-strong">Referral likely: restricted commodity</span>
  </div>
</template>
