<script setup>
// Documents of one owner (contract 2026-10, G7): every upload is a new version of its type; the latest
// is shown with its older versions under it. An issued policy's documents are locked.
import { computed, ref } from "vue";
import { openModal } from "@customizer/modal-x";
import Button from "@/components/Button.vue";
import { toasted } from "@/utils/utils";
import { useLifeResource } from "../composables/useLifeResource";
import { confirmAction } from "../composables/confirmAction";
import { openBlob } from "../composables/openBlob";
import { formatDate } from "../constants/labels";
import { formatFileSize } from "../claims/claimRules";
import { documentTypeLabel, groupDocuments } from "../servicing/servicingRules";
import { deleteDocument, getDocuments, openDocument } from "../api/documentApi";

const props = defineProps({
  ownerType: { type: String, required: true },
  ownerUuid: { type: String, required: true },
  canUpload: { type: Boolean, default: false },
  /** the policy's printed schedule (GET /policy/{uuid}/schedule.pdf), for issued policies */
  schedule: { type: Function, default: null },
});

const docs = useLifeResource(() => getDocuments({ ownerType: props.ownerType, ownerUuid: props.ownerUuid }), { initial: [], map: (d) => (Array.isArray(d) ? d : []) });
docs.load();
const groups = computed(() => groupDocuments(docs.data.value));

const upload = (documentType) => openModal("LifeDocumentUpload", { ownerType: props.ownerType, ownerUuid: props.ownerUuid, documentType }, (done) => done && docs.load());
const opening = ref("");
async function open(d) {
  opening.value = d.documentUuid;
  openBlob(await openDocument(d.documentUuid), d.fileName);
  opening.value = "";
}
function remove(d) {
  confirmAction({ title: `Delete ${d.fileName}?`, message: "This version is removed. Older versions stay.", confirmText: "Delete", tone: "danger" }, async () => {
    const res = await deleteDocument(d.documentUuid);
    if (res?.success) { toasted(true, "Document deleted"); docs.load(); }
  });
}
const printing = ref(false);
async function printSchedule() {
  printing.value = true;
  openBlob(await props.schedule(), "policy-schedule.pdf");
  printing.value = false;
}
const meta = (d) => [`v${d.version}`, formatFileSize(d.sizeBytes), formatDate(d.audit?.createdAt)].filter((x) => x && x !== "—").join(" · ");
</script>

<template>
  <section class="p-5 rounded-2xl border bg-surface border-line shadow-card">
    <div class="flex flex-wrap gap-3 justify-between items-start">
      <div>
        <h2 class="text-sm font-semibold text-ink">Documents</h2>
        <p class="text-xs text-ink-muted">Uploading the same type again keeps the old file as an earlier version.</p>
      </div>
      <div class="flex gap-2">
        <Button v-if="schedule" size="sm" variant="outline" :pending="printing" @click="printSchedule">Policy schedule (PDF)</Button>
        <Button v-if="canUpload" size="sm" @click="upload()">Upload document</Button>
      </div>
    </div>
    <p v-if="docs.error.value && !docs.loading.value" class="mt-3 text-sm text-ink-muted">{{ docs.error.value }} <button type="button" class="font-semibold text-primary" @click="docs.load()">Try again</button></p>
    <ul v-else class="mt-3 rounded-xl border divide-y border-line divide-line">
      <li v-if="docs.loading.value && !docs.data.value.length" class="px-4 py-3"><div class="w-1/3 h-4 rounded animate-pulse bg-surface-raised"></div></li>
      <li v-else-if="!groups.length" class="px-4 py-3 text-sm text-ink-subtle">No documents yet.</li>
      <li v-for="g in groups" v-else :key="g.type" class="px-4 py-2.5">
        <div class="flex flex-wrap gap-3 justify-between items-center">
          <span class="text-sm">
            <span class="font-medium text-ink">{{ documentTypeLabel(g.type) }}</span>
            <span class="block text-xs text-ink-subtle">{{ g.latest.fileName }} · {{ meta(g.latest) }}<template v-if="g.latest.locked"> · locked</template></span>
          </span>
          <span class="flex gap-1">
            <Button variant="ghost" size="sm" :pending="opening === g.latest.documentUuid" @click="open(g.latest)">Open</Button>
            <Button v-if="canUpload" variant="ghost" size="sm" @click="upload(g.type)">New version</Button>
            <Button v-if="canUpload && !g.latest.locked" variant="ghost" size="sm" class="!text-error" @click="remove(g.latest)">Delete</Button>
          </span>
        </div>
        <ul v-if="g.older.length" class="mt-1 ml-3 text-xs text-ink-subtle">
          <li v-for="o in g.older" :key="o.documentUuid" class="flex gap-2 items-center">
            <span>{{ o.fileName }} · {{ meta(o) }}</span>
            <button type="button" class="font-semibold text-primary hover:underline" @click="open(o)">Open</button>
          </li>
        </ul>
      </li>
    </ul>
  </section>
</template>
