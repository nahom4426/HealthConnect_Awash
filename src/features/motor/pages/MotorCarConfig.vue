<script setup>
import { ref, onMounted, watch } from 'vue';
import DataTable from '@/components/DataTable.vue';
import Button from '@/components/Button.vue';
import {
  fetchAllCarSpecs, saveCarSpec, updateCarSpec, deleteCarSpec, fetchCategoryTree,
} from '../api/motorApi.js';

// ── state ─────────────────────────────────────────────────────────────────────
const cars        = ref([]);
const categories  = ref([]);
const loading     = ref(false);
const saving      = ref(false);
const error       = ref('');
const success     = ref('');
const searchQ     = ref('');
const showAdd     = ref(false);

// ── form ──────────────────────────────────────────────────────────────────────
function emptyPriceRow() {
  return { fromMakeYear: '', toMakeYear: '', minMarketValue: '', maxMarketValue: '' };
}

function freshForm() {
  return {
    categoryUuid: '',
    categoryName: '',
    carName:  '',
    carType:  '',
    carModel: '',
    engine:   '',
    priceSpecificationRequests: [emptyPriceRow()],
  };
}

const form       = ref(freshForm());
const formErrors = ref({});

function addPriceRow() {
  form.value.priceSpecificationRequests.push(emptyPriceRow());
}

function removePriceRow(idx) {
  if (form.value.priceSpecificationRequests.length === 1) return;
  form.value.priceSpecificationRequests.splice(idx, 1);
}

function resetForm() {
  form.value = freshForm();
  formErrors.value = {};
}

function formatWithCommas(val) {
  if (!val) return '';
  const num = String(val).replace(/[^0-9]/g, '');
  if (!num) return '';
  return Number(num).toLocaleString('en-US');
}

function onMinMarketValueInput(e, row) {
  const raw = e.target.value.replace(/[^0-9]/g, '');
  row.minMarketValue = raw;
  e.target.value = formatWithCommas(raw);
}

function onMaxMarketValueInput(e, row) {
  const raw = e.target.value.replace(/[^0-9]/g, '');
  row.maxMarketValue = raw;
  e.target.value = formatWithCommas(raw);
}

// ── edit / delete ─────────────────────────────────────────────────────────────
const editTarget   = ref(null);
const editForm     = ref({});
const deleteTarget = ref(null);

function openEdit(car) {
  editTarget.value = car;
  const specs = car.priceSpecificationResponses ?? car.priceSpecificationRequests;
  editForm.value = {
    carName:  car.carName  || '',
    carType:  car.carType  || '',
    carModel: car.carModel || '',
    engine:   car.engine   || '',
    priceSpecificationRequests:
      Array.isArray(specs) && specs.length
        ? specs.map(r => ({
            fromMakeYear:   r.fromMakeYear   || '',
            toMakeYear:     r.toMakeYear     || '',
            minMarketValue: r.minMarketValue ?? '',
            maxMarketValue: r.maxMarketValue ?? '',
          }))
        : [emptyPriceRow()],
  };
}

function addEditPriceRow() {
  editForm.value.priceSpecificationRequests.push(emptyPriceRow());
}

function removeEditPriceRow(idx) {
  if (editForm.value.priceSpecificationRequests.length === 1) return;
  editForm.value.priceSpecificationRequests.splice(idx, 1);
}

// ── load ──────────────────────────────────────────────────────────────────────
async function loadCategories() {
  try {
    const tree = await fetchCategoryTree();
    const flat = [];
    function walk(nodes, depth = 0) {
      for (const node of nodes) {
        flat.push({
          categoryUuid: node.categoryUuid || node.uuid,
          name: node.name,
          indent: '— '.repeat(depth) + node.name,
        });
        if (node.subCategories && node.subCategories.length) {
          walk(node.subCategories, depth + 1);
        }
      }
    }
    walk(tree);
    categories.value = flat;
  } catch (e) {
    console.warn('Failed to load categories', e);
  }
}

function onCategoryChange() {
  const selected = categories.value.find(c => c.categoryUuid === form.value.categoryUuid);
  if (selected) {
    form.value.categoryName = selected.name;
    if (!form.value.carType) {
      form.value.carType = selected.name;
    }
  }
}

