<script setup>
// Details, premium (as recorded by the backend) and timeline of a group quotation / policy.
import { computed } from "vue";
import { formatAmount, formatDate } from "../constants/labels";

const props = defineProps({ quotation: { type: Object, required: true } });
const q = computed(() => props.quotation || {});

const details = computed(() => [
  ["Institution", q.value.institutionName],
  ["Term", q.value.term ? `${q.value.term} year${q.value.term === 1 ? "" : "s"}` : null],
  ["Contact person", q.value.contactPersonFullName],
  ["Contact phone", q.value.contactPhone],
  ["Prepared by", q.value.quotedByFullName],
  ["Quotation number", q.value.quotationNumber],
  ["Institution life insurance no.", q.value.institutionLifeInsuranceNumber],
  ["PO number", q.value.poNumber],
  ["PV number", q.value.pvNumber],
]);
const money = computed(() => [
  ["Term premium", formatAmount(q.value.termPremium)],
  ["Rider premium", formatAmount(q.value.riderPremium)],
  ["Gross premium", formatAmount(q.value.grossPremium)],
  ["Requested premium", formatAmount(q.value.requestedPremium)],
  ["Withholding tax", formatAmount(q.value.withHoldingTax)],
  ["Revenue stamp", formatAmount(q.value.revenueStamp)],
  ["Net premium", formatAmount(q.value.netPremium)],
  ["Free cover limit", formatAmount(q.value.fclAmount)],
  ["Average sum-assured multiplier", q.value.averageSumassuredMultiplier ?? "—"],
]);
const timeline = computed(() => [
  ["Created", q.value.createdAt ?? q.value.audit?.createdAt],
  ["Issued", q.value.issueDate],
  ["Accepted", q.value.acceptedDate],
  ["Paid", q.value.paidDate, q.value.paidByFullName],
  ["Policy issued", q.value.policyIssuedDate],
]);
</script>

<template>
  <div class="grid gap-5 lg:grid-cols-3">
    <section class="p-5 rounded-2xl border lg:col-span-2 bg-surface border-line shadow-card">
      <h2 class="text-sm font-semibold text-ink">Quotation</h2>
      <dl class="grid gap-x-6 gap-y-3 mt-3 sm:grid-cols-2">
        <div v-for="[label, value] in details" :key="label">
          <dt class="text-xs text-ink-subtle">{{ label }}</dt>
          <dd class="text-sm text-ink">{{ value || "—" }}</dd>
        </div>
      </dl>
      <h2 class="mt-6 text-sm font-semibold text-ink">Premium</h2>
      <p class="text-xs text-ink-subtle">As calculated and recorded by the system.</p>
      <dl class="grid gap-x-6 gap-y-3 mt-3 sm:grid-cols-3">
        <div v-for="[label, value] in money" :key="label">
          <dt class="text-xs text-ink-subtle">{{ label }}</dt>
          <dd class="text-sm tabular-nums text-ink">{{ value }}</dd>
        </div>
      </dl>
    </section>
    <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
      <h2 class="text-sm font-semibold text-ink">Timeline</h2>
      <ol class="grid gap-3 mt-3">
        <li v-for="[label, date, by] in timeline" :key="label" class="flex gap-3 items-start">
          <span :class="['mt-1.5 w-2 h-2 rounded-full shrink-0', date ? 'bg-primary' : 'bg-line']"></span>
          <span class="text-sm">
            <span :class="date ? 'text-ink' : 'text-ink-subtle'">{{ label }}</span>
            <span class="block text-xs text-ink-subtle">{{ date ? formatDate(date) : "Not yet" }}{{ by ? ` · ${by}` : "" }}</span>
          </span>
        </li>
      </ol>
      <template v-if="q.beginDate">
        <h2 class="mt-6 text-sm font-semibold text-ink">Cover period</h2>
        <p class="mt-1 text-sm text-ink">{{ formatDate(q.beginDate) }} – {{ formatDate(q.endDate) }}</p>
      </template>
    </section>
  </div>
</template>
