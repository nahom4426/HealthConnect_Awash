<script setup>
// Upload a document (POST /document, multipart "file"). The allowed file types and size are set on the
// server (life.documents.*), which says when a file is refused.
// data: { ownerType, ownerUuid, documentType?: string (a new version of that type) }
import { ref } from "vue";
import { closeModal } from "@customizer/modal-x";
import ModalParent from "@/components/ModalParent.vue";
import NewFormParent from "@/components/NewFormParent.vue";
import Button from "@/components/Button.vue";
import SelectField from "@/components/fields/SelectField.vue";
import { toasted } from "@/utils/utils";
import { fileForm } from "../composables/useLifeResource";
import { formatFileSize } from "../claims/claimRules";
import { DOCUMENT_TYPES, documentTypeLabel } from "../servicing/servicingRules";
import { uploadDocument } from "../api/documentApi";

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const fixedType = props.data?.documentType || "";
const documentType = ref(fixedType);
const file = ref(null);
const errors = ref({});
const pending = ref(false);
const options = fixedType && !DOCUMENT_TYPES.some((t) => t.value === fixedType) ? [...DOCUMENT_TYPES, { value: fixedType, label: documentTypeLabel(fixedType) }] : DOCUMENT_TYPES;

async function submit() {
  errors.value = {};
  if (!documentType.value) errors.value.documentType = "Choose the document type";
  if (!file.value) errors.value.file = "Choose a file";
  if (Object.keys(errors.value).length) return;
  pending.value = true;
  const res = await uploadDocument(fileForm(file.value), { ownerType: props.data.ownerType, ownerUuid: props.data.ownerUuid, documentType: documentType.value });
  pending.value = false;
  if (res?.success) {
    toasted(true, `Uploaded as version ${res.data?.version ?? 1}`);
    closeModal(true);
  }
}
</script>

<template>
  <ModalParent>
    <NewFormParent size="md" :title="fixedType ? `New version: ${documentTypeLabel(fixedType)}` : 'Upload document'" subtitle="PDF or a clear photo of the original.">
      <form id="life-document-upload" class="grid gap-4 p-5" novalidate @submit.prevent="submit">
        <SelectField v-model="documentType" label="Document type" :options="options" :disabled="!!fixedType" :error="errors.documentType" />
        <label class="flex flex-col gap-1 text-sm font-medium text-ink">
          File
          <input type="file" accept=".pdf,image/*" :class="['text-sm file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-surface-raised file:text-ink text-ink-muted', errors.file && 'text-error']" @change="file = $event.target.files?.[0] || null" />
          <span v-if="file" class="text-xs text-ink-subtle">{{ file.name }} · {{ formatFileSize(file.size) }}</span>
          <span v-if="errors.file" class="text-xs text-error">{{ errors.file }}</span>
        </label>
      </form>
      <template #bottom>
        <div class="flex gap-2 justify-end p-4 w-full border-t border-line">
          <Button variant="outline" @click="closeModal()">Cancel</Button>
          <Button html-type="submit" form="life-document-upload" :pending="pending">Upload</Button>
        </div>
      </template>
    </NewFormParent>
  </ModalParent>
</template>
