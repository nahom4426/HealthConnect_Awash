<script setup>
// IMO entry with check-digit validation on blur, then the vessel card (MAR-15, MAR-16).
// An unknown IMO opens the vessel form so the user can add it without leaving the page.
import { ref, watch } from "vue";
import { openModal } from "@customizer/modal-x";
import { getVessel } from "../api/marineApi";
import { imoError, normalizeImo } from "../utils/imo";
import { inputClass, inputBorder } from "./styles";

const props = defineProps({
  modelValue: { type: Object, default: null },
  /** Age from which the active rate table refers the vessel */
  referFromAge: { type: Number, default: null },
  id: { type: String, default: "" },
  invalid: { type: Boolean, default: false },
  describedby: { type: String, default: undefined },
});
const emit = defineEmits(["update:modelValue", "error"]);

const imo = ref(props.modelValue?.imo ?? "");
const looking = ref(false);
const localError = ref("");

watch(
  () => props.modelValue?.imo,
  (v) => {
    if (v && v !== imo.value) imo.value = v;
  }
);

async function lookup() {
  const value = normalizeImo(imo.value);
  if (!value) {
    localError.value = "";
    emit("error", "");
    if (props.modelValue) emit("update:modelValue", null);
    return;
  }
  if (props.modelValue?.imo === value) return;
  localError.value = imoError(value);
  emit("error", localError.value);
  if (localError.value) {
    emit("update:modelValue", null);
    return;
  }
  looking.value = true;
  const res = await getVessel(value);
  looking.value = false;
  if (res.ok) emit("update:modelValue", res.data);
  else if (res.error.status === 404) {
    emit("update:modelValue", null);
    openModal("MarineVesselForm", { vessel: { imo: value }, notFound: true }, (saved) => {
      if (saved?.imo) emit("update:modelValue", saved);
    });
  } else {
    localError.value = res.error.message;
  }
}

function clear() {
  imo.value = "";
  emit("update:modelValue", null);
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex gap-2 items-center">
      <span class="text-sm font-medium text-ink-subtle">IMO</span>
      <input
        :id="id"
        v-model="imo"
        inputmode="numeric"
        maxlength="11"
        placeholder="7 digits, e.g. 9074729"
        :aria-invalid="invalid || !!localError || undefined"
        :aria-describedby="describedby"
        :class="[inputClass, inputBorder(invalid || localError), '!w-48 tabular-nums']"
        @blur="lookup"
        @keydown.enter.prevent="lookup"
      />
      <span v-if="looking" class="text-xs text-ink-subtle">Looking up…</span>
      <button v-else-if="modelValue" type="button" class="text-xs font-medium text-primary hover:underline" @click="clear">Clear</button>
    </div>
    <p v-if="localError && !invalid" class="text-xs text-error">{{ localError }}</p>
    <div v-if="modelValue" class="flex flex-wrap gap-x-6 gap-y-1 items-center p-3 text-sm rounded-xl border border-line bg-surface-muted">
      <p class="font-semibold text-ink">{{ modelValue.name }}</p>
      <p class="text-ink-muted">Flag <span class="text-ink">{{ modelValue.flag }}</span></p>
      <p class="text-ink-muted">Built <span class="text-ink">{{ modelValue.yearBuilt }}</span> · <span class="text-ink">{{ modelValue.age }} years</span></p>
      <p class="text-ink-muted">Class <span class="text-ink">{{ modelValue.classSociety }}</span></p>
      <span v-if="referFromAge !== null && modelValue.age >= referFromAge" class="px-2 py-0.5 text-xs font-semibold rounded-full bg-warning-soft text-warning-strong">Old vessel: referral likely</span>
    </div>
  </div>
</template>
