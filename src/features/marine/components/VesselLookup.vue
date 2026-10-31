<script setup>
// Pick the carrying vessel from the Marine vessel registry (MAR-15, MAR-16). Typing searches by
// name or IMO; the registry is the source of a vessel's age and class, which the tariff rates on.
// A vessel that is not registered yet is added from the footer without leaving the page, because
// the alternative is a user inventing an IMO to get past the field.
import { computed, ref } from "vue";
import { openModal } from "@customizer/modal-x";
import Autocomplete from "./Autocomplete.vue";
import { listVessels } from "../api/marineApi";

const props = defineProps({
  modelValue: { type: Object, default: null },
  /** Age from which the active rate table refers the vessel */
  referFromAge: { type: Number, default: null },
  id: { type: String, default: "" },
  invalid: { type: Boolean, default: false },
  describedby: { type: String, default: undefined },
});
const emit = defineEmits(["update:modelValue", "error", "blur"]);

const picker = ref(null);

async function search(q) {
  const res = await listVessels({ q, size: 12 });
  return res.ok ? res.data.content : [];
}

const label = (v) => `${v.name} · IMO ${v.imo}`;
const sub = (v) => [v.flag, v.yearBuilt ? `built ${v.yearBuilt}` : null, v.classSociety].filter(Boolean).join(" · ");

const old = computed(
  () => props.referFromAge !== null && props.modelValue?.age != null && props.modelValue.age >= props.referFromAge
);

function pick(vessel) {
  emit("update:modelValue", vessel);
  emit("error", "");
}

/** Register a vessel that is not in the list, then select it. */
function addVessel(query) {
  picker.value?.close();
  const imo = /^\d{7}$/.test((query ?? "").trim()) ? query.trim() : "";
  openModal("MarineVesselForm", { vessel: imo ? { imo } : {}, notFound: true }, (saved) => {
    if (saved?.imo) pick(saved);
  });
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <Autocomplete
      ref="picker"
      :model-value="modelValue"
      :search="search"
      item-key="imo"
      :item-label="label"
      :item-sub="sub"
      :id="id"
      :invalid="invalid"
      :describedby="describedby"
      placeholder="Search vessel by name or IMO"
      @update:model-value="pick"
      @blur="emit('blur')"
    >
      <template #footer="{ query, close }">
        <button
          type="button"
          class="px-3 py-2 w-full text-sm font-medium text-left rounded-lg text-primary hover:bg-surface-muted"
          @click="close(); addVessel(query)"
        >
          Vessel not listed — add it to the registry
        </button>
      </template>
    </Autocomplete>

    <div v-if="modelValue" class="flex flex-wrap gap-x-6 gap-y-1 items-center p-3 text-sm rounded-xl border border-line bg-surface-muted">
      <p class="font-semibold text-ink">{{ modelValue.name }}</p>
      <p class="text-ink-muted">IMO <span class="text-ink tabular-nums">{{ modelValue.imo }}</span></p>
      <p class="text-ink-muted">Flag <span class="text-ink">{{ modelValue.flag }}</span></p>
      <p class="text-ink-muted">Built <span class="text-ink">{{ modelValue.yearBuilt }}</span> · <span class="text-ink">{{ modelValue.age }} years</span></p>
      <p class="text-ink-muted">Class <span class="text-ink">{{ modelValue.classSociety }}</span></p>
      <span v-if="old" class="px-2 py-0.5 text-xs font-semibold rounded-full bg-warning-soft text-warning-strong">Old vessel: referral likely</span>
    </div>
  </div>
</template>
