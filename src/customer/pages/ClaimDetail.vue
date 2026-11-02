<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { getClaim, getWorkflow, claimDocumentUrl, describeError } from '@/customer/api';
import ClaimDocuments from '@/customer/components/ClaimDocuments.vue';

// The claim tracker: same stages as the staff dashboard (GET /claims/workflow), the documents Standard
// still needs, the accident photos and the amounts once they are set.
const route = useRoute();
const claim = ref(null);
const timeline = ref([]);
const photos = ref([]);
const loading = ref(true);
const error = ref('');
const urls = [];

const closed = computed(() => claim.value?.status === 'REJECTED' || claim.value?.status === 'WITHDRAWN');
// statusStep is -1 for closed claims; the happy-path steps are numbered by the backend
const currentStep = computed(() => claim.value?.statusStep ?? 0);
const missing = computed(() => (claim.value?.requiredDocuments || []).filter((d) => d.required && !d.satisfied).length);

// A licence or title deed that was uploaded but whose original has not been seen yet
const ORIGINALS = ['DRIVING_LICENCE', 'VEHICLE_TITLE_DEED'];
const bringOriginal = computed(() => {
  const marks = claim.value?.documentMarks || [];
  const uploaded = new Set((claim.value?.documents || []).map((d) => d.documentType));
  return ORIGINALS.filter((t) => uploaded.has(t) && !marks.find((m) => m.documentType === t && m.originalSeen));
});
const LABELS = { DRIVING_LICENCE: 'driving licence', VEHICLE_TITLE_DEED: 'vehicle title deed (Libre)' };

