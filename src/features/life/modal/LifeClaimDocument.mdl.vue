<script setup>
// Attach or replace a claim document (multipart field "file", query fileNames = this file's label,
// documentType = the checklist item it covers). data: { claimUuid, attachment?: ClaimAttachmentResponse,
// documentType?: string, checklist?: { documentType, description, received }[] }
import { ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import TextField from "@/components/fields/TextField.vue";
import SelectField from "@/components/fields/SelectField.vue";
import { toasted } from "@/utils/utils";
import { fileForm } from "../composables/useLifeResource";
import { documentTypeLabel, formatFileSize, validateAttachment } from "../claims/claimRules";
import { createClaimAttachment, updateClaimAttachment } from "../api/claimApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const current = props.data?.attachment;
const replacing = !!current?.claimAttachmentUuid;

const checklist = props.data?.checklist || [];
const typeOptions = checklist.map((d) => ({ value: d.documentType, label: d.description || documentTypeLabel(d.documentType) }));
const documentType = ref(props.data?.documentType || "");
const name = ref(current?.fileName?.replace(/\.[^.]+$/, "") ?? typeOptions.find((o) => o.value === documentType.value)?.label ?? "");
const file = ref(null);
const errors = ref({});
const pending = ref(false);

function onFile(e) {
  file.value = e.target.files?.[0] || null;
  if (file.value && !name.value) name.value = file.value.name.replace(/\.[^.]+$/, "");
}

async function submit() {
  errors.value = validateAttachment(file.value, name.value, documentType.value, !replacing && typeOptions.length > 0);
  if (Object.keys(errors.value).length) return;
  pending.value = true;
  const params = { fileNames: name.value.trim() };
  const res = replacing
    ? await updateClaimAttachment(current.claimAttachmentUuid, fileForm(file.value), params)
    : await createClaimAttachment(fileForm(file.value), { claimUuid: props.data.claimUuid, ...params, ...(documentType.value ? { documentType: documentType.value } : {}) });
  pending.value = false;
  if (res?.success) {
    toasted(true, replacing ? "Document replaced" : "Document attached");
    closeModal(true);
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="replacing ? 'Replace document' : 'Attach document'" subtitle="PDF or a clear photo of the original.">
      <form id="life-claim-document" class="grid gap-4 p-5" novalidate @submit.prevent="submit">
        <label class="flex flex-col gap-1 text-sm font-medium text-ink">
          File
          <input type="file" accept=".pdf,image/*" :class="['text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-surface-raised file:text-ink text-ink-muted', errors.file && 'text-error']" @change="onFile" />
          <span v-if="file" class="text-xs text-ink-subtle">{{ file.name }} · {{ formatFileSize(file.size) }}</span>
          <span v-if="errors.file" class="text-xs text-error">{{ errors.file }}</span>
        </label>
        <SelectField
          v-if="!replacing && typeOptions.length"
          v-model="documentType"
          label="Checklist item"
          :options="typeOptions"
          :error="errors.documentType"
          @update:model-value="(v) => !name && (name = typeOptions.find((o) => o.value === v)?.label || '')"
        />
        <TextField v-model="name" label="Document name" maxlength="100" placeholder="e.g. Death certificate" :error="errors.name" />
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-claim-document" :pending="pending">{{ replacing ? "Replace" : "Attach" }}</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
