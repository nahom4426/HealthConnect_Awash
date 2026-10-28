<script setup>
// Create or edit a medical test required by reinsurance underwriting (FclMedicalParameterRequest:
// label ≤ 5 characters, medicalTestDescription ≤ 500). data: { test?: FclMedicalParameterResponse }
import { reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import { createFclMedicalParameter, updateFclMedicalParameter } from "../api/reinsuranceApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const current = props.data?.test;
const editing = !!current?.fclMedicalParameterUuid;

const form = reactive({ label: current?.label ?? "", medicalTestDescription: current?.medicalTestDescription ?? "" });
const errors = ref({});
const pending = ref(false);

async function submit() {
  const e = {};
  if (!form.label.trim()) e.label = "Short code is required";
  else if (form.label.trim().length > 5) e.label = "At most 5 characters";
  if (!form.medicalTestDescription.trim()) e.medicalTestDescription = "Describe the test";
  errors.value = e;
  if (Object.keys(e).length) return;
  const body = { label: form.label.trim().toUpperCase(), medicalTestDescription: form.medicalTestDescription.trim() };
  if (editing) body.status = current.status;
  pending.value = true;
  const res = editing ? await updateFclMedicalParameter(current.fclMedicalParameterUuid, body) : await createFclMedicalParameter(body);
  pending.value = false;
  if (res?.success) {
    toasted(true, editing ? "Medical test updated" : "Medical test added");
    closeModal(res.data || true);
  }
}

const field = "w-full px-3 text-sm rounded-lg border outline-none bg-surface text-ink focus:border-primary focus:ring-2 focus:ring-primary/15";
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="editing ? 'Edit medical test' : 'Add medical test'" subtitle="Evidence a reinsurer can require above its free cover limit.">
      <form id="life-medical-test-form" class="grid gap-4 p-5" novalidate @submit.prevent="submit">
        <label class="flex flex-col gap-1 text-sm font-medium text-ink">
          Short code
          <input v-model="form.label" v-focus="true" maxlength="5" placeholder="e.g. ECG" :class="[field, 'h-10 uppercase w-32', errors.label ? 'border-error' : 'border-line']" />
          <span v-if="errors.label" class="text-xs text-error">{{ errors.label }}</span>
        </label>
        <label class="flex flex-col gap-1 text-sm font-medium text-ink">
          Description
          <textarea v-model="form.medicalTestDescription" maxlength="500" rows="3" placeholder="e.g. Resting electrocardiogram with report" :class="[field, 'py-2', errors.medicalTestDescription ? 'border-error' : 'border-line']" />
          <span class="text-xs text-ink-subtle">{{ form.medicalTestDescription.length }}/500</span>
          <span v-if="errors.medicalTestDescription" class="text-xs text-error">{{ errors.medicalTestDescription }}</span>
        </label>
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-medical-test-form" :pending="pending">{{ editing ? "Save changes" : "Add test" }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
