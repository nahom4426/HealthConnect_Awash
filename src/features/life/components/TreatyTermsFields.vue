<script setup>
// Fields of ReinsuranceTreatyRequest. The parent owns the object and runs validateTreaty().
import { ReinsuranceCoverage, TreatyType } from "../constants/statuses";
import { coverageLabel, treatyTypeLabel } from "../constants/labels";

defineProps({
  form: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
});

const field = "w-full px-3 h-10 text-sm rounded-lg border outline-none bg-surface text-ink focus:border-primary focus:ring-2 focus:ring-primary/15";
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <label class="flex flex-col gap-1 text-sm font-medium text-ink">
      Treaty code
      <input v-model="form.treatyCode" maxlength="60" placeholder="e.g. LIFE-SUR-2026" :class="[field, errors.treatyCode ? 'border-error' : 'border-line']" />
      <span v-if="errors.treatyCode" class="text-xs text-error">{{ errors.treatyCode }}</span>
    </label>
    <label class="flex flex-col gap-1 text-sm font-medium text-ink">
      Treaty type
      <select v-model="form.treatyType" :class="[field, errors.treatyType ? 'border-error' : 'border-line']">
        <option value="" disabled>Select…</option>
        <option v-for="t in Object.values(TreatyType)" :key="t" :value="t">{{ treatyTypeLabel[t] }}</option>
      </select>
      <span v-if="errors.treatyType" class="text-xs text-error">{{ errors.treatyType }}</span>
    </label>
    <label class="flex flex-col gap-1 text-sm font-medium text-ink">
      Covers
      <select v-model="form.reinsuranceCoverage" :class="[field, errors.reinsuranceCoverage ? 'border-error' : 'border-line']">
        <option value="" disabled>Select…</option>
        <option v-for="c in Object.values(ReinsuranceCoverage)" :key="c" :value="c">{{ coverageLabel[c] }}</option>
      </select>
      <span v-if="errors.reinsuranceCoverage" class="text-xs text-error">{{ errors.reinsuranceCoverage }}</span>
    </label>

    <label class="flex flex-col gap-1 text-sm font-medium text-ink">
      Retention limit per life (ETB)
      <input v-model="form.retationLimit" type="number" min="0" step="any" :class="[field, 'tabular-nums', errors.retationLimit ? 'border-error' : 'border-line']" />
      <span class="text-xs font-normal text-ink-subtle">Sum assured Standard keeps before ceding.</span>
      <span v-if="errors.retationLimit" class="text-xs text-error">{{ errors.retationLimit }}</span>
    </label>
    <label class="flex flex-col gap-1 text-sm font-medium text-ink">
      Rider retention limit (ETB)
      <input v-model="form.riderRetentionLimit" type="number" min="0" step="any" :class="[field, 'tabular-nums', errors.riderRetentionLimit ? 'border-error' : 'border-line']" />
      <span v-if="errors.riderRetentionLimit" class="text-xs text-error">{{ errors.riderRetentionLimit }}</span>
    </label>
    <label class="flex flex-col gap-1 text-sm font-medium text-ink">
      Policy cession %
      <input v-model="form.policyCession" type="number" min="0" max="100" step="any" :class="[field, 'tabular-nums', errors.policyCession ? 'border-error' : 'border-line']" />
      <span v-if="errors.policyCession" class="text-xs text-error">{{ errors.policyCession }}</span>
    </label>

    <label class="flex flex-col gap-1 text-sm font-medium text-ink">
      Starts
      <input v-model="form.beginDate" type="date" :class="[field, errors.beginDate ? 'border-error' : 'border-line']" />
      <span v-if="errors.beginDate" class="text-xs text-error">{{ errors.beginDate }}</span>
    </label>
    <label class="flex flex-col gap-1 text-sm font-medium text-ink">
      Ends
      <input v-model="form.endDate" type="date" :class="[field, errors.endDate ? 'border-error' : 'border-line']" />
      <span v-if="errors.endDate" class="text-xs text-error">{{ errors.endDate }}</span>
    </label>
    <label class="flex flex-col gap-1 text-sm font-medium sm:col-span-2 lg:col-span-3 text-ink">
      Description
      <textarea v-model="form.treatyDescription" maxlength="500" rows="2" :class="[field, 'h-auto py-2', errors.treatyDescription ? 'border-error' : 'border-line']" placeholder="Scope, reinsurers' quote reference, special conditions" />
      <span class="text-xs font-normal text-ink-subtle">{{ (form.treatyDescription || "").length }}/500</span>
    </label>
  </div>
</template>
