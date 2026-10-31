<script setup>
// Email a certificate. Recipients start with the insured, broker and LC bank emails.
// A queued response is not delivery. A skipped response means SMTP was not used.
import { ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import { inputClass, inputBorder } from "../components/styles";
import { emailCertificate } from "../api/marineApi";
import { notifyError } from "../api/marineClient";

const props = defineProps({ data: { type: Object, required: true } });
const cert = props.data.certificate;
const recipients = ref([...new Set(cert.emails ?? [])]);
const draft = ref("");
const message = ref(`Please find attached marine cargo certificate ${cert.certNo}.`);
const error = ref("");
const pending = ref(false);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function addDraft() {
  const parts = draft.value.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
  const bad = parts.filter((p) => !isEmail(p));
  recipients.value = [...new Set([...recipients.value, ...parts.filter(isEmail)])];
  draft.value = bad.join(", ");
  error.value = bad.length ? `Not a valid email: ${bad.join(", ")}` : "";
}

async function send() {
  addDraft();
  if (error.value) return;
  if (!recipients.value.length) {
    error.value = "Add at least one recipient";
    return;
  }
  pending.value = true;
  const res = await emailCertificate(cert.id, { recipients: recipients.value, message: message.value });
  pending.value = false;
  if (res.ok) {
    const status = res.data?.status;
    if (status === "QUEUED") toasted(true, res.data.message || "Email queued. Delivery is not confirmed yet.");
    else toasted(false, res.data?.message || "Email was not sent.");
    closeModal(true);
  } else if (res.error.status === 422) error.value = res.error.fields[0]?.message ?? res.error.message;
  else notifyError(res.error);
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="`Email ${cert.certNo}`">
      <div class="flex flex-col gap-1">
        <label for="mec-to" class="text-sm font-medium text-ink">Recipients</label>
        <div :class="[inputClass, inputBorder(error), 'flex flex-wrap gap-1 items-center !h-auto min-h-10 py-1']">
          <span v-for="r in recipients" :key="r" class="inline-flex gap-1 items-center py-0.5 pr-1 pl-2 text-xs font-medium rounded-md bg-primary/10 text-primary">
            {{ r }}
            <button type="button" class="grid place-items-center w-4 h-4 rounded hover:bg-primary/20" :aria-label="`Remove ${r}`" @click="recipients = recipients.filter((x) => x !== r)">×</button>
          </span>
          <input id="mec-to" v-model="draft" placeholder="Add email and press Enter" class="flex-1 min-w-[12rem] h-8 bg-transparent outline-none" @keydown.enter.prevent="addDraft" @blur="draft && addDraft()" />
        </div>
        <p v-if="error" class="text-xs text-error">{{ error }}</p>
      </div>
      <label class="flex flex-col gap-1 text-sm font-medium text-ink">
        Message
        <textarea v-model="message" rows="4" :class="[inputClass, 'border-line h-auto py-2']" />
      </label>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button :pending="pending" @click="send">Send</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
