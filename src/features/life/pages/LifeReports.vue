<script setup>
// Life reports (GET /report/{name}, contract 2026-10 G8): pick a report and a period, view it here, or
// download it as Excel. The backend builds both; this page only lays out its columns and rows.
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import PageHeader from "@/components/PageHeader.vue";
import TextField from "@/components/fields/TextField.vue";
import SelectField from "@/components/fields/SelectField.vue";
import { toasted } from "@/utils/utils";
import { useLifeResource } from "../composables/useLifeResource";
import { formatAmount } from "../constants/labels";
import { PERIODS, REPORTS, isAmountColumn, isHiddenColumn, periodFor, reportByName, validatePeriod } from "../reports/reportRules";
import { downloadReport, getReport } from "../api/reportApi";

const route = useRoute();
const router = useRouter();
const name = ref(reportByName(route.query.report) ? route.query.report : REPORTS[0].name);
watch(name, (n) => router.replace({ query: { ...route.query, report: n } }));
const period = reactive({ preset: "year", ...periodFor("year") });
watch(() => period.preset, (p) => { if (p !== "custom") Object.assign(period, periodFor(p)); });
const periodError = computed(() => validatePeriod(period));

const report = useLifeResource((n, params) => getReport(n, params));
const load = () => { if (!periodError.value) report.load(name.value, { from: period.from, to: period.to }); };
watch([name, () => period.from, () => period.to], load, { immediate: true });

const r = computed(() => report.data.value || {});
// Keep each column's position, hide UUID columns
const shown = computed(() => (r.value.columns || []).map((c, i) => ({ c, i })).filter(({ c }) => !isHiddenColumn(c)));
const rows = computed(() => r.value.rows || []);
const cell = (column, v) => (v === null || v === undefined ? "" : isAmountColumn(column) && typeof v === "number" ? formatAmount(v) : String(v));

const downloading = ref(false);
async function download() {
  downloading.value = true;
  const res = await downloadReport(name.value, { from: period.from, to: period.to });
  downloading.value = false;
  if (!res?.success || !(res.data instanceof Blob)) return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(res.data);
  a.download = `${name.value}_${period.from}_${period.to}.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toasted(true, "Report downloaded");
}
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader title="Life reports" :subtitle="reportByName(name)?.hint" back="/life/dashboard">
      <template #actions><Button variant="outline" :pending="downloading" :disabled="!!periodError" @click="download">Download Excel</Button></template>
    </PageHeader>

    <div class="flex flex-wrap gap-3 items-end mb-5">
      <div class="w-60"><SelectField v-model="name" label="Report" :options="REPORTS.map((x) => ({ value: x.name, label: x.label }))" /></div>
      <div class="w-44"><SelectField v-model="period.preset" label="Period" :options="[...PERIODS, { value: 'custom', label: 'Custom' }]" /></div>
      <div class="w-40"><TextField v-model="period.from" label="From" type="date" :max="period.to" @update:model-value="period.preset = 'custom'" /></div>
      <div class="w-40"><TextField v-model="period.to" label="To" type="date" :min="period.from" @update:model-value="period.preset = 'custom'" /></div>
      <p v-if="periodError" class="pb-2 text-sm text-error">{{ periodError }}</p>
    </div>

    <section class="rounded-2xl border bg-surface border-line shadow-card">
      <div v-if="report.error.value && !report.loading.value" class="flex flex-col gap-3 items-center px-6 py-12 text-center">
        <p class="text-sm font-semibold text-ink">Couldn't load the report</p>
        <p class="max-w-md text-sm text-ink-muted">{{ report.error.value }}</p>
        <Button size="sm" @click="load">Try again</Button>
      </div>
      <p v-else-if="report.loading.value" class="px-5 py-8 text-sm text-ink-muted">Loading…</p>
      <p v-else-if="!rows.length" class="px-5 py-8 text-sm text-ink-muted">Nothing in this period.</p>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <caption class="sr-only">{{ reportByName(name)?.label }}, {{ period.from }} to {{ period.to }}</caption>
          <thead>
            <tr class="border-b border-line">
              <th v-for="{ c } in shown" :key="c" scope="col" :class="['px-4 py-2.5 text-xs font-semibold tracking-wide uppercase whitespace-nowrap text-ink-subtle', isAmountColumn(c) ? 'text-right' : 'text-left']">{{ c }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in rows" :key="ri" class="border-b last:border-0 border-line">
              <td v-for="{ c, i } in shown" :key="c" :class="['px-4 py-2 whitespace-nowrap', isAmountColumn(c) ? 'text-right tabular-nums text-ink' : 'text-ink-muted']">{{ cell(c, row[i]) || "—" }}</td>
            </tr>
          </tbody>
        </table>
        <p class="px-4 py-2 text-xs border-t text-ink-subtle border-line">{{ rows.length }} row{{ rows.length === 1 ? "" : "s" }}</p>
      </div>
    </section>
  </div>
</template>
