<script setup>
// Create or edit a rider (RiderRequest: riderName ≤100, riderDescription ≤250, minLimit, maxLimit).
// data: { rider?: RiderResponse } — closes with the saved RiderResponse, or nothing if cancelled.
import { reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
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

const field = "w-full px-3 h-10 text-sm rounded-lg border outline-none bg-surface text-ink focus:border-primary focus:ring-2 focus:ring-primary/15";
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="editing ? 'Edit rider' : 'New rider'" subtitle="Additional cover attached to term life, priced from its own rate tables.">
      <form id="life-rider-form" class="grid gap-4 p-5 sm:grid-cols-2" novalidate @submit.prevent="submit">
        <label class="flex flex-col gap-1 sm:col-span-2 text-sm font-medium text-ink">
          Rider name <span class="sr-only">(required)</span>
          <input v-model="form.riderName" v-focus="true" maxlength="100" :class="[field, errors.riderName ? 'border-error' : 'border-line']" placeholder="e.g. Accidental death benefit" />
          <span v-if="errors.riderName" class="text-xs text-error">{{ errors.riderName }}</span>
        </label>
        <label class="flex flex-col gap-1 sm:col-span-2 text-sm font-medium text-ink">
          Description
          <textarea v-model="form.riderDescription" maxlength="250" rows="3" :class="[field, 'h-auto py-2', errors.riderDescription ? 'border-error' : 'border-line']" placeholder="What the rider covers and when it pays" />
          <span class="text-xs text-ink-subtle">{{ form.riderDescription.length }}/250</span>
        </label>
        <label class="flex flex-col gap-1 text-sm font-medium text-ink">
          Minimum sum assured (ETB)
          <input v-model="form.minLimit" type="number" min="0" step="any" :class="[field, 'tabular-nums', errors.minLimit ? 'border-error' : 'border-line']" />
          <span v-if="errors.minLimit" class="text-xs text-error">{{ errors.minLimit }}</span>
        </label>
        <label class="flex flex-col gap-1 text-sm font-medium text-ink">
          Maximum sum assured (ETB)
          <input v-model="form.maxLimit" type="number" min="0" step="any" :class="[field, 'tabular-nums', errors.maxLimit ? 'border-error' : 'border-line']" />
          <span v-if="errors.maxLimit" class="text-xs text-error">{{ errors.maxLimit }}</span>
        </label>
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
