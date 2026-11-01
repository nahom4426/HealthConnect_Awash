<script setup>
// Cancel, lapse, reinstate or renew a policy (ServicingRequest). Closes with the ServicingResponse.
// data: { kind: 'policy'|'benefit', uuid, action: 'cancel'|'lapse'|'reinstate'|'renew' }
import { reactive, ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
import TextareaField from "@/components/fields/TextareaField.vue";
import CheckboxField from "@/components/fields/CheckboxField.vue";
import { toasted } from "@/utils/utils";
import { formatAmount } from "../constants/labels";
import { SERVICING, newServicingForm, toServicingRequest, validateServicing } from "../servicing/servicingRules";
import { servicePolicy } from "../api/servicingApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const { kind, uuid, action } = props.data || {};
const d = SERVICING[action] || {};

const form = reactive(newServicingForm());
const errors = ref({});
const pending = ref(false);

async function submit() {
  errors.value = validateServicing(action, form);
  if (Object.keys(errors.value).length) return;
  pending.value = true;
  const res = await servicePolicy(kind, uuid, action, toServicingRequest(action, form));
  pending.value = false;
  if (!res?.success) return;
  const r = res.data || {};
  // The backend's message already says whether a refund was calculated
  if (r.message) toasted(true, r.message);
  else if (action === "cancel" && r.refundAmount != null) toasted(true, `${d.done}. Refund ${formatAmount(r.refundAmount)}`);
  else toasted(true, d.done);
  closeModal(r);
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="d.title" :subtitle="d.hint">
      <form id="life-servicing-action" class="grid gap-4 p-5" novalidate @submit.prevent="submit">
        <TextField v-model="form.effectiveDate" label="Effective date" type="date" focus :error="errors.effectiveDate" />
        <TextField v-model="form.reason" label="Reason" maxlength="300" :error="errors.reason" />
        <TextareaField v-model="form.note" label="Note (optional)" rows="3" maxlength="500" counter :error="errors.note" />
        <CheckboxField v-if="action === 'reinstate'" v-model="form.healthEvidenceReceived" label="Health evidence received" hint="Needed when the policy lapsed more than 90 days ago." />
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Back</Button>
          <Button html-type="submit" form="life-servicing-action" :pending="pending" :variant="d.tone === 'danger' ? 'destructive' : 'primary'">{{ d.confirmText }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
