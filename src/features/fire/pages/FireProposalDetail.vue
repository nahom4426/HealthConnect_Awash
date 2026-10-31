<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiError, fetchProposal, previewQuote, submitProposal, withdrawProposal } from '../api/fireApi.js';
import {
  formatAnswerValue,
  parseAnswers,
  proposalAnswerRows,
  proposalAnswerSections,
  ratingAxes,
  usePcModule,
} from '@/features/pc/pcModule.js';
import '../fire-ui.css';

const route = useRoute();
const router = useRouter();
const pc = usePcModule();
const loading = ref(false);
const working = ref(false);
const error = ref('');
const premiumError = ref('');
const premiumPreview = ref(null);
const proposal = ref(null);
const answers = computed(() => parseAnswers(proposal.value?.answersJson));
const axes = computed(() => ratingAxes(proposal.value));
const isFire = computed(() => pc.value.productClass === 'FIRE');
const isMarine = computed(() => pc.value.productClass === 'MARINE');
const isOpenCover = computed(() => answers.value.insuranceArrangement === 'OPEN_COVER');
const marineSections = computed(() => (isMarine.value ? proposalAnswerSections(answers.value) : []));
const genericAnswerRows = computed(() =>
  isMarine.value
    ? []
    : proposalAnswerRows(answers.value, {
        prefer: [
          'proposerName',
          'proposerPhone',
          'proposerAddress',
          'occupation',
          'riskAddress',
          'periodFrom',
          'periodTo',
          'soleOccupancy',
        ],
      }),
);
const scheduleItems = computed(() => {
  const fromProposal = proposal.value?.riskItems || [];
  if (fromProposal.length) return fromProposal;
  const fromAnswers = answers.value.riskItems;
  return Array.isArray(fromAnswers) ? fromAnswers : [];
});
const perilCodes = computed(() => {
  const fromProposal = proposal.value?.selectedPerils || [];
  if (fromProposal.length) return fromProposal;
  const fromAnswers = answers.value.selectedPerils;
  return Array.isArray(fromAnswers) ? fromAnswers : [];
});

