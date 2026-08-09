<script setup>
import { ref, computed, onMounted } from 'vue';
import DataTable from '@/components/DataTable.vue';
import Button from '@/components/Button.vue';
import {
  fetchCategoryTree,
  fetchAllPremiums, savePremium, updatePremium, deletePremium,
} from '../api/motorApi.js';

// ── state ─────────────────────────────────────────────────────────────────────
const tree         = ref([]);   // full tree from API
const premiums     = ref([]);
const loading      = ref(false);
const saving       = ref(false);
const error        = ref('');
const success      = ref('');

// Cascaded selection — each level is [{ categoryUuid, name, code, subCategories }]
// selections[i] = chosen categoryUuid at depth i
const selections   = ref([]);   // array of chosen uuids per level
const levels       = ref([]);   // array of option arrays per level (children of prev selection)

const rateInput    = ref('');
const rateError    = ref('');
const selectErrors = ref([]);   // per-level validation errors

// Edit / delete
const editTarget   = ref(null);
const editRate     = ref('');
const deleteTarget = ref(null);

// Active tab
const activeTab    = ref('rates');

// ── computed ──────────────────────────────────────────────────────────────────
// The deepest selected uuid is the actual category to save the rate for
const selectedCategoryUuid = computed(() => {
  for (let i = selections.value.length - 1; i >= 0; i--) {
    if (selections.value[i]) return selections.value[i];
  }
  return '';
});

const selectedCategoryName = computed(() => {
  for (let i = selections.value.length - 1; i >= 0; i--) {
    const uuid = selections.value[i];
    if (!uuid) continue;
    const option = levels.value[i]?.find(n => n.categoryUuid === uuid);
    if (option) return option.name;
  }
  return '';
});

// ── cascade helpers ───────────────────────────────────────────────────────────
function initCascade() {
  selections.value = [''];
  levels.value = [tree.value];
}

function onSelectLevel(depth, uuid) {
  // Set this level's selection
  selections.value[depth] = uuid;
  // Clear all deeper levels
  selections.value = selections.value.slice(0, depth + 1);
  levels.value = levels.value.slice(0, depth + 1);

  if (!uuid) return;

  // Find node to see if it has children
  const node = levels.value[depth]?.find(n => n.categoryUuid === uuid);
  if (node?.subCategories?.length) {
    levels.value.push(node.subCategories);
    selections.value.push('');
  }
}

function resetCascade() {
  selections.value = [''];
  levels.value = [tree.value];
  rateInput.value = '';
  rateError.value = '';
  selectErrors.value = [];
}

function clearSelectError(depth) {
  const errs = [...selectErrors.value];
  errs[depth] = '';
  selectErrors.value = errs;
}

function handleSelectChange(depth, uuid) {
  clearSelectError(depth);
  onSelectLevel(depth, uuid);
}

// ── load ──────────────────────────────────────────────────────────────────────
async function loadTree() {
  try {
    const data = await fetchCategoryTree();
    tree.value = Array.isArray(data) ? data : [];
    initCascade();
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Failed to load categories';
  }
}

async function loadPremiums() {
  loading.value = true;
  try {
    const data = await fetchAllPremiums();
    // fetchAllPremiums already extracts .content via motorApi.js
    premiums.value = Array.isArray(data) ? data : [];
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Failed to load premiums';
  } finally {
    loading.value = false;
  }
}

function getCategoryInfo(uuid) {
  let name = '';
  let path = '';
  
  function traverse(nodes, currentPath) {
    if (!nodes) return false;
    for (const node of nodes) {
      const nodePath = currentPath ? `${currentPath} > ${node.name}` : node.name;
      if (node.categoryUuid === uuid || node.uuid === uuid) {
        name = node.name;
        path = nodePath;
        return true;
      }
      if (node.subCategories && node.subCategories.length > 0) {
        if (traverse(node.subCategories, nodePath)) return true;
      }
    }
    return false;
  }
  
  traverse(tree.value, 'Motor');
  return { name, path };
}

