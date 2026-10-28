<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import Button from "@/components/Button.vue";
import TabGroup from "@/components/TabGroup.vue";
import { toasted } from "@/utils/utils";
import LifePageHeader from "../../components/LifePageHeader.vue";
import LifeStatusBadge from "../../components/LifeStatusBadge.vue";
import LifePager from "../../components/LifePager.vue";
import { useLifePagedList } from "../../composables/useLifePagedList";
import { confirmAction } from "../../composables/confirmAction";
import { RecordStatus } from "../../constants/statuses";
import { QUESTION_TYPES, fromQuestion, isChoice, toQuestionRequest } from "../../underwriting/questionRules";
import { deleteQuestion, getQuestion, getQuestions, updateQuestion } from "../../api/underwritingApi";

const router = useRouter();
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

// There is no status-only endpoint: the full question is reloaded and sent back with the new status
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
      const fresh = await getQuestion(q.questionUuid);
      if (!fresh?.success) return;
      const { form, answers, ranges } = fromQuestion(fresh.data);
      const res = await updateQuestion(q.questionUuid, toQuestionRequest(form, answers, ranges, status));
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
    <LifePageHeader title="Underwriting questionnaire" subtitle="Health and lifestyle questions applicants answer. Answers are scored, and critical answers send the proposal to an underwriter.">
      <template #actions>
        <Button variant="outline" @click="router.push('/life/underwriting/answers')">Answer library</Button>
        <Button @click="open()">Add question</Button>
      </template>
    </LifePageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
      <TabGroup v-model="tab" :tabs="Object.keys(TABS)" />
      <input v-model="list.search.value" type="search" placeholder="Search questions" aria-label="Search questions" class="px-3 w-72 h-9 text-sm rounded-lg border outline-none bg-surface border-line text-ink focus:border-primary focus:ring-2 focus:ring-primary/15" />
    </div>

    <section class="overflow-hidden rounded-2xl border bg-surface border-line shadow-card">
      <div v-if="list.error.value && !list.loading.value" class="flex flex-col gap-3 items-center px-6 py-12 text-center">
        <p class="text-sm font-semibold text-ink">Couldn't load questions</p>
        <p class="max-w-md text-sm text-ink-muted">{{ list.error.value }}</p>
        <Button variant="outline" size="sm" @click="list.reload()">Try again</Button>
      </div>
      <table v-else class="w-full text-sm">
        <thead class="bg-surface-muted">
          <tr class="text-xs font-semibold tracking-wide text-left uppercase text-ink-subtle">
            <th class="px-4 py-3">Question</th>
            <th class="px-4 py-3">Category</th>
            <th class="px-4 py-3">Answered as</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3 text-right"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <template v-if="list.loading.value">
            <tr v-for="i in 5" :key="i" class="border-t border-line"><td v-for="j in 5" :key="j" class="px-4 py-3.5"><div class="h-4 rounded animate-pulse bg-surface-raised"></div></td></tr>
          </template>
          <tr v-else-if="!list.rows.value.length">
            <td colspan="5" class="px-6 py-14 text-center">
              <p class="text-sm font-semibold text-ink">{{ list.search.value ? "No questions match your search" : `No ${tab.toLowerCase()} questions` }}</p>
              <p v-if="!list.search.value && tab === 'Active'" class="mt-1 text-sm text-ink-muted">Add a question, or activate one of the drafts.</p>
            </td>
          </tr>
          <tr v-for="q in list.rows.value" v-else :key="q.questionUuid" class="border-t cursor-pointer border-line hover:bg-surface-muted/60" @click="open(q)">
            <td class="px-4 py-3 max-w-md font-medium text-ink">{{ q.question }}</td>
            <td class="px-4 py-3 text-ink-muted">{{ q.category || "—" }}</td>
            <td class="px-4 py-3 whitespace-nowrap">
              <span class="text-ink">{{ typeLabel(q.questionType) }}</span>
              <span class="block text-xs text-ink-subtle">{{ detail(q) }}</span>
            </td>
            <td class="px-4 py-3"><LifeStatusBadge :status="q.status" /></td>
            <td class="px-4 py-3" @click.stop>
              <div class="flex gap-1 justify-end">
                <Button variant="ghost" size="sm" @click="open(q)">Edit</Button>
                <Button v-if="q.status !== 'ACTIVE'" variant="ghost" size="sm" @click="setStatus(q, 'ACTIVE')">Activate</Button>
                <Button v-else variant="ghost" size="sm" @click="setStatus(q, 'DISABLED')">Disable</Button>
                <Button v-if="q.status !== 'ACTIVE'" variant="ghost" size="sm" class="!text-error" @click="remove(q)">Delete</Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <LifePager v-model:page="list.page.value" :total-pages="list.totalPages.value" :disabled="list.loading.value" />
    </section>
  </div>
</template>
