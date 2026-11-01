<script setup>
// One underwriting case (GET /underwriting/{subjectUuid}): why it was referred, the scored answers,
// the medical requirements and the decision. Scores and the maximum loading are the backend's.
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import ListTable from "@/components/ListTable.vue";
import { lifeCan } from "@/features/life/privileges";
import { useLifeResource } from "../../composables/useLifeResource";
import { formatAmount, formatDate } from "../../constants/labels";
import { caseActions, caseStatusLabel, decisionLabel, outstandingRequirements } from "../../underwriting/caseRules";
import { getUnderwritingCase } from "../../api/underwritingCaseApi";

const route = useRoute();
const router = useRouter();
const subjectUuid = route.params.subjectUuid;

const kase = useLifeResource(getUnderwritingCase);
const c = computed(() => kase.data.value || {});
kase.load(subjectUuid);

const may = lifeCan("Life_Underwriting_Decide");
const can = computed(() => {
  const a = caseActions(c.value);
  return { requirements: a.requirements && may, decide: a.decide && may, redecide: a.redecide && may };
});
const waiting = computed(() => outstandingRequirements(c.value));
const back = computed(() => (c.value.benefitUuid ? `/life/individual/${c.value.benefitUuid}` : c.value.quotationUuid ? `/life/quotations/${c.value.quotationUuid}` : "/life/underwriting/cases"));

const facts = computed(() => [
  ["Status", caseStatusLabel(c.value.status)],
  ["Cover", c.value.benefitUuid ? "Individual policy" : "Group member"],
  ["Sum assured", c.value.sumAssured != null ? formatAmount(c.value.sumAssured) : ""],
  ["Above free cover limit", c.value.amountAboveFcl ? formatAmount(c.value.amountAboveFcl) : ""],
  ["Score", c.value.score != null ? String(c.value.score) : ""],
  ["Critical answer", c.value.criticalAnswer ? "Yes" : "No"],
  ["Maximum loading", c.value.maxLoadPercent != null ? `${c.value.maxLoadPercent}%` : ""],
]);
const answerColumns = [
  { key: "question", label: "Question" },
  { key: "answer", label: "Answer" },
  { key: "weight", label: "Weight", align: "right" },
];
const requirementColumns = computed(() => [
  { key: "label", label: "Requirement" },
  { key: "status", label: "Status" },
  { key: "result", label: "Result" },
  ...(can.value.requirements ? [{ key: "actions", label: "Actions", srOnly: true, align: "right" }] : []),
]);

const reload = (done) => done && kase.load(subjectUuid);
const decide = () => openModal("LifeUnderwritingDecision", { case: c.value }, reload);
const record = (requirement) => openModal("LifeMedicalRequirement", { case: c.value, requirement }, reload);
</script>

