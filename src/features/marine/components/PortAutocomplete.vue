<script setup>
// Pick one port (or several with `multiple`), shown as "UN/LOCODE · name, country".
import Autocomplete from "./Autocomplete.vue";
import { listPorts } from "../api/marineApi";

defineProps({
  modelValue: { type: [Object, Array], default: null },
  multiple: { type: Boolean, default: false },
  max: { type: Number, default: Infinity },
  id: { type: String, default: "" },
  invalid: { type: Boolean, default: false },
  describedby: { type: String, default: undefined },
  placeholder: { type: String, default: "Search port by name or UN/LOCODE" },
});
const emit = defineEmits(["update:modelValue", "blur"]);

async function search(q) {
  const res = await listPorts({ q, size: 12 });
  return res.ok ? res.data.content : [];
}
const label = (p) => (p.country ? `${p.code} · ${p.name}, ${p.country}` : p.code);
</script>

<template>
  <Autocomplete
    :model-value="modelValue"
    :search="search"
    item-key="code"
    :item-label="label"
    :multiple="multiple"
    :max="max"
    :placeholder="placeholder"
    :id="id"
    :invalid="invalid"
    :describedby="describedby"
    @update:model-value="emit('update:modelValue', $event)"
    @blur="emit('blur')"
  />
</template>