const enrichedPremiums = computed(() => {
  return premiums.value.map(p => {
    const info = getCategoryInfo(p.categoryUuid || p.vehicleCategoryUuid);
    return {
      ...p,
      displayCategoryName: info.name || p.categoryName || 'Unknown',
      displayCategoryPath: info.path || p.categoryPath || 'Unknown'
    };
  });
});

onMounted(() => {
  loadTree();
  loadPremiums();
});

// ── save premium ──────────────────────────────────────────────────────────────
function validateRate(val) {
  const n = parseFloat(val);
  if (!val && val !== 0) return 'Rate is required';
  if (isNaN(n))          return 'Rate must be a number';
  if (n < 0)             return 'Rate cannot be negative';
  return '';
}

async function submitRate() {
  // Validate every visible cascade level
  const errs = levels.value.map((_, i) => selections.value[i] ? '' : 'This field is required');
  selectErrors.value = errs;
  const hasSelectError = errs.some(e => e);

  rateError.value = validateRate(rateInput.value);

  if (hasSelectError || rateError.value) return;
  if (!selectedCategoryUuid.value) { rateError.value = 'Please select a category'; return; }

  saving.value = true;
  error.value = '';
  success.value = '';
  try {
    await savePremium(selectedCategoryUuid.value, parseFloat(rateInput.value));
    success.value = `Rate saved for ${selectedCategoryName.value}`;
    resetCascade();
    await loadPremiums();
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Save failed';
  } finally {
    saving.value = false;
  }
}

// ── edit premium ──────────────────────────────────────────────────────────────
function openEdit(p) {
  editTarget.value = p;
  editRate.value = String(p.premiumRate ?? '');
}

async function submitEdit() {
  const err = validateRate(editRate.value);
  if (err) { error.value = err; return; }
  saving.value = true;
  error.value = '';
  try {
    await updatePremium(
      editTarget.value.premiumUuid,
      editTarget.value.categoryUuid,
      parseFloat(editRate.value)
    );
    success.value = 'Rate updated successfully';
    editTarget.value = null;
    await loadPremiums();
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Update failed';
  } finally {
    saving.value = false;
  }
}

// ── delete premium ────────────────────────────────────────────────────────────
async function doDelete() {
  if (!deleteTarget.value) return;
  saving.value = true;
  error.value = '';
  try {
    await deletePremium(deleteTarget.value.premiumUuid);
    success.value = 'Rate deleted';
    deleteTarget.value = null;
    await loadPremiums();
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Delete failed';
  } finally {
    saving.value = false;
  }
}

// ── static discounts ──────────────────────────────────────────────────────────
const discounts = ref([
  { id: 1, name: 'No-Claim Discount', code: 'NCD', type: 'Percentage', value: 10, description: 'Reward for no claims in previous year', status: 'Active' },
  { id: 2, name: 'Fleet Discount',    code: 'FLT', type: 'Percentage', value: 15, description: 'Applicable for 5+ vehicles in a fleet', status: 'Active' },
  { id: 3, name: 'Loyalty Discount',  code: 'LOY', type: 'Percentage', value: 5,  description: 'Customers with 3+ years tenure', status: 'Active' },
  { id: 4, name: 'Safe Driver Bonus', code: 'SDB', type: 'Percentage', value: 8,  description: 'Based on driving record assessment', status: 'Active' },
  { id: 5, name: 'Multi-Policy',      code: 'MPD', type: 'Flat',       value: 500, description: 'Holding multiple policy types', status: 'Inactive' },
]);

// ── already-rated uuids (for filtering cascade selects) ──────────────────────
const ratedUuids = computed(() => new Set(premiums.value.map(p => p.categoryUuid)));

