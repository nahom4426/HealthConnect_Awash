<script setup>
// Wizard step 2: shipment (plan 5.2, MAR-15 to MAR-21).
import { ref } from "vue";
import FormField from "../FormField.vue";
import VesselLookup from "../VesselLookup.vue";
import PortAutocomplete from "../PortAutocomplete.vue";
import HsCodeAutocomplete from "../HsCodeAutocomplete.vue";
import MoneyInput from "../MoneyInput.vue";
import DateField from "../DateField.vue";
import { inputClass, inputBorder } from "../styles";
import { MODES, isSeaMode } from "../../constants";
import { addDays, todayIso } from "../../utils/format";
import { isValidContainerNo } from "../../utils/imo";

defineProps({
  draft: { type: Object, required: true },
  errors: { type: Object, required: true },
  referFromAge: { type: Number, default: null },
});
const emit = defineEmits(["check"]);

const containerDraft = ref("");
function addContainers(draft) {
  const parts = containerDraft.value.toUpperCase().split(/[\s,;]+/).filter(Boolean);
  if (!parts.length) return;
  draft.containers = [...new Set([...draft.containers, ...parts])];
  containerDraft.value = "";
  emit("check", "containers");
}
</script>

<template>
  <div class="grid gap-5 sm:grid-cols-2">
    <FormField v-slot="{ id, invalid }" label="Mode of conveyance" name="mode" required :error="errors.mode">
      <select :id="id" v-model="draft.mode" :class="[inputClass, inputBorder(invalid)]" @change="emit('check', 'mode')">
        <option value="" disabled>Choose a mode</option>
        <option v-for="m in MODES" :key="m.value" :value="m.value">{{ m.label }}</option>
      </select>
    </FormField>
    <div class="hidden sm:block" />

    <FormField v-if="isSeaMode(draft.mode)" v-slot="{ id, invalid, describedby }" label="Vessel" name="vessel" required :error="errors.vessel" class="sm:col-span-2">
      <VesselLookup :id="id" v-model="draft.vessel" :refer-from-age="referFromAge" :invalid="invalid" :describedby="describedby" @update:model-value="emit('check', 'vessel')" />
    </FormField>
    <p v-if="draft.mode === 'SEA_ROAD'" class="sm:col-span-2 p-3 text-sm rounded-xl bg-surface-muted text-ink-muted">The inland leg's fields (truck, route, transit days) arrive with inland transit in phase 3.</p>

    <FormField v-slot="{ id, invalid, describedby }" label="Port of loading" name="loadingPort" required :error="errors.loadingPort">
      <PortAutocomplete :id="id" v-model="draft.loadingPort" :invalid="invalid" :describedby="describedby" @blur="emit('check', 'loadingPort')" />
    </FormField>
    <FormField v-slot="{ id, invalid, describedby }" label="Port of discharge" name="dischargePort" required :error="errors.dischargePort">
      <PortAutocomplete :id="id" v-model="draft.dischargePort" :invalid="invalid" :describedby="describedby" @blur="emit('check', 'dischargePort')" />
    </FormField>
    <FormField v-slot="{ id, invalid, describedby }" label="Transshipment ports" name="transshipments" :error="errors.transshipments" hint="Optional, up to 5" class="sm:col-span-2">
      <PortAutocomplete :id="id" v-model="draft.transshipments" multiple :max="5" :invalid="invalid" :describedby="describedby" placeholder="Add a port" />
    </FormField>
    <FormField v-slot="{ id, invalid }" label="Final destination" name="finalDestination" required :error="errors.finalDestination">
      <input :id="id" v-model="draft.finalDestination" placeholder="e.g. Modjo dry port" :class="[inputClass, inputBorder(invalid)]" @blur="emit('check', 'finalDestination')" />
    </FormField>
    <FormField v-slot="{ id, invalid, describedby }" label="Sailing date" name="sailingDate" required :error="errors.sailingDate" hint="Not more than 30 days in the past">
      <DateField :id="id" v-model="draft.sailingDate" :min="addDays(todayIso(), -30)" :invalid="invalid" :describedby="describedby" @blur="emit('check', 'sailingDate')" />
    </FormField>

    <FormField v-slot="{ id, invalid, describedby }" label="Commodity" name="commodity" required :error="errors.commodity" class="sm:col-span-2">
      <HsCodeAutocomplete :id="id" v-model="draft.commodity" :invalid="invalid" :describedby="describedby" @blur="emit('check', 'commodity')" />
    </FormField>
    <FormField v-slot="{ id, invalid }" label="Goods description" name="goodsDescription" required :error="errors.goodsDescription" :hint="`Printed on the certificate · ${draft.goodsDescription.length}/500`" class="sm:col-span-2">
      <textarea :id="id" v-model="draft.goodsDescription" rows="3" maxlength="500" :class="[inputClass, inputBorder(invalid), 'h-auto py-2']" @blur="emit('check', 'goodsDescription')" />
    </FormField>
    <FormField v-slot="{ id }" label="Packing" name="packing">
      <input :id="id" v-model="draft.packing" placeholder="e.g. 40 ft containers, palletised" :class="[inputClass, 'border-line']" />
    </FormField>
    <div class="hidden sm:block" />

    <FormField v-slot="{ id, invalid, describedby }" label="Invoice value" name="invoiceValue" required :error="errors.invoiceValue" hint="Sets the shipment currency">
      <MoneyInput :id="id" v-model:amount="draft.invoiceValue" v-model:currency="draft.currency" :invalid="invalid" :describedby="describedby" @blur="emit('check', 'invoiceValue')" />
    </FormField>
    <FormField v-slot="{ id, invalid, describedby }" label="Freight" name="freight" required :error="errors.freight" hint="Same currency as the invoice">
      <MoneyInput :id="id" v-model:amount="draft.freight" :currency="draft.currency" lock-currency :invalid="invalid" :describedby="describedby" @blur="emit('check', 'freight')" />
    </FormField>
    <FormField v-slot="{ id }" label="Invoice no" name="invoiceNo">
      <input :id="id" v-model="draft.invoiceNo" :class="[inputClass, 'border-line']" />
    </FormField>
    <FormField v-slot="{ id }" label="Bill of lading no" name="blNo">
      <input :id="id" v-model="draft.blNo" :class="[inputClass, 'border-line']" />
    </FormField>
    <FormField v-slot="{ id, invalid }" label="Container numbers" name="containers" :error="errors.containers" hint="4 letters + 7 digits each; press Enter to add" class="sm:col-span-2">
      <div :class="[inputClass, inputBorder(invalid), 'flex flex-wrap gap-1 items-center !h-auto min-h-10 py-1']">
        <span v-for="c in draft.containers" :key="c" :class="['inline-flex gap-1 items-center py-0.5 pr-1 pl-2 text-xs font-medium rounded-md tabular-nums', isValidContainerNo(c) ? 'bg-primary/10 text-primary' : 'bg-error-soft text-error-strong']">
          {{ c }}
          <button type="button" class="grid place-items-center w-4 h-4 rounded hover:bg-black/10" :aria-label="`Remove ${c}`" @click="draft.containers = draft.containers.filter((x) => x !== c); emit('check', 'containers')">×</button>
        </span>
        <input :id="id" v-model="containerDraft" placeholder="MSCU1234567" class="flex-1 min-w-[10rem] h-8 uppercase bg-transparent outline-none" @keydown.enter.prevent="addContainers(draft)" @blur="addContainers(draft)" />
      </div>
    </FormField>
  </div>
</template>
