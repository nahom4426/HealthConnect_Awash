<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiError, fetchDashboardSummary } from '../api/liabilityApi.js';
import '../liability-ui.css';

const router = useRouter();
const loading = ref(false);
const error = ref('');
const summary = ref(null);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    summary.value = await fetchDashboardSummary();
  } catch (e) {
    error.value = apiError(e);
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="lia-page">
    <header class="lia-head">
      <div>
        <p class="lia-kicker">Liability</p>
        <h1>Dashboard</h1>
        <p class="lia-sub">Quotations, underwriting, policies and claims in one liability workflow — same pattern as Marine.</p>
      </div>
      <div class="lia-actions">
        <button class="lia-btn ghost" :disabled="loading" @click="load">Refresh</button>
        <button class="lia-btn" @click="router.push('/liability/quotations/new')">New quotation</button>
      </div>
    </header>

    <p v-if="loading" class="lia-note">Loading summary…</p>
    <p v-if="error" class="lia-error">{{ error }}</p>

    <section v-if="summary" class="lia-meta">
      <div><span>Policies issued this year</span><strong>{{ summary.policiesIssuedThisYear ?? '—' }}</strong></div>
      <div><span>Open quotations</span><strong>{{ summary.openQuotations ?? summary.quotationsOpen ?? '—' }}</strong></div>
      <div><span>Active policies</span><strong>{{ summary.activePolicies ?? '—' }}</strong></div>
      <div><span>Claims to settle</span><strong>{{ summary.attention?.claimsToSettle ?? '—' }}</strong></div>
    </section>

    <div class="lia-grid">
      <section class="lia-card">
        <h2>Start work</h2>
        <ul>
          <li><button class="lia-link" @click="router.push('/liability/quotations/new')">Create a liability quotation</button></li>
          <li><button class="lia-link" @click="router.push('/liability/quotations')">Review quotations &amp; underwrite</button></li>
          <li><button class="lia-link" @click="router.push('/liability/claims/process')">Process claims</button></li>
          <li><button class="lia-link" @click="router.push('/liability/products')">Product tariffs</button></li>
        </ul>
      </section>
      <section class="lia-card">
        <h2>Workflow</h2>
        <p>Quotation → submit → underwrite (inside the quotation) → accept → issue policy → claims. There is no separate underwriting queue.</p>
      </section>
    </div>
  </div>
</template>
