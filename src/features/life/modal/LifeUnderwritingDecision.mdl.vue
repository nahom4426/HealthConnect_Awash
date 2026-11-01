<script setup>
// Decide an underwriting case (PUT /underwriting/{subject}/decision). LOADED raises the term premium
// (the backend reprices it); DECLINED or POSTPONED takes a group member out of cover and blocks
// issuing an individual policy. data: { case: UnderwritingCaseResponse }
import { reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
import TextareaField from "@/components/fields/TextareaField.vue";
import { toasted } from "@/utils/utils";
import { DECISIONS, fromDecision, toDecisionRequest, validateDecision } from "../underwriting/caseRules";
import { decideUnderwriting } from "../api/underwritingCaseApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const c = props.data?.case || {};
const subjectUuid = c.insuredUuid || c.benefitUuid;

const form = reactive(fromDecision(c));
const errors = ref({});
const pending = ref(false);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

async function submit() {
  errors.value = validateDecision(form, c);
  if (Object.keys(errors.value).length) return;
  pending.value = true;
  const res = await decideUnderwriting(subjectUuid, toDecisionRequest(form));
  pending.value = false;
  if (res?.success) {
    toasted(true, "Decision saved");
    closeModal(true);
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" title="Underwriting decision" :subtitle="c.subjectName">
      <form id="life-underwriting-decision" class="grid gap-4 p-5" novalidate @submit.prevent="submit">
        <fieldset class="grid gap-2">
          <legend class="mb-1 text-sm font-medium text-ink">Decision</legend>
          <label v-for="d in DECISIONS" :key="d.value" class="inline-flex gap-2 items-center text-sm cursor-pointer text-ink">
            <input v-model="form.decision" type="radio" name="decision" :value="d.value" class="accent-primary" />
            {{ d.label }}
          </label>
          <p v-if="errors.decision" class="text-xs text-error">{{ errors.decision }}</p>
        </fieldset>
        <TextField v-if="form.decision === 'LOADED'" v-model="form.loadingPercent" label="Loading %" type="number" numeric min="0" step="any" :hint="c.maxLoadPercent != null ? `At most ${c.maxLoadPercent}%. The system reprices the premium.` : 'The system reprices the premium.'" :error="errors.loadingPercent" />
        <TextareaField v-if="form.decision === 'EXCLUSION'" v-model="form.exclusions" label="Exclusions" rows="3" placeholder="One per line, e.g. Hazardous sports" :error="errors.exclusions" />
        <TextField v-if="form.decision === 'POSTPONED'" v-model="form.postponeUntil" label="Postpone until" type="date" :min="tomorrow" :error="errors.postponeUntil" />
        <p v-if="form.decision === 'DECLINED' || form.decision === 'POSTPONED'" class="px-3 py-2 text-xs rounded-lg bg-warning-soft text-warning-strong">
          {{ c.insuredUuid ? "The member is taken out of cover (premium 0)." : "The policy can't be issued." }}
        </p>
        <TextareaField v-model="form.note" label="Reason" rows="3" maxlength="1000" counter placeholder="Why this decision" :error="errors.note" />
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-underwriting-decision" :pending="pending">Save decision</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
