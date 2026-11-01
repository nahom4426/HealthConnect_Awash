<script setup>
// The health questionnaire of an individual policy: one answer per active question (AnswerRequest with
// benefitUuid, #30). The backend scores the answers when underwriting is run.
// data: { benefit: BenefitResponse, editable: boolean }
import { computed, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
import { toasted } from "@/utils/utils";
import { useLifeResource } from "../composables/useLifeResource";
import { benefitName } from "../individual/individualRules";
import { questionOptions, questionnaireForm, toAnswerRequest, validateQuestionnaire } from "../underwriting/caseRules";
import { createAnswer, getAnswers, getQuestions, updateAnswer } from "../api/underwritingApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const benefit = props.data?.benefit || {};
const editable = !!props.data?.editable;

const list = (d) => (Array.isArray(d) ? d : d?.content || []);
const questions = useLifeResource(() => getQuestions({ status: "ACTIVE" }), { initial: [], map: list });
const answers = useLifeResource(() => getAnswers({ benefitUuid: benefit.benefitUuid }), { initial: [], map: list });
const rows = ref([]);
const loading = ref(true);
Promise.all([questions.load(), answers.load()]).then(() => {
  rows.value = questionnaireForm(questions.data.value, answers.data.value);
  loading.value = false;
});
const error = computed(() => questions.error.value || answers.error.value);

const question = (id) => questions.data.value.find((q) => q.questionUuid === id) || {};
const choice = (q) => q.questionType === "Radio" || q.questionType === "Multiselect";
const followUp = (row) => questionOptions(question(row.questionUuid)).find((o) => o.value === row.possibleAnswerUuid)?.followUp;

const errors = ref(null);
const pending = ref(false);
async function save() {
  errors.value = validateQuestionnaire(rows.value, questions.data.value);
  if (errors.value) return;
  pending.value = true;
  let failed = 0;
  for (const row of rows.value) {
    const body = toAnswerRequest(row, question(row.questionUuid), benefit.benefitUuid);
    const res = row.answerUuid ? await updateAnswer(row.answerUuid, body) : await createAnswer(body);
    if (res?.success) row.answerUuid = res.data?.answerUuid || row.answerUuid;
    else failed++;
  }
  pending.value = false;
  if (failed) return; // the failing answers' errors are already shown; saved ones keep their uuid for the retry
  toasted(true, "Health questionnaire saved");
  closeModal(true);
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="lg" title="Health questionnaire" :subtitle="benefitName(benefit)">
      <form id="life-health-questionnaire" class="grid gap-4 p-5" novalidate @submit.prevent="save">
        <p v-if="loading" class="text-sm text-ink-muted">Loading…</p>
        <p v-else-if="error" class="text-sm text-error">{{ error }}</p>
        <p v-else-if="!rows.length" class="text-sm text-ink-muted">There are no active questions. Add them under Underwriting › Questionnaire.</p>
        <fieldset v-for="(row, i) in rows" v-else :key="row.questionUuid" :disabled="!editable" class="grid gap-3 p-4 rounded-xl border border-line">
          <legend class="px-1 text-sm font-medium text-ink">{{ i + 1 }}. {{ question(row.questionUuid).question }}</legend>
          <div v-if="choice(question(row.questionUuid))" class="flex flex-wrap gap-x-5 gap-y-2" role="radiogroup" :aria-label="question(row.questionUuid).question">
            <label v-for="o in questionOptions(question(row.questionUuid))" :key="o.value" class="inline-flex gap-2 items-center text-sm cursor-pointer text-ink">
              <input v-model="row.possibleAnswerUuid" type="radio" :name="`q-${row.questionUuid}`" :value="o.value" class="accent-primary" />
              {{ o.label }}
            </label>
          </div>
          <TextField v-else v-model="row.answer" label="Answer" :type="question(row.questionUuid).questionType === 'Numeric' ? 'number' : 'text'" :numeric="question(row.questionUuid).questionType === 'Numeric'" step="any" maxlength="500" />
          <p v-if="errors?.[i]?.answer" class="text-xs text-error">{{ errors[i].answer }}</p>
          <TextField v-if="followUp(row)" v-model="row.cascadedAnswer" :label="followUp(row)" maxlength="500" :error="errors?.[i]?.cascadedAnswer" />
        </fieldset>
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">{{ editable ? "Cancel" : "Close" }}</Button>
          <Button v-if="editable && rows.length" html-type="submit" form="life-health-questionnaire" :pending="pending">Save answers</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
