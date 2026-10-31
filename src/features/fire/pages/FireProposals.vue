<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiError, fetchProposals } from '../api/fireApi.js';
import { formatAnswerValue, parseAnswers, ratingAxes, usePcModule } from '@/features/pc/pcModule.js';
import '../fire-ui.css';

const router = useRouter();
const pc = usePcModule();
const rows = ref([]);
const error = ref('');
const loading = ref(false);
const search = ref('');
const status = ref('');
const page = ref(1);
const totalPages = ref(1);
const isMarine = computed(() => pc.value.productClass === 'MARINE');

function money(value) {
  if (value == null) return '—';
  return `ETB ${Number(value).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

function proposerLabel(row) {
  if (row?.proposerName) return row.proposerName;
  const answers = parseAnswers(row?.answersJson);
  return formatAnswerValue(answers.insuredParty) || formatAnswerValue(answers.broker) || 'Untitled proposal';
}

function arrangementLabel(row) {
  const answers = parseAnswers(row?.answersJson);
  if (answers.insuranceArrangement === 'OPEN_COVER') return 'Open Cover';
  if (answers.insuranceArrangement === 'SINGLE_SHIPMENT') return 'Single Shipment';
  return answers.insuranceArrangement || '—';
}

function sumLabel(row) {
  const answers = parseAnswers(row?.answersJson);
  if (answers.insuranceArrangement === 'OPEN_COVER') {
    return answers.estimatedAnnualValue != null ? money(answers.estimatedAnnualValue) : '—';
  }
  return money(row.totalSumInsured || answers.invoiceValue);
}

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    const data = await fetchProposals({
      productClass: pc.value.productClass,
      search: search.value,
      status: status.value,
      page: page.value,
      sortBy: 'createdAt',
    });
    rows.value = data.content || [];
    totalPages.value = Math.max(data.totalPages || 1, 1);
  } catch (e) {
    error.value = apiError(e);
  } finally {
    loading.value = false;
  }
}

onMounted(refresh);
</script>

<template>
  <div class="fire-page">
    <header class="fire-head">
      <div>
        <p class="fire-kicker">{{ pc.kicker }} · proposal</p>
        <h1>Proposals</h1>
        <p class="fire-sub">Capture and submit risk. Quotation is a separate step for a different role.</p>
      </div>
      <div class="fire-actions">
        <button class="fire-btn ghost" :disabled="loading" @click="refresh">Refresh</button>
        <button class="fire-btn" @click="router.push(`${pc.basePath}/proposals/new`)">New proposal</button>
      </div>
    </header>

    <div class="fire-filters">
      <input v-model="search" placeholder="Search proposer, phone, uuid…" @keyup.enter="page = 1; refresh()" />
      <select v-model="status" @change="page = 1; refresh()">
        <option value="">All statuses</option>
        <option value="DRAFT">Draft</option>
        <option value="SUBMITTED">Submitted</option>
        <option value="QUOTED">Quoted</option>
        <option value="DECLINED">Declined</option>
        <option value="CONVERTED">Converted</option>
      </select>
      <button class="fire-btn ghost" @click="page = 1; refresh()">Search</button>
    </div>

    <p v-if="error" class="fire-error">{{ error }}</p>
    <p v-else-if="!loading && !rows.length" class="fire-note">No {{ pc.label }} proposals match these filters.</p>

    <div v-else class="fire-card">
      <table>
        <thead>
          <tr>
            <th>Proposer</th>
            <th>Status</th>
            <th v-if="isMarine">Arrangement</th>
            <th>{{ pc.axis1 }}</th>
            <th>{{ pc.axis2 }}</th>
            <th>{{ isMarine ? 'Value' : 'Sum insured' }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.proposalUuid">
            <td>
              <strong>{{ proposerLabel(row) }}</strong>
              <div class="muted">{{ row.proposalUuid }}</div>
            </td>
            <td>{{ row.status }}</td>
            <td v-if="isMarine">{{ arrangementLabel(row) }}</td>
            <td>{{ ratingAxes(row).axis1 }}</td>
            <td>{{ ratingAxes(row).axis2 }}</td>
            <td>{{ sumLabel(row) }}</td>
            <td class="row-actions">
              <button class="link" @click="router.push(`${pc.basePath}/proposals/${row.proposalUuid}`)">Open</button>
              <button
                v-if="row.status === 'DRAFT'"
                class="link"
                @click="router.push(`${pc.basePath}/proposals/${row.proposalUuid}/edit`)"
              >
                Edit
              </button>
              <button
                v-if="row.status === 'SUBMITTED' && !isMarine"
                class="link"
                @click="router.push(`${pc.basePath}/quotations/new/${row.proposalUuid}`)"
              >
                Issue quotation
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pager">
        <button class="fire-btn ghost" :disabled="page <= 1" @click="page -= 1; refresh()">Previous</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button class="fire-btn ghost" :disabled="page >= totalPages" @click="page += 1; refresh()">Next</button>
      </div>
    </div>
  </div>
</template>
