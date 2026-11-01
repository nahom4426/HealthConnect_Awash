<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { listVersions } from '../api/productsApi';
import { formatDateTime, money, statusTone, useProductContext } from '../productUtils';
import '../products-ui.css';

const router = useRouter();
const { productClass, productName, retired, basePath, can, definition } = useProductContext();
const rows = ref([]);
const status = ref('');
const page = ref(1);
const totalPages = ref(1);
const loading = ref(false);
const error = ref('');

const published = computed(() => rows.value.find((row) => row.status === 'PUBLISHED'));

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    const data = await listVersions({ productClass: productClass.value, status: status.value, page: page.value });
    rows.value = Array.isArray(data) ? data : data?.content || [];
    totalPages.value = Math.max(data?.totalPages || 1, 1);
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

watch(productClass, () => {
  page.value = 1;
  refresh();
});
onMounted(refresh);
</script>

<template>
  <div class="pp-page">
    <header class="pp-head">
      <div>
        <p class="pp-kicker">{{ productName }} · product setup</p>
        <h1>
          Versions
          <span v-if="retired" class="pp-pill red" style="vertical-align: middle">Retired</span>
        </h1>
        <p class="pp-sub">
          Each version holds the proposal form, insured items, covers and pricing. Publishing a version archives the previous one;
          existing proposals stay on the version they were created with.
        </p>
      </div>
      <div class="pp-actions">
        <button class="pp-btn ghost" :disabled="loading" @click="refresh">Refresh</button>
        <button
          v-if="published && can('product.schema.update')"
          class="pp-btn ghost"
          @click="router.push({ path: `${basePath}/versions/${published.productUuid}`, query: { tab: 'form', live: '1' } })"
        >
          Edit live form
        </button>
        <button
          v-if="can('product.create')"
          class="pp-btn"
          @click="router.push({ path: `${basePath}/versions/new`, query: published ? { from: published.productUuid } : {} })"
        >
          + New draft version
        </button>
      </div>
    </header>

    <p v-if="definition && !definition.privilegesPublishedAt" class="pp-warn">
      Permissions for this product are not set up yet. A Super Admin can retry from the product catalogue.
    </p>

    <div class="pp-filters">
      <select v-model="status" class="pp-input" @change="page = 1; refresh()">
        <option value="">All statuses</option>
        <option value="DRAFT">Draft</option>
        <option value="PUBLISHED">Published</option>
        <option value="ARCHIVED">Archived</option>
      </select>
    </div>

    <p v-if="error" class="pp-error">{{ error }}</p>
    <p v-else-if="loading && !rows.length" class="pp-note">Loading versions…</p>
    <p v-else-if="!rows.length" class="pp-note">
      No versions yet. Create a draft version to define the form, covers and pricing, then publish it to start taking proposals.
    </p>

    <section v-if="rows.length" class="pp-card flush">
      <table>
        <thead>
          <tr>
            <th>Version</th>
            <th>Status</th>
            <th>Pricing</th>
            <th class="num">Minimum premium</th>
            <th>Created</th>
            <th>Published</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.productUuid">
            <td><strong>{{ row.version }}</strong><div class="muted mono">{{ row.productUuid }}</div></td>
            <td><span class="pp-pill" :class="statusTone(row.status)">{{ row.status }}</span></td>
            <td>{{ row.formulas?.length ? `${row.formulas.length} formulas` : row.rates?.length ? `Rate grid (${row.rates.length})` : '—' }}</td>
            <td class="num">{{ money(row.minPremium, row.currency) }}</td>
            <td>{{ formatDateTime(row.createdAt) }}</td>
            <td>{{ formatDateTime(row.publishedAt) }}</td>
            <td>
              <div class="row-actions">
                <button class="pp-link" @click="router.push(`${basePath}/versions/${row.productUuid}`)">
                  {{ row.status === 'DRAFT' && can('product.update') ? 'Edit' : 'Open' }}
                </button>
                <button
                  v-if="can('product.create')"
                  class="pp-link"
                  @click="router.push({ path: `${basePath}/versions/new`, query: { from: row.productUuid } })"
                >
                  Copy to new version
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
