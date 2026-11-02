<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { openModal } from '@customizer/modal-x';
import { toasted } from '@/utils/utils';
import { useModuleStore } from '@/stores/moduleStore';
import {
  listDefinitions,
  publishDefinitionPrivileges,
  setDefinitionStatus,
  updateDefinition,
} from '../api/productsApi';
import { listCategories } from '../api/categoriesApi';
import { FAMILIES, filingProblem, formatDateTime, generalError, statusTone } from '../productUtils';
import FilingPicker from '../components/FilingPicker.vue';
import '../products-ui.css';

const UNFILED = '__unfiled';

const route = useRoute();
const router = useRouter();
const moduleStore = useModuleStore();
const rows = ref([]);
const categories = ref([]);
const loading = ref(false);
const error = ref('');
const includeRetired = ref(true);
const busyKey = ref('');
const filterCategory = ref(String(route.query.category || ''));
const filterSubcategory = ref(String(route.query.subcategory || ''));
const grouped = ref(false);

const isSuperAdmin = computed(() => moduleStore.isSuperAdmin());

const filterSubcategoryOptions = computed(() =>
  (categories.value.find((c) => c.key === filterCategory.value)?.subcategories || []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
);

// Everyone sees only the products whose module grants them product.read
const visibleRows = computed(() =>
  rows.value
    .filter((row) => isSuperAdmin.value || moduleStore.can(row.privilegeModule, 'product.read'))
    .filter((row) => {
      if (!filterCategory.value) return true;
      if (filterCategory.value === UNFILED) return !row.subcategoryKey;
      if (row.categoryKey !== filterCategory.value) return false;
      return !filterSubcategory.value || row.subcategoryKey === filterSubcategory.value;
    })
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
);

function filingLabel(row) {
  return row.subcategoryKey ? [row.categoryName || row.categoryKey, row.subcategoryName || row.subcategoryKey].join(' · ') : '';
}

/** Rows in category, then class-of-business order; unfiled products last. */
const groups = computed(() => {
  const order = (categoryKey, subcategoryKey) => {
    const ci = categories.value.findIndex((c) => c.key === categoryKey);
    if (ci < 0) return [Number.MAX_SAFE_INTEGER, 0];
    const cat = categories.value[ci];
    const si = (cat.subcategories || []).find((s) => s.key === subcategoryKey);
    return [cat.sortOrder ?? ci, si?.sortOrder ?? 0];
  };
  const map = new Map();
  for (const row of visibleRows.value) {
    const id = row.subcategoryKey ? `${row.categoryKey}/${row.subcategoryKey}` : UNFILED;
    if (!map.has(id)) map.set(id, { id, label: filingLabel(row) || 'Unfiled', sort: row.subcategoryKey ? order(row.categoryKey, row.subcategoryKey) : [Infinity, 0], rows: [] });
    map.get(id).rows.push(row);
  }
  return [...map.values()].sort((a, b) => a.sort[0] - b.sort[0] || a.sort[1] - b.sort[1]);
});

function onFilterCategory() {
  filterSubcategory.value = '';
}

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    await moduleStore.loadRegistry();
    const [list, cats] = await Promise.all([
      listDefinitions({ includeRetired: includeRetired.value }),
      // Retired nodes too, so a product filed under one still shows its filing in the pickers
      listCategories({ includeRetired: true }).catch(() => []),
    ]);
    rows.value = Array.isArray(list) ? list : list?.content || [];
    categories.value = Array.isArray(cats) ? cats : cats?.content || [];
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

/* ── Create: its own page, starting filed where the list is filtered to one class of business ── */
function openCreate() {
  const query = filterCategory.value && filterCategory.value !== UNFILED && filterSubcategory.value
    ? { category: filterCategory.value, subcategory: filterSubcategory.value }
    : {};
  router.push({ path: '/product-catalogue/new', query });
}

/* ── Edit ── */
const editing = ref(null);
const editForm = reactive({ name: '', description: '', sortOrder: 0 });
const editFiling = ref({ categoryKey: '', subcategoryKey: '' });
const editError = ref(null);
const saving = ref(false);

function openEdit(row) {
  editing.value = row;
  Object.assign(editForm, { name: row.name, description: row.description || '', sortOrder: row.sortOrder ?? 0 });
  editFiling.value = { categoryKey: row.subcategoryKey ? row.categoryKey || '' : '', subcategoryKey: row.subcategoryKey || '' };
  editError.value = null;
}

async function submitEdit() {
  const filingIssue = filingProblem(editFiling.value);
  if (filingIssue) {
    editError.value = { message: filingIssue, for: (f) => (f === 'subcategoryKey' ? filingIssue : '') };
    return;
  }
  saving.value = true;
  editError.value = null;
  try {
    const body = { name: editForm.name.trim(), description: editForm.description.trim() };
    // Shipped products allow name and description only
    body.sortOrder = editing.value.builtIn ? editing.value.sortOrder : Number(editForm.sortOrder) || 0;
    // Filing goes out only when it changed: omitted keeps it, "" clears it, a key refiles it
    const before = editing.value;
    const after = editFiling.value;
    const changed = (before.subcategoryKey || '') !== after.subcategoryKey
      || (after.subcategoryKey && (before.categoryKey || '') !== after.categoryKey);
    if (changed) {
      body.subcategoryKey = after.subcategoryKey || '';
      if (after.subcategoryKey) body.categoryKey = after.categoryKey;
    }
    await updateDefinition(editing.value.key, body);
    editing.value = null;
    toasted(true, 'Product updated');
    await refresh();
  } catch (e) {
    editError.value = e;
  } finally {
    saving.value = false;
  }
}

/* ── Retire / reactivate, permissions retry ── */
function toggleStatus(row) {
  const retiring = row.status !== 'RETIRED';
  openModal(
    'Confirmation',
    {
      title: retiring ? `Retire ${row.name}?` : `Reactivate ${row.name}?`,
      message: retiring
        ? 'Existing proposals and policies stay open, but no new proposals can be created for this product.'
        : 'New proposals can be created for this product again.',
      confirmText: retiring ? 'Retire' : 'Reactivate',
      cancelText: 'Cancel',
      tone: retiring ? 'danger' : undefined,
    },
    async (yes) => {
      if (!yes) return;
      busyKey.value = row.key;
      try {
        await setDefinitionStatus(row.key, retiring ? 'RETIRED' : 'ACTIVE');
        toasted(true, retiring ? `${row.name} retired` : `${row.name} reactivated`);
        await Promise.all([refresh(), moduleStore.loadDefinitions({ force: true })]);
      } catch (e) {
        toasted(false, '', e.message);
      } finally {
        busyKey.value = '';
      }
    },
  );
}

async function retryPrivileges(row) {
  busyKey.value = row.key;
  try {
    await publishDefinitionPrivileges(row.key);
    toasted(true, `Permissions for ${row.name} are set up`);
    await Promise.all([refresh(), moduleStore.loadRegistry({ force: true })]);
  } catch (e) {
    toasted(false, '', e.message);
  } finally {
    busyKey.value = '';
  }
}

function canManage(row) {
  return isSuperAdmin.value || moduleStore.can(row.privilegeModule, 'product.update');
}

function familyLabel(value) {
  return FAMILIES.find((f) => f.value === value)?.label || value || '—';
}

onMounted(refresh);
</script>

<template>
  <div class="pp-page">
    <header class="pp-head">
      <div>
        <p class="pp-kicker">Products</p>
        <h1>Product catalogue</h1>
        <p class="pp-sub">Each product gets its own module, roles and menu entry. Define its form, covers and pricing in versions.</p>
      </div>
      <div class="pp-actions">
        <label class="pp-check"><input v-model="includeRetired" type="checkbox" @change="refresh" /> Show retired</label>
        <button class="pp-btn ghost" :disabled="loading" @click="refresh">Refresh</button>
        <button v-if="isSuperAdmin" class="pp-btn" @click="openCreate">+ New product</button>
      </div>
    </header>

    <div class="pp-filters">
      <select v-model="filterCategory" class="pp-input" aria-label="Filter by category" @change="onFilterCategory">
        <option value="">All categories</option>
        <option v-for="c in categories" :key="c.key" :value="c.key">{{ c.name }}{{ c.status === 'RETIRED' ? ' (retired)' : '' }}</option>
        <option :value="UNFILED">Unfiled</option>
      </select>
      <select
        v-if="filterCategory && filterCategory !== UNFILED"
        v-model="filterSubcategory"
        class="pp-input"
        aria-label="Filter by class of business"
        :disabled="!filterSubcategoryOptions.length"
      >
        <option value="">{{ filterSubcategoryOptions.length ? 'All classes of business' : 'No classes of business' }}</option>
        <option v-for="s in filterSubcategoryOptions" :key="s.key" :value="s.key">{{ s.name }}{{ s.status === 'RETIRED' ? ' (retired)' : '' }}</option>
      </select>
      <label class="pp-check"><input v-model="grouped" type="checkbox" /> Group by class of business</label>
      <button class="pp-link" style="margin-left: auto" @click="router.push('/product-categories')">Manage categories</button>
    </div>

    <p v-if="error" class="pp-error">{{ error }}</p>
    <p v-else-if="loading && !rows.length" class="pp-note">Loading products…</p>
    <p v-else-if="!visibleRows.length" class="pp-note">{{ filterCategory ? 'No products match this filter.' : 'No products you can view.' }}</p>

    <section v-if="visibleRows.length" class="pp-card flush">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Filed under</th>
            <th>Family</th>
            <th>Module</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="group in grouped ? groups : [{ id: 'all', rows: visibleRows }]" :key="group.id">
          <tr v-if="grouped">
            <td colspan="6" style="background: rgb(var(--surface-muted)); font-weight: 700; font-size: .8rem">
              {{ group.label }} <span class="muted">· {{ group.rows.length }}</span>
            </td>
          </tr>
          <tr v-for="row in group.rows" :key="row.key" :class="{ retired: row.status === 'RETIRED' }">
            <td>
              <strong>{{ row.name }}</strong>
              <span v-if="row.builtIn" class="pp-pill" style="margin-left: .4rem">Built-in</span>
              <div class="muted"><span class="mono">{{ row.key }}</span><template v-if="row.description"> · {{ row.description }}</template></div>
            </td>
            <td>
              <span v-if="row.subcategoryKey">{{ filingLabel(row) }}</span>
              <span v-else class="muted">Unfiled</span>
            </td>
            <td>{{ familyLabel(row.family) }}</td>
            <td>
              <span class="mono">{{ row.privilegeModule }}</span>
              <div v-if="!row.privilegesPublishedAt" style="margin-top: .3rem">
                <span class="pp-pill amber" title="The product exists, but its roles were not created in AuthService">Permissions not set up yet</span>
                <button v-if="isSuperAdmin" class="pp-link" style="margin-left: .5rem" :disabled="busyKey === row.key" @click="retryPrivileges(row)">Retry</button>
              </div>
              <div v-else class="muted">Set up {{ formatDateTime(row.privilegesPublishedAt) }}</div>
            </td>
            <td><span class="pp-pill" :class="statusTone(row.status)">{{ row.status === 'RETIRED' ? 'Retired' : row.status }}</span></td>
            <td>
              <div class="row-actions">
                <button class="pp-link" @click="router.push(`/products/${row.key}/versions`)">Versions</button>
                <button class="pp-link" @click="router.push(`/products/${row.key}/proposals`)">Proposals</button>
                <button v-if="canManage(row)" class="pp-link" @click="openEdit(row)">Edit</button>
                <button
                  v-if="canManage(row) && !row.builtIn"
                  class="pp-link"
                  :class="{ danger: row.status !== 'RETIRED' }"
                  :disabled="busyKey === row.key"
                  @click="toggleStatus(row)"
                >
                  {{ row.status === 'RETIRED' ? 'Reactivate' : 'Retire' }}
                </button>
              </div>
            </td>
          </tr>
          </template>
        </tbody>
      </table>
    </section>

    <!-- Edit -->
    <div v-if="editing" class="pp-modal-backdrop" @click.self="editing = null">
      <form class="pp-modal" @submit.prevent="submitEdit">
        <h2>Edit {{ editing.name }}</h2>
        <p v-if="generalError(editError, ['name', 'subcategoryKey', 'categoryKey'])" class="pp-error">
          {{ generalError(editError, ['name', 'subcategoryKey', 'categoryKey']) }}
        </p>
        <dl class="pp-dl" style="margin-bottom: .8rem">
          <div><dt>Key (fixed)</dt><dd class="mono">{{ editing.key }}</dd></div>
          <div><dt>Privilege module (fixed)</dt><dd class="mono">{{ editing.privilegeModule }}</dd></div>
        </dl>
        <div class="pp-grid">
          <label class="pp-field span-2" :class="{ invalid: editError?.for?.('name') }">
            Name *
            <input v-model="editForm.name" required />
            <span v-if="editError?.for?.('name')" class="field-error">{{ editError.for('name') }}</span>
          </label>
          <label class="pp-field span-2" :class="{ invalid: editError?.for?.('description') }">
            Description
            <input v-model="editForm.description" />
          </label>
          <label v-if="!editing.builtIn" class="pp-field" :class="{ invalid: editError?.for?.('sortOrder') }">
            Menu order
            <input v-model.number="editForm.sortOrder" type="number" />
          </label>
          <FilingPicker
            v-model="editFiling"
            :categories="categories"
            :error="editError?.for?.('subcategoryKey') || editError?.for?.('categoryKey') || ''"
          />
        </div>
        <p v-if="editing.builtIn" class="muted" style="margin-top: .6rem">Built-in product: only the name, description and filing can change.</p>
        <div class="pp-actions" style="justify-content: flex-end; margin-top: 1rem">
          <button type="button" class="pp-btn ghost" @click="editing = null">Cancel</button>
          <button type="submit" class="pp-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>
