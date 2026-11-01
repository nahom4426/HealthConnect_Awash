<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { openModal } from '@customizer/modal-x';
import { toasted } from '@/utils/utils';
import { useModuleStore } from '@/stores/moduleStore';
import {
  createDefinition,
  listDefinitions,
  publishDefinitionPrivileges,
  setDefinitionStatus,
  updateDefinition,
} from '../api/productsApi';
import { FAMILIES, formatDateTime, generalError, keyProblem, normalizeKey, statusTone } from '../productUtils';
import '../products-ui.css';

const router = useRouter();
const moduleStore = useModuleStore();
const rows = ref([]);
const loading = ref(false);
const error = ref('');
const includeRetired = ref(true);
const busyKey = ref('');

const isSuperAdmin = computed(() => moduleStore.isSuperAdmin());

// Everyone sees only the products whose module grants them product.read
const visibleRows = computed(() =>
  rows.value
    .filter((row) => isSuperAdmin.value || moduleStore.can(row.privilegeModule, 'product.read'))
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
);

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    await moduleStore.loadRegistry();
    const list = await listDefinitions({ includeRetired: includeRetired.value });
    rows.value = Array.isArray(list) ? list : list?.content || [];
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

/* ── Create ── */
const showCreate = ref(false);
const showAdvanced = ref(false);
const createForm = reactive({ key: '', name: '', description: '', family: 'PROPERTY', privilegeModule: '', keyTouched: false });
const createError = ref(null);
const creating = ref(false);
const normalizedKey = computed(() => normalizeKey(createForm.key));
const defaultPrivilegeModule = computed(() => normalizedKey.value.toLowerCase());

function openCreate() {
  Object.assign(createForm, { key: '', name: '', description: '', family: 'PROPERTY', privilegeModule: '', keyTouched: false });
  createError.value = null;
  showAdvanced.value = false;
  showCreate.value = true;
}

function onNameInput() {
  // Suggest the key from the name until the user types a key of their own
  if (!createForm.keyTouched) createForm.key = createForm.name;
}

async function submitCreate() {
  createError.value = null;
  const problem = keyProblem(normalizedKey.value);
  if (problem) {
    createError.value = { message: problem, for: (f) => (f === 'key' ? problem : '') };
    return;
  }
  creating.value = true;
  try {
    const body = {
      key: normalizedKey.value,
      name: createForm.name.trim(),
      description: createForm.description.trim(),
      family: createForm.family,
    };
    if (createForm.privilegeModule.trim()) body.privilegeModule = createForm.privilegeModule.trim().toLowerCase();
    const created = await createDefinition(body);
    showCreate.value = false;
    // The new module and its roles now exist in AuthService, so the menu can show it
    await Promise.all([moduleStore.loadRegistry({ force: true }), moduleStore.loadDefinitions({ force: true })]);
    await refresh();
    if (created?.privilegesPublishedAt) {
      toasted(true, `${created.name} created. It is now in the module menu with its roles.`);
    } else {
      toasted(true, `${created?.name || body.name} created, but its permissions are not set up yet.`);
    }
  } catch (e) {
    createError.value = e;
  } finally {
    creating.value = false;
  }
}

/* ── Edit ── */
const editing = ref(null);
const editForm = reactive({ name: '', description: '', sortOrder: 0 });
const editError = ref(null);
const saving = ref(false);

function openEdit(row) {
  editing.value = row;
  Object.assign(editForm, { name: row.name, description: row.description || '', sortOrder: row.sortOrder ?? 0 });
  editError.value = null;
}

