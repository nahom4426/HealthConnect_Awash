<script setup>
// Cancel a certificate (plan 6.6, MAR-39). data: { certificate }. Closes with the cancelled certificate.
import { ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import { inputClass, inputBorder } from "../components/styles";
import { cancelCertificate } from "../api/marineApi";
import { notifyError } from "../api/marineClient";
import { CANCEL_REASONS } from "../constants";

const props = defineProps({ data: { type: Object, required: true } });
const c = props.data.certificate;
const reason = ref("");
const note = ref("");
const errors = ref({});
const pending = ref(false);

async function submit() {
  const e = {};
  if (!reason.value) e.reason = "Pick a reason";
  if (!note.value.trim()) e.note = "A note is required";
  errors.value = e;
  if (Object.keys(e).length) return;
  pending.value = true;
  const res = await cancelCertificate(c.id, { reason: reason.value, note: note.value.trim() });
  pending.value = false;
  if (res.ok) {
    toasted(true, `${c.certNo} cancelled`);
    closeModal(res.data);
  } else if (res.error.status === 409) errors.value = { form: res.error.message };
  else if (res.error.status === 422) errors.value = res.error.fieldMap();
  else notifyError(res.error);
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="`Cancel ${c.certNo} v${c.version}`">
      <p v-if="errors.form" role="alert" class="p-3 text-sm rounded-xl bg-error-soft text-error-strong">{{ errors.form }}</p>
      <p class="text-sm text-ink-muted">The certificate stops giving cover and its QR code shows Cancelled. A refund line is added to the policy.</p>
      <label class="flex flex-col gap-1 text-sm font-medium text-ink">
        Reason
        <select v-model="reason" :class="[inputClass, inputBorder(errors.reason)]">
          <option value="" disabled>Choose a reason</option>
          <option v-for="r in CANCEL_REASONS" :key="r.value" :value="r.value">{{ r.label }}</option>
        </select>
        <span v-if="errors.reason" class="text-xs text-error">{{ errors.reason }}</span>
      </label>
      <label class="flex flex-col gap-1 text-sm font-medium text-ink">
        Note
        <textarea v-model="note" rows="3" :class="[inputClass, inputBorder(errors.note), 'h-auto py-2']" />
        <span v-if="errors.note" class="text-xs text-error">{{ errors.note }}</span>
      </label>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Keep certificate</Button>
          <Button variant="destructive" :pending="pending" @click="submit">Cancel certificate</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
