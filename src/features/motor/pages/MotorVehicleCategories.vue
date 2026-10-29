<script setup>
import { ref, computed, onMounted } from 'vue';
import DataTable from '@/components/DataTable.vue';
import {
  fetchCategoryRoots, fetchCategoryTree, fetchSubCategories,
  createCategory, updateCategory, deleteCategory,
} from '../api/motorApi.js';

// ── state ─────────────────────────────────────────────────────────────────────
const tree        = ref([]);
const roots       = ref([]);
const loading     = ref(false);
const saving      = ref(false);
const error       = ref('');
const success     = ref('');

const showForm    = ref(false);
const editTarget  = ref(null);   // null = create, object = edit

const form = ref({ name: '', description: '', code: '', parentUuid: '' });
const formErrors = ref({});

// ── helpers ───────────────────────────────────────────────────────────────────
function resetForm() {
  form.value = { name: '', description: '', code: '', parentUuid: '' };
  formErrors.value = {};
  editTarget.value = null;
}

function flattenTree(nodes, depth = 0) {
  const result = [];
  (nodes || []).forEach(n => {
    result.push({ ...n, _depth: depth });
    if (n.subCategories?.length) result.push(...flattenTree(n.subCategories, depth + 1));
  });
  return result;
}

function expandAll(nodes) {
  (nodes || []).forEach(n => {
    if (n.subCategories?.length) {
      expanded.value.add(n.categoryUuid);
      expandAll(n.subCategories);
    }
  });
}

const flatCategories = computed(() => flattenTree(tree.value));

// ── load ──────────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [t, r] = await Promise.all([fetchCategoryTree(), fetchCategoryRoots()]);
    tree.value  = Array.isArray(t) ? t : [];
    roots.value = Array.isArray(r) ? r : [];
    // start collapsed — only root categories visible
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Failed to load categories';
  } finally {
    loading.value = false;
  }
}

onMounted(load);

// ── open form ─────────────────────────────────────────────────────────────────
function openCreate(parentUuid = '') {
  resetForm();
  form.value.parentUuid = parentUuid;
  showForm.value = true;
}

function openEdit(cat) {
  resetForm();
  editTarget.value = cat;
  form.value = {
    name: cat.name || '',
    description: cat.description || '',
    code: cat.code || '',
    parentUuid: cat.parentUuid || '',
  };
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  resetForm();
}

// ── validate ──────────────────────────────────────────────────────────────────
function validate() {
  const errs = {};
  if (!form.value.name.trim())  errs.name = 'Name is required';
  if (!form.value.code.trim())  errs.code = 'Code is required';
  formErrors.value = errs;
  return Object.keys(errs).length === 0;
}

// ── save ──────────────────────────────────────────────────────────────────────
async function save() {
  if (!validate()) return;
  saving.value = true;
  error.value = '';
  success.value = '';
  try {
    const payload = {
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      code: form.value.code.trim(),
      parentUuid: form.value.parentUuid || null,
    };
    if (editTarget.value) {
      await updateCategory(editTarget.value.categoryUuid, payload);
      success.value = 'Category updated successfully';
    } else {
      await createCategory(payload);
      success.value = 'Category created successfully';
    }
    closeForm();
    await load();
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Save failed';
  } finally {
    saving.value = false;
  }
}

// ── delete ────────────────────────────────────────────────────────────────────
const deleteTarget = ref(null);
async function confirmDelete(cat) {
  deleteTarget.value = cat;
}
async function doDelete() {
  if (!deleteTarget.value) return;
  saving.value = true;
  error.value = '';
  try {
    await deleteCategory(deleteTarget.value.categoryUuid);
    success.value = 'Category deleted';
    deleteTarget.value = null;
    await load();
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Delete failed';
  } finally {
    saving.value = false;
  }
}

