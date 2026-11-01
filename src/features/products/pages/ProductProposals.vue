<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { listProposals } from '../api/productsApi';
import { formatDateTime, money, statusTone, useProductContext } from '../productUtils';
import '../products-ui.css';

const router = useRouter();
const { productClass, productName, retired, basePath, can } = useProductContext();
const rows = ref([]);
const search = ref('');
const status = ref('');
const page = ref(1);
const totalPages = ref(1);
const loading = ref(false);
const error = ref('');

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    const data = await listProposals({ productClass: productClass.value, search: search.value, status: status.value, page: page.value });
    rows.value = data?.content || (Array.isArray(data) ? data : []);
    totalPages.value = Math.max(data?.totalPages || 1, 1);
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function find() {
  page.value = 1;
  refresh();
}

watch(productClass, find);
onMounted(refresh);
</script>

<template>
  <div class="pp-page">
    <header class="pp-head">
      <div>
        <p class="pp-kicker">{{ productName }}</p>
        <h1>
          Proposals
          <span v-if="retired" class="pp-pill red" style="vertical-align: middle">Retired</span>
        </h1>
        <p class="pp-sub">Capture the risk, submit it, then quote it.</p>
      </div>
      <div class="pp-actions">
        <button class="pp-btn ghost" :disabled="loading" @click="refresh">Refresh</button>
        <button v-if="can('proposal.create') && !retired" class="pp-btn" @click="router.push(`${basePath}/proposals/new`)">+ New proposal</button>
      </div>
    </header>

    <p v-if="retired" class="pp-note">This product is retired. Existing proposals still open, but new ones can't be created.</p>

    <div class="pp-filters">
      <input v-model="search" class="pp-input grow" placeholder="Search proposer, phone, reference…" @keyup.enter="find" />
      <select v-model="status" class="pp-input" @change="find">
        <option value="">All statuses</option>
        <option v-for="s in ['DRAFT', 'SUBMITTED', 'QUOTED', 'ACCEPTED', 'CONVERTED', 'WITHDRAWN', 'DECLINED']" :key="s" :value="s">{{ s }}</option>
      </select>
      <button class="pp-btn ghost" @click="find">Search</button>
    </div>

    <p v-if="error" class="pp-error">{{ error }}</p>
    <p v-else-if="loading && !rows.length" class="pp-note">Loading proposals…</p>
    <p v-else-if="!rows.length" class="pp-note">No {{ productName }} proposals match these filters.</p>

    <section v-if="rows.length" class="pp-card flush">
      <table>
        <thead>
          <tr><th>Proposer</th><th>Status</th><th>Version</th><th>Period</th><th class="num">Sum insured</th><th>Created</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.proposalUuid">
            <td>
              <strong>{{ row.proposerName || 'Untitled proposal' }}</strong>
              <div class="muted">{{ row.proposerPhone || row.proposalUuid }}</div>
            </td>
            <td><span class="pp-pill" :class="statusTone(row.status)">{{ row.status }}</span></td>
            <td>{{ row.productVersion || '—' }}</td>
            <td>{{ String(row.periodFrom || '').slice(0, 10) || '—' }} → {{ String(row.periodTo || '').slice(0, 10) || '—' }}</td>
            <td class="num">{{ money(row.totalSumInsured, row.currency) }}</td>
            <td>{{ formatDateTime(row.createdAt) }}</td>
            <td>
              <div class="row-actions">
                <button class="pp-link" @click="router.push(`${basePath}/proposals/${row.proposalUuid}`)">Open</button>
                <button
                  v-if="row.status === 'DRAFT' && can('proposal.update')"
                  class="pp-link"
                  @click="router.push(`${basePath}/proposals/${row.proposalUuid}/edit`)"
                >
                  Edit
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pager">
        <button class="pp-btn ghost sm" :disabled="page <= 1" @click="page -= 1; refresh()">Previous</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button class="pp-btn ghost sm" :disabled="page >= totalPages" @click="page += 1; refresh()">Next</button>
      </div>
    </section>
  </div>
</template>
