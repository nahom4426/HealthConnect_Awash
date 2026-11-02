<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toasted } from '@/utils/utils';
import { useModuleStore } from '@/stores/moduleStore';
import { createDefinition } from '../api/productsApi';
import { listCategories } from '../api/categoriesApi';
import { FAMILIES, filingProblem, generalError, keyProblem, normalizeKey } from '../productUtils';
import FilingPicker from '../components/FilingPicker.vue';
import '../products-ui.css';

const route = useRoute();
const router = useRouter();
const moduleStore = useModuleStore();

const isSuperAdmin = computed(() => moduleStore.isSuperAdmin());
const categories = ref([]);
const form = reactive({ key: '', name: '', description: '', family: 'PROPERTY', privilegeModule: '', keyTouched: false });
// Start filed where the catalogue was filtered, when it was filtered to one class of business
const filing = ref(
  route.query.category && route.query.subcategory
    ? { categoryKey: String(route.query.category), subcategoryKey: String(route.query.subcategory) }
    : { categoryKey: '', subcategoryKey: '' },
);
const showAdvanced = ref(false);
const error = ref(null);
const creating = ref(false);

const normalizedKey = computed(() => normalizeKey(form.key));
const defaultPrivilegeModule = computed(() => normalizedKey.value.toLowerCase());
const privilegeModule = computed(() => form.privilegeModule.trim().toLowerCase() || defaultPrivilegeModule.value);
const familyLabel = computed(() => FAMILIES.find((f) => f.value === form.family)?.label || form.family);
const filingLabel = computed(() => {
  const cat = categories.value.find((c) => c.key === filing.value.categoryKey);
  const sub = cat?.subcategories?.find((s) => s.key === filing.value.subcategoryKey);
  return sub ? `${cat.name} · ${sub.name}` : '';
});
// Every product module gets these roles in AuthService
const ROLES = ['admin', 'Underwriter', 'Claims Adjuster', 'Surveyor', 'Branch Manager', 'System Admin'];
const FIELDS = ['name', 'key', 'family', 'description', 'privilegeModule', 'subcategoryKey', 'categoryKey'];

function onNameInput() {
  // Suggest the key from the name until the user types a key of their own
  if (!form.keyTouched) form.key = form.name;
}

async function submit() {
  error.value = null;
  const problem = keyProblem(normalizedKey.value);
  if (problem) {
    error.value = { message: problem, for: (f) => (f === 'key' ? problem : '') };
    return;
  }
  const filingIssue = filingProblem(filing.value);
  if (filingIssue) {
    error.value = { message: filingIssue, for: (f) => (f === 'subcategoryKey' ? filingIssue : '') };
    return;
  }
  creating.value = true;
  try {
    const body = {
      key: normalizedKey.value,
      name: form.name.trim(),
      description: form.description.trim(),
      family: form.family,
    };
    if (form.privilegeModule.trim()) body.privilegeModule = form.privilegeModule.trim().toLowerCase();
    if (filing.value.subcategoryKey) {
      // Sending the category too removes any ambiguity (OTHER can exist under two categories)
      body.subcategoryKey = filing.value.subcategoryKey;
      body.categoryKey = filing.value.categoryKey;
    }
    const created = await createDefinition(body);
    // The new module and its roles now exist in AuthService, so the menu can show it
    await Promise.all([moduleStore.loadRegistry({ force: true }), moduleStore.loadDefinitions({ force: true })]);
    if (created?.privilegesPublishedAt) {
      toasted(true, `${created.name} created. It is now in the module menu with its roles. Next, create its first version.`);
    } else {
      toasted(true, `${created?.name || body.name} created, but its permissions are not set up yet.`);
    }
    router.push(`/products/${created?.key || body.key}/versions`);
  } catch (e) {
    error.value = e;
  } finally {
    creating.value = false;
  }
}

function cancel() {
  router.push({ path: '/product-catalogue', query: route.query });
}

onMounted(async () => {
  moduleStore.loadRegistry();
  try {
    const list = await listCategories({ includeRetired: true });
    categories.value = Array.isArray(list) ? list : list?.content || [];
  } catch {
    // Filing is optional; without categories the product is created unfiled
  }
});
</script>

