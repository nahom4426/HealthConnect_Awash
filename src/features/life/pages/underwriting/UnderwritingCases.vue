<script setup>
// The underwriter's work queue: open and decided cases across group quotations and individual policies
// (GET /underwriting/queue?status=).
import { computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import TabGroup from "@/components/TabGroup.vue";
import PageHeader from "@/components/PageHeader.vue";
import ListTable from "@/components/ListTable.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { useLifeResource } from "../../composables/useLifeResource";
import { formatAmount, formatDate } from "../../constants/labels";
import { CASE_STATUSES, decisionLabel } from "../../underwriting/caseRules";
import { getUnderwritingQueue } from "../../api/underwritingCaseApi";

const route = useRoute();
const router = useRouter();
const status = computed(() => (CASE_STATUSES.some((s) => s.value === route.query.status) ? route.query.status : CASE_STATUSES[0].value));
const tab = computed({
  get: () => CASE_STATUSES.find((s) => s.value === status.value)?.label,
  set: (label) => router.replace({ query: { status: CASE_STATUSES.find((s) => s.label === label)?.value } }),
});

const cases = useLifeResource((s) => getUnderwritingQueue({ status: s }), { initial: [], map: (d) => (Array.isArray(d) ? d : d?.content || []) });
watch(status, (s) => cases.load(s), { immediate: true });

const columns = [
  { key: "subject", label: "Person" },
  { key: "cover", label: "Cover" },
  { key: "sumAssured", label: "Sum assured", align: "right" },
  { key: "reasons", label: "Referred because" },
  { key: "outcome", label: "Status" },
  { key: "updated", label: "Updated" },
];
const open = (c) => router.push(`/life/underwriting/cases/${c.insuredUuid || c.benefitUuid}`);
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader title="Underwriting cases" subtitle="Proposals referred by the questionnaire score, a critical answer or the free cover limit." />
    <TabGroup v-model="tab" :tabs="CASE_STATUSES.map((s) => s.label)" class="mb-4" />
    <ListTable
      :columns="columns"
      :rows="cases.data.value"
      row-key="caseUuid"
      :loading="cases.loading.value"
      :error="cases.error.value"
      error-title="Couldn't load underwriting cases"
      :empty-title="`No cases ${tab?.toLowerCase()}`"
      :skeleton-rows="5"
      clickable
      @row-click="open"
      @retry="cases.load(status)"
    >
      <template #cell-subject="{ row }"><span class="font-medium text-ink">{{ row.subjectName || "—" }}</span></template>
      <template #cell-cover="{ row }"><span class="text-ink-muted">{{ row.benefitUuid ? "Individual policy" : "Group member" }}</span></template>
      <template #cell-sumAssured="{ row }"><span class="tabular-nums text-ink">{{ formatAmount(row.sumAssured) }}</span></template>
      <template #cell-reasons="{ row }"><span class="text-ink-muted">{{ (row.reasons || []).join("; ") || "—" }}</span></template>
      <template #cell-outcome="{ row }">
        <span v-if="row.decision" class="text-ink">{{ decisionLabel(row.decision) }}</span>
        <StatusBadge v-else :status="row.status" />
      </template>
      <template #cell-updated="{ row }"><span class="whitespace-nowrap text-ink-muted">{{ formatDate(row.decidedDate ?? row.audit?.updatedAt ?? row.audit?.createdAt) }}</span></template>
    </ListTable>
  </div>
</template>
