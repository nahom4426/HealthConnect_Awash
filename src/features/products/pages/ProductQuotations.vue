<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { toasted } from '@/utils/utils';
import { issueQuotation, listProposals, listQuotations } from '../api/productsApi';
import { formatDateTime, money, statusTone, useProductContext } from '../productUtils';
import '../products-ui.css';

const router = useRouter();
const { productClass, productName, basePath, can } = useProductContext();
const pending = ref([]);
const rows = ref([]);
const search = ref('');
const status = ref('');
const page = ref(1);
const totalPages = ref(1);
const loading = ref(false);
const issuing = ref('');
const error = ref('');

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    const [queue, quotes] = await Promise.all([
      listProposals({ productClass: productClass.value, status: 'SUBMITTED', search: search.value, limit: 50 }),
      listQuotations({ productClass: productClass.value, status: status.value, search: search.value, page: page.value }),
    ]);
    pending.value = queue?.content || [];
    rows.value = quotes?.content || [];
    totalPages.value = Math.max(quotes?.totalPages || 1, 1);
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function issue(row) {
  issuing.value = row.proposalUuid;
  try {
    const quote = await issueQuotation(row.proposalUuid);
    toasted(true, 'Quotation issued');
    router.push(`${basePath.value}/quotations/${quote.quotationUuid}`);
  } catch (e) {
    error.value = e.message;
  } finally {
    issuing.value = '';
  }
}

watch(productClass, refresh);
onMounted(refresh);
</script>

<template>
  <div class="pp-page">
    <header class="pp-head">
      <div>
        <p class="pp-kicker">{{ productName }}</p>
        <h1>Quotations</h1>
        <p class="pp-sub">Submitted proposals wait here to be quoted.</p>
      </div>
      <button class="pp-btn ghost" :disabled="loading" @click="refresh">Refresh</button>
    </header>

    <div class="pp-filters">
      <input v-model="search" class="pp-input grow" placeholder="Search proposer, quote number…" @keyup.enter="page = 1; refresh()" />
      <select v-model="status" class="pp-input" @change="page = 1; refresh()">
        <option value="">All quotation statuses</option>
        <option v-for="s in ['ISSUED', 'ACCEPTED', 'DECLINED']" :key="s" :value="s">{{ s }}</option>
      </select>
      <button class="pp-btn ghost" @click="page = 1; refresh()">Search</button>
    </div>

    <p v-if="error" class="pp-error">{{ error }}</p>

    <h2>Ready to quote</h2>
    <p v-if="!loading && !pending.length" class="pp-note">No submitted {{ productName }} proposals are waiting.</p>
    <section v-else-if="pending.length" class="pp-card flush">
      <table>
        <thead><tr><th>Proposer</th><th>Version</th><th class="num">Sum insured</th><th></th></tr></thead>
        <tbody>
          <tr v-for="row in pending" :key="row.proposalUuid">
            <td><strong>{{ row.proposerName }}</strong><div class="muted">{{ row.proposerPhone }}</div></td>
            <td>{{ row.productVersion || '—' }}</td>
            <td class="num">{{ money(row.totalSumInsured) }}</td>
            <td>
              <div class="row-actions">
                <button class="pp-link" @click="router.push(`${basePath}/proposals/${row.proposalUuid}`)">Preview</button>
                <button v-if="can('quotation.issue')" class="pp-link" :disabled="issuing === row.proposalUuid" @click="issue(row)">Issue quotation</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <h2 style="margin-top: 1.4rem">Issued quotations</h2>
    <p v-if="!loading && !rows.length" class="pp-note">No quotations yet.</p>
    <section v-else-if="rows.length" class="pp-card flush">
      <table>
        <thead><tr><th>Quotation</th><th>Proposer</th><th>Status</th><th class="num">Premium</th><th>Issued</th><th></th></tr></thead>
        <tbody>
          <tr v-for="row in rows" :key="row.quotationUuid">
            <td><strong>{{ row.quotationNumber || '—' }}</strong><div class="muted">{{ row.ratingVersion }}</div></td>
            <td>{{ row.proposerName || '—' }}</td>
            <td><span class="pp-pill" :class="statusTone(row.status)">{{ row.status }}</span></td>
            <td class="num">{{ money(row.totalPremium, row.currency) }}</td>
            <td>{{ formatDateTime(row.createdAt || row.issuedAt) }}</td>
            <td><div class="row-actions"><button class="pp-link" @click="router.push(`${basePath}/quotations/${row.quotationUuid}`)">Open</button></div></td>
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
