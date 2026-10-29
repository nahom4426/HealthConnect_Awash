<script setup>
// Create or edit a vessel. data: { vessel?: Vessel, notFound?: boolean } — `notFound` comes from
// VesselLookup when an IMO isn't in the master yet. Closes with the saved vessel.
import { ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import FormField from "../components/FormField.vue";
import FormErrorBanner from "../components/FormErrorBanner.vue";
import AuditTimeline from "../components/AuditTimeline.vue";
import { inputClass, inputBorder } from "../components/styles";
import { required, useForm } from "../composables/useForm";
import { createVessel, updateVessel } from "../api/marineApi";
import { notifyError } from "../api/marineClient";
import { CLASS_SOCIETIES, FLAG_STATES } from "../constants";
import { imoError, normalizeImo } from "../utils/imo";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const v = props.data?.vessel ?? {};
const editing = !!v.name;
const thisYear = new Date().getFullYear();
const showAudit = ref(false);

const { form, errors, pending, check, validate, applyServerError, bannerItems, submitted } = useForm(
  { imo: v.imo ?? "", name: v.name ?? "", flag: v.flag ?? "", yearBuilt: v.yearBuilt ?? "", classSociety: v.classSociety ?? "", grossTonnage: v.grossTonnage ?? "" },
  {
    imo: (x) => imoError(x),
    name: required("Name"),
    flag: required("Flag"),
    yearBuilt: (x) => (!(Number(x) >= 1900 && Number(x) <= thisYear) ? `Year built must be between 1900 and ${thisYear}` : ""),
    classSociety: required("Class society"),
    grossTonnage: (x) => (x !== "" && x !== null && !(Number(x) > 0) ? "Gross tonnage must be greater than 0" : ""),
  },
  { imo: "IMO", name: "Name", flag: "Flag", yearBuilt: "Year built", classSociety: "Class society", grossTonnage: "Gross tonnage" }
);

async function submit() {
  form.imo = normalizeImo(form.imo);
  if (!validate()) return;
  pending.value = true;
  const body = { ...form, source: "MANUAL" };
  const res = editing ? await updateVessel(v.imo, body) : await createVessel(body);
  pending.value = false;
  if (res.ok) {
    toasted(true, editing ? "Vessel updated" : `${res.data.name} added`);
    closeModal(res.data);
  } else if (!applyServerError(res.error)) notifyError(res.error);
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="editing ? `Edit ${v.name}` : 'New vessel'">
      <p v-if="data.notFound" class="p-3 mb-1 text-sm rounded-xl bg-primary/5 text-ink">No vessel with IMO <strong>{{ v.imo }}</strong> is on file. Add it here and it will be picked for this quote.</p>
      <FormErrorBanner :items="submitted ? bannerItems() : []" />
      <form id="marine-vessel-form" class="grid gap-4 sm:grid-cols-2" novalidate @submit.prevent="submit">
        <FormField v-slot="{ id, invalid }" label="IMO number" name="imo" required :error="errors.imo" hint="7 digits; the last is a check digit">
          <input :id="id" v-model="form.imo" inputmode="numeric" maxlength="7" :readonly="editing" :class="[inputClass, inputBorder(invalid), 'tabular-nums', editing ? 'bg-surface-muted' : '']" @blur="check('imo')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Name" name="name" required :error="errors.name">
          <input :id="id" v-model="form.name" v-focus="true" :class="[inputClass, inputBorder(invalid)]" @blur="check('name')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Flag" name="flag" required :error="errors.flag">
          <select :id="id" v-model="form.flag" :class="[inputClass, inputBorder(invalid)]" @blur="check('flag')">
            <option value="" disabled>Choose a flag</option>
            <option v-for="f in FLAG_STATES" :key="f" :value="f">{{ f }}</option>
          </select>
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Year built" name="yearBuilt" required :error="errors.yearBuilt">
          <input :id="id" v-model="form.yearBuilt" type="number" min="1900" :max="thisYear" :class="[inputClass, inputBorder(invalid), 'tabular-nums']" @blur="check('yearBuilt')" />
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Class society" name="classSociety" required :error="errors.classSociety">
          <select :id="id" v-model="form.classSociety" :class="[inputClass, inputBorder(invalid)]" @blur="check('classSociety')">
            <option value="" disabled>Choose a class society</option>
            <option v-for="c in CLASS_SOCIETIES" :key="c" :value="c">{{ c }}</option>
          </select>
        </FormField>
        <FormField v-slot="{ id, invalid }" label="Gross tonnage" name="grossTonnage" :error="errors.grossTonnage">
          <input :id="id" v-model="form.grossTonnage" type="number" min="1" :class="[inputClass, inputBorder(invalid), 'tabular-nums']" @blur="check('grossTonnage')" />
        </FormField>
      </form>
      <div v-if="editing" class="pt-3 border-t border-line">
        <button type="button" class="text-sm font-medium text-primary hover:underline" :aria-expanded="showAudit" @click="showAudit = !showAudit">{{ showAudit ? "Hide" : "Show" }} change history</button>
        <div v-if="showAudit" class="mt-3"><AuditTimeline entity="vessel" :entity-id="v.imo" /></div>
      </div>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="marine-vessel-form" :pending="pending">{{ editing ? "Save changes" : "Add vessel" }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
