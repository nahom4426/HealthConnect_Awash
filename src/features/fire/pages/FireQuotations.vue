<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiError, fetchProposals, fetchQuotations } from '../api/fireApi.js';
import { ratingAxes, usePcModule } from '@/features/pc/pcModule.js';
import '../fire-ui.css';

const route = useRoute();
const router = useRouter();
const pc = usePcModule();
const pending = ref([]);
const rows = ref([]);
const error = ref('');
const loading = ref(false);
const search = ref('');
const status = ref('');
const page = ref(1);
const pendingPage = ref(1);
const totalPages = ref(1);
const pendingPages = ref(1);

function money(value) {
  if (value == null) return '—';
  return `ETB ${Number(value).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    const [queue, quotes] = await Promise.all([
      fetchProposals({
        productClass: pc.value.productClass,
        status: 'SUBMITTED',
        search: search.value,
        page: pendingPage.value,
      }),
      fetchQuotations({
        productClass: pc.value.productClass,
        search: search.value,
        status: status.value,
        proposalUuid: route.query.proposalUuid,
        page: page.value,
      }),
    ]);
    pending.value = queue.content || [];
    pendingPages.value = Math.max(queue.totalPages || 1, 1);
    rows.value = quotes.content || [];
    totalPages.value = Math.max(quotes.totalPages || 1, 1);
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
        <p class="fire-kicker">{{ pc.kicker }} · quotation</p>
        <h1>Quotations</h1>
        <p class="fire-sub">Submitted proposals wait here to be quoted. Issuing a quote is a separate step from capturing the risk.</p>
      </div>
      <button class="fire-btn ghost" :disabled="loading" @click="refresh">Refresh</button>
    </header>

    <div class="fire-filters">
      <input v-model="search" placeholder="Search proposer, quote number, uuid…" @keyup.enter="page = 1; pendingPage = 1; refresh()" />
      <select v-model="status" @change="page = 1; refresh()">
        <option value="">All issued statuses</option>
        <option value="ISSUED">Issued</option>
        <option value="ACCEPTED">Accepted</option>
        <option value="DECLINED">Declined</option>
      </select>
      <button class="fire-btn ghost" @click="page = 1; pendingPage = 1; refresh()">Search</button>
    </div>

    <p v-if="error" class="fire-error">{{ error }}</p>

    <h2 class="fire-section">Ready to quote</h2>
    <p v-if="!loading && !pending.length" class="fire-note">No submitted {{ pc.label }} proposals waiting for a quotation.</p>
    <div v-else-if="pending.length" class="fire-card">
      <table>
        <thead>
          <tr>
            <th>Proposer</th>
            <th>{{ pc.axis1 }}</th>
            <th>{{ pc.axis2 }}</th>
            <th>Sum insured</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pending" :key="row.proposalUuid">
            <td>
              <strong>{{ row.proposerName }}</strong>
              <div class="muted">{{ row.proposalUuid }}</div>
            </td>
            <td>{{ ratingAxes(row).axis1 }}</td>
            <td>{{ ratingAxes(row).axis2 }}</td>
            <td>{{ money(row.totalSumInsured) }}</td>
            <td class="row-actions">
              <button class="link" @click="router.push(`${pc.basePath}/quotations/new/${row.proposalUuid}`)">Issue quotation</button>
              <button class="link" @click="router.push(`${pc.basePath}/proposals/${row.proposalUuid}`)">Proposal</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pager">
        <button class="fire-btn ghost" :disabled="pendingPage <= 1" @click="pendingPage -= 1; refresh()">Previous</button>
        <span>Page {{ pendingPage }} of {{ pendingPages }}</span>
        <button class="fire-btn ghost" :disabled="pendingPage >= pendingPages" @click="pendingPage += 1; refresh()">Next</button>
      </div>
    </div>

    <h2 class="fire-section">Issued quotations</h2>
    <p v-if="!loading && !rows.length" class="fire-note">No issued quotations yet.</p>
    <div v-else-if="rows.length" class="fire-card">
      <table>
        <thead>
          <tr>
            <th>Quote</th>
            <th>Proposer</th>
            <th>Status</th>
            <th>Premium</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.quotationUuid">
            <td>
              <strong>{{ row.quotationNumber }}</strong>
              <div class="muted">{{ row.ratingVersion }}</div>
            </td>
            <td>{{ row.proposerName }}</td>
            <td>{{ row.status }}</td>
            <td>{{ money(row.totalPremium) }}</td>
            <td><button class="link" @click="router.push(`${pc.basePath}/quotations/${row.quotationUuid}`)">Open</button></td>
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