async function loadCars() {
  loading.value = true;
  try {
    const data = await fetchAllCarSpecs({ search: searchQ.value });
    cars.value = Array.isArray(data) ? data : [];
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Failed to load car specifications';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadCars();
  loadCategories();
});

let searchTimer = null;
watch(searchQ, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadCars, 350);
});

// ── validation ────────────────────────────────────────────────────────────────
function validateForm(f) {
  const errs = {};
  if (!f.carName?.trim())  errs.carName  = 'Car name is required';
  if (!f.carType?.trim())  errs.carType  = 'Car type is required';
  if (!f.carModel?.trim()) errs.carModel = 'Car model is required';
  return errs;
}

// ── save ──────────────────────────────────────────────────────────────────────
async function submitSave() {
  const errs = validateForm(form.value);
  formErrors.value = errs;
  if (Object.keys(errs).length) return;

  saving.value = true;
  error.value = '';
  success.value = '';
  try {
    await saveCarSpec({
      categoryUuid: form.value.categoryUuid || null,
      categoryName: form.value.categoryName || null,
      carName:  form.value.carName,
      carType:  form.value.carType,
      carModel: form.value.carModel,
      engine:   form.value.engine || null,
      priceSpecificationRequests: form.value.priceSpecificationRequests
        .filter(r => r.fromMakeYear || r.toMakeYear || r.minMarketValue || r.maxMarketValue)
        .map(r => ({
          fromMakeYear:    r.fromMakeYear   || null,
          toMakeYear:      r.toMakeYear     || null,
          minMarketValue:  r.minMarketValue !== '' ? Number(r.minMarketValue) : null,
          maxMarketValue:  r.maxMarketValue !== '' ? Number(r.maxMarketValue) : null,
        })),
    });
    success.value = `Car "${form.value.carName}" registered successfully`;
    resetForm();
    showAdd.value = false;
    await loadCars();
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Save failed';
  } finally {
    saving.value = false;
  }
}

// ── edit submit ───────────────────────────────────────────────────────────────
async function submitEdit() {
  const errs = validateForm(editForm.value);
  if (Object.keys(errs).length) { error.value = Object.values(errs)[0]; return; }
  saving.value = true;
  error.value = '';
  try {
    const id = editTarget.value.carUuid || editTarget.value.uuid || editTarget.value.id;
    await updateCarSpec(id, {
      carName:  editForm.value.carName,
      carType:  editForm.value.carType,
      carModel: editForm.value.carModel,
      engine:   editForm.value.engine || null,
      priceSpecificationRequests: editForm.value.priceSpecificationRequests
        .filter(r => r.fromMakeYear || r.toMakeYear || r.minMarketValue || r.maxMarketValue)
        .map(r => ({
          fromMakeYear:    r.fromMakeYear   || null,
          toMakeYear:      r.toMakeYear     || null,
          minMarketValue:  r.minMarketValue !== '' ? Number(r.minMarketValue) : null,
          maxMarketValue:  r.maxMarketValue !== '' ? Number(r.maxMarketValue) : null,
        })),
    });
    success.value = 'Car specification updated';
    editTarget.value = null;
    await loadCars();
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Update failed';
  } finally {
    saving.value = false;
  }
}

