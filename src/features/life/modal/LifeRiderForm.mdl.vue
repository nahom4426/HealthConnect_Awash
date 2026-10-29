<script setup>
// Create or edit a rider (RiderRequest: riderName ≤100, riderDescription ≤250, minLimit, maxLimit).
// data: { rider?: RiderResponse } — closes with the saved RiderResponse, or nothing if cancelled.
import { reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
import TextareaField from "@/components/fields/TextareaField.vue";
import { toasted } from "@/utils/utils";
import { createRider, updateRider } from "../api/productApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const editing = !!props.data?.rider?.riderUuid;

const form = reactive({
  riderName: props.data?.rider?.riderName ?? "",
  riderDescription: props.data?.rider?.riderDescription ?? "",
  minLimit: props.data?.rider?.minLimit ?? "",
  maxLimit: props.data?.rider?.maxLimit ?? "",
});
const errors = ref({});
const pending = ref(false);

function validate() {
  const e = {};
  if (!form.riderName.trim()) e.riderName = "Rider name is required";
  else if (form.riderName.length > 100) e.riderName = "At most 100 characters";
  if (form.riderDescription.length > 250) e.riderDescription = "At most 250 characters";
  const min = form.minLimit === "" ? null : Number(form.minLimit);
  const max = form.maxLimit === "" ? null : Number(form.maxLimit);
  if (min === null) e.minLimit = "Minimum sum assured is required";
  else if (min < 0) e.minLimit = "Cannot be negative";
  if (max === null) e.maxLimit = "Maximum sum assured is required";
  else if (min !== null && max < min) e.maxLimit = "Must be at least the minimum";
  errors.value = e;
  return !Object.keys(e).length;
}

async function submit() {
  if (!validate()) return;
  const body = {
    riderName: form.riderName.trim(),
    riderDescription: form.riderDescription.trim(),
    minLimit: Number(form.minLimit),
    maxLimit: Number(form.maxLimit),
  };
  // Keep the current status on edit; on create the backend decides the initial status
  if (editing) body.status = props.data.rider.status;
  pending.value = true;
  const res = editing ? await updateRider(props.data.rider.riderUuid, body) : await createRider(body);
  pending.value = false;
  if (res?.success) {
    toasted(true, editing ? "Rider updated" : "Rider created");
    closeModal(res.data);
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="editing ? 'Edit rider' : 'New rider'" subtitle="Additional cover attached to term life, priced from its own rate tables.">
      <form id="life-rider-form" class="grid gap-4 p-5 sm:grid-cols-2" novalidate @submit.prevent="submit">
        <div class="sm:col-span-2"><TextField v-model="form.riderName" label="Rider name" required focus maxlength="100" placeholder="e.g. Accidental death benefit" :error="errors.riderName" /></div>
        <div class="sm:col-span-2"><TextareaField v-model="form.riderDescription" label="Description" :maxlength="250" counter rows="3" placeholder="What the rider covers and when it pays" :error="errors.riderDescription" /></div>
        <TextField v-model.number="form.minLimit" label="Minimum sum assured (ETB)" type="number" numeric min="0" step="any" :error="errors.minLimit" />
        <TextField v-model.number="form.maxLimit" label="Maximum sum assured (ETB)" type="number" numeric min="0" step="any" :error="errors.maxLimit" />
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-rider-form" :pending="pending">{{ editing ? "Save changes" : "Create rider" }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
