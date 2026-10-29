<script setup>
import { onMounted, ref } from "vue";
import Button from "@/components/Button.vue";
import PageHeader from "@/components/PageHeader.vue";
import TextField from "@/components/fields/TextField.vue";
import RateTableEditor from "../../components/RateTableEditor.vue";
import { useRateTable } from "../../composables/useRateTable";
import { individualTermSpec } from "../../rates/rateTables";
import { PolicyStatus } from "../../constants/statuses";
import { deleteInsuranceTerm, geTermPremium, getInsuranceTerms, updateInsuranceTerms } from "../../api/productApi";

// The backend lists active rows only (GET /insurance-term/active) and has no import for this table
const table = useRateTable({
  list: getInsuranceTerms,
  bulkSave: updateInsuranceTerms,
  remove: deleteInsuranceTerm,
  idField: individualTermSpec.idField,
  label: "Individual term rates",
});
onMounted(() => table.reload());

// Rate lookup: shows what the backend returns for an age and term (GET /insurance-term/calculate-term-premium)
const lookup = ref({ age: "", term: "" });
const lookupResult = ref(null);
const lookupError = ref("");
const lookupPending = ref(false);

async function runLookup() {
  lookupError.value = "";
  lookupResult.value = null;
  const age = Number.parseInt(lookup.value.age, 10);
  const term = Number.parseInt(lookup.value.term, 10);
  if (!Number.isInteger(age) || age < 0 || !Number.isInteger(term) || term < 1) {
    lookupError.value = "Enter a whole-number age and a term of at least 1 year.";
    return;
  }
  lookupPending.value = true;
  const res = await geTermPremium({ age, term });
  lookupPending.value = false;
  if (res?.success) lookupResult.value = res.data;
  else lookupError.value = res?.error || "No rate found.";
}
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader
      title="Individual term rates"
      subtitle="Premium rate by age, term and gender for individual term life, with the discount and loading limits underwriters may apply."
    />

    <section class="p-4 mb-4 rounded-2xl border bg-surface border-line shadow-card">
      <h2 class="text-sm font-semibold text-ink">Rate lookup</h2>
      <p class="mt-0.5 text-xs text-ink-muted">Check which rate the backend applies for an entry age and term.</p>
      <form class="flex flex-wrap gap-3 items-end mt-3" @submit.prevent="runLookup">
        <div class="w-28"><TextField v-model.number="lookup.age" label="Age" type="number" numeric min="0" step="1" /></div>
        <div class="w-28"><TextField v-model.number="lookup.term" label="Term (years)" type="number" numeric min="1" step="1" /></div>
        <Button size="sm" html-type="submit" :pending="lookupPending">Look up</Button>
      </form>
      <p v-if="lookupError" role="alert" class="mt-3 text-sm text-error">{{ lookupError }}</p>
      <dl v-else-if="lookupResult" class="grid grid-cols-2 gap-3 mt-4 sm:grid-cols-5">
        <div v-for="[label, value] in [
          ['Male rate', lookupResult.maleRate],
          ['Female rate', lookupResult.femaleRate],
          ['Per sum assured', lookupResult.rateUnit],
          ['Max discount %', lookupResult.maxDiscount],
          ['Max load %', lookupResult.maxLoad],
        ]" :key="label" class="px-3 py-2 rounded-xl bg-surface-muted">
          <dt class="text-xs text-ink-subtle">{{ label }}</dt>
          <dd class="mt-0.5 text-base font-semibold tabular-nums text-ink">{{ value ?? "—" }}</dd>
        </div>
      </dl>
    </section>

    <RateTableEditor
      :spec="individualTermSpec"
      :rows="table.rows.value"
      :loading="table.loading.value"
      :load-error="table.error.value"
      :saving="table.saving.value"
      :default-status="PolicyStatus.ACTIVE"
      @retry="table.reload()"
      @save="table.save"
      @remove="table.remove"
    />
  </div>
</template>