<template>
  <div class="pp-page">
    <header class="pp-head">
      <div>
        <button class="pp-link" @click="cancel">← Product catalogue</button>
        <p class="pp-kicker" style="margin-top: .5rem">Products</p>
        <h1>New product</h1>
        <p class="pp-sub">
          Creating a product also creates its module, roles and menu entry. You define its proposal form, covers and pricing next, in a version.
        </p>
      </div>
    </header>

    <p v-if="!isSuperAdmin" class="pp-note">Only a Super Admin can create products.</p>

    <form v-else class="np-layout" @submit.prevent="submit">
      <div>
        <p v-if="generalError(error, FIELDS)" class="pp-error">{{ generalError(error, FIELDS) }}</p>

        <section class="pp-card">
          <h2>Product</h2>
          <div class="pp-grid">
            <label class="pp-field" :class="{ invalid: error?.for?.('name') }">
              Name *
              <input v-model="form.name" required placeholder="e.g. Pet Care" @input="onNameInput" />
              <span v-if="error?.for?.('name')" class="field-error">{{ error.for('name') }}</span>
            </label>
            <label class="pp-field" :class="{ invalid: error?.for?.('key') }">
              Key *
              <input v-model="form.key" class="mono" required placeholder="Filled from the name" @input="form.keyTouched = true" />
              <small>Saved as <code>{{ normalizedKey || '—' }}</code> · letters, digits and _, starting with a letter, up to 40</small>
              <span v-if="error?.for?.('key')" class="field-error">{{ error.for('key') }}</span>
            </label>
            <label class="pp-field" :class="{ invalid: error?.for?.('family') }">
              Family *
              <select v-model="form.family">
                <option v-for="f in FAMILIES" :key="f.value" :value="f.value">{{ f.label }}</option>
              </select>
              <small>Drives the product's permissions</small>
              <span v-if="error?.for?.('family')" class="field-error">{{ error.for('family') }}</span>
            </label>
            <label class="pp-field" :class="{ invalid: error?.for?.('description') }">
              Description
              <input v-model="form.description" placeholder="Shown on the menu tile" />
              <span v-if="error?.for?.('description')" class="field-error">{{ error.for('description') }}</span>
            </label>
          </div>
        </section>

        <section class="pp-card">
          <h2>Filed under</h2>
          <div class="pp-grid">
            <FilingPicker
              v-model="filing"
              :categories="categories"
              :error="error?.for?.('subcategoryKey') || error?.for?.('categoryKey') || ''"
            />
          </div>
        </section>

        <section class="pp-card">
          <button type="button" class="pp-link" @click="showAdvanced = !showAdvanced">{{ showAdvanced ? '▾' : '▸' }} Advanced</button>
          <div v-if="showAdvanced" class="pp-grid" style="margin-top: .8rem">
            <label class="pp-field" :class="{ invalid: error?.for?.('privilegeModule') }">
              Privilege module
              <input v-model="form.privilegeModule" class="mono" :placeholder="defaultPrivilegeModule || 'pet_care'" />
              <small>Prefix of this product's privileges. Defaults to the key in lower case.</small>
              <span v-if="error?.for?.('privilegeModule')" class="field-error">{{ error.for('privilegeModule') }}</span>
            </label>
          </div>
        </section>
      </div>

      <aside class="np-summary">
        <section class="pp-card">
          <h2>What gets created</h2>
          <dl class="np-facts">
            <div><dt>Product</dt><dd>{{ form.name.trim() || '—' }}</dd></div>
            <div><dt>Key</dt><dd class="mono">{{ normalizedKey || '—' }}</dd></div>
            <div><dt>Family</dt><dd>{{ familyLabel }}</dd></div>
            <div><dt>Filed under</dt><dd>{{ filingLabel || 'Unfiled' }}</dd></div>
            <div><dt>Module</dt><dd class="mono">{{ privilegeModule || '—' }}</dd></div>
            <div>
              <dt>Roles</dt>
              <dd class="np-roles"><span v-for="r in ROLES" :key="r" class="pp-pill">{{ r }}</span></dd>
            </div>
            <div><dt>Privileges</dt><dd class="mono" style="font-weight: 500">{{ privilegeModule || 'pet_care' }}.proposal.create, …</dd></div>
          </dl>
          <p class="pp-warn" style="margin: 1rem 0">The key and privilege module can never change after the product is created.</p>
          <div class="pp-actions">
            <button type="submit" class="pp-btn" style="flex: 1; justify-content: center" :disabled="creating">
              {{ creating ? 'Creating…' : 'Create product' }}
            </button>
            <button type="button" class="pp-btn ghost" @click="cancel">Cancel</button>
          </div>
        </section>

        <section class="pp-card">
          <h3>Next</h3>
          <ol class="np-steps">
            <li>Create a draft version: proposal form, insured items, covers and pricing.</li>
            <li>Test the pricing on sample answers.</li>
            <li>Publish it, then take proposals and quotations.</li>
          </ol>
        </section>
      </aside>
    </form>
  </div>
</template>

<style scoped>
.np-layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 1.25rem; align-items: start; }
.np-summary { position: sticky; top: 1rem; }
.np-facts { margin: 0; }
.np-facts > div { display: grid; grid-template-columns: 6.5rem minmax(0, 1fr); gap: .75rem; padding: .55rem 0; border-top: 1px solid rgb(var(--line)); font-size: .85rem; }
.np-facts > div:first-child { border-top: 0; }
.np-facts dt { color: rgb(var(--ink-subtle)); font-size: .72rem; text-transform: uppercase; letter-spacing: .04em; font-weight: 600; padding-top: .1rem; }
.np-facts dd { margin: 0; font-weight: 600; word-break: break-word; }
.np-roles { display: flex; flex-wrap: wrap; gap: .3rem; }
.np-steps { margin: 0; padding-left: 1.1rem; font-size: .85rem; color: rgb(var(--ink-muted)); line-height: 1.6; }
@media (max-width: 1100px) {
  .np-layout { grid-template-columns: 1fr; }
  .np-summary { position: static; }
}
</style>
