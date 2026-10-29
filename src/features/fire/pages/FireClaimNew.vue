<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiError, createClaim, fetchPolicies, fetchPublishedProduct, submitClaim } from '../api/fireApi.js';
import { usePcModule } from '@/features/pc/pcModule.js';
import '../fire-ui.css';

const route = useRoute();
const router = useRouter();
const pc = usePcModule();
const policies = ref([]);
const perils = ref([]);
const saving = ref(false);
const error = ref('');
const form = ref({
  policyUuid: route.query.policyUuid || '',
  lossDate: new Date().toISOString().slice(0, 10),
  location: '',
  perilCode: '',
  estimatedAmount: '',
  description: '',
});

const selectedPolicy = computed(() => policies.value.find((row) => row.policyUuid === form.value.policyUuid));

async function load() {
  error.value = '';
  try {
    const [policyPage, product] = await Promise.all([
      fetchPolicies({ productClass: pc.value.productClass, status: 'ISSUED', limit: 100, sortBy: 'createdAt' }),
      fetchPublishedProduct(pc.value.productClass),
    ]);
    policies.value = policyPage.content || [];
    perils.value = product?.perils || [];
    if (!perils.value.length) {
      perils.value = pc.value.productClass === 'FIRE'
        ? [{ code: 'FIRE_AND_LIGHTNING', label: 'Fire and lightning' }]
        : [
          { code: 'THEFT_DAMAGE', label: 'Damage caused by thieves' },
          { code: 'HOLD_UP', label: 'Hold-up / armed robbery' },
          { code: 'CASH_IN_SAFE', label: 'Cash in locked safe' },
          { code: 'CASH_IN_TRANSIT', label: 'Cash in transit' },
        ];
    }
    if (!form.value.policyUuid && policies.value.length) {
      form.value.policyUuid = policies.value[0].policyUuid;
    }
    if (!form.value.perilCode && perils.value.length) {
      form.value.perilCode = perils.value[0].code;
    }
  } catch (e) {
    error.value = apiError(e);
  }
}

async function save(andSubmit) {
  if (!form.value.policyUuid) {
    error.value = 'Select an issued policy. NYA-POL dummy numbers belong to Motor, not this catalog.';
    return;
  }
  saving.value = true;
  error.value = '';
  try {
    const created = await createClaim({
      policyUuid: form.value.policyUuid,
      lossDate: form.value.lossDate,
      location: form.value.location,
      perilCode: form.value.perilCode,
      estimatedAmount: Number(form.value.estimatedAmount),
      description: form.value.description,
    });
    const saved = andSubmit ? await submitClaim(created.claimUuid) : created;
    router.push(`${pc.value.basePath}/claims/${saved.claimUuid}`);
  } catch (e) {
    error.value = apiError(e);
  } finally {
    saving.value = false;
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
        <h1>New {{ pc.label }} claim</h1>
        <p class="fire-sub">File against an issued {{ pc.label }} policy. This does not go to Motor.</p>
      </div>
    </header>

    <p v-if="error" class="fire-error">{{ error }}</p>
    <p v-if="!policies.length" class="fire-note">
      No issued {{ pc.label }} policies yet. Accept a quotation and issue a policy first.
    </p>

    <form v-else class="fire-form" @submit.prevent="save(true)">
      <section class="fire-card">
        <h2>Loss notification</h2>
        <div class="grid-2">
          <label>
            Policy *
            <select v-model="form.policyUuid" required>
              <option disabled value="">Select issued policy</option>
              <option v-for="row in policies" :key="row.policyUuid" :value="row.policyUuid">
                {{ row.policyNumber }} · {{ row.proposerName }}
              </option>
            </select>
            <small v-if="selectedPolicy">Sum insured {{ selectedPolicy.totalSumInsured }} · {{ selectedPolicy.periodFrom }} → {{ selectedPolicy.periodTo }}</small>
          </label>
          <label>
            Date of loss *
            <input v-model="form.lossDate" type="date" required />
          </label>
          <label>
            Cause / cover *
            <select v-model="form.perilCode" required>
              <option disabled value="">Select</option>
              <option v-for="peril in perils" :key="peril.code" :value="peril.code">{{ peril.label }}</option>
            </select>
          </label>
          <label>
            Estimated loss (ETB) *
            <input v-model.number="form.estimatedAmount" type="number" min="0.01" step="0.01" required />
          </label>
          <label class="span-2">
            Incident location *
            <input v-model="form.location" required />
          </label>
          <label class="span-2">
            Description
            <textarea v-model="form.description" rows="4" />
          </label>
        </div>
      </section>
      <div class="fire-actions">
        <button type="button" class="fire-btn ghost" :disabled="saving" @click="save(false)">Save draft</button>
        <button type="submit" class="fire-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Submit for assessment' }}</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem 1rem; padding: 0 1.1rem 1rem; }
.span-2 { grid-column: span 2; }
label { display: flex; flex-direction: column; gap: .3rem; font-size: .8rem; font-weight: 600; color: #44403c; }
input, select, textarea { border: 1px solid #d6d3d1; border-radius: .5rem; padding: .5rem .65rem; font-weight: 500; }
small { font-weight: 500; color: #78716c; }
.fire-actions { display: flex; justify-content: flex-end; gap: .5rem; }
@media (max-width: 800px) { .grid-2 { grid-template-columns: 1fr; } }
</style>