// ── expand/collapse tree ──────────────────────────────────────────────────────
const expanded = ref(new Set());
function toggle(categoryUuid) {
  const next = new Set(expanded.value);
  if (next.has(categoryUuid)) next.delete(categoryUuid);
  else next.add(categoryUuid);
  expanded.value = next;
}
function isExpanded(categoryUuid) { return expanded.value.has(categoryUuid); }

function isVisible(node) {
  // root nodes always visible
  if (!node.parentUuid) return true;
  // visible if all ancestors expanded
  let parentId = node.parentUuid;
  while (parentId) {
    if (!expanded.value.has(parentId)) return false;
    const parent = flatCategories.value.find(n => n.categoryUuid === parentId);
    parentId = parent?.parentUuid;
  }
  return true;
}

function hasChildren(categoryUuid) {
  return flatCategories.value.some(n => n.parentUuid === categoryUuid);
}
</script>

<template>
  <div class="mc-root">
    <!-- ── Header ── -->
    <div class="mc-header">
      <div class="mc-header-left">
        <div class="mc-header-icon">
          <!-- Contextual Hierarchy Tree Icon -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:22px;height:22px">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
        </div>
        <div>
          <h2 class="mc-title">Vehicle Classification Hierarchy</h2>
          <p class="mc-subtitle">Organize multi-level category structures for motor risk rating</p>
        </div>
      </div>
      <button class="mc-btn mc-btn-amber" @click="openCreate()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
        New Category
      </button>
    </div>

    <!-- ── Alerts ── -->
    <div v-if="error" class="mc-alert mc-alert-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;flex-shrink:0">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      {{ error }}
      <button @click="error=''" class="mc-alert-close">×</button>
    </div>
    <div v-if="success" class="mc-alert mc-alert-success">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;flex-shrink:0">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      {{ success }}
      <button @click="success=''" class="mc-alert-close">×</button>
    </div>

    <!-- ── Tree Table ── -->
    <div class="mc-card">
      <div v-if="loading" class="mc-loading">
        <div class="mc-spinner"></div>
        <span>Loading classification tree…</span>
      </div>

      <DataTable
        v-else-if="flatCategories.length"
        :headers="['Name', 'Code', 'Description', 'Classification Level', 'Actions']"
        :hide-index="true"
        :last-col="false"
        class="mc-datatable"
      >
        <template v-for="cat in flatCategories" :key="cat.categoryUuid">
          <tr v-if="isVisible(cat)" class="mc-row">
            <td>
              <div class="mc-name-cell" :style="{ paddingLeft: (cat._depth * 24 + 4) + 'px' }">
                <button v-if="hasChildren(cat.categoryUuid)" class="mc-expand-btn" @click="toggle(cat.categoryUuid)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                    :style="{ width: '10px', height: '10px', transition: 'transform 0.15s', transform: isExpanded(cat.categoryUuid) ? 'rotate(90deg)' : 'rotate(0deg)' }">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
                <span v-else class="mc-expand-placeholder"></span>
                <div class="mc-cat-dot" :class="cat._depth === 0 ? 'mc-dot-root' : 'mc-dot-child'"></div>
                <span class="mc-cat-name">{{ cat.name }}</span>
              </div>
            </td>
            <td><span class="mc-code-badge">{{ cat.code }}</span></td>
            <td class="mc-desc">{{ cat.description || '—' }}</td>
            <td>
              <span class="mc-type-badge" :class="cat._depth === 0 ? 'mc-type-root' : 'mc-type-sub'">
                {{ cat._depth === 0 ? 'Root Classification' : 'Sub-category (Level ' + (cat._depth + 1) + ')' }}
              </span>
            </td>
            <td>
              <div class="mc-actions">
                <button class="mc-icon-btn mc-btn-sub" title="Add sub-category" @click="openCreate(cat.categoryUuid)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                </button>
                <button class="mc-icon-btn mc-btn-edit" title="Edit" @click="openEdit(cat)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button class="mc-icon-btn mc-btn-del" title="Delete" @click="confirmDelete(cat)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </template>
      </DataTable>

      <div v-else class="mc-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:40px;height:40px;color:#d97706">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
        <p>No categories yet. Create your first root category.</p>
        <button class="mc-btn mc-btn-amber" @click="openCreate()">Create Category</button>
      </div>
    </div>

    <!-- ── Create / Edit Modal ── -->
    <Teleport to="body">
      <Transition name="mc-modal">
        <div v-if="showForm" class="mc-overlay" @click.self="closeForm">
          <div class="mc-modal">
            <div class="mc-modal-header">
              <h3>{{ editTarget ? 'Edit Category' : 'New Category' }}</h3>
              <button class="mc-modal-close" @click="closeForm">×</button>
            </div>
            <div class="mc-modal-body">
              <div class="mc-field">
                <label>Name <span class="mc-req">*</span></label>
                <input v-model="form.name" class="mc-input" :class="{ 'mc-input-err': formErrors.name }" placeholder="e.g. Private Vehicle" />
                <span v-if="formErrors.name" class="mc-field-err">{{ formErrors.name }}</span>
              </div>
              <div class="mc-field">
                <label>Code <span class="mc-req">*</span></label>
                <input v-model="form.code" class="mc-input" :class="{ 'mc-input-err': formErrors.code }" placeholder="e.g. PVT" />
                <span v-if="formErrors.code" class="mc-field-err">{{ formErrors.code }}</span>
              </div>
              <div class="mc-field">
                <label>Description</label>
                <textarea v-model="form.description" class="mc-input mc-textarea" placeholder="Optional description" rows="2" />
              </div>
              <div class="mc-field">
                <label>Parent Category</label>
                <select v-model="form.parentUuid" class="mc-input">
                  <option value="">— Root category (no parent) —</option>
                  <option v-for="cat in flatCategories" :key="cat.categoryUuid" :value="cat.categoryUuid">
                    {{ '　'.repeat(cat._depth) }}{{ cat.name }} ({{ cat.code }})
                  </option>
                </select>
              </div>
            </div>
            <div class="mc-modal-footer">
              <button class="mc-btn mc-btn-ghost" @click="closeForm">Cancel</button>
              <button class="mc-btn mc-btn-amber" :disabled="saving" @click="save">
                <svg v-if="saving" class="mc-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                {{ saving ? 'Saving…' : (editTarget ? 'Update' : 'Create') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Delete Confirm Modal ── -->
    <Teleport to="body">
      <Transition name="mc-modal">
        <div v-if="deleteTarget" class="mc-overlay" @click.self="deleteTarget = null">
          <div class="mc-modal mc-modal-sm">
            <div class="mc-modal-header mc-modal-header-danger">
              <h3>Delete Category</h3>
              <button class="mc-modal-close" @click="deleteTarget = null">×</button>
            </div>
            <div class="mc-modal-body">
              <p>Are you sure you want to delete <strong>{{ deleteTarget.name }}</strong>?</p>
              <p class="mc-warn-text">This may also remove associated sub-categories and rates.</p>
            </div>
            <div class="mc-modal-footer">
              <button class="mc-btn mc-btn-ghost" @click="deleteTarget = null">Cancel</button>
              <button class="mc-btn mc-btn-danger" :disabled="saving" @click="doDelete">
                {{ saving ? 'Deleting…' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.mc-root { padding: 1.75rem 2rem; min-height: 100%; background: rgb(var(--surface-muted)); }

/* Header - Contextual Warm Amber Theme */
.mc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem; }
.mc-header-left { display: flex; align-items: center; gap: 0.85rem; }
.mc-header-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  display: flex; align-items: center; justify-content: center; color: #fff;
  flex-shrink: 0; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.25);
}
.mc-title { font-size: 1.25rem; font-weight: 800; color: rgb(var(--ink)); margin: 0; letter-spacing: -0.01em; }
.mc-subtitle { font-size: 0.78rem; color: rgb(var(--ink-subtle)); margin: 0; }

