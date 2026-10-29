<script setup>
// Documents checklist (plan 8.3, MAR-46): each mandatory document Missing or Received with upload,
// plus other documents.
import { ref } from "vue";
import FileUploader from "../FileUploader.vue";
import { cardClass } from "../styles";
import { uploadClaimDocument } from "../../api/marineApi";
import { formatDateTime } from "../../utils/format";
import { formatSize } from "../../utils/files";

const props = defineProps({ claim: { type: Object, required: true }, canWork: { type: Boolean, default: false } });
const emit = defineEmits(["updated"]);
const open = ref("");
const upload = (file, kind, onProgress) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", kind);
  return uploadClaimDocument(props.claim.id, fd, onProgress);
};
const known = (k) => props.claim.documentsChecklist.some((d) => d.kind === k);
</script>

<template>
  <div class="grid gap-4">
    <section :class="[cardClass, 'overflow-hidden']">
      <h3 class="px-4 pt-4 pb-2 text-sm font-semibold text-ink">Checklist <span class="font-normal text-ink-subtle">· * required to settle</span></h3>
      <ul class="divide-y divide-line">
        <li v-for="d in claim.documentsChecklist" :key="d.kind" :id="`doc-${d.kind}`" class="px-4 py-3">
          <div class="flex flex-wrap gap-2 justify-between items-center">
            <span class="text-sm text-ink">{{ d.label }}<span v-if="d.mandatory" class="text-error" aria-label="required"> *</span></span>
            <span class="flex gap-3 items-center">
              <span :class="['px-2 py-0.5 text-xs font-semibold rounded-full', d.status === 'RECEIVED' ? 'bg-success-soft text-success-strong' : 'bg-surface-raised text-ink-muted']">{{ d.status === "RECEIVED" ? "Received" : "Missing" }}</span>
              <button v-if="canWork" type="button" class="text-sm font-medium text-primary hover:underline" :aria-expanded="open === d.kind" @click="open = open === d.kind ? '' : d.kind">Upload</button>
            </span>
          </div>
          <ul v-if="d.files.length" class="mt-1 text-xs text-ink-muted">
            <li v-for="f in d.files" :key="f.id">{{ f.name }} · {{ formatSize(f.size) }} · {{ f.uploadedBy }}, {{ formatDateTime(f.uploadedAt) }}</li>
          </ul>
          <div v-if="open === d.kind" class="mt-2"><FileUploader :upload="upload" :kind="d.kind" @uploaded="emit('updated', $event)" /></div>
        </li>
      </ul>
    </section>
    <section :class="[cardClass, 'p-4']">
      <h3 class="mb-2 text-sm font-semibold text-ink">Other documents</h3>
      <ul class="mb-3 text-sm">
        <li v-for="f in claim.documents.filter((x) => !known(x.kind))" :key="f.id" class="text-ink">{{ f.name }} <span class="text-xs text-ink-subtle">· {{ f.kind.replace(/_/g, " ").toLowerCase() }} · {{ formatSize(f.size) }}</span></li>
        <li v-if="!claim.documents.filter((x) => !known(x.kind)).length" class="text-ink-subtle">None</li>
      </ul>
      <FileUploader v-if="canWork" :upload="upload" kind="OTHER" @uploaded="emit('updated', $event)" />
    </section>
  </div>
</template>
