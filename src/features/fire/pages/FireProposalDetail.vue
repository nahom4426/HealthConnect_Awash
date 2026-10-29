<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiError, fetchProposal, submitProposal } from '../api/fireApi.js';
import { parseAnswers, ratingAxes, usePcModule } from '@/features/pc/pcModule.js';
import '../fire-ui.css';

const route = useRoute();
const router = useRouter();
const pc = usePcModule();
const loading = ref(false);
const working = ref(false);
const error = ref('');
const proposal = ref(null);
const answers = computed(() => parseAnswers(proposal.value?.answersJson));
const axes = computed(() => ratingAxes(proposal.value));
const isFire = computed(() => pc.value.productClass === 'FIRE');

function money(value) {
  if (value == null) return '—';
  return `ETB ${Number(value).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    proposal.value = await fetchProposal(route.params.proposalUuid);
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
    proposal.value = await submitProposal(route.params.proposalUuid);
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
        <button class="link" @click="router.push(`${pc.basePath}/proposals`)">← Proposals</button>
        <h1>{{ proposal?.proposerName || `${pc.label} proposal` }}</h1>
        <p class="fire-sub">{{ proposal?.proposalUuid }}</p>
      </div>
      <div class="fire-actions">
        <button
          class="fire-btn ghost"
          :disabled="proposal?.status !== 'DRAFT'"
          @click="router.push(`${pc.basePath}/proposals/${route.params.proposalUuid}/edit`)"
        >
          Edit
        </button>
        <button class="fire-btn" :disabled="working || proposal?.status !== 'DRAFT'" @click="onSubmit">Submit for quotation</button>
        <button
          class="fire-btn ghost"
          :disabled="proposal?.status !== 'SUBMITTED'"
          @click="router.push(`${pc.basePath}/quotations/new/${route.params.proposalUuid}`)"
        >
          Issue quotation
        </button>
      </div>
    </header>

    <p v-if="loading" class="fire-note">Loading proposal…</p>
    <p v-if="error" class="fire-error">{{ error }}</p>
    <p v-if="proposal?.status === 'SUBMITTED'" class="fire-note">
      Submitted. This risk is on the Quotations page, waiting to be quoted.
      <button class="link" @click="router.push(`${pc.basePath}/quotations/new/${route.params.proposalUuid}`)">Issue quotation</button>
    </p>

    <template v-if="proposal">
      <section class="fire-meta">
        <div><span>Status</span><strong>{{ proposal.status }}</strong></div>
        <div><span>Product</span><strong>{{ proposal.productClass }} {{ proposal.productVersion }}</strong></div>
        <div><span>{{ pc.axis1 }}</span><strong>{{ axes.axis1 }}</strong></div>
        <div><span>{{ pc.axis2 }}</span><strong>{{ axes.axis2 }}</strong></div>
        <div><span>Sum insured</span><strong>{{ money(proposal.totalSumInsured) }}</strong></div>
      </section>

      <div class="fire-grid">
        <section v-if="isFire" class="fire-card">
          <h2>Premises</h2>
          <ul>
            <li>Sprinklers: {{ proposal.premises?.hasSprinklers ? 'Yes' : 'No' }}</li>
            <li>Inflammable goods: {{ proposal.premises?.inflammableGoods ? 'Yes' : 'No' }}</li>
            <li>Power machinery: {{ proposal.premises?.powerMachinery ? 'Yes' : 'No' }}</li>
            <li>Basement stock: {{ proposal.premises?.basementUsedForStock ? 'Yes' : 'No' }}</li>
            <li>Adjacent thatch: {{ proposal.premises?.adjacentThatch ? 'Yes' : 'No' }}</li>
          </ul>
        </section>
        <section v-else class="fire-card">
          <h2>Security</h2>
          <ul>
            <li>Intruder alarm: {{ answers.hasIntruderAlarm ? 'Yes' : 'No' }}</li>
            <li>Monitored: {{ answers.alarmMonitored ? 'Yes' : 'No' }}</li>
            <li>Bars on openings: {{ answers.barsOnOpenings ? 'Yes' : 'No' }}</li>
            <li>Watchman: {{ answers.hasWatchman ? 'Yes' : 'No' }}</li>
            <li>High-value goods: {{ answers.highValueGoods ? 'Yes' : 'No' }}</li>
          </ul>
        </section>
        <section class="fire-card">
          <h2>Schedule</h2>
          <ul>
            <li v-for="item in proposal.riskItems" :key="item.riskItemUuid">
              <strong>{{ item.itemType }}</strong>
              <span> {{ item.description }} · {{ money(item.sumInsured) }}</span>
            </li>
          </ul>
        </section>
        <section class="fire-card">
          <h2>Additional perils</h2>
          <p v-if="!proposal.selectedPerils?.length">None selected</p>
          <ul v-else>
            <li v-for="code in proposal.selectedPerils" :key="code">{{ code }}</li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>
