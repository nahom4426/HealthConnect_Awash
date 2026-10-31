<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiError, fetchQuotations } from '../api/liabilityApi.js';
import { money, statusLabel } from '../constants.js';
import '../liability-ui.css';

const router = useRouter();
const rows = ref([]);
const error = ref('');
const loading = ref(false);
const search = ref('');
const status = ref('');
const page = ref(0);
const totalPages = ref(1);

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    const data = await fetchQuotations({
      search: search.value || undefined,
      status: status.value || undefined,
      page: page.value,
      size: 20,
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
  <div class="lia-page">
    <header class="lia-head">
      <div>
        <p class="lia-kicker">Liability · quotation</p>
        <h1>Quotations</h1>
        <p class="lia-sub">Capture cover, underwrite, rate and issue the policy from the same quotation record.</p>
      </div>
      <div class="lia-actions">
        <button class="lia-btn ghost" :disabled="loading" @click="refresh">Refresh</button>
        <button class="lia-btn" @click="router.push('/liability/quotations/new')">New quotation</button>
      </div>
    </header>

    <div class="lia-filters">
      <input v-model="search" type="search" placeholder="Search insured, quotation no…" @keyup.enter="page = 0; refresh()" />
      <select v-model="status" @change="page = 0; refresh()">
        <option value="">All statuses</option>
        <option v-for="s in ['DRAFT','SUBMITTED','QUOTED','ACCEPTED','DECLINED','EXPIRED','CONVERTED']" :key="s" :value="s">{{ statusLabel(s) }}</option>
      </select>
      <button class="lia-btn ghost" @click="page = 0; refresh()">Search</button>
    </div>

    <p v-if="error" class="lia-error">{{ error }}</p>
    <p v-else-if="!loading && !rows.length" class="lia-note">No quotations match these filters.</p>

    <div v-else class="lia-card">
      <table>
        <thead>
          <tr>
            <th>Quotation</th>
            <th>Insured</th>
            <th>Product</th>
            <th>Status</th>
            <th>Premium</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.quotationUuid">
            <td>
              <strong>{{ row.quotationNumber }}</strong>
              <div class="lia-muted">{{ row.quotationUuid }}</div>
            </td>
            <td>{{ row.insured?.name || '—' }}</td>
            <td>{{ row.productName || row.productCode }}</td>
            <td><span class="lia-badge">{{ statusLabel(row.status) }}</span></td>
            <td>{{ money(row.premium?.totalPayable) }}</td>
            <td><button class="lia-link" @click="router.push(`/liability/quotations/${row.quotationUuid}`)">Open</button></td>
          </tr>
        </tbody>
      </table>
      <div class="lia-pager">
        <button class="lia-btn ghost" :disabled="page <= 0" @click="page -= 1; refresh()">Previous</button>
        <span>Page {{ page + 1 }} of {{ totalPages }}</span>
        <button class="lia-btn ghost" :disabled="page + 1 >= totalPages" @click="page += 1; refresh()">Next</button>
      </div>
    </div>
  </div>
</template>
