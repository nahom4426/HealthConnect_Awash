<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiError, fetchPolicy } from '../api/fireApi.js';
import { usePcModule } from '@/features/pc/pcModule.js';
import '../fire-ui.css';

const route = useRoute();
const router = useRouter();
const pc = usePcModule();
const policy = ref(null);
const error = ref('');

function money(value) {
  if (value == null) return '—';
  return `ETB ${Number(value).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

onMounted(async () => {
  try {
    policy.value = await fetchPolicy(route.params.policyUuid);
  } catch (e) {
    error.value = apiError(e);
  }
});
</script>

<template>
  <div class="fire-page">
    <header class="fire-head">
      <div>
        <button class="link" @click="router.push(`${pc.basePath}/policies`)">← Policies</button>
        <p class="fire-kicker">{{ pc.kicker }} · policy</p>
        <h1>{{ policy?.policyNumber || 'Policy' }}</h1>
        <p class="fire-sub">{{ policy?.proposerName }} · {{ policy?.policyUuid }}</p>
      </div>
      <button
        class="fire-btn"
        :disabled="policy?.status !== 'ISSUED'"
        @click="router.push(`${pc.basePath}/claims/new?policyUuid=${policy.policyUuid}`)"
      >
        File claim
      </button>
    </header>

    <p v-if="error" class="fire-error">{{ error }}</p>

    <section v-if="policy" class="fire-meta">
      <div><span>Status</span><strong>{{ policy.status }}</strong></div>
      <div><span>Period</span><strong>{{ policy.periodFrom }} → {{ policy.periodTo }}</strong></div>
      <div><span>Sum insured</span><strong>{{ money(policy.totalSumInsured) }}</strong></div>
      <div><span>Premium</span><strong>{{ money(policy.totalPremium) }}</strong></div>
    </section>

    <section v-if="policy" class="fire-card">
      <h2>Linked records</h2>
      <p>
        Proposal
        <button class="link" @click="router.push(`${pc.basePath}/proposals/${policy.proposalUuid}`)">{{ policy.proposalUuid }}</button>
      </p>
      <p>
        Quotation
        <button class="link" @click="router.push(`${pc.basePath}/quotations/${policy.quotationUuid}`)">{{ policy.quotationUuid }}</button>
      </p>
    </section>
  </div>
</template>
