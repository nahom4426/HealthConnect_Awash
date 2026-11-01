<script setup>
import { onMounted, reactive, ref } from 'vue';
import { openModal } from '@customizer/modal-x';
import { toasted } from '@/utils/utils';
import { useModuleStore } from '@/stores/moduleStore';
import { fetchModules, setModuleStatus, updateModule } from '../api/modulesApi';
import { generalError, statusTone } from '../productUtils';
import '../products-ui.css';

// Super Admin only. Products register their own module when created, so there is no
// "create module" form here: POST /modules is for a future backend service.
const moduleStore = useModuleStore();
const rows = ref([]);
const loading = ref(false);
const error = ref('');
const busyKey = ref('');

const editing = ref(null);
const form = reactive({ name: '', description: '', sortOrder: 0 });
const editError = ref(null);
const saving = ref(false);

async function refresh() {
  loading.value = true;
  error.value = '';
  try {
    const list = await fetchModules({ includeInactive: true });
    rows.value = (Array.isArray(list) ? list : list?.content || []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function openEdit(row) {
  editing.value = row;
  Object.assign(form, { name: row.name, description: row.description || '', sortOrder: row.sortOrder ?? 0 });
  editError.value = null;
}

async function save() {
  saving.value = true;
  editError.value = null;
  try {
    await updateModule(editing.value.key, { name: form.name.trim(), description: form.description.trim(), sortOrder: Number(form.sortOrder) || 0 });
    editing.value = null;
    toasted(true, 'Module updated');
    await Promise.all([refresh(), moduleStore.loadRegistry({ force: true })]);
  } catch (e) {
    editError.value = e;
  } finally {
    saving.value = false;
  }
}

function toggle(row) {
  const deactivating = row.status === 'ACTIVE';
  openModal(
    'Confirmation',
    {
      title: deactivating ? `Deactivate ${row.name}?` : `Activate ${row.name}?`,
      message: deactivating ? 'It disappears from every user\'s menu until it is activated again.' : 'It appears again in the menu of its members.',
      confirmText: deactivating ? 'Deactivate' : 'Activate',
      cancelText: 'Cancel',
      tone: deactivating ? 'danger' : undefined,
    },
    async (yes) => {
      if (!yes) return;
      busyKey.value = row.key;
      try {
        await setModuleStatus(row.key, deactivating ? 'INACTIVE' : 'ACTIVE');
        toasted(true, deactivating ? `${row.name} deactivated` : `${row.name} activated`);
        await Promise.all([refresh(), moduleStore.loadRegistry({ force: true })]);
      } catch (e) {
        toasted(false, '', e.message);
      } finally {
        busyKey.value = '';
      }
    },
  );
}

onMounted(refresh);
</script>

<template>
  <div class="pp-page">
    <header class="pp-head">
      <div>
        <p class="pp-kicker">Administration</p>
        <h1>Module registry</h1>
        <p class="pp-sub">Every module in the menu. Rename, reorder, or switch one off. New products add their module here automatically.</p>
      </div>
      <button class="pp-btn ghost" :disabled="loading" @click="refresh">Refresh</button>
    </header>

    <p v-if="!moduleStore.isSuperAdmin()" class="pp-note">Only a Super Admin can manage the module registry.</p>
    <p v-if="error" class="pp-error">{{ error }}</p>
    <p v-else-if="loading && !rows.length" class="pp-note">Loading modules…</p>

    <section v-if="rows.length" class="pp-card flush">
      <table>
        <thead><tr><th class="num">Order</th><th>Module</th><th>Service</th><th>Status</th><th></th></tr></thead>
        <tbody>
          <tr v-for="row in rows" :key="row.key" :class="{ retired: row.status !== 'ACTIVE' }">
            <td class="num">{{ row.sortOrder }}</td>
            <td>
              <strong>{{ row.name }}</strong>
              <span v-if="row.builtIn" class="pp-pill" style="margin-left: .4rem">Built-in</span>
              <div class="muted"><span class="mono">{{ row.key }}</span><template v-if="row.description"> · {{ row.description }}</template></div>
            </td>
            <td><span class="mono">{{ row.serviceId }}</span><div class="muted mono">{{ row.basePath }}</div></td>
            <td><span class="pp-pill" :class="statusTone(row.status)">{{ row.status }}</span></td>
            <td>
              <div class="row-actions">
                <button class="pp-link" @click="openEdit(row)">Edit</button>
                <button
                  v-if="row.key !== 'health'"
                  class="pp-link"
                  :class="{ danger: row.status === 'ACTIVE' }"
                  :disabled="busyKey === row.key"
                  @click="toggle(row)"
                >
                  {{ row.status === 'ACTIVE' ? 'Deactivate' : 'Activate' }}
                </button>
                <span v-else class="muted" title="Health can't be deactivated">Always on</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <div v-if="editing" class="pp-modal-backdrop" @click.self="editing = null">
      <form class="pp-modal" @submit.prevent="save">
        <h2>Edit {{ editing.name }}</h2>
        <p class="muted mono" style="margin-top: -.4rem">{{ editing.key }}</p>
        <p v-if="generalError(editError, ['name', 'description', 'sortOrder'])" class="pp-error">{{ editError.message }}</p>
        <div class="pp-grid">
          <label class="pp-field span-2" :class="{ invalid: editError?.for?.('name') }">
            Name *
            <input v-model="form.name" required />
            <span v-if="editError?.for?.('name')" class="field-error">{{ editError.for('name') }}</span>
          </label>
          <label class="pp-field span-2" :class="{ invalid: editError?.for?.('description') }">
            Description
            <input v-model="form.description" />
          </label>
          <label class="pp-field" :class="{ invalid: editError?.for?.('sortOrder') }">
            Menu order
            <input v-model.number="form.sortOrder" type="number" />
          </label>
        </div>
        <div class="pp-actions" style="justify-content: flex-end; margin-top: 1rem">
          <button type="button" class="pp-btn ghost" @click="editing = null">Cancel</button>
          <button type="submit" class="pp-btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>
