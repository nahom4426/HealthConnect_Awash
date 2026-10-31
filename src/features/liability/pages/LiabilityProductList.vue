<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiError, fetchProducts } from '../api/liabilityApi.js';
import { money, statusLabel } from '../constants.js';
import '../liability-ui.css';

const router = useRouter();
const rows = ref([]);
const error = ref('');
const loading = ref(false);

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    rows.value = await fetchProducts();
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
        <p class="lia-kicker">Liability · product</p>
        <h1>Products &amp; tariffs</h1>
        <p class="lia-sub">Active liability lines used when creating quotations (Public, Employers', Product, PI, D&amp;O).</p>
      </div>
      <button class="lia-btn ghost" :disabled="loading" @click="refresh">Refresh</button>
    </header>

    <p v-if="error" class="lia-error">{{ error }}</p>
    <p v-else-if="!loading && !rows.length" class="lia-note">No liability products seeded yet.</p>

    <div v-else class="lia-card">
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Line</th>
            <th>Status</th>
            <th>Min / max limit</th>
            <th>Version</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.productUuid">
            <td><strong>{{ row.code }}</strong></td>
            <td>{{ row.name }}</td>
            <td>{{ statusLabel(row.line) }}</td>
            <td><span class="lia-badge">{{ statusLabel(row.status) }}</span></td>
            <td>{{ money(row.minLimit) }} – {{ money(row.maxLimit) }}</td>
            <td>{{ row.version }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="lia-note">Quotations start from an active product. Open <button class="lia-link" @click="router.push('/liability/quotations/new')">New quotation</button> to price cover.</p>
  </div>
</template>
