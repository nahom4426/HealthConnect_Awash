<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiError, fetchClaims } from '../api/fireApi.js';
import { usePcModule } from '@/features/pc/pcModule.js';
import '../fire-ui.css';

const route = useRoute();
const router = useRouter();
const pc = usePcModule();
const rows = ref([]);
const error = ref('');
const loading = ref(false);
const search = ref('');
const status = ref(route.meta.claimStatus || '');
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
    const data = await fetchClaims({
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

watch(() => route.meta.claimStatus, (next) => {
  status.value = next || '';
  page.value = 1;
  refresh();
});

onMounted(refresh);
</script>

<template>
  <div class="fire-page">
    <header class="fire-head">
      <div>
        <p class="fire-kicker">{{ pc.kicker }} · claim</p>
        <h1>{{ route.meta.claimTitle || 'Claims' }}</h1>
        <p class="fire-sub">Property-casualty claims against issued {{ pc.label }} policies. Motor is not used here.</p>
      </div>
      <div class="fire-actions">
        <button class="fire-btn ghost" :disabled="loading" @click="refresh">Refresh</button>
        <button class="fire-btn" @click="router.push(`${pc.basePath}/claims/new`)">New claim</button>
      </div>
    </header>

    <div class="fire-filters">
      <input v-model="search" placeholder="Search claim number, policy, location…" @keyup.enter="page = 1; refresh()" />
      <select v-model="status" @change="page = 1; refresh()">
        <option value="">All statuses</option>
        <option value="DRAFT">Draft</option>
        <option value="SUBMITTED">Submitted</option>
        <option value="ASSESSED">Assessed</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
        <option value="PAID">Paid</option>
      </select>
      <button class="fire-btn ghost" @click="page = 1; refresh()">Search</button>
    </div>

    <p v-if="error" class="fire-error">{{ error }}</p>
    <p v-else-if="!loading && !rows.length" class="fire-note">No {{ pc.label }} claims match these filters.</p>

    <div v-else class="fire-card">
      <table>
        <thead>
          <tr>
            <th>Claim</th>
            <th>Policy</th>
            <th>Status</th>
            <th>Estimated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.claimUuid">
            <td>
              <strong>{{ row.claimNumber }}</strong>
              <div class="muted">{{ row.proposerName }} · {{ row.perilCode }}</div>
            </td>
            <td>{{ row.policyNumber }}</td>
            <td>{{ row.status }}</td>
            <td>{{ money(row.estimatedAmount) }}</td>
            <td><button class="link" @click="router.push(`${pc.basePath}/claims/${row.claimUuid}`)">Open</button></td>
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