// Returns true if this node (or any of its descendants) is still available to rate.
// A node is unavailable if: it has no children AND it is already rated,
// OR it has children but ALL of them are unavailable.
function hasAvailableDescendants(node) {
  if (!node.subCategories || node.subCategories.length === 0) {
    return !ratedUuids.value.has(node.categoryUuid);
  }
  return node.subCategories.some(child => hasAvailableDescendants(child));
}

// Filter a list of nodes — keep only those that still have ratable descendants
function availableOptions(nodes) {
  return nodes.filter(n => hasAvailableDescendants(n));
}

// ── level label ───────────────────────────────────────────────────────────────
function levelLabel(depth) {
  if (depth === 0) return 'Category';
  if (depth === 1) return 'Sub-category';
  return `Level ${depth + 1}`;
}
</script>

<template>
  <div class="mr-root">

    <!-- ── Page Header ── -->
    <div class="mr-header">
      <div class="mr-header-left">
        <div class="mr-header-icon">
          <!-- Contextual Matrix Slider Icon -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:22px;height:22px">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
          </svg>
        </div>
        <div>
          <h2 class="mr-title">Rate Matrix & Premium Rules</h2>
          <p class="mr-subtitle">Configure vehicle category percentage rates and calculation multipliers</p>
        </div>
      </div>
    </div>

    <!-- ── Alerts ── -->
    <div v-if="error" class="mr-alert mr-alert-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      {{ error }}
      <button @click="error=''" class="mr-alert-close">×</button>
    </div>
    <div v-if="success" class="mr-alert mr-alert-success">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      {{ success }}
      <button @click="success=''" class="mr-alert-close">×</button>
    </div>

    <!-- ══════════════ RATES CONTENT ══════════════ -->
    <div class="mr-tab-content">

      <!-- Add Rate Panel -->
      <div class="mr-panel">
        <div class="mr-panel-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;color:#6366f1">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          <span>Add Category Premium Rate</span>
        </div>
        <div class="mr-panel-body">
          <!-- Dynamic N-level cascaded selects -->
          <div class="mr-cascade-row">
            <div
              v-for="(levelOptions, depth) in levels"
              :key="depth"
              class="mr-field"
            >
              <label class="mr-cascade-label">{{ levelLabel(depth) }} <span class="mr-req">*</span></label>
              <select
                class="mr-input"
                :class="{ 'mr-input-err': selectErrors[depth] }"
                :value="selections[depth]"
                @change="e => handleSelectChange(depth, e.target.value)"
              >
                <option value="">— Choose —</option>
                <option
                  v-for="opt in availableOptions(levelOptions)"
                  :key="opt.categoryUuid"
                  :value="opt.categoryUuid"
                >{{ opt.name }}</option>
              </select>
              <span v-if="selectErrors[depth]" class="mr-field-err">{{ selectErrors[depth] }}</span>
            </div>

            <!-- Rate input -->
            <div class="mr-field">
              <label>Rate (%) <span class="mr-req">*</span></label>
              <input
                v-model="rateInput"
                type="number"
                step="0.01"
                min="0"
                class="mr-input"
                :class="{ 'mr-input-err': rateError }"
                placeholder="e.g. 3.5"
                @keydown.enter="submitRate"
              />
              <span v-if="rateError" class="mr-field-err">{{ rateError }}</span>
            </div>

            <!-- Submit -->
            <div class="mr-field mr-field-action">
              <label>&nbsp;</label>
              <Button type="primary" size="sm" :pending="saving" @click="submitRate" class="mr-btn-indigo">
                <svg v-if="!saving" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;margin-right:4px"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                Save Rate
              </Button>
            </div>
          </div>

          <!-- Selected path breadcrumb -->
          <div v-if="selectedCategoryUuid" class="mr-selected-path">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px;color:#6366f1"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            <span>Selected Category: <strong>{{ selectedCategoryName }}</strong></span>
          </div>
        </div>
      </div>

      <!-- Rates Table -->
      <div class="mr-card">
        <div class="mr-card-header">
          <span class="mr-card-title">Configured Rate Matrix</span>
          <button class="mr-refresh-btn" @click="loadPremiums" :disabled="loading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px" :class="{ 'mr-spin': loading }"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Refresh
          </button>
        </div>

        <div v-if="loading" class="mr-loading">
          <div class="mr-spinner"></div>
          <span>Loading rate matrix…</span>
        </div>

        <DataTable
          v-else-if="enrichedPremiums.length"
          :headers="['Category', 'Category Path', 'Rate (%)','Actions']"
          :hide-index="false"
          class="mr-datatable"
        >
          <tr v-for="(p, i) in enrichedPremiums" :key="p.premiumUuid" class="mr-row">
            <td class="mr-idx">{{ i + 1 }}</td>
            <td><span class="mr-cat-name">{{ p.displayCategoryName }}</span></td>
            <td><span class="mr-path-text">{{ p.displayCategoryPath }}</span></td>
            <td><span class="mr-rate-badge">{{ p.premiumRate ?? '—' }} %</span></td>
            <td>
              <div class="mr-actions">
                <button class="mr-icon-btn mr-btn-edit" title="Edit rate" @click="openEdit(p)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button class="mr-icon-btn mr-btn-del" title="Delete rate" @click="deleteTarget = p">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </td>
          </tr>
        </DataTable>

        <div v-else class="mr-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:38px;height:38px;color:#cbd5e1"><path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
          <p>No rates configured yet. Use the form above to add the first rate.</p>
        </div>
      </div>
    </div>



    <!-- ── Edit Rate Modal ── -->
    <Teleport to="body">
      <Transition name="mr-modal">
        <div v-if="editTarget" class="mr-overlay" @click.self="editTarget = null">
          <div class="mr-modal">
            <div class="mr-modal-header">
              <h3>Edit Premium Rate</h3>
              <button class="mr-modal-close" @click="editTarget = null">×</button>
            </div>
            <div class="mr-modal-body">
              <div class="mr-info-row">
                <span class="mr-info-label">Category UUID</span>
                <code class="mr-uuid">{{ editTarget.categoryUuid || editTarget.vehicleCategoryUuid }}</code>
              </div>
              <div class="mr-field">
                <label>New Rate (%)</label>
                <input
                  v-model="editRate"
                  type="number"
                  step="0.01"
                  min="0"
                  class="mr-input"
                  placeholder="Enter rate"
                  @keydown.enter="submitEdit"
                />
              </div>
            </div>
            <div class="mr-modal-footer">
              <Button type="edge-primary" size="sm" @click="editTarget = null">Cancel</Button>
              <Button type="primary" size="sm" :pending="saving" @click="submitEdit">Update Rate</Button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Delete Confirm Modal ── -->
    <Teleport to="body">
      <Transition name="mr-modal">
        <div v-if="deleteTarget" class="mr-overlay" @click.self="deleteTarget = null">
          <div class="mr-modal mr-modal-sm">
            <div class="mr-modal-header mr-modal-header-danger">
              <h3>Delete Rate</h3>
              <button class="mr-modal-close" @click="deleteTarget = null">×</button>
            </div>
            <div class="mr-modal-body">
              <p>Delete this premium rate entry?</p>
              <p class="mr-warn-text">This cannot be undone.</p>
            </div>
            <div class="mr-modal-footer">
              <Button type="edge-primary" size="sm" @click="deleteTarget = null">Cancel</Button>
              <Button type="danger" size="sm" :pending="saving" @click="doDelete">Delete</Button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.mr-root { padding: 1.75rem 2rem; min-height: 100%; background: #f8fafc; }

/* Header - Contextual Indigo Theme */
.mr-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem; }
.mr-header-left { display: flex; align-items: center; gap: 0.85rem; }
.mr-header-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25); }
.mr-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.01em; }
.mr-subtitle { font-size: 0.78rem; color: #64748b; margin: 0; }

/* Alerts */
.mr-alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1rem; border-radius: 0.6rem; font-size: 0.78rem; font-weight: 500; margin-bottom: 1rem; }
.mr-alert-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.mr-alert-success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.mr-alert-close { margin-left: auto; background: none; border: none; font-size: 1.1rem; cursor: pointer; color: inherit; opacity: 0.6; }
.mr-alert-close:hover { opacity: 1; }

