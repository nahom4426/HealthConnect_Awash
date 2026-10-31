<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiError, fetchProposal, issueQuote, previewQuote } from '../api/fireApi.js';
import { usePcModule } from '@/features/pc/pcModule.js';
import '../fire-ui.css';

const route = useRoute();
const router = useRouter();
const pc = usePcModule();
const proposal = ref(null);
const preview = ref(null);
const working = ref(false);
const error = ref('');

function money(value) {
  if (value == null) return '—';
  return `ETB ${Number(value).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

async function load() {
  error.value = '';
  try {
    proposal.value = await fetchProposal(route.params.proposalUuid);
    if (pc.value.productClass === 'MARINE') {
      if (proposal.value?.marineQuoteId) {
        await router.replace(`/marine/quotes/${proposal.value.marineQuoteId}`);
      }
      return;
    }
    preview.value = await previewQuote(route.params.proposalUuid);
  } catch (e) {
    error.value = apiError(e);
  }
}

async function onIssue() {
  working.value = true;
  error.value = '';
  try {
    const issued = await issueQuote(route.params.proposalUuid);
    router.push(`${pc.value.basePath}/quotations/${issued.quotationUuid}`);
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
        <button class="link" @click="router.push(`${pc.basePath}/proposals/${route.params.proposalUuid}`)">← Proposal</button>
        <p class="fire-kicker">{{ pc.kicker }} · quotation</p>
        <h1>Issue quotation</h1>
        <p class="fire-sub">{{ proposal?.proposerName }} · {{ route.params.proposalUuid }}</p>
      </div>
      <button class="fire-btn" :disabled="working || proposal?.status !== 'SUBMITTED'" @click="onIssue">
        {{ working ? 'Issuing…' : 'Issue quotation' }}
      </button>
    </header>

    <p v-if="pc.productClass === 'MARINE' && proposal && !proposal.marineQuoteId" class="fire-note">
      This proposal has no Marine quotation yet. Submit it from the proposal, then rate that quotation.
    </p>
    <p v-if="error" class="fire-error">{{ error }}</p>
    <p v-if="proposal && proposal.status !== 'SUBMITTED'" class="fire-note">
      Only submitted proposals can be quoted. Current status: {{ proposal.status }}.
    </p>

    <section v-if="preview" class="fire-card premium-card">
      <h2>Premium preview · {{ preview.ratingVersion }}</h2>
      <p class="premium">{{ money(preview.totalPremium) }} <small>{{ preview.currency || 'ETB' }}</small></p>
      <table v-if="preview.breakdown?.length">
        <tbody>
          <tr v-for="(line, i) in preview.breakdown" :key="i">
            <td>{{ line.label }}</td>
            <td>{{ money(line.amount) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
