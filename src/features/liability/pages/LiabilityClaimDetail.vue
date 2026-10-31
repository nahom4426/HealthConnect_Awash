<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  apiError,
  approveClaim,
  assessClaim,
  assignClaim,
  fetchClaim,
  registerClaim,
  rejectClaim,
  settleClaim,
} from '../api/liabilityApi.js';
import { money, PAYMENT_METHODS, statusLabel } from '../constants.js';
import '../liability-ui.css';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const working = ref(false);
const error = ref('');
const claim = ref(null);

const form = reactive({
  reserveAmount: '',
  adjusterName: '',
  liabilityDecision: 'PARTLY_LIABLE',
  assessedAmount: '',
  findings: '',
  approvedAmount: '',
  rejectReason: '',
  paymentReference: '',
  paymentMethod: 'BANK_TRANSFER',
  paidAmount: '',
  paidDate: new Date().toISOString().slice(0, 10),
  payeeName: '',
});

const status = computed(() => claim.value?.status);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    claim.value = await fetchClaim(route.params.claimUuid);
    form.reserveAmount = claim.value.reserveAmount ?? claim.value.amountClaimed ?? '';
    form.assessedAmount = claim.value.assessedAmount ?? claim.value.amountClaimed ?? '';
    form.approvedAmount = claim.value.approvedAmount ?? claim.value.payableAmount ?? '';
    form.paidAmount = claim.value.payableAmount ?? claim.value.approvedAmount ?? '';
    form.payeeName = claim.value.claimant?.name || '';
  } catch (e) {
    error.value = apiError(e);
  } finally {
    loading.value = false;
  }
}

async function run(action) {
  working.value = true;
  error.value = '';
  try {
    claim.value = await action();
  } catch (e) {
    error.value = apiError(e);
  } finally {
    working.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="lia-page">
    <header class="lia-head">
      <div>
        <button class="lia-link" @click="router.push('/liability/claims/process')">← Claims</button>
        <h1>{{ claim?.claimNumber || 'Claim' }}</h1>
        <p class="lia-sub">{{ claim?.claimUuid }}</p>
      </div>
    </header>

    <p v-if="loading" class="lia-note">Loading claim…</p>
    <p v-if="error" class="lia-error">{{ error }}</p>

    <template v-if="claim">
      <section class="lia-meta">
        <div><span>Status</span><strong>{{ statusLabel(claim.status) }}</strong></div>
        <div><span>Policy</span><strong>{{ claim.policyNumber || claim.policyUuid }}</strong></div>
        <div><span>Incident</span><strong>{{ claim.incidentDate }}</strong></div>
        <div><span>Claimed</span><strong>{{ money(claim.amountClaimed) }}</strong></div>
        <div><span>Payable</span><strong>{{ money(claim.payableAmount) }}</strong></div>
        <div><span>Reserve</span><strong>{{ money(claim.reserveAmount) }}</strong></div>
      </section>

      <div class="lia-grid">
        <section class="lia-card">
          <h2>Incident</h2>
          <dl class="lia-answers">
            <div><dt>Location</dt><dd>{{ claim.location }}</dd></div>
            <div><dt>Loss type</dt><dd>{{ statusLabel(claim.lossType) }}</dd></div>
            <div><dt>Claimant</dt><dd>{{ claim.claimant?.name }}</dd></div>
            <div><dt>Description</dt><dd>{{ claim.description }}</dd></div>
          </dl>
        </section>

        <section class="lia-card">
          <h2>Actions</h2>
          <div class="lia-form-grid" style="padding-top:.5rem">
            <template v-if="status === 'REPORTED'">
              <label>Reserve<input v-model="form.reserveAmount" type="number" min="0" step="0.01" /></label>
              <div class="span-2">
                <button class="lia-btn" :disabled="working" @click="run(() => registerClaim(claim.claimUuid, { reserveAmount: Number(form.reserveAmount) }))">Register</button>
              </div>
            </template>
            <template v-else-if="status === 'REGISTERED'">
              <label class="span-2">Adjuster<input v-model="form.adjusterName" /></label>
              <div class="span-2">
                <button class="lia-btn" :disabled="working || !form.adjusterName" @click="run(() => assignClaim(claim.claimUuid, { adjusterName: form.adjusterName }))">Assign</button>
              </div>
            </template>
            <template v-else-if="status === 'INVESTIGATING'">
              <label>
                Liability decision
                <select v-model="form.liabilityDecision">
                  <option value="LIABLE">Liable</option>
                  <option value="PARTLY_LIABLE">Partly liable</option>
                  <option value="NOT_LIABLE">Not liable</option>
                </select>
              </label>
              <label>Assessed amount<input v-model="form.assessedAmount" type="number" min="0" step="0.01" /></label>
              <label class="span-2">Findings<textarea v-model="form.findings" rows="2" /></label>
              <div class="span-2">
                <button class="lia-btn" :disabled="working" @click="run(() => assessClaim(claim.claimUuid, { liabilityDecision: form.liabilityDecision, assessedAmount: Number(form.assessedAmount), findings: form.findings }))">Assess</button>
              </div>
            </template>
            <template v-else-if="status === 'ASSESSED'">
              <label>Approved amount<input v-model="form.approvedAmount" type="number" min="0" step="0.01" /></label>
              <label>Reject reason<input v-model="form.rejectReason" /></label>
              <div class="span-2" style="display:flex;gap:.5rem;flex-wrap:wrap">
                <button class="lia-btn success" :disabled="working" @click="run(() => approveClaim(claim.claimUuid, { approvedAmount: Number(form.approvedAmount) }))">Approve</button>
                <button class="lia-btn ghost" :disabled="working || !form.rejectReason" @click="run(() => rejectClaim(claim.claimUuid, { reason: form.rejectReason }))">Reject</button>
              </div>
            </template>
            <template v-else-if="status === 'APPROVED'">
              <label>Payment reference<input v-model="form.paymentReference" /></label>
              <label>
                Method
                <select v-model="form.paymentMethod">
                  <option v-for="m in PAYMENT_METHODS" :key="m.value" :value="m.value">{{ m.label }}</option>
                </select>
              </label>
              <label>Paid amount<input v-model="form.paidAmount" type="number" min="0" step="0.01" /></label>
              <label>Paid date<input v-model="form.paidDate" type="date" /></label>
              <label class="span-2">Payee<input v-model="form.payeeName" /></label>
              <div class="span-2">
                <button class="lia-btn success" :disabled="working || !form.paymentReference" @click="run(() => settleClaim(claim.claimUuid, { paymentReference: form.paymentReference, paymentMethod: form.paymentMethod, paidAmount: Number(form.paidAmount), paidDate: form.paidDate, payeeName: form.payeeName }))">Settle</button>
              </div>
            </template>
            <p v-else class="span-2 lia-note" style="margin:0">No further actions on status {{ statusLabel(status) }}.</p>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