/* Tabs - Indigo Theme */
.mr-tabs { display: flex; gap: 0.3rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 0.3rem; margin-bottom: 1.5rem; width: fit-content; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
.mr-tab { display: flex; align-items: center; gap: 0.45rem; padding: 0.5rem 1.1rem; border-radius: 0.5rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; border: none; background: transparent; color: #64748b; transition: all 0.15s; }
.mr-tab:hover { color: #334155; background: #f8fafc; }
.mr-tab-active { background: #f5f3ff; color: #4f46e5; border: 1px solid #c7d2fe; }
.mr-tab-badge { font-size: 0.65rem; font-weight: 800; background: #e2e8f0; color: #475569; border-radius: 9999px; padding: 0.12rem 0.5rem; }
.mr-tab-active .mr-tab-badge { background: #e0e7ff; color: #4338ca; }
.mr-badge-indigo { background: #e0e7ff; color: #4338ca; }

.mr-tab-content { display: flex; flex-direction: column; gap: 1.25rem; }

/* Add Rate Panel */
.mr-panel { background: #fff; border-radius: 0.85rem; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.03); }
.mr-panel-header { display: flex; align-items: center; gap: 0.55rem; padding: 0.85rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; font-weight: 700; color: #1e293b; }
.mr-panel-body { padding: 1.25rem; }

.mr-cascade-row { display: flex; flex-wrap: wrap; gap: 0.875rem; align-items: flex-start; }
.mr-cascade-row .mr-field { min-width: 160px; flex: 1 1 160px; }
.mr-cascade-row .mr-field-action { flex: 0 0 auto; min-width: 120px; }

.mr-field { display: flex; flex-direction: column; gap: 0.3rem; }
.mr-field label { font-size: 0.72rem; font-weight: 700; color: #374151; white-space: nowrap; }
.mr-req { color: #ef4444; }
.mr-field-action { justify-content: flex-end; }
.mr-input { padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.6rem; font-size: 0.82rem; color: #0f172a; background: #fff; outline: none; transition: border-color 0.15s, box-shadow 0.15s; width: 100%; box-sizing: border-box; }
.mr-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
.mr-input:disabled { background: #f8fafc; color: #94a3b8; cursor: not-allowed; }
.mr-input-err { border-color: #ef4444; }
.mr-field-err { font-size: 0.7rem; color: #ef4444; }
.mr-selected-path { display: flex; align-items: center; gap: 0.35rem; margin-top: 0.75rem; font-size: 0.78rem; color: #64748b; }
.mr-selected-path strong { color: #4338ca; }
.mr-path-text { font-size: 0.72rem; color: #4338ca; font-family: monospace; background: #f5f3ff; border: 1px solid #e0e7ff; padding: 0.15rem 0.5rem; border-radius: 4px; white-space: nowrap; }

/* Card */
.mr-card { background: #fff; border-radius: 0.85rem; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.03); }
.mr-card-header { display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.mr-card-title { font-size: 0.85rem; font-weight: 700; color: #1e293b; }
.mr-refresh-btn { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.75rem; border-radius: 0.5rem; font-size: 0.74rem; font-weight: 600; border: 1px solid #e2e8f0; background: #fff; color: #475569; cursor: pointer; }
.mr-refresh-btn:hover { background: #f1f5f9; color: #0f172a; }
.mr-static-badge { font-size: 0.7rem; font-weight: 700; color: #4338ca; background: #e0e7ff; border: 1px solid #c7d2fe; border-radius: 9999px; padding: 0.15rem 0.6rem; }

/* Loading */
.mr-loading { display: flex; align-items: center; gap: 0.75rem; padding: 2.5rem; justify-content: center; color: #64748b; font-size: 0.85rem; }
.mr-spinner { width: 20px; height: 20px; border: 2px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }

/* DataTable wrapper */
.mr-datatable :deep(.overflow-x-auto) { border: none; border-radius: 0; box-shadow: none; }
.mr-row { border-bottom: 1px solid #f1f5f9; transition: background 0.15s; }
.mr-row:hover { background: #f5f3ff; }
.mr-row td { padding: 0.8rem 1rem; color: #334155; vertical-align: middle; font-size: 0.82rem; }
.mr-idx { color: #94a3b8; font-size: 0.75rem; font-weight: 700; width: 36px; }
.mr-cat-name { font-weight: 700; color: #0f172a; }
.mr-uuid { font-size: 0.68rem; color: #64748b; background: #f1f5f9; padding: 0.15rem 0.45rem; border-radius: 4px; font-family: monospace; }
.mr-rate-badge { display: inline-block; padding: 0.2rem 0.65rem; background: #f5f3ff; color: #4338ca; border: 1px solid #c7d2fe; border-radius: 9999px; font-size: 0.72rem; font-weight: 800; }
.mr-rate-flat { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
.mr-code-badge { display: inline-block; padding: 0.18rem 0.55rem; background: #e0e7ff; color: #4338ca; border-radius: 6px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.04em; }
.mr-type-pill { display: inline-block; padding: 0.15rem 0.55rem; background: #f8fafc; color: #475569; border-radius: 9999px; font-size: 0.68rem; font-weight: 600; border: 1px solid #e2e8f0; }
.mr-desc { color: #64748b; font-size: 0.78rem; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mr-status-badge { display: inline-block; padding: 0.18rem 0.6rem; border-radius: 9999px; font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
.mr-status-active { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.mr-status-inactive { background: #f1f5f9; color: #94a3b8; border: 1px solid #e2e8f0; }

.mr-actions { display: flex; align-items: center; justify-content: flex-start; gap: 0.35rem; }
.mr-icon-btn { width: 30px; height: 30px; border-radius: 7px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.mr-btn-edit { background: #f5f3ff; color: #4f46e5; border: 1px solid #c7d2fe; }
.mr-btn-edit:hover { background: #4f46e5; color: #fff; }
.mr-btn-del { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.mr-btn-del:hover { background: #dc2626; color: #fff; }

.mr-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3.5rem; color: #94a3b8; font-size: 0.85rem; text-align: center; }

/* Modal */
.mr-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); z-index: 9000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
.mr-modal { background: #fff; border-radius: 0.875rem; width: 100%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,0.25); overflow: hidden; }
.mr-modal-sm { max-width: 360px; }
.mr-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; }
.mr-modal-header h3 { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0; }
.mr-modal-header-danger { background: #fef2f2; }
.mr-modal-header-danger h3 { color: #b91c1c; }
.mr-modal-close { background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #94a3b8; line-height: 1; }
.mr-modal-close:hover { color: #475569; }
.mr-modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.875rem; }
.mr-modal-footer { display: flex; justify-content: flex-end; gap: 0.5rem; padding: 1rem 1.25rem; border-top: 1px solid #e2e8f0; background: #f8fafc; }
.mr-info-row { display: flex; flex-direction: column; gap: 0.25rem; }
.mr-info-label { font-size: 0.7rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
.mr-warn-text { font-size: 0.78rem; color: #ef4444; margin: 0.25rem 0 0; }

/* Spin */
.mr-spin { animation: spin 0.8s linear infinite; }

/* Modal transition */
.mr-modal-enter-active, .mr-modal-leave-active { transition: opacity 0.2s, transform 0.2s; }
.mr-modal-enter-from, .mr-modal-leave-to { opacity: 0; transform: scale(0.97) translateY(8px); }
</style>
