<script setup>
// Record a medical requirement of an underwriting case (PUT /underwriting/{subject}/medical-requirement/{r}).
// data: { case: UnderwritingCaseResponse, requirement: Requirement }
import { reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
import SelectField from "@/components/fields/SelectField.vue";
import TextareaField from "@/components/fields/TextareaField.vue";
import { toasted } from "@/utils/utils";
import { REQUIREMENT_STATUSES, toRequirementRequest, validateRequirement } from "../underwriting/caseRules";
import { updateMedicalRequirement } from "../api/underwritingCaseApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const c = props.data?.case || {};
const r = props.data?.requirement || {};
const today = new Date().toISOString().slice(0, 10);

const form = reactive({ status: r.status === "OUTSTANDING" ? "RECEIVED" : r.status || "RECEIVED", receivedDate: r.receivedDate || today, result: r.result || "" });
const errors = ref({});
const pending = ref(false);

async function submit() {
  errors.value = validateRequirement(form);
  if (Object.keys(errors.value).length) return;
  pending.value = true;
  const res = await updateMedicalRequirement(c.insuredUuid || c.benefitUuid, r.requirementUuid, toRequirementRequest(form));
  pending.value = false;
  if (res?.success) {
    toasted(true, "Requirement updated");
    closeModal(true);
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="r.label || 'Medical requirement'" :subtitle="c.subjectName">
      <form id="life-medical-requirement" class="grid gap-4 p-5" novalidate @submit.prevent="submit">
        <SelectField v-model="form.status" label="Status" :options="REQUIREMENT_STATUSES" :error="errors.status" />
        <TextField v-if="form.status === 'RECEIVED'" v-model="form.receivedDate" label="Received on" type="date" :max="today" :error="errors.receivedDate" />
        <TextareaField v-model="form.result" :label="form.status === 'WAIVED' ? 'Why it is waived (optional)' : 'Result (optional)'" rows="3" maxlength="1000" counter :error="errors.result" />
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-medical-requirement" :pending="pending">Save</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
