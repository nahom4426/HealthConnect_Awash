<script setup>
// Shared answers that choice questions offer (GET /possible-answer/active returns the whole list).
import { computed, ref } from "vue";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import LifePageHeader from "../../components/LifePageHeader.vue";
import { useLifeResource } from "../../composables/useLifeResource";
import { confirmAction } from "../../composables/confirmAction";
import { deletePossibleAnswer, getAllPossibleAnswers } from "../../api/underwritingApi";

const answers = useLifeResource(getAllPossibleAnswers, { initial: [] });
answers.load();

const search = ref("");
const visible = computed(() => {
  const q = search.value.trim().toLowerCase();
  const list = [...(answers.data.value || [])].sort((a, b) => String(a.answer).localeCompare(String(b.answer)));
  return q ? list.filter((a) => String(a.answer).toLowerCase().includes(q)) : list;
});

const edit = (answer) => openModal("LifePossibleAnswerForm", { answer, initial: answer ? undefined : search.value.trim() }, (saved) => saved && answers.load());

function remove(a) {
  confirmAction(
    { title: `Delete “${a.answer}”?`, message: "Questions that offer this answer lose the option. Answers applicants already gave are kept. This can't be undone.", confirmText: "Delete", tone: "danger" },
    async () => {
      const res = await deletePossibleAnswer(a.possibleAnswerUuid);
      if (res?.success) { toasted(true, "Answer deleted"); answers.load(); }
    }
  );
}
</script>

<template>
  <div class="p-4 md:p-6">
    <LifePageHeader title="Answer library" subtitle="Reusable answers for single- and multiple-choice questions. Each question sets its own score for an answer.">
      <template #actions><Button @click="edit()">Add answer</Button></template>
    </LifePageHeader>

    <div class="flex flex-wrap gap-3 justify-between items-center mb-4">
      <input v-model="search" type="search" placeholder="Search answers" aria-label="Search answers" class="px-3 w-72 h-9 text-sm rounded-lg border outline-none bg-surface border-line text-ink focus:border-primary focus:ring-2 focus:ring-primary/15" />
      <span v-if="!answers.loading.value && !answers.error.value" class="text-xs text-ink-subtle">{{ visible.length }} of {{ answers.data.value.length }} answers</span>
    </div>

    <section class="overflow-hidden rounded-2xl border bg-surface border-line shadow-card">
      <div v-if="answers.error.value && !answers.loading.value" class="flex flex-col gap-3 items-center px-6 py-12 text-center">
        <p class="text-sm font-semibold text-ink">Couldn't load the answer library</p>
        <p class="max-w-md text-sm text-ink-muted">{{ answers.error.value }}</p>
        <Button variant="outline" size="sm" @click="answers.load()">Try again</Button>
      </div>
      <ul v-else-if="answers.loading.value" class="divide-y divide-line">
        <li v-for="i in 6" :key="i" class="px-4 py-3.5"><div class="w-1/3 h-4 rounded animate-pulse bg-surface-raised"></div></li>
      </ul>
      <div v-else-if="!visible.length" class="flex flex-col gap-3 items-center px-6 py-14 text-center">
        <p class="text-sm font-semibold text-ink">{{ search ? "No answers match your search" : "The library is empty" }}</p>
        <p class="max-w-md text-sm text-ink-muted">{{ search ? "Add it as a new answer so questions can offer it." : "Start with the answers most questions share, like Yes and No." }}</p>
        <Button size="sm" @click="edit()">{{ search ? `Add “${search.trim()}”` : "Add answer" }}</Button>
      </div>
      <ul v-else class="divide-y divide-line">
        <li v-for="a in visible" :key="a.possibleAnswerUuid" class="flex gap-3 justify-between items-center px-4 py-2.5 hover:bg-surface-muted/60">
          <span class="text-sm text-ink">{{ a.answer }}</span>
          <div class="flex gap-1">
            <Button variant="ghost" size="sm" @click="edit(a)">Edit</Button>
            <Button variant="ghost" size="sm" class="!text-error" @click="remove(a)">Delete</Button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