const fmt = (d) => (d ? new Date(d).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const money = (n) => (n == null ? '—' : `ETB ${Number(n).toLocaleString()}`);

async function loadPhotos() {
  const shots = (claim.value?.documents || []).filter((d) => d.documentType === 'ACCIDENT_PHOTO' && d.isImage).slice(0, 8);
  const loaded = [];
  for (const d of shots) {
    const url = await claimDocumentUrl(claim.value.claimUuid, d.documentUuid);
    if (url) { urls.push(url); loaded.push({ id: d.documentUuid, url, name: d.originalFileName }); }
  }
  photos.value = loaded;
}

async function load() {
  try {
    claim.value = await getClaim(route.params.claimUuid);
    await loadPhotos();
  } catch (e) {
    if (!claim.value) {
      error.value = e?.response?.status === 404 || e?.response?.status === 403
        ? 'We couldn’t find that claim on your account.'
        : describeError(e, 'We could not load this claim.');
    }
  }
}

onMounted(async () => {
  await Promise.all([
    load(),
    getWorkflow().then((w) => { timeline.value = w?.timeline || []; }).catch(() => { timeline.value = []; }),
  ]);
  loading.value = false;
});
onBeforeUnmount(() => urls.forEach((u) => URL.revokeObjectURL(u)));
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <router-link to="/claims" class="text-sm text-primary underline">← My claims</router-link>

    <p v-if="loading" class="mt-6 text-ink-muted">Loading…</p>
    <div v-else-if="error" class="mt-6" role="alert">
      <p class="rounded-lg bg-error-soft px-3 py-2 text-sm text-error-strong">{{ error }}</p>
      <button type="button" class="mt-3 rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-surface-muted" @click="error = ''; loading = true; load().finally(() => (loading = false))">Retry</button>
    </div>

    <template v-else-if="claim">
      <div class="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold">Claim {{ claim.claimNumber }}</h1>
          <p class="text-sm text-ink-muted">Policy {{ claim.policyNumber }}<span v-if="claim.plateNumber"> · {{ claim.plateNumber }}</span></p>
        </div>
        <span
          class="rounded-full px-3 py-1 text-sm font-semibold"
          :class="closed ? 'bg-error-soft text-error-strong' : (claim.status === 'HANDOVER_COMPLETED' ? 'bg-success-soft text-success-strong' : 'bg-warning-soft text-warning-strong')"
        >{{ claim.statusLabel || claim.status }}</span>
      </div>
      <p v-if="claim.statusDescription" class="mt-1 text-sm text-ink-muted">{{ claim.statusDescription }}</p>

      <section v-if="closed" class="mt-4 rounded-2xl border border-error bg-surface p-4" role="status">
        <p class="font-semibold text-error-strong">This claim was {{ claim.status === 'WITHDRAWN' ? 'withdrawn' : 'declined' }}</p>
        <p v-if="claim.closed?.reason" class="mt-1 text-sm">{{ claim.closed.reason }}</p>
        <p v-if="claim.closed?.closedAt" class="mt-1 text-xs text-ink-subtle">{{ fmt(claim.closed.closedAt) }}</p>
      </section>

      <section v-if="!closed && timeline.length" class="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h2 class="text-lg font-semibold">Live progress</h2>
        <ol class="mt-4 space-y-4">
          <li v-for="s in timeline" :key="s.key" class="flex gap-3">
            <span
              class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              :class="s.step < currentStep ? 'bg-success text-white' : (s.step === currentStep ? 'bg-primary text-white' : 'bg-surface-muted text-ink-subtle')"
            >{{ s.step < currentStep ? '✓' : s.step + 1 }}</span>
            <div>
              <p class="text-sm font-medium" :class="s.step > currentStep ? 'text-ink-subtle' : ''">{{ s.label }}</p>
              <p class="text-xs text-ink-muted">{{ s.description }}</p>
            </div>
          </li>
        </ol>
      </section>

      <section class="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h2 class="text-lg font-semibold">Details</h2>
        <dl class="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div><dt class="text-ink-subtle">Accident</dt><dd class="font-medium">{{ fmt(claim.incidentDate) }}</dd></div>
          <div><dt class="text-ink-subtle">Incident location</dt><dd class="font-medium">{{ claim.incidentLocation }}</dd></div>
          <div><dt class="text-ink-subtle">Your estimate</dt><dd class="font-medium">{{ money(claim.estimatedAmount) }}</dd></div>
          <div><dt class="text-ink-subtle">Approved amount</dt><dd class="font-medium">{{ money(claim.approvedAmount) }}</dd></div>
          <div class="sm:col-span-2"><dt class="text-ink-subtle">What happened</dt><dd class="whitespace-pre-line font-medium">{{ claim.description }}</dd></div>
        </dl>
        <ul v-if="claim.warnings?.length" class="mt-3 list-disc pl-5 text-sm text-warning-strong">
          <li v-for="w in claim.warnings" :key="w">{{ w }}</li>
        </ul>
        <router-link v-if="claim.notificationForm" :to="`/claims/${claim.claimUuid}/form`" class="mt-4 inline-block rounded-xl border border-line px-4 py-2 text-sm font-medium hover:bg-surface-muted">Download claim form (PDF)</router-link>
      </section>

      <section v-if="photos.length" class="mt-6">
        <h2 class="text-lg font-semibold">Accident photos</h2>
        <ul class="mt-3 flex flex-wrap gap-2">
          <li v-for="p in photos" :key="p.id"><img :src="p.url" :alt="p.name || 'Accident photo'" class="h-24 w-24 rounded-xl object-cover" /></li>
        </ul>
      </section>

      <section v-if="!closed && claim.status !== 'HANDOVER_COMPLETED'" class="mt-6">
        <h2 class="text-lg font-semibold">Your documents<span v-if="missing" class="ml-2 text-sm font-normal text-warning-strong">{{ missing }} needed</span></h2>
        <p class="mb-3 text-sm text-ink-muted">Upload anything we still need so your claim keeps moving.</p>
        <p v-if="bringOriginal.length" class="mb-3 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-strong">
          Bring the original {{ bringOriginal.map((t) => LABELS[t]).join(' and ') }} to our office.
        </p>
        <ClaimDocuments :claim-uuid="claim.claimUuid" :required="claim.requiredDocuments || []" :documents="claim.documents || []" @uploaded="load" />
      </section>
    </template>
  </div>
</template>
