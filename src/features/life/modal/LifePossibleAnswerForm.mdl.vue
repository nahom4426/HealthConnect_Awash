<script setup>
// Create or rename an answer in the shared answer library (PossibleAnswerRequest: answer ≤ 250).
// data: { answer?: PossibleAnswerResponse, initial?: string }. Closes with the saved PossibleAnswerResponse.
import { ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import { createPossibleAnswer, updatePossibleAnswer } from "../api/underwritingApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const current = props.data?.answer;
const editing = !!current?.possibleAnswerUuid;

const answer = ref(current?.answer ?? props.data?.initial ?? "");
const error = ref("");
const pending = ref(false);

async function submit() {
  const text = answer.value.trim();
  error.value = !text ? "Write the answer" : text.length > 250 ? "At most 250 characters" : "";
  if (error.value) return;
  pending.value = true;
  const res = editing ? await updatePossibleAnswer(current.possibleAnswerUuid, { answer: text }) : await createPossibleAnswer({ answer: text });
  pending.value = false;
  if (res?.success) {
    toasted(true, editing ? "Answer updated" : "Answer added to the library");
    closeModal(res.data || true);
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="editing ? 'Edit answer' : 'Add answer'" :subtitle="editing ? 'Every question that offers this answer shows the new wording.' : 'Answers are shared: any question can offer them.'">
      <form id="life-possible-answer-form" class="grid gap-4 p-5" novalidate @submit.prevent="submit">
        <label class="flex flex-col gap-1 text-sm font-medium text-ink">
          Answer
          <input
            v-model="answer"
            v-focus="true"
            maxlength="250"
            placeholder="e.g. Yes, within the last 5 years"
            :class="['px-3 w-full h-10 text-sm rounded-lg border outline-none bg-surface text-ink focus:border-primary focus:ring-2 focus:ring-primary/15', error ? 'border-error' : 'border-line']"
          />
          <span v-if="error" class="text-xs text-error">{{ error }}</span>
        </label>
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-possible-answer-form" :pending="pending">{{ editing ? "Save changes" : "Add answer" }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
