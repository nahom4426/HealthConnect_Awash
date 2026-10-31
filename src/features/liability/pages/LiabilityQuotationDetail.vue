<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  acceptQuotation,
  apiError,
  fetchQuotation,
  issuePolicy,
  submitQuotation,
  underwriteQuotation,
} from '../api/liabilityApi.js';
import { money, PAYMENT_METHODS, statusLabel } from '../constants.js';
import '../liability-ui.css';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const working = ref(false);
const error = ref('');
const quotation = ref(null);
const tab = ref('cover');

const uw = reactive({
  decision: 'QUOTE',
  loadingPercent: 0,
  discountPercent: 0,
  conditions: '',
  note: '',
});

const issue = reactive({
  paymentReference: '',
  paymentMethod: 'BANK_TRANSFER',
  paidAmount: '',
  paidDate: new Date().toISOString().slice(0, 10),
});

const canEdit = computed(() => quotation.value?.status === 'DRAFT');
const canSubmit = computed(() => quotation.value?.status === 'DRAFT');
const canUnderwrite = computed(() => quotation.value?.status === 'SUBMITTED');
const canAccept = computed(() => quotation.value?.status === 'QUOTED');
const canIssue = computed(() => quotation.value?.status === 'ACCEPTED');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    quotation.value = await fetchQuotation(route.params.quotationUuid);
    if (quotation.value?.premium?.totalPayable != null) {
      issue.paidAmount = quotation.value.premium.totalPayable;
    }
  } catch (e) {
    error.value = apiError(e);
  } finally {
    loading.value = false;
  }
}

async function onSubmit() {
  working.value = true;
  error.value = '';
  try {
    quotation.value = await submitQuotation(route.params.quotationUuid, 'Ready for underwriting');
    tab.value = 'underwriting';
  } catch (e) {
    error.value = apiError(e);
  } finally {
    working.value = false;
  }
}

async function onUnderwrite() {
  working.value = true;
  error.value = '';
  try {
    quotation.value = await underwriteQuotation(route.params.quotationUuid, {
      decision: uw.decision,
      loadingPercent: Number(uw.loadingPercent) || 0,
      discountPercent: Number(uw.discountPercent) || 0,
      conditions: uw.conditions,
      note: uw.note,
    });
    tab.value = uw.decision === 'QUOTE' ? 'acceptance' : 'cover';
  } catch (e) {
    error.value = apiError(e);
  } finally {
    working.value = false;
  }
}

async function onAccept() {
  working.value = true;
  error.value = '';
  try {
    quotation.value = await acceptQuotation(route.params.quotationUuid);
    tab.value = 'acceptance';
  } catch (e) {
    error.value = apiError(e);
  } finally {
    working.value = false;
  }
}

