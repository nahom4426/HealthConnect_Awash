<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import ListTable from "@/components/ListTable.vue";
import TextField from "@/components/fields/TextField.vue";
import { toasted } from "@/utils/utils";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import PageNav from "@/components/PageNav.vue";
import { useLifePagedList } from "../../composables/useLifePagedList";
import { confirmAction } from "../../composables/confirmAction";
import { RecordStatus } from "../../constants/statuses";
import { QUESTION_TYPES, isChoice } from "../../underwriting/questionRules";
import { deleteQuestion, getQuestions, updateQuestionStatus } from "../../api/underwritingApi";

const router = useRouter();
const COLUMNS = [{ key: "question", label: "Question", class: "max-w-md" }, { key: "category", label: "Category" }, { key: "questionType", label: "Answered as" }, { key: "status", label: "Status" }, { key: "actions", label: "Actions", align: "right", srOnly: true }];
const TABS = { Active: RecordStatus.ACTIVE, Draft: RecordStatus.PENDING, Disabled: RecordStatus.DISABLED };
const list = useLifePagedList(getQuestions, { status: RecordStatus.ACTIVE });
list.reload();
const tab = computed({ get: () => Object.keys(TABS).find((k) => TABS[k] === list.status.value), set: (t) => (list.status.value = TABS[t]) });

const typeLabel = (t) => QUESTION_TYPES.find((x) => x.value === t)?.label ?? t ?? "—";
function detail(q) {
  if (isChoice(q.questionType)) {
    const n = (q.questionPossibleAnswer || []).filter((a) => !a.deleted).length;
    return `${n} answer${n === 1 ? "" : "s"}`;
  }
  if (q.questionType === "Numeric") {
    const n = (q.ranges || []).filter((r) => !r.deleted).length;
    return `${n} range${n === 1 ? "" : "s"}`;
  }
  return "Not scored";
}

const open = (q) => router.push(q ? `/life/underwriting/questions/${q.questionUuid}` : "/life/underwriting/questions/new");

function setStatus(q, status) {
  const activate = status === RecordStatus.ACTIVE;
  confirmAction(
    {
      title: `${activate ? "Activate" : "Disable"} this question?`,
      message: activate ? "Applicants will be asked it on new proposals." : "It stops being asked on new proposals. Answers already given are kept.",
      confirmText: activate ? "Activate" : "Disable",
      tone: activate ? "primary" : "danger",
    },
    async () => {
      const res = await updateQuestionStatus(q.questionUuid, status);
      if (res?.success) { toasted(true, activate ? "Question activated" : "Question disabled"); list.reload(); }
    }
  );
}

function remove(q) {
  confirmAction({ title: "Delete this question?", message: `“${q.question}” is removed from the questionnaire. This can't be undone; disable it instead to keep its history.`, confirmText: "Delete", tone: "danger" }, async () => {
    const res = await deleteQuestion(q.questionUuid);
    if (res?.success) { toasted(true, "Question deleted"); list.reload(); }
  });
}
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader title="Underwriting questionnaire" subtitle="Health and lifestyle questions applicants answer. Answers are scored, and critical answers send the proposal to an underwriter.">
      <template #actions>
        <Button variant="outline" @click="router.push('/life/underwriting/answers')">Answer library</Button>
        <Button @click="open()">Add question</Button>
      </template>
    </PageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
      <TabGroup v-model="tab" :tabs="Object.keys(TABS)" />
      <div class="w-72"><TextField v-model="list.search.value" type="search" placeholder="Search questions" aria-label="Search questions" /></div>
    </div>

    <ListTable
      :columns="COLUMNS"
      :rows="list.rows.value"
      row-key="questionUuid"
      :loading="list.loading.value"
      :error="list.error.value"
      error-title="Couldn't load questions"
      clickable
      @row-click="open"
      @retry="list.reload()"
    >
      <template #empty>
        <p class="text-sm font-semibold text-ink">{{ list.search.value ? "No questions match your search" : `No ${tab.toLowerCase()} questions` }}</p>
        <p v-if="!list.search.value && tab === 'Active'" class="mt-1 text-sm text-ink-muted">Add a question, or activate one of the drafts.</p>
      </template>
      <template #cell-question="{ row }"><span class="font-medium text-ink">{{ row.question }}</span></template>
      <template #cell-category="{ row }"><span class="text-ink-muted">{{ row.category || "—" }}</span></template>
      <template #cell-questionType="{ row }">
        <span class="whitespace-nowrap text-ink">{{ typeLabel(row.questionType) }}</span>
        <span class="block text-xs whitespace-nowrap text-ink-subtle">{{ detail(row) }}</span>
      </template>
      <template #cell-status="{ row }"><StatusBadge :status="row.status" /></template>
      <template #cell-actions="{ row }">
        <div class="flex gap-1 justify-end" @click.stop @keydown.enter.stop>
          <Button variant="ghost" size="sm" @click="open(row)">Edit</Button>
          <Button v-if="row.status !== 'ACTIVE'" variant="ghost" size="sm" @click="setStatus(row, 'ACTIVE')">Activate</Button>
          <Button v-else variant="ghost" size="sm" @click="setStatus(row, 'DISABLED')">Disable</Button>
          <Button v-if="row.status !== 'ACTIVE'" variant="ghost" size="sm" class="!text-error" @click="remove(row)">Delete</Button>
        </div>
      </template>
      <template #footer><PageNav v-model:page="list.page.value" :total-pages="list.totalPages.value" :disabled="list.loading.value" /></template>
    </ListTable>
  </div>
</template>
