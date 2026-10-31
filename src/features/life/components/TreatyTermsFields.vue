<script setup>
// Fields of ReinsuranceTreatyRequest. The parent owns the object and runs validateTreaty().
import TextField from "@/components/fields/TextField.vue";
import SelectField from "@/components/fields/SelectField.vue";
import TextareaField from "@/components/fields/TextareaField.vue";
import { ReinsuranceCoverage, TreatyType } from "../constants/statuses";
import { coverageLabel, treatyTypeLabel } from "../constants/labels";

defineProps({
  form: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
});

const TYPE_OPTIONS = Object.values(TreatyType).map((t) => ({ value: t, label: treatyTypeLabel[t] }));
const COVERAGE_OPTIONS = Object.values(ReinsuranceCoverage).map((c) => ({ value: c, label: coverageLabel[c] }));
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <TextField v-model="form.treatyCode" label="Treaty code" maxlength="60" placeholder="e.g. LIFE-SUR-2026" :error="errors.treatyCode" />
    <SelectField v-model="form.treatyType" label="Treaty type" :options="TYPE_OPTIONS" :error="errors.treatyType" />
    <SelectField v-model="form.reinsuranceCoverage" label="Covers" :options="COVERAGE_OPTIONS" :error="errors.reinsuranceCoverage" />

    <TextField v-model.number="form.retationLimit" label="Retention limit per life (ETB)" type="number" numeric min="0" step="any" hint="Sum assured Standard keeps before ceding." :error="errors.retationLimit" />
    <TextField v-model.number="form.riderRetentionLimit" label="Rider retention limit (ETB)" type="number" numeric min="0" step="any" :error="errors.riderRetentionLimit" />
    <TextField v-model.number="form.policyCession" label="Policy cession %" type="number" numeric min="0" max="100" step="any" :error="errors.policyCession" />

    <TextField v-model="form.beginDate" label="Starts" type="date" :error="errors.beginDate" />
    <TextField v-model="form.endDate" label="Ends" type="date" :error="errors.endDate" />
    <div class="sm:col-span-2 lg:col-span-3">
      <TextareaField v-model="form.treatyDescription" label="Description" :maxlength="500" counter rows="2" placeholder="Scope, reinsurers' quote reference, special conditions" :error="errors.treatyDescription" />
    </div>
  </div>
</template>