async function onIssue() {
  working.value = true;
  error.value = '';
  try {
    const policy = await issuePolicy(route.params.quotationUuid, {
      paymentReference: issue.paymentReference,
      paymentMethod: issue.paymentMethod,
      paidAmount: Number(issue.paidAmount),
      paidDate: issue.paidDate,
    });
    router.push(`/liability/policies/${policy.policyUuid}`);
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
        <button class="lia-link" @click="router.push('/liability/quotations')">← Quotations</button>
        <h1>{{ quotation?.quotationNumber || 'Quotation' }}</h1>
        <p class="lia-sub">{{ quotation?.quotationUuid }}</p>
      </div>
      <div class="lia-actions">
        <button v-if="canEdit" class="lia-btn ghost" @click="router.push(`/liability/quotations/${route.params.quotationUuid}/edit`)">Edit</button>
        <button v-if="canSubmit" class="lia-btn" :disabled="working" @click="onSubmit">Submit for underwriting</button>
        <button v-if="canAccept" class="lia-btn success" :disabled="working" @click="onAccept">Accept quotation</button>
      </div>
    </header>

    <p v-if="loading" class="lia-note">Loading quotation…</p>
    <p v-if="error" class="lia-error">{{ error }}</p>

    <template v-if="quotation">
      <section class="lia-meta">
        <div><span>Status</span><strong>{{ statusLabel(quotation.status) }}</strong></div>
        <div><span>Product</span><strong>{{ quotation.productName }} ({{ quotation.productCode }})</strong></div>
        <div><span>Insured</span><strong>{{ quotation.insured?.name }}</strong></div>
        <div><span>Premium</span><strong>{{ money(quotation.premium?.totalPayable) }}</strong></div>
        <div v-if="quotation.validUntil"><span>Valid until</span><strong>{{ quotation.validUntil }}</strong></div>
        <div v-if="quotation.policyNumber"><span>Policy</span><strong>{{ quotation.policyNumber }}</strong></div>
      </section>

      <p class="lia-note">
        Underwriting and rating belong on this quotation. There is no separate underwriting queue — same architecture as Marine.
      </p>

      <div class="lia-tabs" role="tablist">
        <button type="button" class="lia-tab" :class="{ active: tab === 'cover' }" @click="tab = 'cover'">Cover &amp; risk</button>
        <button type="button" class="lia-tab" :class="{ active: tab === 'underwriting' }" @click="tab = 'underwriting'">Underwriting</button>
        <button type="button" class="lia-tab" :class="{ active: tab === 'premium' }" @click="tab = 'premium'">Premium</button>
        <button type="button" class="lia-tab" :class="{ active: tab === 'acceptance' }" @click="tab = 'acceptance'">Acceptance &amp; issue</button>
        <button type="button" class="lia-tab" :class="{ active: tab === 'activity' }" @click="tab = 'activity'">Activity</button>
      </div>

      <section v-if="tab === 'cover'" class="lia-grid">
        <div class="lia-card">
          <h2>Insured</h2>
          <dl class="lia-answers">
            <div><dt>Name</dt><dd>{{ quotation.insured?.name }}</dd></div>
            <div><dt>TIN</dt><dd>{{ quotation.insured?.tin || '—' }}</dd></div>
            <div><dt>Phone</dt><dd>{{ quotation.insured?.phone || '—' }}</dd></div>
            <div><dt>Email</dt><dd>{{ quotation.insured?.email || '—' }}</dd></div>
            <div><dt>City</dt><dd>{{ quotation.insured?.address?.city || '—' }}</dd></div>
            <div><dt>Region</dt><dd>{{ quotation.insured?.address?.region || '—' }}</dd></div>
          </dl>
        </div>
        <div class="lia-card">
          <h2>Limits</h2>
          <dl class="lia-answers">
            <div><dt>Per occurrence</dt><dd>{{ money(quotation.cover?.limitPerOccurrence) }}</dd></div>
            <div><dt>Aggregate</dt><dd>{{ money(quotation.cover?.aggregateLimit) }}</dd></div>
            <div><dt>Deductible</dt><dd>{{ money(quotation.cover?.deductibleAmount) }}</dd></div>
            <div><dt>Period</dt><dd>{{ quotation.cover?.startDate || '—' }} → {{ quotation.cover?.endDate || '—' }}</dd></div>
            <div><dt>Extensions</dt><dd>{{ (quotation.cover?.extensionCodes || []).join(', ') || 'None' }}</dd></div>
            <div><dt>Cover basis</dt><dd>{{ quotation.coverBasis }}</dd></div>
          </dl>
        </div>
        <div class="lia-card" style="grid-column:1/-1">
          <h2>Risk items</h2>
          <table>
            <thead><tr><th>Category</th><th>Basis</th><th>Description</th></tr></thead>
            <tbody>
              <tr v-for="(item, i) in quotation.cover?.riskItems || []" :key="i">
                <td>{{ item.categoryCode }}</td>
                <td>{{ money(item.basisAmount) }}</td>
                <td>{{ item.description || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-else-if="tab === 'underwriting'" class="lia-card">
        <h2>Underwriting</h2>
        <p v-if="quotation.underwriting" class="lia-note">
          Decision <strong>{{ quotation.underwriting.decision }}</strong>
          <template v-if="quotation.underwriting.decidedBy"> by {{ quotation.underwriting.decidedBy }}</template>
          <template v-if="quotation.underwriting.note"> — {{ quotation.underwriting.note }}</template>
        </p>
        <template v-if="canUnderwrite">
          <div class="lia-form-grid">
            <label>
              Decision
              <select v-model="uw.decision">
                <option value="QUOTE">Quote</option>
                <option value="DECLINE">Decline</option>
              </select>
            </label>
            <label>Loading %<input v-model.number="uw.loadingPercent" type="number" min="0" step="0.01" /></label>
            <label>Discount %<input v-model.number="uw.discountPercent" type="number" min="0" step="0.01" /></label>
            <label class="span-2">Conditions<textarea v-model="uw.conditions" rows="2" /></label>
            <label class="span-2">Note<textarea v-model="uw.note" rows="2" /></label>
          </div>
          <div class="lia-actions" style="padding:0 1.15rem 1.15rem">
            <button class="lia-btn" :disabled="working" @click="onUnderwrite">{{ uw.decision === 'DECLINE' ? 'Decline' : 'Issue quotation terms' }}</button>
          </div>
        </template>
        <p v-else class="lia-note">Submit the draft before underwriting, or review the decision already recorded.</p>
      </section>

      <section v-else-if="tab === 'premium'" class="lia-card">
        <h2>Premium</h2>
        <dl v-if="quotation.premium" class="lia-answers">
          <div><dt>Base premium</dt><dd>{{ money(quotation.premium.basePremium) }}</dd></div>
          <div><dt>Loadings</dt><dd>{{ money(quotation.premium.loadingAmount ?? quotation.premium.extensionsLoading) }}</dd></div>
          <div><dt>Discounts</dt><dd>{{ money(quotation.premium.discountAmount) }}</dd></div>
          <div><dt>Policy fee</dt><dd>{{ money(quotation.premium.policyFee) }}</dd></div>
          <div><dt>Total payable</dt><dd>{{ money(quotation.premium.totalPayable) }}</dd></div>
        </dl>
        <p v-else class="lia-note">Premium appears when the quotation is priced from the product tariff.</p>
      </section>

      <section v-else-if="tab === 'acceptance'" class="lia-card">
        <h2>Acceptance &amp; issue policy</h2>
        <p v-if="quotation.status === 'QUOTED'" class="lia-note">Quotation is issued. Accept it, then record payment to bind the policy.</p>
        <p v-else-if="canIssue" class="lia-note">Accepted. Issue the liability policy when payment is confirmed.</p>
        <p v-else class="lia-note">Finish underwriting and accept before issuing a policy.</p>
        <div v-if="canIssue" class="lia-form-grid">
          <label>Payment reference *<input v-model="issue.paymentReference" required /></label>
          <label>
            Method
            <select v-model="issue.paymentMethod">
              <option v-for="m in PAYMENT_METHODS" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </label>
          <label>Paid amount *<input v-model="issue.paidAmount" type="number" min="0" step="0.01" /></label>
          <label>Paid date *<input v-model="issue.paidDate" type="date" /></label>
        </div>
        <div v-if="canIssue" class="lia-actions" style="padding:0 1.15rem 1.15rem">
          <button class="lia-btn success" :disabled="working || !issue.paymentReference" @click="onIssue">Issue policy</button>
        </div>
        <p v-if="quotation.policyUuid">
          Policy issued:
          <button class="lia-link" @click="router.push(`/liability/policies/${quotation.policyUuid}`)">{{ quotation.policyNumber }}</button>
        </p>
      </section>

      <section v-else class="lia-card">
        <h2>Activity</h2>
        <ul v-if="quotation.history?.length">
          <li v-for="(h, i) in quotation.history" :key="i">
            <strong>{{ h.action }}</strong>
            <span v-if="h.note"> — {{ h.note }}</span>
            <span class="lia-muted"> · {{ h.by || h.actor }} · {{ h.at || h.createdAt }}</span>
          </li>
        </ul>
        <p v-else class="lia-note">No history rows on this quotation yet.</p>
      </section>
    </template>
  </div>
</template>
