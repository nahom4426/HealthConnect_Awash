<script setup>
// Life dashboard (GET /dashboard/summary, contract 2026-10 G8): premium and claims totals for a period,
// sum assured in force, policies expiring, and counts by status that open the matching lists.
import { computed, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import PageHeader from "@/components/PageHeader.vue";
import TextField from "@/components/fields/TextField.vue";
import SelectField from "@/components/fields/SelectField.vue";
import { lifeCan } from "@/features/life/privileges";
import { useLifeResource } from "../composables/useLifeResource";
import { formatAmount } from "../constants/labels";
import { PERIODS, periodFor, statusBreakdown, totalOf, validatePeriod } from "../reports/reportRules";
import { getDashboardSummary } from "../api/reportApi";

const router = useRouter();
const period = reactive({ preset: "year", ...periodFor("year") });
watch(() => period.preset, (p) => { if (p !== "custom") Object.assign(period, periodFor(p)); });
const periodError = computed(() => validatePeriod(period));

const summary = useLifeResource(getDashboardSummary);
const s = computed(() => summary.data.value || {});
watch(() => [period.from, period.to], () => { if (!periodError.value) summary.load({ from: period.from, to: period.to }); }, { immediate: true });

const kpis = computed(() => [
  { label: "Gross written premium", value: s.value.grossWrittenPremium, hint: "Falling due in the period, less refunds" },
  { label: "Premium collected", value: s.value.premiumCollected, hint: "Payments received in the period" },
  { label: "Premium outstanding", value: s.value.premiumOutstanding, hint: "Due and unpaid", tone: Number(s.value.premiumOutstanding) > 0 ? "warning" : "" },
  { label: "Claims paid", value: s.value.claimsPaid, hint: "Paid out in the period" },
  { label: "Sum assured in force", value: s.value.sumAssuredInForce, hint: "Active cover today" },
]);
const GROUPS = [
  { key: "quotationsByStatus", title: "Group quotations", path: "/life/quotations" },
  { key: "groupPoliciesByStatus", title: "Group policies", path: "/life/policies" },
  { key: "individualPoliciesByStatus", title: "Individual policies", path: "/life/individual" },
  { key: "claimsByStatus", title: "Claims", path: "/life/claims/insurance" },
];
const expiring = computed(() => [
  ["30 days", s.value.expiring?.within30Days],
  ["60 days", s.value.expiring?.within60Days],
  ["90 days", s.value.expiring?.within90Days],
]);
const loadingFirst = computed(() => summary.loading.value && !summary.data.value);
const canReports = lifeCan("Life_Report_View");
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader title="Life dashboard" subtitle="Premium, claims and policies for the period. Group figures cover your branches.">
      <template v-if="canReports" #actions><Button variant="outline" @click="router.push('/life/reports')">Reports</Button></template>
    </PageHeader>

    <div class="flex flex-wrap gap-3 items-end mb-5">
      <div class="w-44"><SelectField v-model="period.preset" label="Period" :options="[...PERIODS, { value: 'custom', label: 'Custom' }]" /></div>
      <div class="w-40"><TextField v-model="period.from" label="From" type="date" :max="period.to" @update:model-value="period.preset = 'custom'" /></div>
      <div class="w-40"><TextField v-model="period.to" label="To" type="date" :min="period.from" @update:model-value="period.preset = 'custom'" /></div>
      <p v-if="periodError" class="pb-2 text-sm text-error">{{ periodError }}</p>
    </div>

    <div v-if="summary.error.value && !summary.loading.value && !summary.data.value" class="flex flex-col gap-3 items-center px-6 py-16 text-center rounded-2xl border bg-surface border-line">
      <p class="text-sm font-semibold text-ink">Couldn't load the dashboard</p>
      <p class="max-w-md text-sm text-ink-muted">{{ summary.error.value }}</p>
      <Button size="sm" @click="summary.load({ from: period.from, to: period.to })">Try again</Button>
    </div>

    <template v-else>
      <dl class="grid gap-3 mb-5 sm:grid-cols-2 xl:grid-cols-5">
        <div v-for="k in kpis" :key="k.label" class="px-4 py-3 rounded-2xl border bg-surface border-line shadow-card">
          <dt class="text-xs text-ink-subtle">{{ k.label }}</dt>
          <dd :class="['mt-0.5 text-lg font-semibold tabular-nums', k.tone === 'warning' ? 'text-warning-strong' : 'text-ink']">{{ loadingFirst ? "…" : formatAmount(k.value ?? 0) }}</dd>
          <dd class="text-xs text-ink-subtle">{{ k.hint }}</dd>
        </div>
      </dl>

      <div class="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        <section v-for="g in GROUPS" :key="g.key" class="p-5 rounded-2xl border bg-surface border-line shadow-card">
          <div class="flex gap-3 justify-between items-baseline">
            <h2 class="text-sm font-semibold text-ink">{{ g.title }}</h2>
            <span class="text-sm tabular-nums text-ink-muted">{{ loadingFirst ? "…" : totalOf(s[g.key]) }}</span>
          </div>
          <ul class="grid gap-2 mt-3">
            <li v-if="!loadingFirst && !statusBreakdown(s[g.key]).length" class="text-sm text-ink-subtle">None in this period.</li>
            <li v-for="row in statusBreakdown(s[g.key])" :key="row.status">
              <button type="button" class="block w-full text-left rounded-lg group focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" @click="router.push(g.path)">
                <span class="flex justify-between text-sm"><span class="text-ink group-hover:underline">{{ row.label }}</span><span class="tabular-nums text-ink-muted">{{ row.count }}</span></span>
                <span class="block mt-1 h-1.5 rounded-full bg-surface-muted" aria-hidden="true"><span class="block h-1.5 rounded-full bg-primary" :style="{ width: `${Math.max(4, Math.round(row.share * 100))}%` }"></span></span>
              </button>
            </li>
          </ul>
        </section>
      </div>

      <section class="p-5 mt-5 rounded-2xl border bg-surface border-line shadow-card">
        <h2 class="text-sm font-semibold text-ink">Policies expiring</h2>
        <dl class="grid grid-cols-3 gap-3 mt-3 max-w-md">
          <div v-for="[label, n] in expiring" :key="label">
            <dt class="text-xs text-ink-subtle">Within {{ label }}</dt>
            <dd class="text-lg font-semibold tabular-nums text-ink">{{ loadingFirst ? "…" : n ?? 0 }}</dd>
          </div>
        </dl>
      </section>
    </template>
  </div>
</template>