// ── delete ────────────────────────────────────────────────────────────────────
async function doDelete() {
  if (!deleteTarget.value) return;
  saving.value = true;
  error.value = '';
  try {
    await deleteCarSpec(deleteTarget.value.carUuid || deleteTarget.value.uuid || deleteTarget.value.id);
    success.value = 'Car specification deleted';
    deleteTarget.value = null;
    await loadCars();
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || 'Delete failed';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="cc-root">

    <!-- Header -->
    <div class="cc-header">
      <div class="cc-header-left">
        <div class="cc-header-icon">
          <!-- Contextual Vehicle Spec Icon -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:22px;height:22px">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM4 17H3v-4l3-5h10l3 5v4h-1M9 17h6"/>
          </svg>
        </div>
        <div>
          <h1 class="cc-title">Vehicle Catalog & Specifications</h1>
          <p class="cc-subtitle">Manage vehicle makes, models, and market valuation matrices</p>
        </div>
      </div>
      <Button type="primary" size="sm" @click="showAdd = !showAdd" class="cc-btn-cobalt">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;margin-right:4px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        {{ showAdd ? 'Close Form' : 'Register Vehicle Spec' }}
      </Button>
    </div>

    <!-- Alerts -->
    <div v-if="error" class="cc-alert cc-alert-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v4m0 4h.01"/></svg>
      {{ error }}
      <button class="cc-alert-close" @click="error = ''">×</button>
    </div>
    <div v-if="success" class="cc-alert cc-alert-success">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      {{ success }}
      <button class="cc-alert-close" @click="success = ''">×</button>
    </div>

    <!-- Add Form Panel -->
    <Transition name="cc-slide">
      <div v-if="showAdd" class="cc-card cc-form-card">
        <div class="cc-card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;color:#2563eb"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          <span>Register New Vehicle Specification</span>
        </div>
        <div class="cc-card-body">

          <!-- Basic fields -->
          <div class="cc-grid">
            <div class="cc-field">
              <label>Vehicle Category <span class="cc-req">*</span></label>
              <select v-model="form.categoryUuid" class="cc-input" @change="onCategoryChange">
                <option value="">-- Select Category --</option>
                <option v-for="cat in categories" :key="cat.categoryUuid" :value="cat.categoryUuid">
                  {{ cat.indent }}
                </option>
              </select>
            </div>
            <div class="cc-field">
              <label>Car Name <span class="cc-req">*</span></label>
              <input v-model="form.carName" class="cc-input" :class="{ 'cc-input-err': formErrors.carName }" placeholder="e.g. Toyota Corolla 1.6" />
              <span v-if="formErrors.carName" class="cc-field-err">{{ formErrors.carName }}</span>
            </div>
            <div class="cc-field">
              <label>Car Type / Classification <span class="cc-req">*</span></label>
              <input v-model="form.carType" class="cc-input" :class="{ 'cc-input-err': formErrors.carType }" placeholder="e.g. Sedan, SUV, Truck" />
              <span v-if="formErrors.carType" class="cc-field-err">{{ formErrors.carType }}</span>
            </div>
            <div class="cc-field">
              <label>Car Model <span class="cc-req">*</span></label>
              <input v-model="form.carModel" class="cc-input" :class="{ 'cc-input-err': formErrors.carModel }" placeholder="e.g. Corolla" />
              <span v-if="formErrors.carModel" class="cc-field-err">{{ formErrors.carModel }}</span>
            </div>
            <div class="cc-field">
              <label>Engine</label>
              <input v-model="form.engine" class="cc-input" placeholder="e.g. 1.6L 4-cylinder" />
            </div>
          </div>

          <!-- Price Specifications -->
          <div class="cc-section-header">
            <span class="cc-section-label">Valuation Rules & Year Ranges</span>
            <button class="cc-add-row-btn" type="button" @click="addPriceRow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
              Add Year Range
            </button>
          </div>

          <div class="cc-price-table">
            <div class="cc-price-header">
              <span>From Make Year</span>
              <span>To Make Year</span>
              <span>Min Market Value (ETB)</span>
              <span>Max Market Value (ETB)</span>
              <span></span>
            </div>
            <div
              v-for="(row, idx) in form.priceSpecificationRequests"
              :key="idx"
              class="cc-price-row"
            >
              <input v-model="row.fromMakeYear" class="cc-input" placeholder="e.g. 2015" />
              <input v-model="row.toMakeYear"   class="cc-input" placeholder="e.g. 2020" />
              <input :value="formatWithCommas(row.minMarketValue)" @input="e => onMinMarketValueInput(e, row)" class="cc-input" type="text" placeholder="0" />
              <input :value="formatWithCommas(row.maxMarketValue)" @input="e => onMaxMarketValueInput(e, row)" class="cc-input" type="text" placeholder="0" />
              <button
                class="cc-icon-btn cc-btn-del"
                type="button"
                :disabled="form.priceSpecificationRequests.length === 1"
                title="Remove row"
                @click="removePriceRow(idx)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div class="cc-form-actions">
            <Button type="edge-primary" size="sm" @click="resetForm">Reset</Button>
            <Button type="primary" size="sm" :pending="saving" @click="submitSave">
              <svg v-if="!saving" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;margin-right:4px"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
              Register Spec
            </Button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- List Card -->
    <div class="cc-card">
      <div class="cc-card-header cc-card-header-list">
        <div class="cc-card-header-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;color:#2563eb"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
          <span>Catalog Index</span>
          <span v-if="cars.length" class="cc-count">{{ cars.length }}</span>
        </div>
        <div class="cc-search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;color:#94a3b8"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/></svg>
          <input v-model="searchQ" class="cc-search-input" placeholder="Filter vehicles…" />
        </div>
      </div>

      <div v-if="loading" class="cc-empty">
        <svg class="cc-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:22px;height:22px;color:#2563eb"><path stroke-linecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        <span>Loading vehicles…</span>
      </div>

      <div v-else-if="!cars.length" class="cc-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:38px;height:38px;color:#cbd5e1"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM4 17H3v-4l3-5h10l3 5v4h-1M9 17h6"/></svg>
        <span>No vehicle specifications found</span>
        <button class="cc-link" @click="showAdd = true">Register the first car</button>
      </div>

      <DataTable
        v-else
        :headers="['#', 'Vehicle Name', 'Classification', 'Model', 'Engine Spec', 'Valuation Matrix', 'Actions']"
        :hide-index="true"
        class="cc-datatable"
      >
        <tr v-for="(car, i) in cars" :key="car.carUuid || car.uuid || car.id || i" class="cc-row">
          <td class="cc-idx">{{ i + 1 }}</td>
          <td><span class="cc-model">{{ car.carName || '—' }}</span></td>
          <td><span class="cc-type-badge">{{ car.carType || '—' }}</span></td>
          <td>{{ car.carModel || '—' }}</td>
          <td>{{ car.engine || '—' }}</td>
          <td>
            <span v-if="(car.priceSpecificationResponses ?? car.priceSpecificationRequests)?.length" class="cc-spec-count">
              {{ (car.priceSpecificationResponses ?? car.priceSpecificationRequests).length }}
              range{{ (car.priceSpecificationResponses ?? car.priceSpecificationRequests).length > 1 ? 's' : '' }}
            </span>
            <span v-else class="cc-muted">—</span>
          </td>
          <td>
            <div class="cc-actions">
              <button class="cc-icon-btn cc-btn-edit" title="Edit" @click="openEdit(car)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              <button class="cc-icon-btn cc-btn-del" title="Delete" @click="deleteTarget = car">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </td>
        </tr>
      </DataTable>
    </div>

    <!-- ── Edit Modal ── -->
    <Teleport to="body">
      <Transition name="cc-modal">
        <div v-if="editTarget" class="cc-overlay" @click.self="editTarget = null">
          <div class="cc-modal cc-modal-lg">
            <div class="cc-modal-header">
              <h3>Edit Vehicle Specification</h3>
              <button class="cc-modal-close" @click="editTarget = null">×</button>
            </div>
            <div class="cc-modal-body">
              <div class="cc-grid cc-grid-modal">
                <div class="cc-field">
                  <label>Car Name <span class="cc-req">*</span></label>
                  <input v-model="editForm.carName" class="cc-input" placeholder="e.g. Toyota Corolla 1.6" />
                </div>
                <div class="cc-field">
                  <label>Car Type <span class="cc-req">*</span></label>
                  <input v-model="editForm.carType" class="cc-input" placeholder="e.g. Sedan" />
                </div>
                <div class="cc-field">
                  <label>Car Model <span class="cc-req">*</span></label>
                  <input v-model="editForm.carModel" class="cc-input" placeholder="e.g. Corolla" />
                </div>
                <div class="cc-field">
                  <label>Engine</label>
                  <input v-model="editForm.engine" class="cc-input" placeholder="e.g. 1.6L 4-cylinder" />
                </div>
              </div>

              <div class="cc-section-header" style="margin-top:1rem">
                <span class="cc-section-label">Valuation Ranges</span>
                <button class="cc-add-row-btn" type="button" @click="addEditPriceRow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                  Add Row
                </button>
              </div>
              <div class="cc-price-table">
                <div class="cc-price-header">
                  <span>From Make Year</span>
                  <span>To Make Year</span>
                  <span>Min Market Value</span>
                  <span>Max Market Value</span>
                  <span></span>
                </div>
                <div
                  v-for="(row, idx) in editForm.priceSpecificationRequests"
                  :key="idx"
                  class="cc-price-row"
                >
                  <input v-model="row.fromMakeYear" class="cc-input" placeholder="e.g. 2015" />
                  <input v-model="row.toMakeYear"   class="cc-input" placeholder="e.g. 2020" />
                  <input :value="formatWithCommas(row.minMarketValue)" @input="e => onMinMarketValueInput(e, row)" class="cc-input" type="text" placeholder="0" />
                  <input :value="formatWithCommas(row.maxMarketValue)" @input="e => onMaxMarketValueInput(e, row)" class="cc-input" type="text" placeholder="0" />
                  <button
                    class="cc-icon-btn cc-btn-del"
                    type="button"
                    :disabled="editForm.priceSpecificationRequests.length === 1"
                    title="Remove row"
                    @click="removeEditPriceRow(idx)"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="cc-modal-footer">
              <Button type="edge-primary" size="sm" @click="editTarget = null">Cancel</Button>
              <Button type="primary" size="sm" :pending="saving" @click="submitEdit">Save Changes</Button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Delete Confirm Modal ── -->
    <Teleport to="body">
      <Transition name="cc-modal">
        <div v-if="deleteTarget" class="cc-overlay" @click.self="deleteTarget = null">
          <div class="cc-modal cc-modal-sm">
            <div class="cc-modal-header cc-modal-header-danger">
              <h3>Delete Vehicle Specification</h3>
              <button class="cc-modal-close" @click="deleteTarget = null">×</button>
            </div>
            <div class="cc-modal-body">
              <p>Delete <strong>{{ deleteTarget.carName || deleteTarget.carType }} {{ deleteTarget.carModel }}</strong>?</p>
              <p class="cc-warn-text">This action cannot be undone.</p>
            </div>
            <div class="cc-modal-footer">
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
.cc-root { padding: 1.75rem 2rem; min-height: 100%; background: #f8fafc; }

/* Header - Contextual Cobalt Blue Theme */
.cc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem; }
.cc-header-left { display: flex; align-items: center; gap: 0.85rem; }
.cc-header-icon { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25); }
.cc-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.01em; }
.cc-subtitle { font-size: 0.78rem; color: #64748b; margin: 0; }

/* Alerts */
.cc-alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1rem; border-radius: 0.6rem; font-size: 0.78rem; font-weight: 500; margin-bottom: 1rem; }
.cc-alert-error   { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.cc-alert-success { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.cc-alert-close { margin-left: auto; background: none; border: none; cursor: pointer; color: inherit; font-size: 1.1rem; line-height: 1; opacity: 0.7; }
.cc-alert-close:hover { opacity: 1; }

/* Card */
.cc-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 0.85rem; margin-bottom: 1.25rem; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.03); }
.cc-card-header { display: flex; align-items: center; gap: 0.55rem; padding: 0.85rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 0.85rem; font-weight: 700; color: #1e293b; }
.cc-card-header-list { justify-content: space-between; }
.cc-card-header-left { display: flex; align-items: center; gap: 0.5rem; }
.cc-count { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 9999px; font-size: 0.68rem; font-weight: 800; padding: 0.12rem 0.5rem; }
.cc-card-body { padding: 1.25rem; }

/* Search */
.cc-search-box { display: flex; align-items: center; gap: 0.4rem; background: #fff; border: 1px solid #cbd5e1; border-radius: 0.6rem; padding: 0.35rem 0.75rem; }
.cc-search-box:focus-within { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
.cc-search-input { border: none; background: transparent; outline: none; font-size: 0.78rem; color: #0f172a; width: 170px; }

/* Section header */
.cc-section-header { display: flex; align-items: center; justify-content: space-between; margin: 1.25rem 0 0.6rem; }
.cc-section-label { font-size: 0.72rem; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; }
.cc-add-row-btn { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.7rem; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 0.5rem; font-size: 0.72rem; font-weight: 700; cursor: pointer; transition: background 0.15s; }
.cc-add-row-btn:hover { background: #dbeafe; }

/* Price spec table */
.cc-price-table { border: 1px solid #e2e8f0; border-radius: 0.6rem; overflow: hidden; }
.cc-price-header { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 36px; gap: 0; background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; }
.cc-price-header span { font-size: 0.68rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
.cc-price-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 36px; gap: 0.5rem; align-items: center; padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9; }
.cc-price-row:last-child { border-bottom: none; }

/* Fields */
.cc-field { display: flex; flex-direction: column; gap: 0.3rem; }
.cc-field label { font-size: 0.72rem; font-weight: 700; color: #374151; white-space: nowrap; }
.cc-req { color: #ef4444; }
.cc-field-err { font-size: 0.68rem; color: #ef4444; }
.cc-input { padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.6rem; font-size: 0.82rem; color: #0f172a; background: #fff; outline: none; transition: border-color 0.15s, box-shadow 0.15s; width: 100%; box-sizing: border-box; }
.cc-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
.cc-input-err { border-color: #ef4444 !important; }

/* Grid */
.cc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.85rem; }
.cc-grid-modal { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }

/* Form actions */
.cc-form-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; }

/* Table */
.cc-datatable :deep(th) { background: #f1f5f9; color: #0f172a; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 0.85rem 1rem; border-bottom: 2px solid #e2e8f0; }
.cc-datatable :deep(.overflow-x-auto) { border: none; border-radius: 0; box-shadow: none; }
.cc-row { border-bottom: 1px solid #f1f5f9; transition: background 0.15s; }
.cc-row:hover { background: #eff6ff; }
.cc-row td { padding: 0.8rem 1rem; color: #334155; vertical-align: middle; font-size: 0.82rem; }
.cc-idx { color: #94a3b8; font-size: 0.75rem; font-weight: 700; width: 36px; }
.cc-type-badge { display: inline-block; padding: 0.2rem 0.65rem; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 9999px; font-size: 0.72rem; font-weight: 800; }
.cc-model { font-weight: 700; color: #0f172a; }
.cc-spec-count { display: inline-block; padding: 0.15rem 0.55rem; background: #f0fdf4; color: #15803d; border-radius: 9999px; font-size: 0.68rem; font-weight: 700; border: 1px solid #bbf7d0; }
.cc-muted { color: #94a3b8; }

/* Actions */
.cc-actions { display: flex; align-items: center; justify-content: flex-start; gap: 0.35rem; }
.cc-icon-btn { width: 30px; height: 30px; border-radius: 7px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.cc-icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.cc-btn-edit { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.cc-btn-edit:hover { background: #2563eb; color: #fff; }
.cc-btn-del { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.cc-btn-del:not(:disabled):hover { background: #dc2626; color: #fff; }

/* Empty */
.cc-empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 3.5rem; color: #94a3b8; font-size: 0.85rem; text-align: center; }
.cc-link { color: #2563eb; background: none; border: none; cursor: pointer; font-size: 0.82rem; text-decoration: underline; font-weight: 700; }

/* Modal */
.cc-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); display: flex; align-items: center; justify-content: center; z-index: 999; padding: 1rem; overflow-y: auto; }
.cc-modal { background: #fff; border-radius: 0.875rem; box-shadow: 0 20px 60px rgba(0,0,0,0.22); width: 100%; max-width: 640px; overflow: hidden; margin: auto; }
.cc-modal-lg { max-width: 820px; }
.cc-modal-sm { max-width: 400px; }
.cc-modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; }
.cc-modal-header h3 { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0; }
.cc-modal-header-danger { background: #fef2f2; border-color: #fecaca; }
.cc-modal-header-danger h3 { color: #b91c1c; }
.cc-modal-close { background: none; border: none; cursor: pointer; font-size: 1.25rem; color: #64748b; line-height: 1; padding: 0 0.25rem; }
.cc-modal-body { padding: 1.25rem; max-height: 70vh; overflow-y: auto; }
.cc-modal-body p { font-size: 0.85rem; color: #374151; margin: 0 0 0.35rem; }
.cc-warn-text { color: #dc2626 !important; font-size: 0.78rem !important; }
.cc-modal-footer { display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; padding: 0.875rem 1.25rem; border-top: 1px solid #f1f5f9; background: #f8fafc; }

/* Form card */
.cc-form-card { border-color: #bfdbfe; }

/* Animations */
.cc-slide-enter-active, .cc-slide-leave-active { transition: all 0.25s ease; }
.cc-slide-enter-from, .cc-slide-leave-to { opacity: 0; transform: translateY(-8px); }
.cc-modal-enter-active, .cc-modal-leave-active { transition: opacity 0.2s ease; }
.cc-modal-enter-from, .cc-modal-leave-to { opacity: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
.cc-spin { animation: spin 0.9s linear infinite; }
</style>
