<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiError, fetchPolicies } from '../api/fireApi.js';
import { usePcModule } from '@/features/pc/pcModule.js';
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

function money(value) {
  if (value == null) return '—';
  return `ETB ${Number(value).toLocaleString('en-ET', { minimumFractionDigits: 2 })}`;
}

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    const data = await fetchPolicies({
      productClass: pc.value.productClass,
      search: search.value,
      status: status.value,
      page: page.value,
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
        <p class="fire-kicker">{{ pc.kicker }} · policy</p>
        <h1>Policies</h1>
        <p class="fire-sub">Issued contracts. Created only from an accepted quotation.</p>
      </div>
      <button class="fire-btn ghost" :disabled="loading" @click="refresh">Refresh</button>
    </header>

    <div class="fire-filters">
      <input v-model="search" placeholder="Search policy number, proposer…" @keyup.enter="page = 1; refresh()" />
      <select v-model="status" @change="page = 1; refresh()">
        <option value="">All statuses</option>
        <option value="ISSUED">Issued</option>
        <option value="CANCELLED">Cancelled</option>
        <option value="EXPIRED">Expired</option>
      </select>
      <button class="fire-btn ghost" @click="page = 1; refresh()">Search</button>
    </div>

    <p v-if="error" class="fire-error">{{ error }}</p>
    <p v-else-if="!loading && !rows.length" class="fire-note">No policies yet. Accept a quotation, then issue a policy.</p>

    <div v-else class="fire-card">
      <table>
        <thead>
          <tr>
            <th>Policy</th>
            <th>Proposer</th>
            <th>Status</th>
            <th>Premium</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.policyUuid">
            <td>
              <strong>{{ row.policyNumber }}</strong>
              <div class="muted">{{ row.policyUuid }}</div>
            </td>
            <td>{{ row.proposerName }}</td>
            <td>{{ row.status }}</td>
            <td>{{ money(row.totalPremium) }}</td>
            <td><button class="link" @click="router.push(`${pc.basePath}/policies/${row.policyUuid}`)">Open</button></td>
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
