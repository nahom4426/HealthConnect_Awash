<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiError, fetchPolicy } from '../api/liabilityApi.js';
import { money, statusLabel } from '../constants.js';
import '../liability-ui.css';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const error = ref('');
const policy = ref(null);

async function load() {
  loading.value = true;
  error.value = '';
  try {
    policy.value = await fetchPolicy(route.params.policyUuid);
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
        <button class="lia-link" @click="router.push('/liability/policies')">← Policies</button>
        <h1>{{ policy?.policyNumber || 'Policy' }}</h1>
        <p class="lia-sub">{{ policy?.policyUuid }}</p>
      </div>
      <div class="lia-actions">
        <button class="lia-btn" @click="router.push({ path: '/liability/claims/new', query: { policyUuid: policy?.policyUuid } })">New claim</button>
      </div>
    </header>

    <p v-if="loading" class="lia-note">Loading policy…</p>
    <p v-if="error" class="lia-error">{{ error }}</p>

    <template v-if="policy">
      <section class="lia-meta">
        <div><span>Status</span><strong>{{ statusLabel(policy.status) }}</strong></div>
        <div><span>Product</span><strong>{{ policy.productName || policy.productCode }}</strong></div>
        <div><span>Insured</span><strong>{{ policy.insured?.name || policy.insuredName }}</strong></div>
        <div><span>Period</span><strong>{{ policy.periodFrom || policy.cover?.startDate }} → {{ policy.periodTo || policy.cover?.endDate }}</strong></div>
        <div><span>Claims</span><strong>{{ policy.claimCount ?? 0 }} open {{ policy.openClaimCount ?? 0 }}</strong></div>
        <div><span>Remaining aggregate</span><strong>{{ money(policy.remainingAggregate) }}</strong></div>
      </section>

      <div class="lia-grid">
        <section class="lia-card">
          <h2>Cover</h2>
          <dl class="lia-answers">
            <div><dt>Per occurrence</dt><dd>{{ money(policy.cover?.limitPerOccurrence || policy.limitPerOccurrence) }}</dd></div>
            <div><dt>Aggregate</dt><dd>{{ money(policy.cover?.aggregateLimit || policy.aggregateLimit) }}</dd></div>
            <div><dt>Deductible</dt><dd>{{ money(policy.cover?.deductibleAmount || policy.deductibleAmount) }}</dd></div>
            <div><dt>Premium</dt><dd>{{ money(policy.premium?.totalPayable || policy.totalPremium) }}</dd></div>
          </dl>
        </section>
        <section class="lia-card">
          <h2>Exclusions</h2>
          <ul v-if="policy.exclusions?.length">
            <li v-for="(item, i) in policy.exclusions" :key="i">{{ item }}</li>
          </ul>
          <p v-else>No exclusions listed.</p>
        </section>
      </div>
    </template>
  </div>
</template>
