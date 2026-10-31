<script setup>
// Search and pick a party of one type; "Create new" opens the party form pre-filled with the search.
import { openModal } from "@customizer/modal-x";
import Autocomplete from "./Autocomplete.vue";
import { listParties } from "../api/marineApi";
import { partyTypeLabel } from "../constants";

const props = defineProps({
  modelValue: { type: Object, default: null },
  type: { type: String, required: true },
  id: { type: String, default: "" },
  invalid: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  describedby: { type: String, default: undefined },
  canCreate: { type: Boolean, default: true },
});
const emit = defineEmits(["update:modelValue", "blur"]);

async function search(q) {
  const res = await listParties({ type: props.type, q, size: 10 });
  return res.ok ? res.data.content : [];
}

function createNew(query, close) {
  close();
  openModal("MarinePartyForm", { party: { name: query, types: [props.type] } }, (saved) => {
    if (saved?.id) emit("update:modelValue", saved);
  });
}
</script>

<template>
  <Autocomplete
    :model-value="modelValue"
    :search="search"
    item-key="id"
    :item-label="(p) => p.name"
    :item-sub="(p) => [p.tin && `TIN ${p.tin}`, p.email].filter(Boolean).join(' · ') || partyTypeLabel(type)"
    :placeholder="`Search ${partyTypeLabel(type).toLowerCase()} by name or TIN`"
    :id="id"
    :invalid="invalid"
    :disabled="disabled"
    :describedby="describedby"
    @update:model-value="emit('update:modelValue', $event)"
    @blur="emit('blur')"
  >
    <template v-if="canCreate" #footer="{ query, close }">
      <button type="button" class="px-3 py-2 w-full text-sm font-medium text-left rounded-lg text-primary hover:bg-surface-muted" @click="createNew(query, close)">
        + Create new {{ partyTypeLabel(type).toLowerCase() }}{{ query ? ` "${query}"` : "" }}
      </button>
    </template>
  </Autocomplete>
</template>
