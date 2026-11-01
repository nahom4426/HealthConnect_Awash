<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toasted } from '@/utils/utils';
import { acceptQuotation, declineQuotation, getQuotation } from '../api/productsApi';
import { formatDateTime, money, statusTone, useProductContext } from '../productUtils';
import PremiumBreakdown from '../components/PremiumBreakdown.vue';
import '../products-ui.css';

const route = useRoute();
const router = useRouter();
const { productName, basePath, can } = useProductContext();
const quotationUuid = computed(() => route.params.quotationUuid);
const quote = ref(null);
const working = ref('');
const error = ref('');

async function load() {
  error.value = '';
  try {
    quote.value = await getQuotation(quotationUuid.value);
  } catch (e) {
    error.value = e.message;
  }
}

async function act(name, fn, message) {
  working.value = name;
  error.value = '';
  try {
    quote.value = (await fn(quotationUuid.value)) || (await getQuotation(quotationUuid.value));
    toasted(true, message);
  } catch (e) {
    error.value = e.message;
  } finally {
    working.value = '';
  }
}

watch(quotationUuid, load, { immediate: true });
</script>

<template>
  <div class="pp-page">
    <header class="pp-head">
      <div>
        <button class="pp-link" @click="router.push(`${basePath}/quotations`)">← Quotations</button>
        <p class="pp-kicker" style="margin-top: .5rem">{{ productName }} · quotation</p>
        <h1>{{ quote?.quotationNumber || 'Quotation' }}</h1>
        <p v-if="quote" class="pp-sub">
          {{ quote.proposerName }} ·
          <button class="pp-link" @click="router.push(`${basePath}/proposals/${quote.proposalUuid}`)">Open proposal</button>
        </p>
      </div>
      <div v-if="quote?.status === 'ISSUED'" class="pp-actions">
        <button v-if="can('quotation.decline')" class="pp-btn danger" :disabled="Boolean(working)" @click="act('decline', declineQuotation, 'Quotation declined')">
          {{ working === 'decline' ? 'Declining…' : 'Decline' }}
        </button>
        <button v-if="can('quotation.accept')" class="pp-btn" :disabled="Boolean(working)" @click="act('accept', acceptQuotation, 'Quotation accepted')">
          {{ working === 'accept' ? 'Accepting…' : 'Accept' }}
        </button>
      </div>
    </header>

    <p v-if="error" class="pp-error">{{ error }}</p>
    <p v-if="!quote && !error" class="pp-note">Loading quotation…</p>

    <template v-if="quote">
      <section class="pp-meta">
        <div><span>Status</span><strong><span class="pp-pill" :class="statusTone(quote.status)">{{ quote.status }}</span></strong></div>
        <div><span>Rating</span><strong>{{ quote.ratingVersion || '—' }}</strong></div>
        <div><span>Sum insured</span><strong>{{ money(quote.totalSumInsured, quote.currency) }}</strong></div>
        <div><span>Premium</span><strong>{{ money(quote.totalPremium, quote.currency) }}</strong></div>
        <div v-if="quote.validUntil"><span>Valid until</span><strong>{{ formatDateTime(quote.validUntil) }}</strong></div>
      </section>
      <PremiumBreakdown :result="quote" />
    </template>
  </div>
</template>