async function submitEdit() {
  saving.value = true;
  editError.value = null;
  try {
    const body = { name: editForm.name.trim(), description: editForm.description.trim() };
    // Shipped products allow name and description only
    body.sortOrder = editing.value.builtIn ? editing.value.sortOrder : Number(editForm.sortOrder) || 0;
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

    <p v-if="error" class="pp-error">{{ error }}</p>
    <p v-else-if="loading && !rows.length" class="pp-note">Loading products…</p>
    <p v-else-if="!visibleRows.length" class="pp-note">No products you can view.</p>

    <section v-if="visibleRows.length" class="pp-card flush">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Family</th>
            <th>Module</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in visibleRows" :key="row.key" :class="{ retired: row.status === 'RETIRED' }">
            <td>
              <strong>{{ row.name }}</strong>
              <span v-if="row.builtIn" class="pp-pill" style="margin-left: .4rem">Built-in</span>
              <div class="muted"><span class="mono">{{ row.key }}</span><template v-if="row.description"> · {{ row.description }}</template></div>
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
        </tbody>
      </table>
    </section>

    <!-- Create -->
    <div v-if="showCreate" class="pp-modal-backdrop" @click.self="showCreate = false">
      <form class="pp-modal" @submit.prevent="submitCreate">
        <h2>New product</h2>
        <p class="pp-warn">The key and privilege module can never change after the product is created.</p>
        <p v-if="generalError(createError, ['name', 'key', 'family', 'privilegeModule'])" class="pp-error">
          {{ generalError(createError, ['name', 'key', 'family', 'privilegeModule']) }}
        </p>
        <div class="pp-grid">
          <label class="pp-field span-2" :class="{ invalid: createError?.for?.('name') }">
            Name *
            <input v-model="createForm.name" required placeholder="e.g. Pet Care" @input="onNameInput" />
            <span v-if="createError?.for?.('name')" class="field-error">{{ createError.for('name') }}</span>
          </label>
          <label class="pp-field span-2" :class="{ invalid: createError?.for?.('key') }">
            Key *
            <input v-model="createForm.key" required @input="createForm.keyTouched = true" />
            <small>Saved as <code>{{ normalizedKey || '—' }}</code> · letters, digits and _, starting with a letter, up to 40</small>
            <span v-if="createError?.for?.('key')" class="field-error">{{ createError.for('key') }}</span>
          </label>
          <label class="pp-field span-2" :class="{ invalid: createError?.for?.('family') }">
            Family *
            <select v-model="createForm.family">
              <option v-for="f in FAMILIES" :key="f.value" :value="f.value">{{ f.label }}</option>
            </select>
            <span v-if="createError?.for?.('family')" class="field-error">{{ createError.for('family') }}</span>
          </label>
          <label class="pp-field span-2" :class="{ invalid: createError?.for?.('description') }">
            Description
            <input v-model="createForm.description" />
          </label>
        </div>
        <button type="button" class="pp-link" style="margin: .8rem 0" @click="showAdvanced = !showAdvanced">
          {{ showAdvanced ? '▾' : '▸' }} Advanced
        </button>
        <label v-if="showAdvanced" class="pp-field" :class="{ invalid: createError?.for?.('privilegeModule') }">
          Privilege module
          <input v-model="createForm.privilegeModule" class="mono" :placeholder="defaultPrivilegeModule || 'pet_care'" />
          <small>Prefix of this product's privileges, e.g. <code>{{ createForm.privilegeModule || defaultPrivilegeModule || 'pet_care' }}.proposal.create</code>. Defaults to the key in lower case.</small>
          <span v-if="createError?.for?.('privilegeModule')" class="field-error">{{ createError.for('privilegeModule') }}</span>
        </label>
        <div class="pp-actions" style="justify-content: flex-end; margin-top: 1rem">
          <button type="button" class="pp-btn ghost" @click="showCreate = false">Cancel</button>
          <button type="submit" class="pp-btn" :disabled="creating">{{ creating ? 'Creating…' : 'Create product' }}</button>
        </div>
      </form>
    </div>

    <!-- Edit -->
    <div v-if="editing" class="pp-modal-backdrop" @click.self="editing = null">
      <form class="pp-modal" @submit.prevent="submitEdit">
        <h2>Edit {{ editing.name }}</h2>
        <p v-if="generalError(editError, ['name'])" class="pp-error">{{ generalError(editError, ['name']) }}</p>
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
        </div>
        <p v-if="editing.builtIn" class="muted" style="margin-top: .6rem">Built-in product: only the name and description can change.</p>
        <div class="pp-actions" style="justify-content: flex-end; margin-top: 1rem">
          <button type="button" class="pp-btn ghost" @click="editing = null">Cancel</button>
          <button type="submit" class="pp-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>
