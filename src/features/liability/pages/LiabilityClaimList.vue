<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiError, fetchClaims } from '../api/liabilityApi.js';
import { CLAIM_APPROVED_STATUSES, CLAIM_COMPLETED_STATUSES, CLAIM_PROCESS_STATUSES, money, statusLabel } from '../constants.js';
import '../liability-ui.css';

const route = useRoute();
const router = useRouter();
const rows = ref([]);
const error = ref('');
const loading = ref(false);
const search = ref('');
const page = ref(0);
const totalPages = ref(1);

const pageTitle = computed(() => route.meta.claimTitle || 'Claims');
const presetStatuses = computed(() => {
  if (route.meta.claimBucket === 'process') return [...CLAIM_PROCESS_STATUSES];
  if (route.meta.claimBucket === 'approved') return [...CLAIM_APPROVED_STATUSES];
  if (route.meta.claimBucket === 'completed') return [...CLAIM_COMPLETED_STATUSES];
  return [];
});

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    const data = await fetchClaims({
      search: search.value || undefined,
      status: presetStatuses.value.length === 1 ? presetStatuses.value[0] : undefined,
      page: page.value,
      size: 20,
    });
    let content = data.content || [];
    if (presetStatuses.value.length > 1) {
      content = content.filter((row) => presetStatuses.value.includes(row.status));
    }
    rows.value = content;
    totalPages.value = Math.max(data.totalPages || 1, 1);
  } catch (e) {
    error.value = apiError(e);
  } finally {
    loading.value = false;
  }
}

watch(() => route.path, () => { page.value = 0; refresh(); });
onMounted(refresh);
</script>

<template>
  <div class="lia-page">
    <header class="lia-head">
      <div>
        <p class="lia-kicker">Liability · claim</p>
        <h1>{{ pageTitle }}</h1>
        <p class="lia-sub">Same four claim queues as Fire and Marine.</p>
      </div>
      <div class="lia-actions">
        <button class="lia-btn ghost" :disabled="loading" @click="refresh">Refresh</button>
        <button class="lia-btn" @click="router.push('/liability/claims/new')">New claim</button>
      </div>
    </header>

    <nav class="lia-queues" aria-label="Claim queues">
      <RouterLink to="/liability/claims/process" class="lia-queue" :class="{ active: route.path === '/liability/claims/process' }">
        <strong>Process</strong>
        <span>Reported through assessed</span>
      </RouterLink>
      <RouterLink to="/liability/claims/approved" class="lia-queue" :class="{ active: route.path === '/liability/claims/approved' }">
        <strong>Approved</strong>
        <span>Ready to settle</span>
      </RouterLink>
      <RouterLink to="/liability/claims/completed" class="lia-queue" :class="{ active: route.path === '/liability/claims/completed' }">
        <strong>Completed</strong>
        <span>Settled, rejected, withdrawn</span>
      </RouterLink>
    </nav>

    <div class="lia-filters">
      <input v-model="search" type="search" placeholder="Search claim, claimant, policy…" @keyup.enter="page = 0; refresh()" />
      <button class="lia-btn ghost" @click="page = 0; refresh()">Search</button>
    </div>

    <p v-if="error" class="lia-error">{{ error }}</p>
    <p v-else-if="!loading && !rows.length" class="lia-note">No claims in this queue.</p>

    <div v-else class="lia-card">
      <table>
        <thead>
          <tr>
            <th>Claim</th>
            <th>Policy</th>
            <th>Claimant</th>
            <th>Status</th>
            <th>Claimed</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.claimUuid">
            <td>
              <strong>{{ row.claimNumber }}</strong>
              <div class="lia-muted">{{ row.incidentDate }}</div>
            </td>
            <td>{{ row.policyNumber || row.policyUuid }}</td>
            <td>{{ row.claimant?.name || '—' }}</td>
            <td><span class="lia-badge">{{ statusLabel(row.status) }}</span></td>
            <td>{{ money(row.amountClaimed) }}</td>
            <td><button class="lia-link" @click="router.push(`/liability/claims/${row.claimUuid}`)">Open</button></td>
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
