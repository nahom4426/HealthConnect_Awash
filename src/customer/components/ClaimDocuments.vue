<script setup>
import { ref, computed } from 'vue';
import { uploadClaimDocument, describeError } from '@/customer/api';

const props = defineProps({
  claimUuid: { type: String, required: true },
  /** requiredDocuments from the claim: [{ documentType, required, satisfied }] */
  required: { type: Array, default: () => [] },
  /** documents already on the claim: [{ documentType, originalFileName }] */
  documents: { type: Array, default: () => [] },
});
const emit = defineEmits(['uploaded']);

const LABELS = {
  NOTIFICATION_FORM_SIGNED: 'Signed notification form',
  DRIVING_LICENCE: 'Driving licence',
  VEHICLE_TITLE_DEED: 'Vehicle title deed (Libre)',
  POWER_OF_ATTORNEY: 'Power of attorney',
  POLICE_REPORT: 'Police report',
  PROFORMA_INVOICE: 'Repair proforma invoice',
  ACCIDENT_PHOTO: 'Accident photos',
  OTHER: 'Other document',
};
const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';
const MAX_BYTES = 10 * 1024 * 1024;

const busy = ref('');
const messages = ref({});

// Required types first, then the optional ones a customer can still add.
const rows = computed(() => {
  const seen = new Set();
  const out = [];
  for (const r of props.required) {
    if (!r.required) continue;
    seen.add(r.documentType);
    out.push({ type: r.documentType, required: true, satisfied: r.satisfied });
  }
  for (const type of ['ACCIDENT_PHOTO', 'OTHER']) {
    if (!seen.has(type)) out.push({ type, required: false, satisfied: null });
  }
  return out;
});

const filesOf = (type) => props.documents.filter((d) => d.documentType === type);

async function pick(type, event) {
  const files = Array.from(event.target.files || []);
  event.target.value = '';
  for (const file of files) {
    if (file.size > MAX_BYTES) {
      messages.value = { ...messages.value, [type]: `${file.name} is larger than 10 MB.` };
      continue;
    }
    busy.value = type;
    try {
      await uploadClaimDocument(props.claimUuid, type, file);
      messages.value = { ...messages.value, [type]: '' };
      emit('uploaded');
    } catch (e) {
      messages.value = { ...messages.value, [type]: describeError(e, `Could not upload ${file.name}.`) };
    } finally {
      busy.value = '';
    }
  }
}
</script>

<template>
  <ul class="divide-y divide-line rounded-xl border border-line bg-surface">
    <li v-for="row in rows" :key="row.type" class="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <p class="text-sm font-medium">
          {{ LABELS[row.type] || row.type }}
          <span v-if="row.required" class="ml-1 text-xs font-normal text-ink-subtle">required</span>
        </p>
        <p v-if="filesOf(row.type).length" class="truncate text-xs text-ink-muted">
          {{ filesOf(row.type).map((d) => d.originalFileName).join(', ') }}
        </p>
        <p v-if="messages[row.type]" role="alert" class="text-xs text-error-strong">{{ messages[row.type] }}</p>
      </div>
      <div class="flex items-center gap-3">
        <span
          v-if="row.satisfied !== null"
          class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          :class="row.satisfied ? 'bg-success-soft text-success-strong' : 'bg-warning-soft text-warning-strong'"
        >{{ row.satisfied ? 'Received' : 'Needed' }}</span>
        <label
          class="cursor-pointer rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-surface-muted"
          :class="busy === row.type ? 'pointer-events-none opacity-60' : ''"
        >
          {{ busy === row.type ? 'Uploading…' : (filesOf(row.type).length ? 'Add another' : 'Upload') }}
          <input type="file" class="sr-only" :accept="ACCEPT" multiple @change="pick(row.type, $event)" />
        </label>
      </div>
    </li>
  </ul>
  <p class="mt-2 text-xs text-ink-subtle">PDF, JPG or PNG, up to 10 MB each.</p>
</template>