function money(value) {
  if (value == null || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `ETB ${amount.toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

function scheduleLabel(item) {
  return formatAnswerValue(item?.itemType || item?.type) || 'Item';
}

function perilLabel(code) {
  return formatAnswerValue(code) || code;
}

async function loadPremium() {
  premiumPreview.value = null;
  premiumError.value = '';
  if (!proposal.value || isMarine.value) return;
  try {
    premiumPreview.value = await previewQuote(route.params.proposalUuid);
  } catch (e) {
    premiumError.value = apiError(e);
  }
}

async function load() {
  loading.value = true;
  error.value = '';
  premiumPreview.value = null;
  premiumError.value = '';
  try {
    proposal.value = await fetchProposal(route.params.proposalUuid);
    await loadPremium();
  } catch (e) {
    error.value = apiError(e);
  } finally {
    loading.value = false;
  }
}

async function onWithdraw() {
  working.value = true;
  error.value = '';
  try {
    proposal.value = await withdrawProposal(route.params.proposalUuid);
  } catch (e) {
    error.value = apiError(e);
  } finally {
    working.value = false;
  }
}

async function onSubmit() {
  working.value = true;
  error.value = '';
  try {
    proposal.value = await submitProposal(route.params.proposalUuid);
    if (isMarine.value && proposal.value?.marineQuoteId) {
      await router.push(`/marine/quotes/${proposal.value.marineQuoteId}`);
      return;
    }
    await loadPremium();
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
        <h1>{{ proposal?.proposerName || formatAnswerValue(answers.insuredParty) || `${pc.label} proposal` }}</h1>
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
          v-if="isMarine"
          class="fire-btn ghost"
          :disabled="working || !['DRAFT', 'SUBMITTED'].includes(proposal?.status)"
          @click="onWithdraw"
        >
          Withdraw
        </button>
        <button
          v-if="isMarine && proposal?.marineQuoteId"
          class="fire-btn ghost"
          @click="router.push(`/marine/quotes/${proposal.marineQuoteId}`)"
        >
          Open quotation
        </button>
        <button
          v-if="!isMarine"
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
    <p v-if="isMarine && proposal?.status === 'SUBMITTED'" class="fire-note">
      Submitted. Underwriting, rating, payment and binding continue on the Marine quotation.
      <button v-if="proposal.marineQuoteId" class="link" @click="router.push(`/marine/quotes/${proposal.marineQuoteId}`)">Open quotation {{ proposal.marineQuoteNo }}</button>
    </p>
    <p v-else-if="proposal?.status === 'SUBMITTED'" class="fire-note">
      Submitted. This risk is on the Quotations page, waiting to be quoted.
      <button class="link" @click="router.push(`${pc.basePath}/quotations/new/${route.params.proposalUuid}`)">Issue quotation</button>
    </p>

    <template v-if="proposal">
      <section class="fire-meta">
        <div><span>Status</span><strong>{{ proposal.status }}</strong></div>
        <div><span>Product</span><strong>{{ proposal.productClass }} {{ proposal.productVersion }}</strong></div>
        <div v-if="isMarine && answers.insuranceArrangement">
          <span>Arrangement</span>
          <strong>{{ formatAnswerValue(answers.insuranceArrangement) }}</strong>
        </div>
        <div v-if="answers.periodFrom || answers.periodTo">
          <span>Period</span>
          <strong>{{ answers.periodFrom || '—' }} → {{ answers.periodTo || '—' }}</strong>
        </div>
        <div><span>{{ isOpenCover ? 'Frequency' : pc.axis1 }}</span><strong>{{ isOpenCover ? (formatAnswerValue(answers.shipmentFrequency) || '—') : axes.axis1 }}</strong></div>
        <div><span>{{ isOpenCover ? 'Conveyances' : pc.axis2 }}</span><strong>{{ isOpenCover ? (formatAnswerValue(answers.conveyanceTypes) || axes.axis2) : axes.axis2 }}</strong></div>
        <div>
          <span>{{ isOpenCover ? 'Est. annual value' : 'Sum insured' }}</span>
          <strong>
            <template v-if="isOpenCover">
              {{ money(answers.estimatedAnnualValue) }}
              <span v-if="answers.maxShipmentValue" class="muted"> · max {{ money(answers.maxShipmentValue) }}</span>
            </template>
            <template v-else>{{ money(proposal.totalSumInsured || answers.invoiceValue) }}</template>
          </strong>
        </div>
        <div v-if="!isMarine && premiumPreview">
          <span>Indicative premium</span>
          <strong>{{ money(premiumPreview.totalPremium) }}</strong>
        </div>
      </section>

      <section v-if="!isMarine && premiumPreview" class="fire-card premium-card">
        <h2>Premium</h2>
        <p class="premium">{{ money(premiumPreview.totalPremium) }} <small>{{ premiumPreview.currency || 'ETB' }}</small></p>
        <p class="fire-sub" style="padding: 0 1.1rem .75rem; margin: 0">
          Rated with {{ premiumPreview.ratingVersion || 'published tariff' }}.
          <template v-if="proposal.status === 'SUBMITTED'">
            Confirm on
            <button class="link" @click="router.push(`${pc.basePath}/quotations/new/${route.params.proposalUuid}`)">Issue quotation</button>.
          </template>
          <template v-else-if="proposal.status === 'DRAFT'">
            Submit the proposal, then issue a quotation to lock this premium.
          </template>
        </p>
        <table v-if="premiumPreview.breakdown?.length">
          <tbody>
            <tr v-for="(line, i) in premiumPreview.breakdown" :key="i">
              <td>{{ line.label }}</td>
              <td>{{ money(line.amount) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
      <p v-else-if="!isMarine && premiumError" class="fire-note">
        Premium could not be calculated yet: {{ premiumError }}
      </p>

      <div v-if="isMarine" class="fire-grid">
        <section v-for="section in marineSections" :key="section.id" class="fire-card">
          <h2>{{ section.title }}</h2>
          <dl class="fire-answers">
            <div v-for="row in section.rows" :key="row.key">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
        </section>

        <section v-if="scheduleItems.length" class="fire-card">
          <h2>Schedule</h2>
          <ul>
            <li v-for="(item, index) in scheduleItems" :key="item.riskItemUuid || index">
              <strong>{{ scheduleLabel(item) }}</strong>
              <span> {{ item.description || '—' }} · {{ money(item.sumInsured) }}</span>
            </li>
          </ul>
        </section>

        <section v-if="perilCodes.length" class="fire-card">
          <h2>Selected covers</h2>
          <ul class="peril-list">
            <li v-for="code in perilCodes" :key="code">{{ perilLabel(code) }}</li>
          </ul>
        </section>
      </div>

      <div v-else class="fire-grid">
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
        <section v-else-if="pc.productClass === 'BURGLARY'" class="fire-card">
          <h2>Security</h2>
          <ul>
            <li>Intruder alarm: {{ answers.hasIntruderAlarm ? 'Yes' : 'No' }}</li>
            <li>Monitored: {{ answers.alarmMonitored ? 'Yes' : 'No' }}</li>
            <li>Bars on openings: {{ answers.barsOnOpenings ? 'Yes' : 'No' }}</li>
            <li>Watchman: {{ answers.hasWatchman ? 'Yes' : 'No' }}</li>
            <li>High-value goods: {{ answers.highValueGoods ? 'Yes' : 'No' }}</li>
          </ul>
        </section>
        <section v-else-if="pc.productClass === 'LIABILITY'" class="fire-card">
          <h2>Cover &amp; exposure</h2>
          <ul>
            <li>Line: {{ formatAnswerValue(answers.liabilityLine) || '—' }}</li>
            <li>Risk class: {{ formatAnswerValue(answers.constructionClass) || axes.axis1 }}</li>
            <li>Activity: {{ formatAnswerValue(answers.occupancyCode) || axes.axis2 }}</li>
            <li>Limit any one occurrence: {{ money(answers.limitAnyOneOccurrence) }}</li>
            <li>Aggregate limit: {{ money(answers.limitAggregate) }}</li>
            <li>Territory: {{ formatAnswerValue(answers.territorialScope) || '—' }}</li>
          </ul>
        </section>

        <section class="fire-card">
          <h2>Captured answers</h2>
          <dl v-if="genericAnswerRows.length" class="fire-answers">
            <div v-for="row in genericAnswerRows" :key="row.key">
              <dt>{{ row.label }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
          <p v-else>No proposal answers were stored on this record.</p>
        </section>

        <section v-if="scheduleItems.length" class="fire-card">
          <h2>Schedule</h2>
          <ul>
            <li v-for="(item, index) in scheduleItems" :key="item.riskItemUuid || index">
              <strong>{{ scheduleLabel(item) }}</strong>
              <span> {{ item.description || '—' }} · {{ money(item.sumInsured) }}</span>
            </li>
          </ul>
        </section>

        <section class="fire-card">
          <h2>Additional perils</h2>
          <p v-if="!perilCodes.length">None selected</p>
          <ul v-else class="peril-list">
            <li v-for="code in perilCodes" :key="code">{{ perilLabel(code) }}</li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.peril-list {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
  list-style: none;
  padding: 0 1.1rem 1rem !important;
}
.peril-list li {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
  border-radius: 999px;
  padding: .35rem .75rem;
  font-size: .85rem;
  font-weight: 600;
}
</style>
