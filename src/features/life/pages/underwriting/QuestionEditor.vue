<script setup>
// Create or edit one underwriting question (QuestionRequest). Choice questions pick their
// options from the answer library and score each; numeric questions score value ranges.
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
import TextareaField from "@/components/fields/TextareaField.vue";
import { toasted } from "@/utils/utils";
import PageHeader from "@/components/PageHeader.vue";
import StatusBadge from "@/components/StatusBadge.vue";
import RateTableEditor from "../../components/RateTableEditor.vue";
import { useLifeResource } from "../../composables/useLifeResource";
import { QuestionType, RecordStatus } from "../../constants/statuses";
import { QUESTION_TYPES, answerOptionSpec, fromQuestion, isChoice, rangeSpec, toQuestionRequest, validateQuestion } from "../../underwriting/questionRules";
import { createQuestion, getAllPossibleAnswers, getQuestion, updateQuestion } from "../../api/underwritingApi";

const route = useRoute();
const router = useRouter();
const questionUuid = route.params.questionUuid;
const editing = !!questionUuid;

const form = reactive({ question: "", category: "", questionType: "", status: "" });
const initialAnswers = ref([]);
const initialRanges = ref([]);
const errors = ref({});
const saving = ref("");

const library = useLifeResource(getAllPossibleAnswers, { initial: [] });
library.load();
const answerSpec = computed(() => answerOptionSpec(library.data.value || []));

const question = useLifeResource(getQuestion);
if (editing) {
  question.load(questionUuid).then((res) => {
    if (!res?.success) return;
    const state = fromQuestion(res.data);
    Object.assign(form, state.form);
    initialAnswers.value = state.answers;
    initialRanges.value = state.ranges;
  });
}

const answersEditor = ref(null);
const rangesEditor = ref(null);

// Live preview of what the applicant sees, from the rows being typed
const previewAnswers = computed(() => (answersEditor.value?.editRows || []).map((r) => ({ ...r, label: library.data.value.find((a) => a.possibleAnswerUuid === r.possibleAnswerUuid)?.answer })).filter((r) => r.label));
const previewRanges = computed(() => (rangesEditor.value?.editRows || []).filter((r) => r.lower !== "" && r.upper !== ""));

function addToLibrary() {
  openModal("LifePossibleAnswerForm", {}, (saved) => saved && library.load());
}

async function save(status) {
  const answers = answersEditor.value?.collect() ?? { valid: true, rows: [] };
  const ranges = rangesEditor.value?.collect() ?? { valid: true, rows: [] };
  errors.value = validateQuestion(form, answers.rows, ranges.rows);
  const gridOk = isChoice(form.questionType) ? answers.valid : form.questionType === QuestionType.Numeric ? ranges.valid : true;
  if (Object.keys(errors.value).length || !gridOk) {
    toasted(false, "Check the highlighted fields");
    return;
  }
  saving.value = status;
  const body = toQuestionRequest(form, answers.rows, ranges.rows, status);
  const res = editing ? await updateQuestion(questionUuid, body) : await createQuestion(body);
  saving.value = "";
  if (res?.success) {
    toasted(true, status === RecordStatus.ACTIVE ? "Question saved and active" : editing ? "Question saved" : "Draft saved");
    router.push("/life/underwriting/questions");
  }
}
</script>

