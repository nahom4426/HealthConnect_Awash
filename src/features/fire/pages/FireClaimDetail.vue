<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  apiError,
  approveClaim,
  assessClaim,
  fetchClaim,
  payClaim,
  rejectClaim,
  submitClaim,
} from '../api/fireApi.js';
import { usePcModule } from '@/features/pc/pcModule.js';
import '../fire-ui.css';

const route = useRoute();
const router = useRouter();
const pc = usePcModule();
const claim = ref(null);
const error = ref('');
const working = ref(false);
const assessedAmount = ref('');
const notes = ref('');
const reason = ref('');

function money(value) {
  if (value == null) return '—';
  return `ETB ${Number(value).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

async function load() {
  error.value = '';
  try {
    claim.value = await fetchClaim(route.params.claimUuid);
    assessedAmount.value = claim.value.assessedAmount || claim.value.estimatedAmount || '';
  } catch (e) {
    error.value = apiError(e);
  }
}

async function run(fn) {
  working.value = true;
  error.value = '';
  try {
    claim.value = await fn();
  } catch (e) {
    error.value = apiError(e);
  } finally {
    working.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="fire-page">
    <header class="fire-head">
      <div>
        <button class="link" @click="router.push(`${pc.basePath}/claims/process`)">← Claims</button>
        <p class="fire-kicker">{{ pc.kicker }} · claim</p>
        <h1>{{ claim?.claimNumber || 'Claim' }}</h1>
        <p class="fire-sub">{{ claim?.proposerName }} · {{ claim?.policyNumber }}</p>
      </div>
      <div class="fire-actions">
        <button class="fire-btn" :disabled="working || claim?.status !== 'DRAFT'" @click="run(() => submitClaim(route.params.claimUuid))">Submit</button>
        <button class="fire-btn ghost" :disabled="working || claim?.status !== 'ASSESSED'" @click="run(() => approveClaim(route.params.claimUuid))">Approve</button>
        <button class="fire-btn" :disabled="working || claim?.status !== 'APPROVED'" @click="run(() => payClaim(route.params.claimUuid))">Record payment</button>
      </div>
    </header>

    <p v-if="error" class="fire-error">{{ error }}</p>

    <section v-if="claim" class="fire-meta">
      <div><span>Status</span><strong>{{ claim.status }}</strong></div>
      <div><span>Loss date</span><strong>{{ claim.lossDate }}</strong></div>
      <div><span>Cover</span><strong>{{ claim.perilCode }}</strong></div>
      <div><span>Estimated</span><strong>{{ money(claim.estimatedAmount) }}</strong></div>
      <div><span>Assessed</span><strong>{{ money(claim.assessedAmount) }}</strong></div>
    </section>

    <section v-if="claim" class="fire-card">
      <h2>Incident</h2>
      <p>{{ claim.location }}</p>
      <p>{{ claim.description || 'No description' }}</p>
    </section>

    <section v-if="claim?.status === 'SUBMITTED'" class="fire-card">
      <h2>Assess</h2>
      <div class="fire-filters">
        <input v-model.number="assessedAmount" type="number" min="0" step="0.01" placeholder="Assessed amount" />
        <input v-model="notes" placeholder="Notes" />
        <button class="fire-btn" :disabled="working" @click="run(() => assessClaim(route.params.claimUuid, { assessedAmount, notes }))">Save assessment</button>
      </div>
    </section>

    <section v-if="claim?.status === 'SUBMITTED' || claim?.status === 'ASSESSED'" class="fire-card">
      <h2>Reject</h2>
      <div class="fire-filters">
        <input v-model="reason" placeholder="Reason" />
        <button class="fire-btn ghost" :disabled="working || !reason" @click="run(() => rejectClaim(route.params.claimUuid, reason))">Reject</button>
      </div>
    </section>
  </div>
</template>