<template>
  <div class="p-4 md:p-6">
    <div v-if="kase.error.value && !kase.loading.value && !kase.data.value" class="flex flex-col gap-3 items-center px-6 py-16 text-center">
      <p class="text-sm font-semibold text-ink">Couldn't load this underwriting case</p>
      <p class="max-w-md text-sm text-ink-muted">{{ kase.error.value }}</p>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="router.push('/life/underwriting/cases')">Back to cases</Button>
        <Button size="sm" @click="kase.load(subjectUuid)">Try again</Button>
      </div>
    </div>

    <template v-else>
      <PageHeader :title="c.subjectName || (kase.loading.value ? 'Loading…' : 'Underwriting case')" subtitle="Underwriting" :back="back">
        <template v-if="c.status" #badge><StatusBadge :status="c.decision || c.status" /></template>
        <template #actions>
          <Button v-if="can.decide" @click="decide">Decide</Button>
          <Button v-else-if="can.redecide" variant="outline" @click="decide">Change decision</Button>
        </template>
      </PageHeader>

      <p v-if="may && waiting.length && c.status !== 'DECIDED'" class="px-4 py-2.5 mb-5 text-xs rounded-xl bg-surface-muted text-ink-muted">
        Record or waive every medical requirement before deciding. Waiting for: {{ waiting.map((r) => r.label).join(", ") }}.
      </p>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div class="grid gap-5 min-w-0">
          <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
            <h2 class="text-sm font-semibold text-ink">Why it was referred</h2>
            <ul v-if="c.reasons?.length" class="grid gap-1 mt-3 text-sm list-disc list-inside text-ink">
              <li v-for="r in c.reasons" :key="r">{{ r }}</li>
            </ul>
            <p v-else class="mt-2 text-sm text-ink-muted">{{ kase.loading.value ? "…" : "No reasons given." }}</p>
          </section>

          <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
            <h2 class="text-sm font-semibold text-ink">Medical requirements</h2>
            <ListTable bare class="mt-3" :columns="requirementColumns" :rows="c.requirements || []" row-key="requirementUuid" :loading="kase.loading.value && !c.status" empty-title="No medical requirements." :skeleton-rows="1">
              <template #cell-label="{ row }"><span class="text-ink">{{ row.label }}</span></template>
              <template #cell-status="{ row }">
                <StatusBadge :status="row.status" />
                <span v-if="row.receivedDate" class="block text-xs text-ink-subtle">{{ formatDate(row.receivedDate) }}</span>
              </template>
              <template #cell-result="{ row }"><span class="text-ink-muted">{{ row.result || "—" }}</span></template>
              <template #cell-actions="{ row }"><Button variant="ghost" size="sm" @click="record(row)">{{ row.status === "OUTSTANDING" ? "Record" : "Change" }}</Button></template>
            </ListTable>
          </section>

          <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
            <h2 class="text-sm font-semibold text-ink">Health questionnaire</h2>
            <ListTable bare class="mt-3" :columns="answerColumns" :rows="c.answers || []" row-key="answerUuid" :loading="kase.loading.value && !c.status" empty-title="No answers." :skeleton-rows="2">
              <template #cell-question="{ row }"><span class="text-ink">{{ row.question }}</span></template>
              <template #cell-answer="{ row }">
                <span :class="row.critical ? 'font-semibold text-error' : 'text-ink'">{{ row.answer }}</span>
                <span v-if="row.critical" class="block text-xs text-error">Critical</span>
              </template>
              <template #cell-weight="{ row }"><span class="tabular-nums text-ink-muted">{{ row.weight ?? "—" }}</span></template>
            </ListTable>
          </section>
        </div>

        <aside class="grid gap-5 self-start">
          <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
            <h2 class="text-sm font-semibold text-ink">Case</h2>
            <dl class="grid gap-2 mt-3">
              <div v-for="[label, value] in facts" :key="label" class="flex gap-3 justify-between text-sm">
                <dt class="text-ink-subtle">{{ label }}</dt>
                <dd class="text-right text-ink">{{ value || "—" }}</dd>
              </div>
            </dl>
          </section>
          <section v-if="c.decision" class="p-5 rounded-2xl border bg-surface border-line shadow-card">
            <h2 class="text-sm font-semibold text-ink">Decision</h2>
            <p class="mt-2 text-sm font-medium text-ink">{{ decisionLabel(c.decision) }}</p>
            <p v-if="c.loadingPercent" class="text-sm text-ink-muted">Loading {{ c.loadingPercent }}%</p>
            <ul v-if="c.exclusions?.length" class="mt-1 text-sm list-disc list-inside text-ink-muted"><li v-for="x in c.exclusions" :key="x">{{ x }}</li></ul>
            <p v-if="c.postponeUntil" class="text-sm text-ink-muted">Until {{ formatDate(c.postponeUntil) }}</p>
            <p v-if="c.note" class="mt-2 text-sm whitespace-pre-line text-ink-muted">{{ c.note }}</p>
            <p v-if="c.decidedDate" class="mt-2 text-xs text-ink-subtle">Decided {{ formatDate(c.decidedDate) }}</p>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
