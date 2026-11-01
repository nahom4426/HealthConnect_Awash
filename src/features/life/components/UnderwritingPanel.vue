<script setup>
// Underwriting for one group quotation or individual policy: run the check (POST /underwriting/evaluate)
// and list the cases it opened. Group: members above the free cover limit (generate the treaty report
// first). Individual: critical answers, a high score or the medical range.
import { computed } from "vue";
import { useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import ListTable from "@/components/ListTable.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import { toasted } from "@/utils/utils";
import { useLifeResource } from "../composables/useLifeResource";
import { formatAmount } from "../constants/labels";
import { decisionLabel } from "../underwriting/caseRules";
import { evaluateUnderwriting, getUnderwritingQueue } from "../api/underwritingCaseApi";

const props = defineProps({
  /** { quotationUuid } or { benefitUuid } */
  subject: { type: Object, required: true },
  /** may run the check (draft and Life_Underwriting_Decide) */
  editable: { type: Boolean, default: false },
});
const emit = defineEmits(["changed"]);
const router = useRouter();

const cases = useLifeResource(() => getUnderwritingQueue(props.subject), { initial: [], map: (d) => (Array.isArray(d) ? d : d?.content || []) });
cases.load();
const open = computed(() => cases.data.value.filter((c) => c.status !== "DECIDED").length);

const running = useLifeResource(() => evaluateUnderwriting(props.subject));
async function evaluate() {
  const res = await running.load();
  if (!res?.success) return;
  const n = Array.isArray(res.data) ? res.data.length : 0;
  toasted(true, n ? `${n} case${n === 1 ? "" : "s"} referred to underwriting` : "Nothing needs underwriting");
  cases.load();
  emit("changed");
}

const columns = [
  { key: "subject", label: "Person" },
  { key: "sumAssured", label: "Sum assured", align: "right" },
  { key: "reasons", label: "Referred because" },
  { key: "outcome", label: "Status" },
];
const openCase = (c) => router.push(`/life/underwriting/cases/${c.insuredUuid || c.benefitUuid}`);
defineExpose({ reload: () => cases.load() });
</script>

<template>
  <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
    <div class="flex flex-wrap gap-3 justify-between items-start">
      <div>
        <h2 class="text-sm font-semibold text-ink">Underwriting</h2>
        <p class="text-xs text-ink-muted">
          <template v-if="subject.quotationUuid">Members above the free cover limit are referred. Generate the treaty report first.</template>
          <template v-else>Referred on a critical answer, a high questionnaire score or the medical range.</template>
          <template v-if="open"> {{ open }} still to decide; it can't be issued until they are.</template>
        </p>
      </div>
      <Button v-if="editable" size="sm" variant="outline" :pending="running.loading.value" @click="evaluate">Run underwriting check</Button>
    </div>
    <ListTable
      bare
      class="mt-3"
      :columns="columns"
      :rows="cases.data.value"
      row-key="caseUuid"
      :loading="cases.loading.value"
      :error="cases.error.value"
      error-title="Couldn't load underwriting cases"
      empty-title="No underwriting cases."
      :skeleton-rows="1"
      clickable
      @row-click="openCase"
      @retry="cases.load()"
    >
      <template #cell-subject="{ row }"><span class="text-ink">{{ row.subjectName || "—" }}</span></template>
      <template #cell-sumAssured="{ row }"><span class="tabular-nums text-ink">{{ formatAmount(row.sumAssured) }}</span></template>
      <template #cell-reasons="{ row }"><span class="text-ink-muted">{{ (row.reasons || []).join("; ") || "—" }}</span></template>
      <template #cell-outcome="{ row }">
        <span v-if="row.decision" class="text-ink">{{ decisionLabel(row.decision) }}</span>
        <StatusBadge v-else :status="row.status" />
      </template>
    </ListTable>
  </section>
</template>
