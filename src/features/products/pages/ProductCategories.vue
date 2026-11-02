<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { openModal } from '@customizer/modal-x';
import { toasted } from '@/utils/utils';
import { useModuleStore } from '@/stores/moduleStore';
import {
  createCategory,
  createSubcategory,
  listCategories,
  setCategoryStatus,
  setSubcategoryStatus,
  updateCategory,
  updateSubcategory,
} from '../api/categoriesApi';
import { listDefinitions } from '../api/productsApi';
import { generalError, normalizeKey, statusTone } from '../productUtils';
import '../products-ui.css';

// Category → subcategory (class of business) browse taxonomy over the product catalogue.
// A presentation grouping only: ProductFamily (Property / Liability / Personal accident) is separate.
const router = useRouter();
const moduleStore = useModuleStore();
const categories = ref([]);
const products = ref([]);
const includeRetired = ref(false);
const loading = ref(false);
const error = ref('');
const busy = ref('');

const canCreate = computed(() => moduleStore.isSuperAdmin() || moduleStore.canAnywhere('.product.create'));
const canUpdate = computed(() => moduleStore.isSuperAdmin() || moduleStore.canAnywhere('.product.update'));

const byOrder = (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || String(a.name).localeCompare(String(b.name));
const sorted = computed(() =>
  categories.value
    .slice()
    .sort(byOrder)
    .map((c) => ({ ...c, subcategories: (c.subcategories || []).slice().sort(byOrder) })),
);

/** Products filed under a subcategory. Subcategory keys repeat across categories, so match both. */
function productCount(categoryKey, subcategoryKey) {
  return products.value.filter((p) => p.categoryKey === categoryKey && p.subcategoryKey === subcategoryKey).length;
}
const unfiledCount = computed(() => products.value.filter((p) => !p.subcategoryKey).length);

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    await moduleStore.loadRegistry();
    const [list, defs] = await Promise.all([
      listCategories({ includeRetired: includeRetired.value }),
      listDefinitions({ includeRetired: true }).catch(() => []),
    ]);
    categories.value = Array.isArray(list) ? list : list?.content || [];
    products.value = Array.isArray(defs) ? defs : defs?.content || [];
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

/* ── Create / edit, both levels ── */
const editor = ref(null); // { level: 'category' | 'subcategory', mode: 'create' | 'edit', categoryKey, node }
const form = reactive({ key: '', name: '', tagline: '', description: '', iconAsset: '', sortOrder: 0, keyTouched: false });
const formError = ref(null);
const saving = ref(false);
const normalizedKey = computed(() => normalizeKey(form.key || form.name));
const keyProblem = computed(() => {
  if (editor.value?.mode !== 'create') return '';
  const key = normalizedKey.value;
  if (!key) return '';
  return /^[A-Z][A-Z0-9_]{1,39}$/.test(key) ? '' : 'Start with a letter; 2 to 40 letters, digits or _';
});

function open(level, mode, categoryKey = null, node = null) {
  const siblings = level === 'category' ? categories.value : categories.value.find((c) => c.key === categoryKey)?.subcategories || [];
  const nextOrder = siblings.reduce((m, s) => Math.max(m, Number(s.sortOrder) || 0), 0) + 1;
  Object.assign(form, {
    key: '',
    name: node?.name || '',
    tagline: node?.tagline || '',
    description: node?.description || '',
    iconAsset: node?.iconAsset || '',
    sortOrder: node?.sortOrder ?? nextOrder,
    keyTouched: false,
  });
  formError.value = null;
  editor.value = { level, mode, categoryKey, node };
}

async function save() {
  formError.value = null;
  if (keyProblem.value) {
    formError.value = { message: keyProblem.value, for: (f) => (f === 'key' ? keyProblem.value : '') };
    return;
  }
  const { level, mode, categoryKey, node } = editor.value;
  const body = {
    name: form.name.trim(),
    description: form.description.trim() || null,
    iconAsset: form.iconAsset.trim() || null,
    sortOrder: Number(form.sortOrder) || 0,
  };
  if (level === 'category') body.tagline = form.tagline.trim() || null;
  // The key is read on create only (it is in links and seed data); empty lets the backend derive it
  if (mode === 'create' && form.keyTouched && form.key.trim()) body.key = normalizedKey.value;
  saving.value = true;
  try {
    if (level === 'category') {
      if (mode === 'create') await createCategory(body);
      else await updateCategory(node.key, body);
    } else if (mode === 'create') {
      await createSubcategory(categoryKey, body);
    } else {
      await updateSubcategory(categoryKey, node.key, body);
    }
    toasted(true, `${body.name} ${mode === 'create' ? 'created' : 'saved'}`);
    editor.value = null;
    await refresh();
  } catch (e) {
    if (e.status === 409 && !e.field) e.field = 'key';
    formError.value = e;
  } finally {
    saving.value = false;
  }
}

/* ── Retire / reactivate ── */
function toggle(level, node, categoryKey) {
  const retiring = node.status !== 'RETIRED';
  const what = level === 'category' ? 'category' : 'class of business';
  openModal(
    'Confirmation',
    {
      title: `${retiring ? 'Retire' : 'Reactivate'} ${node.name}?`,
      message: retiring
        ? `The ${what} is hidden from browsing. Products filed under it keep their filing, and it can be reactivated from "Show retired".`
        : `The ${what} shows again.`,
      confirmText: retiring ? 'Retire' : 'Reactivate',
      cancelText: 'Cancel',
      tone: retiring ? 'danger' : undefined,
    },
    async (yes) => {
      if (!yes) return;
      const status = retiring ? 'RETIRED' : 'ACTIVE';
      busy.value = `${categoryKey || ''}/${node.key}`;
      try {
        if (level === 'category') await setCategoryStatus(node.key, status);
        else await setSubcategoryStatus(categoryKey, node.key, status);
        toasted(true, `${node.name} ${retiring ? 'retired' : 'reactivated'}`);
        await refresh();
      } catch (e) {
        toasted(false, '', e.message);
      } finally {
        busy.value = '';
      }
    },
  );
}

function openProducts(categoryKey, subcategoryKey) {
  router.push({ path: '/product-catalogue', query: { category: categoryKey, ...(subcategoryKey ? { subcategory: subcategoryKey } : {}) } });
}

onMounted(refresh);
</script>

<template>
  <div class="pp-page">
    <header class="pp-head">
      <div>
        <p class="pp-kicker">Products</p>
        <h1>Product categories</h1>
        <p class="pp-sub">
          How products are grouped for browsing: category, then class of business. This is separate from a product's family
          (Property, Liability, Personal accident), which drives its permissions.
        </p>
      </div>
      <div class="pp-actions">
        <label class="pp-check"><input v-model="includeRetired" type="checkbox" @change="refresh" /> Show retired</label>
        <button class="pp-btn ghost" :disabled="loading" @click="refresh">Refresh</button>
        <button v-if="canCreate" class="pp-btn" @click="open('category', 'create')">+ New category</button>
      </div>
    </header>

    <p v-if="error" class="pp-error">{{ error }}</p>
    <p v-else-if="loading && !categories.length" class="pp-note">Loading categories…</p>
    <p v-else-if="!sorted.length" class="pp-note">No categories yet.</p>
    <p v-if="unfiledCount" class="pp-note">
      {{ unfiledCount }} product{{ unfiledCount === 1 ? ' is' : 's are' }} not filed under a class of business.
      <button class="pp-link" @click="router.push({ path: '/product-catalogue', query: { category: '__unfiled' } })">Show them</button>
    </p>

    <section v-for="cat in sorted" :key="cat.key" class="pp-card flush" :style="cat.status === 'RETIRED' ? 'opacity: .7' : ''">
      <div class="pp-head" style="padding: 1rem 1.2rem .4rem; margin: 0">
        <div>
          <h2 style="margin: 0">
            {{ cat.name }}
            <span class="pp-pill" :class="statusTone(cat.status)" style="vertical-align: middle; margin-left: .3rem">{{ cat.status === 'RETIRED' ? 'Retired' : cat.status }}</span>
          </h2>
          <p class="muted" style="margin: .25rem 0 0">
            <span class="mono">{{ cat.key }}</span> · order {{ cat.sortOrder ?? 0 }}
            <template v-if="cat.tagline"> · {{ cat.tagline }}</template>
            <template v-if="cat.iconAsset"> · icon <span class="mono">{{ cat.iconAsset }}</span></template>
          </p>
          <p v-if="cat.description" class="pp-sub" style="margin-top: .3rem">{{ cat.description }}</p>
        </div>
        <div class="row-actions">
          <button v-if="canCreate && cat.status !== 'RETIRED'" class="pp-link" @click="open('subcategory', 'create', cat.key)">+ Class of business</button>
          <button v-if="canUpdate" class="pp-link" @click="open('category', 'edit', null, cat)">Edit</button>
          <button
            v-if="canUpdate"
            class="pp-link"
            :class="{ danger: cat.status !== 'RETIRED' }"
            :disabled="busy === `/${cat.key}`"
            @click="toggle('category', cat)"
          >
            {{ cat.status === 'RETIRED' ? 'Reactivate' : 'Retire' }}
          </button>
        </div>
      </div>
      <table>
        <thead>
          <tr><th class="num" style="width: 4rem">Order</th><th>Class of business</th><th>Products</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-if="!cat.subcategories.length">
            <td colspan="5" class="muted">No classes of business in this category yet.</td>
          </tr>
          <tr v-for="sub in cat.subcategories" :key="`${cat.key}/${sub.key}`" :class="{ retired: sub.status === 'RETIRED' }">
            <td class="num">{{ sub.sortOrder ?? 0 }}</td>
            <td>
              <strong>{{ sub.name }}</strong>
              <div class="muted">
                <span class="mono">{{ sub.key }}</span><template v-if="sub.description"> · {{ sub.description }}</template>
                <template v-if="sub.iconAsset"> · icon <span class="mono">{{ sub.iconAsset }}</span></template>
              </div>
            </td>
            <td>
              <button v-if="productCount(cat.key, sub.key)" class="pp-link" @click="openProducts(cat.key, sub.key)">
                {{ productCount(cat.key, sub.key) }} product{{ productCount(cat.key, sub.key) === 1 ? '' : 's' }}
              </button>
              <span v-else class="muted">None</span>
            </td>
            <td><span class="pp-pill" :class="statusTone(sub.status)">{{ sub.status === 'RETIRED' ? 'Retired' : sub.status }}</span></td>
            <td>
              <div class="row-actions">
                <button v-if="canUpdate" class="pp-link" @click="open('subcategory', 'edit', cat.key, sub)">Edit</button>
                <button
                  v-if="canUpdate"
                  class="pp-link"
                  :class="{ danger: sub.status !== 'RETIRED' }"
                  :disabled="busy === `${cat.key}/${sub.key}`"
                  @click="toggle('subcategory', sub, cat.key)"
                >
                  {{ sub.status === 'RETIRED' ? 'Reactivate' : 'Retire' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <div v-if="editor" class="pp-modal-backdrop" @click.self="editor = null">
      <form class="pp-modal" @submit.prevent="save">
        <h2>
          {{ editor.mode === 'create' ? 'New' : 'Edit' }} {{ editor.level === 'category' ? 'category' : 'class of business' }}
        </h2>
        <p v-if="editor.level === 'subcategory'" class="muted" style="margin-top: -.4rem">
          In {{ categories.find((c) => c.key === editor.categoryKey)?.name || editor.categoryKey }}
        </p>
        <p v-if="generalError(formError, ['key', 'name', 'tagline', 'description', 'iconAsset', 'sortOrder'])" class="pp-error">
          {{ formError.message }}
        </p>
        <div class="pp-grid">
          <label class="pp-field span-2" :class="{ invalid: formError?.for?.('name') }">
            Name *
            <input v-model="form.name" required maxlength="120" />
            <span v-if="formError?.for?.('name')" class="field-error">{{ formError.for('name') }}</span>
          </label>

          <label v-if="editor.mode === 'create'" class="pp-field span-2" :class="{ invalid: formError?.for?.('key') }">
            Key
            <input v-model="form.key" class="mono" :placeholder="normalizedKey || 'Derived from the name'" @input="form.keyTouched = true" />
            <small>Saved as <code>{{ normalizedKey || '—' }}</code>. It is used in links and can't change later.</small>
            <span v-if="formError?.for?.('key')" class="field-error">{{ formError.for('key') }}</span>
          </label>
          <div v-else class="span-2">
            <dl class="pp-dl"><div><dt>Key (fixed)</dt><dd class="mono">{{ editor.node.key }}</dd></div></dl>
          </div>

          <label v-if="editor.level === 'category'" class="pp-field span-2" :class="{ invalid: formError?.for?.('tagline') }">
            Tagline
            <input v-model="form.tagline" />
          </label>
          <label class="pp-field span-2" :class="{ invalid: formError?.for?.('description') }">
            Description
            <input v-model="form.description" />
          </label>
          <label class="pp-field" :class="{ invalid: formError?.for?.('iconAsset') }">
            Icon asset
            <input v-model="form.iconAsset" class="mono" placeholder="icons/fire.svg" />
            <small>A path or asset key, not an upload</small>
          </label>
          <label class="pp-field" :class="{ invalid: formError?.for?.('sortOrder') }">
            Order
            <input v-model.number="form.sortOrder" type="number" />
          </label>
        </div>
        <div class="pp-actions" style="justify-content: flex-end; margin-top: 1rem">
          <button type="button" class="pp-btn ghost" @click="editor = null">Cancel</button>
          <button type="submit" class="pp-btn" :disabled="saving">{{ saving ? 'Saving…' : editor.mode === 'create' ? 'Create' : 'Save' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>
