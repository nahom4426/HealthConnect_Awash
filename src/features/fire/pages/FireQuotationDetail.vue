<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { acceptQuote, apiError, declineQuote, fetchQuotation, issuePolicy } from '../api/fireApi.js';
import { usePcModule } from '@/features/pc/pcModule.js';
import '../fire-ui.css';

const route = useRoute();
const router = useRouter();
const pc = usePcModule();
const quote = ref(null);
const working = ref(false);
const error = ref('');

function money(value) {
  if (value == null) return '—';
  return `ETB ${Number(value).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

async function load() {
  error.value = '';
  try {
    quote.value = await fetchQuotation(route.params.quotationUuid);
  } catch (e) {
    error.value = apiError(e);
  }
}

async function run(fn) {
  working.value = true;
  error.value = '';
  try {
    return await fn();
  } catch (e) {
    error.value = apiError(e);
    return null;
  } finally {
    working.value = false;
  }
}

async function onAccept() {
  const next = await run(() => acceptQuote(route.params.quotationUuid));
  if (next) quote.value = next;
}

async function onDecline() {
  const next = await run(() => declineQuote(route.params.quotationUuid));
  if (next) quote.value = next;
}

async function onIssuePolicy() {
  const policy = await run(() => issuePolicy(route.params.quotationUuid));
  if (policy) router.push(`${pc.value.basePath}/policies/${policy.policyUuid}`);
}

onMounted(load);
</script>

<template>
  <div class="fire-page">
    <header class="fire-head">
      <div>
        <button class="link" @click="router.push(`${pc.basePath}/quotations`)">← Quotations</button>
        <p class="fire-kicker">{{ pc.kicker }} · quotation</p>
        <h1>{{ quote?.quotationNumber || 'Quotation' }}</h1>
        <p class="fire-sub">{{ quote?.proposerName }} · {{ quote?.proposalUuid }}</p>
      </div>
      <div class="fire-actions">
        <button class="fire-btn ghost" :disabled="working || quote?.status !== 'ISSUED'" @click="onDecline">Decline</button>
        <button class="fire-btn ghost" :disabled="working || quote?.status !== 'ISSUED'" @click="onAccept">Accept</button>
        <button class="fire-btn" :disabled="working || quote?.status !== 'ACCEPTED'" @click="onIssuePolicy">Issue policy</button>
      </div>
    </header>

    <p v-if="error" class="fire-error">{{ error }}</p>

    <section v-if="quote" class="fire-meta">
      <div><span>Status</span><strong>{{ quote.status }}</strong></div>
      <div><span>Rating</span><strong>{{ quote.ratingVersion }}</strong></div>
      <div><span>Sum insured</span><strong>{{ money(quote.totalSumInsured) }}</strong></div>
      <div><span>Premium</span><strong>{{ money(quote.totalPremium) }}</strong></div>
    </section>

    <section v-if="quote" class="fire-card premium-card">
      <h2>Premium</h2>
      <p class="premium">{{ money(quote.totalPremium) }} <small>{{ quote.currency || 'ETB' }}</small></p>
      <table v-if="quote.breakdown?.length">
        <tbody>
          <tr v-for="(line, i) in quote.breakdown" :key="i">
            <td>{{ line.label }}</td>
            <td>{{ money(line.amount) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="fire-note" style="padding-bottom: 1rem">No premium breakdown lines were returned for this quotation.</p>
    </section>
  </div>
</template>