/* Buttons */
.mc-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1.1rem; border-radius: 0.5rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; border: none; transition: all 0.15s; }
.mc-btn-amber { background: linear-gradient(135deg, #d97706, #b45309); color: #fff; box-shadow: 0 2px 8px rgba(217, 119, 6, 0.2); }
.mc-btn-amber:hover { background: linear-gradient(135deg, #b45309, #92400e); }
.mc-btn-amber:disabled { opacity: 0.6; cursor: not-allowed; }
.mc-btn-ghost { background: rgb(var(--surface-raised)); color: rgb(var(--ink-muted)); border: 1px solid rgb(var(--line)); }
.mc-btn-ghost:hover { background: var(--tint-e2e8f0, #e2e8f0); }
.mc-btn-danger { background: #ef4444; color: #fff; }
.mc-btn-danger:hover { background: #dc2626; }
.mc-btn-danger:disabled { background: #fca5a5; cursor: not-allowed; }

/* Alerts */
.mc-alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1rem; border-radius: 0.6rem; font-size: 0.78rem; font-weight: 500; margin-bottom: 1rem; }
.mc-alert-error { background: var(--tint-fef2f2, #fef2f2); color: #b91c1c; border: 1px solid var(--tint-fecaca, #fecaca); }
.mc-alert-success { background: var(--tint-f0fdf4, #f0fdf4); color: var(--shade-15803d, #15803d); border: 1px solid var(--tint-bbf7d0, #bbf7d0); }
.mc-alert-close { margin-left: auto; background: none; border: none; font-size: 1.1rem; cursor: pointer; color: inherit; opacity: 0.6; }
.mc-alert-close:hover { opacity: 1; }

/* Card */
.mc-card { background: rgb(var(--surface)); border-radius: 0.85rem; border: 1px solid rgb(var(--line)); overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.03); }

/* Loading */
.mc-loading { display: flex; align-items: center; gap: 0.75rem; padding: 2.5rem; justify-content: center; color: rgb(var(--ink-subtle)); font-size: 0.85rem; }
.mc-spinner { width: 20px; height: 20px; border: 2px solid rgb(var(--line)); border-top-color: #d97706; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }

/* DataTable wrapper */
.mc-datatable :deep(.overflow-x-auto) { border: none; border-radius: 0; box-shadow: none; }
.mc-row { border-bottom: 1px solid rgb(var(--line)); transition: background 0.15s; }
.mc-row:hover { background: var(--tint-fffbeb, #fffbeb); }
.mc-row td { padding: 0.8rem 1rem; color: rgb(var(--ink-muted)); vertical-align: middle; font-size: 0.82rem; }
.mc-row td:last-child { text-align: left; }

/* Name cell */
.mc-name-cell { display: flex; align-items: center; gap: 0.45rem; }
.mc-expand-btn { width: 20px; height: 20px; border-radius: 4px; border: 1px solid var(--tint-fde68a, #fde68a); background: var(--tint-fffbeb, #fffbeb); cursor: pointer; display: flex; align-items: center; justify-content: center; color: #d97706; flex-shrink: 0; }
.mc-expand-btn:hover { background: var(--tint-fef3c7, #fef3c7); color: #b45309; }
.mc-expand-placeholder { width: 20px; flex-shrink: 0; }
.mc-cat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.mc-dot-root { background: #d97706; }
.mc-dot-child { background: #cbd5e1; }
.mc-cat-name { font-weight: 700; color: rgb(var(--ink)); }

/* Badges */
.mc-code-badge { display: inline-block; padding: 0.18rem 0.55rem; background: var(--tint-fffbeb, #fffbeb); color: #b45309; border: 1px solid var(--tint-fde68a, #fde68a); border-radius: 6px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.04em; }
.mc-type-badge { display: inline-block; padding: 0.18rem 0.6rem; border-radius: 9999px; font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
.mc-type-root { background: var(--tint-fffbeb, #fffbeb); color: #b45309; border: 1px solid var(--tint-fde68a, #fde68a); }
.mc-type-sub { background: rgb(var(--surface-muted)); color: rgb(var(--ink-muted)); border: 1px solid rgb(var(--line)); }

.mc-desc { color: rgb(var(--ink-subtle)); font-size: 0.78rem; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Action buttons */
.mc-actions { display: flex; align-items: center; justify-content: flex-start; gap: 0.35rem; }
.mc-icon-btn { width: 30px; height: 30px; border-radius: 7px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.mc-btn-sub { background: var(--tint-fffbeb, #fffbeb); color: #d97706; border: 1px solid var(--tint-fde68a, #fde68a); }
.mc-btn-sub:hover { background: #d97706; color: #fff; }
.mc-btn-edit { background: var(--tint-eff6ff, #eff6ff); color: #2563eb; border: 1px solid var(--tint-bfdbfe, #bfdbfe); }
.mc-btn-edit:hover { background: #2563eb; color: #fff; }
.mc-btn-del { background: var(--tint-fef2f2, #fef2f2); color: #dc2626; border: 1px solid var(--tint-fecaca, #fecaca); }
.mc-btn-del:hover { background: #dc2626; color: #fff; }

/* Empty */
.mc-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3.5rem; color: rgb(var(--ink-subtle)); font-size: 0.85rem; text-align: center; }

/* Modal */
.mc-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); z-index: 9000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
.mc-modal { background: rgb(var(--surface)); border-radius: 0.875rem; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.25); overflow: hidden; }
.mc-modal-sm { max-width: 380px; }
.mc-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid rgb(var(--line)); }
.mc-modal-header h3 { font-size: 0.95rem; font-weight: 700; color: rgb(var(--ink)); margin: 0; }
.mc-modal-header-danger { background: var(--tint-fef2f2, #fef2f2); }
.mc-modal-header-danger h3 { color: #b91c1c; }
.mc-modal-close { background: none; border: none; font-size: 1.3rem; cursor: pointer; color: rgb(var(--ink-subtle)); line-height: 1; }
.mc-modal-close:hover { color: rgb(var(--ink-muted)); }
.mc-modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.875rem; }
.mc-modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.25rem; border-top: 1px solid rgb(var(--line)); background: rgb(var(--surface-muted)); }

/* Form fields */
.mc-field { display: flex; flex-direction: column; gap: 0.3rem; }
.mc-field label { font-size: 0.75rem; font-weight: 700; color: rgb(var(--ink-muted)); }
.mc-req { color: #ef4444; }
.mc-input { padding: 0.5rem 0.75rem; border: 1px solid rgb(var(--line-strong)); border-radius: 0.6rem; font-size: 0.82rem; color: rgb(var(--ink)); background: rgb(var(--surface)); transition: border-color 0.15s, box-shadow 0.15s; outline: none; width: 100%; box-sizing: border-box; }
.mc-input:focus { border-color: #d97706; box-shadow: 0 0 0 3px rgba(217,119,6,0.15); }
.mc-input-err { border-color: #ef4444; }
.mc-textarea { resize: vertical; min-height: 60px; }
.mc-field-err { font-size: 0.7rem; color: #ef4444; }
.mc-warn-text { font-size: 0.78rem; color: #ef4444; margin: 0.25rem 0 0; }

/* Spin animation */
.mc-spin { animation: spin 0.8s linear infinite; }

/* Modal transition */
.mc-modal-enter-active, .mc-modal-leave-active { transition: opacity 0.2s, transform 0.2s; }
.mc-modal-enter-from, .mc-modal-leave-to { opacity: 0; transform: scale(0.97) translateY(8px); }
</style>
