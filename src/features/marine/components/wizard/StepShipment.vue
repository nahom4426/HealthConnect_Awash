<script setup>
// Wizard step 2: shipment (plan 5.2, MAR-15 to MAR-21).
import { computed, onMounted, ref } from "vue";
import FormField from "../FormField.vue";
import VesselLookup from "../VesselLookup.vue";
import PortAutocomplete from "../PortAutocomplete.vue";
import HsCodeAutocomplete from "../HsCodeAutocomplete.vue";
import MoneyInput from "../MoneyInput.vue";
import DateField from "../DateField.vue";
import { inputClass, inputBorder } from "../styles";
import { MODES, hasInlandLeg, isSeaMode } from "../../constants";
import { listPorts } from "../../api/marineApi";
import { addDays, todayIso } from "../../utils/format";
import { isValidContainerNo } from "../../utils/imo";

const props = defineProps({
  draft: { type: Object, required: true },
  errors: { type: Object, required: true },
  referFromAge: { type: Number, default: null },
  /** Open cover terms in declaration mode: { commodities: [hsCode], declarationDays, currency } */
  cover: { type: Object, default: null },
});
const emit = defineEmits(["check"]);

const inlandOnly = computed(() => props.draft.product === "INLAND_TRANSIT");
const dateLabel = computed(() => (inlandOnly.value ? "Departure date" : "Sailing date"));
const late = computed(() => props.cover && props.draft.sailingDate && props.draft.sailingDate < addDays(todayIso(), -props.cover.declarationDays));

// Dry ports are the Ethiopian entries in the port master
const dryPorts = ref([]);
onMounted(async () => {
  const res = await listPorts({ country: "Ethiopia", size: 50 });
  if (res.ok) dryPorts.value = res.data.content;
});
const dryPortCode = computed({
  get: () => props.draft.inland.to?.code ?? "",
  set: (code) => (props.draft.inland.to = dryPorts.value.find((p) => p.code === code) ?? null),
});

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
    <template v-if="!inlandOnly">
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
    </template>

    <fieldset v-if="hasInlandLeg(draft.product, draft.mode)" class="grid gap-4 p-4 rounded-xl border sm:col-span-2 sm:grid-cols-2 border-line">
      <legend class="px-1 text-sm font-semibold text-ink">Inland leg by road</legend>
      <FormField v-slot="{ id, invalid, describedby }" label="From" name="inland.from" required :error="errors['inland.from']">
        <PortAutocomplete :id="id" v-model="draft.inland.from" :invalid="invalid" :describedby="describedby" @blur="emit('check', 'inland.from')" />
      </FormField>
      <FormField v-slot="{ id, invalid }" label="To (dry port)" name="inland.to" required :error="errors['inland.to']">
        <select :id="id" v-model="dryPortCode" :class="[inputClass, inputBorder(invalid)]" @change="emit('check', 'inland.to')">
          <option value="" disabled>Choose a dry port</option>
          <option v-for="p in dryPorts" :key="p.code" :value="p.code">{{ p.name }} ({{ p.code }})</option>
        </select>
      </FormField>
      <FormField v-slot="{ id, invalid }" label="Truck plate" name="inland.truckPlate" required :error="errors['inland.truckPlate']">
        <input :id="id" v-model="draft.inland.truckPlate" placeholder="e.g. ET-3-A12345" :class="[inputClass, inputBorder(invalid), 'uppercase']" @blur="emit('check', 'inland.truckPlate')" />
      </FormField>
      <FormField v-slot="{ id, invalid }" label="Driver name" name="inland.driverName" required :error="errors['inland.driverName']">
        <input :id="id" v-model="draft.inland.driverName" :class="[inputClass, inputBorder(invalid)]" @blur="emit('check', 'inland.driverName')" />
      </FormField>
      <FormField v-slot="{ id }" label="Convoy reference" name="inland.convoyRef" hint="Optional">
        <input :id="id" v-model="draft.inland.convoyRef" :class="[inputClass, 'border-line']" />
      </FormField>
    </fieldset>
    <FormField v-slot="{ id, invalid, describedby }" :label="dateLabel" name="sailingDate" required :error="errors.sailingDate" hint="Not more than 30 days in the past">
      <DateField :id="id" v-model="draft.sailingDate" :min="addDays(todayIso(), -30)" :invalid="invalid" :describedby="describedby" @blur="emit('check', 'sailingDate')" />
      <span v-if="late" class="self-start px-2 py-0.5 mt-1 text-xs font-semibold rounded-full bg-warning-soft text-warning-strong">Late declaration: more than {{ cover.declarationDays }} days after sailing</span>
    </FormField>

    <FormField v-slot="{ id, invalid, describedby }" label="Commodity" name="commodity" required :error="errors.commodity" class="sm:col-span-2">
      <HsCodeAutocomplete :id="id" v-model="draft.commodity" :allowed="cover?.commodities ?? null" :invalid="invalid" :describedby="describedby" @blur="emit('check', 'commodity')" />
    </FormField>
    <FormField v-slot="{ id, invalid }" label="Goods description" name="goodsDescription" required :error="errors.goodsDescription" :hint="`Printed on the certificate · ${draft.goodsDescription.length}/500`" class="sm:col-span-2">
      <textarea :id="id" v-model="draft.goodsDescription" rows="3" maxlength="500" :class="[inputClass, inputBorder(invalid), 'h-auto py-2']" @blur="emit('check', 'goodsDescription')" />
    </FormField>
    <FormField v-slot="{ id }" label="Packing" name="packing">
      <input :id="id" v-model="draft.packing" placeholder="e.g. 40 ft containers, palletised" :class="[inputClass, 'border-line']" />
    </FormField>
    <div class="hidden sm:block" />

    <FormField v-slot="{ id, invalid, describedby }" label="Invoice value" name="invoiceValue" required :error="errors.invoiceValue" :hint="cover ? `In the cover's currency, ${cover.currency}` : 'Sets the shipment currency'">
      <MoneyInput :id="id" v-model:amount="draft.invoiceValue" v-model:currency="draft.currency" :lock-currency="!!cover" :invalid="invalid" :describedby="describedby" @blur="emit('check', 'invoiceValue')" />
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