<template>
  <div class="p-4 md:p-6">
    <PageHeader :title="editing ? 'Edit question' : 'New question'" back="/life/underwriting/questions" subtitle="Write the question, choose how it is answered, then score the answers.">
      <template v-if="editing && form.status" #badge><StatusBadge :status="form.status" /></template>
      <template #actions>
        <template v-if="!editing || form.status !== 'ACTIVE'">
          <Button variant="outline" :pending="!!saving && saving !== 'ACTIVE'" :disabled="!!saving || question.loading.value" @click="save(editing ? form.status || 'PENDING' : 'PENDING')">{{ editing ? "Save changes" : "Save as draft" }}</Button>
          <Button :pending="saving === 'ACTIVE'" :disabled="!!saving || question.loading.value" @click="save('ACTIVE')">Save and activate</Button>
        </template>
        <Button v-else :pending="saving === 'ACTIVE'" :disabled="!!saving" @click="save('ACTIVE')">Save changes</Button>
      </template>
    </PageHeader>

    <div v-if="question.error.value && !question.loading.value" class="flex flex-col gap-3 items-center px-6 py-12 text-center rounded-2xl border bg-surface border-line">
      <p class="text-sm font-semibold text-ink">Couldn't load this question</p>
      <p class="max-w-md text-sm text-ink-muted">{{ question.error.value }}</p>
      <Button variant="outline" size="sm" @click="question.load(questionUuid)">Try again</Button>
    </div>

    <div v-else class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div class="grid gap-5 min-w-0">
        <!-- Wording -->
        <section class="grid gap-4 p-5 rounded-2xl border bg-surface border-line shadow-card">
          <TextareaField v-model="form.question" label="Question" rows="2" :maxlength="250" counter placeholder="e.g. Have you ever been diagnosed with high blood pressure?" :disabled="question.loading.value" :error="errors.question" />
          <div class="sm:w-80"><TextField v-model="form.category" label="Category" hint="Groups questions on the form, e.g. Medical history or Lifestyle" maxlength="50" :disabled="question.loading.value" :error="errors.category" /></div>
        </section>

        <!-- Answer type -->
        <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
          <h2 class="text-sm font-semibold text-ink">How is it answered?</h2>
          <div role="radiogroup" aria-label="Answer type" class="grid gap-3 mt-3 sm:grid-cols-2 2xl:grid-cols-4">
            <button
              v-for="t in QUESTION_TYPES"
              :key="t.value"
              type="button"
              role="radio"
              :aria-checked="form.questionType === t.value"
              :disabled="question.loading.value"
              :class="['p-3 text-left rounded-xl border transition-colors', form.questionType === t.value ? 'border-primary bg-primary/5 ring-2 ring-primary/15' : 'border-line hover:border-primary/50']"
              @click="form.questionType = t.value"
            >
              <span class="block text-sm font-semibold text-ink">{{ t.label }}</span>
              <span class="block mt-0.5 text-xs text-ink-muted">{{ t.hint }}</span>
            </button>
          </div>
          <p v-if="errors.questionType" class="mt-2 text-xs text-error">{{ errors.questionType }}</p>
        </section>

        <!-- Answer options (both grids stay mounted so switching type doesn't lose what was typed) -->
        <div v-show="isChoice(form.questionType)" class="grid gap-2">
          <div class="flex flex-wrap gap-2 justify-between items-end">
            <div>
              <h2 class="text-sm font-semibold text-ink">Answer options</h2>
              <p class="text-xs text-ink-muted">Pick answers from the library and score each. Critical answers send the proposal to an underwriter.</p>
            </div>
            <Button variant="ghost" size="sm" @click="addToLibrary">New library answer</Button>
          </div>
          <p v-if="errors.answers" class="text-xs text-error">{{ errors.answers }}</p>
          <RateTableEditor
            ref="answersEditor"
            :spec="answerSpec"
            :rows="initialAnswers"
            :loading="question.loading.value || library.loading.value"
            :load-error="library.error.value"
            collect-only
            keep-order
            empty-hint="Add a row for each answer the applicant can choose."
            @retry="library.load()"
          />
        </div>
        <div v-show="form.questionType === 'Numeric'" class="grid gap-2">
          <div>
            <h2 class="text-sm font-semibold text-ink">Score ranges</h2>
            <p class="text-xs text-ink-muted">The applicant's number is scored by the range it falls in. Ranges must not overlap.</p>
          </div>
          <p v-if="errors.ranges" class="text-xs text-error">{{ errors.ranges }}</p>
          <RateTableEditor ref="rangesEditor" :spec="rangeSpec" :rows="initialRanges" :loading="question.loading.value" collect-only empty-hint="Add a row for each band, e.g. 0–10 and 11–20." />
        </div>
        <p v-if="form.questionType === 'Text'" class="px-4 py-3 text-sm rounded-xl border bg-surface-muted border-line text-ink-muted">
          Free-text answers aren't scored. The underwriter reads them when reviewing the proposal.
        </p>
      </div>

      <!-- Applicant preview -->
      <aside class="self-start p-5 rounded-2xl border xl:sticky xl:top-4 bg-surface border-line shadow-card">
        <p class="text-xs font-semibold tracking-wide uppercase text-ink-subtle">Applicant sees</p>
        <p v-if="form.category" class="mt-3 text-xs font-medium text-primary">{{ form.category }}</p>
        <p class="mt-1 text-sm font-semibold text-ink">{{ form.question || "Your question appears here" }}</p>
        <div class="grid gap-2 mt-3 text-sm text-ink">
          <template v-if="isChoice(form.questionType)">
            <label v-for="a in previewAnswers" :key="a._key" class="flex gap-2 items-center">
              <input :type="form.questionType === 'Radio' ? 'radio' : 'checkbox'" name="preview" disabled />
              <span>{{ a.label }}</span>
              <span v-if="a.critical" class="ml-auto text-xs font-semibold text-error-strong">Critical</span>
            </label>
            <p v-if="!previewAnswers.length" class="text-xs text-ink-subtle">No answers yet</p>
          </template>
          <template v-else-if="form.questionType === 'Numeric'">
            <input type="number" disabled placeholder="Number" class="px-3 h-9 rounded-lg border bg-surface-muted border-line" />
            <p v-for="r in previewRanges" :key="r._key" class="flex justify-between text-xs text-ink-muted">
              <span>{{ r.lower }} – {{ r.upper }}</span>
              <span>score {{ r.weight || 0 }}<span v-if="r.critical" class="font-semibold text-error-strong"> · critical</span></span>
            </p>
          </template>
          <textarea v-else-if="form.questionType === 'Text'" disabled rows="2" placeholder="Written answer" class="px-3 py-2 rounded-lg border bg-surface-muted border-line" />
          <p v-else class="text-xs text-ink-subtle">Choose how it is answered</p>
        </div>
      </aside>
    </div>
  </div>
</template>
