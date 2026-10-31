<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiError, createClaim, validatePolicy } from '../api/liabilityApi.js';
import { LOSS_TYPES } from '../constants.js';
import '../liability-ui.css';

const route = useRoute();
const router = useRouter();
const saving = ref(false);
const error = ref('');
const validation = ref(null);

const form = reactive({
  policyNumber: '',
  policyUuid: route.query.policyUuid || '',
  incidentDate: new Date().toISOString().slice(0, 10),
  location: '',
  description: '',
  lossType: 'BODILY_INJURY',
  amountClaimed: '',
  claimant: { name: '', type: 'MEMBER_OF_PUBLIC' },
});

async function checkPolicy() {
  error.value = '';
  validation.value = null;
  if (!form.policyNumber || !form.incidentDate) return;
  try {
    validation.value = await validatePolicy(form.policyNumber, form.incidentDate);
    if (validation.value?.policy?.policyUuid) form.policyUuid = validation.value.policy.policyUuid;
  } catch (e) {
    error.value = apiError(e);
  }
}

async function submit() {
  saving.value = true;
  error.value = '';
  try {
    if (!form.policyUuid) await checkPolicy();
    if (!form.policyUuid) throw new Error('Validate a covered policy first');
    const saved = await createClaim({
      policyUuid: form.policyUuid,
      incidentDate: form.incidentDate,
      location: form.location,
      description: form.description,
      lossType: form.lossType,
      amountClaimed: Number(form.amountClaimed),
      claimant: { ...form.claimant },
    });
    router.push(`/liability/claims/${saved.claimUuid}`);
  } catch (e) {
    error.value = apiError(e);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  if (route.query.policyNumber) form.policyNumber = String(route.query.policyNumber);
});
</script>

<template>
  <div class="lia-page">
    <header class="lia-head">
      <div>
        <button class="lia-link" @click="router.push('/liability/claims/process')">← Claims</button>
        <h1>New Claim</h1>
        <p class="lia-sub">Validate the liability policy, then register the incident.</p>
      </div>
    </header>

    <p v-if="error" class="lia-error">{{ error }}</p>
    <p v-if="validation" class="lia-note">
      Policy {{ validation.found ? 'found' : 'not found' }}
      <template v-if="validation.covered"> · covered on the incident date</template>
      <template v-else-if="validation.found"> · not covered on that date</template>
    </p>

    <form class="lia-card" @submit.prevent="submit">
      <h2>Claim details</h2>
      <div class="lia-form-grid">
        <label>Policy number *<input v-model="form.policyNumber" required @blur="checkPolicy" /></label>
        <label>Incident date *<input v-model="form.incidentDate" type="date" required @change="checkPolicy" /></label>
        <label>Location *<input v-model="form.location" required /></label>
        <label>
          Loss type *
          <select v-model="form.lossType">
            <option v-for="t in LOSS_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </label>
        <label>Amount claimed *<input v-model="form.amountClaimed" type="number" min="1" step="0.01" required /></label>
        <label>Claimant name *<input v-model="form.claimant.name" required /></label>
        <label class="span-2">Description *<textarea v-model="form.description" rows="3" required /></label>
      </div>
      <div class="lia-actions" style="padding:0 1.15rem 1.15rem;justify-content:flex-end">
        <button type="button" class="lia-btn ghost" @click="router.back()">Cancel</button>
        <button type="submit" class="lia-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Create claim' }}</button>
      </div>
    </form>
  </div>
</template>
