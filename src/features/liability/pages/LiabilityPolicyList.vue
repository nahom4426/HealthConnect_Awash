<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiError, fetchPolicies } from '../api/liabilityApi.js';
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
    const data = await fetchPolicies({
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
        <p class="lia-kicker">Liability · policy</p>
        <h1>Policies</h1>
        <p class="lia-sub">Active and historical liability policies issued from quotations.</p>
      </div>
      <button class="lia-btn ghost" :disabled="loading" @click="refresh">Refresh</button>
    </header>

    <div class="lia-filters">
      <input v-model="search" type="search" placeholder="Search policy no, insured…" @keyup.enter="page = 0; refresh()" />
      <select v-model="status" @change="page = 0; refresh()">
        <option value="">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="EXPIRED">Expired</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      <button class="lia-btn ghost" @click="page = 0; refresh()">Search</button>
    </div>

    <p v-if="error" class="lia-error">{{ error }}</p>
    <p v-else-if="!loading && !rows.length" class="lia-note">No policies match these filters.</p>

    <div v-else class="lia-card">
      <table>
        <thead>
          <tr>
            <th>Policy</th>
            <th>Insured</th>
            <th>Product</th>
            <th>Status</th>
            <th>Premium</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.policyUuid">
            <td>
              <strong>{{ row.policyNumber }}</strong>
              <div class="lia-muted">{{ row.policyUuid }}</div>
            </td>
            <td>{{ row.insured?.name || row.insuredName || '—' }}</td>
            <td>{{ row.productName || row.productCode || '—' }}</td>
            <td><span class="lia-badge">{{ statusLabel(row.status) }}</span></td>
            <td>{{ money(row.premium?.totalPayable || row.totalPremium) }}</td>
            <td><button class="lia-link" @click="router.push(`/liability/policies/${row.policyUuid}`)">Open</button></td>
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
