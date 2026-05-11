<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Input  from '@/components/new_form_elements/Input.vue';
import Select from '@/components/new_form_elements/Select.vue';
import Button from '@/components/Button.vue';
import { registerClientsCar, fetchCategoryTree, fetchAllCarSpecs, searchInsureds, createInsured } from '../api/motorApi.js';

const router = useRouter();

// ── Insured search & select ───────────────────────────────────────────────────
const insuredResults  = ref([]);
const insuredsLoading = ref(false);
const selectedInsured = ref(null);
const insuredQuery    = ref('');
const insuredOpen     = ref(false);
let   _searchTimer    = null;

async function runInsuredSearch(q) {
  insuredsLoading.value = true;
  try {
    insuredResults.value = await searchInsureds({ search: q, limit: 25 });
  } catch (_) { insuredResults.value = []; }
  finally { insuredsLoading.value = false; }
}

function onInsuredQueryInput(e) {
  insuredQuery.value = e.target.value;
  insuredOpen.value  = true;
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => runInsuredSearch(insuredQuery.value), 350);
}

function onInsuredFocus() {
  insuredOpen.value = true;
  if (!insuredResults.value.length) runInsuredSearch(insuredQuery.value);
}

function onInsuredBlur() {
  setTimeout(() => { insuredOpen.value = false; }, 180);
}

function pickInsured(insured) {
  selectedInsured.value    = insured;
  insuredQuery.value       = `${insured.firstName} ${insured.fatherName}`;
  insuredOpen.value        = false;
  client.value.insuredUuid = insured.insuredUuid;
  client.value.firstName   = insured.firstName  || '';
  client.value.fatherName  = insured.fatherName || '';
  client.value.mobilePhone = insured.phone      || '';
  client.value.email       = insured.email      || '';
  clientErrors.value       = {};
}

function clearInsuredSelection() {
  selectedInsured.value    = null;
  insuredQuery.value       = '';
  insuredResults.value     = [];
  client.value.insuredUuid = '';
  client.value.firstName   = '';
  client.value.fatherName  = '';
  client.value.mobilePhone = '';
  client.value.email       = '';
}

// ── Add New Insured modal ─────────────────────────────────────────────────────
const showAddModal  = ref(false);
const modalSaving   = ref(false);
const modalError    = ref('');
const newInsured    = ref(emptyNewInsured());
const newInsuredErr = ref({});

function emptyNewInsured() {
  return { firstName: '', fatherName: '', grandFatherName: '', gender: '', email: '', phone: '', birthDate: '', address1: '' };
}

function openAddModal() {
  newInsured.value    = emptyNewInsured();
  newInsuredErr.value = {};
  modalError.value    = '';
  showAddModal.value  = true;
}

function closeAddModal() { showAddModal.value = false; }

function validateNewInsured() {
  const e = {};
  if (!newInsured.value.firstName?.trim())  e.firstName  = 'Required';
  if (!newInsured.value.fatherName?.trim()) e.fatherName = 'Required';
  return e;
}

async function submitNewInsured() {
  const e = validateNewInsured();
  newInsuredErr.value = e;
  if (Object.keys(e).length) return;
  modalSaving.value = true;
  modalError.value  = '';
  try {
    const created = await createInsured(newInsured.value);
    // push to local list and auto-select
    allInsureds.value = [created, ...allInsureds.value];
    onInsuredSelect(created.insuredUuid);
    closeAddModal();
  } catch (err) {
    modalError.value = err?.response?.data?.message || err.message || 'Failed to create insured';
  } finally {
    modalSaving.value = false;
  }
}

// ── Client (filled from selected insured) ─────────────────────────────────────
const client = ref({
  insuredUuid: '', firstName: '', fatherName: '',
  mobilePhone: '', email: '', bankAccount: '', institutionUuid: '',
});
const clientErrors = ref({});

function validateClient() {
  const e = {};
  if (!client.value.insuredUuid) e.insuredUuid = 'Select or create a client';
  return e;
}

// ── Motor cars (from API) ─────────────────────────────────────────────────────
const allCars     = ref([]);
const carsLoading = ref(false);
const carOptions  = computed(() =>
  allCars.value.map(c => ({ value: c.carUuid, label: `${c.carName} — ${c.carModel} (${c.carType})` }))
);

async function loadCars() {
  carsLoading.value = true;
  try {
    const raw = await fetchAllCarSpecs({ limit: 200 });
    // API returns paginated wrapper { content: [...] } or a plain array
    allCars.value = Array.isArray(raw) ? raw : (raw?.content ?? []);
  } catch (_) { allCars.value = []; }
  finally { carsLoading.value = false; }
}

// ── Selected car price specifications ────────────────────────────────────────
const selectedCarSpecs = ref([]);   // priceSpecificationResponses of chosen car
const selectedSpecUuid = ref('');   // which spec row user picked

const activeSpec = computed(() =>
  selectedCarSpecs.value.find(s => s.priceSpecificationUUid === selectedSpecUuid.value) ?? null
);

function fmtNum(n) {
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

// ── Category tree ─────────────────────────────────────────────────────────────
const catTree    = ref([]);
const catLoading = ref(false);

async function loadCatTree() {
  catLoading.value = true;
  try {
    const data = await fetchCategoryTree();
    catTree.value = Array.isArray(data) ? data : (data?.content ?? []);
  } catch (_) { catTree.value = []; }
  finally { catLoading.value = false; }
}

onMounted(() => { loadCars(); loadCatTree(); });

// ── Vehicle form (current being edited) ──────────────────────────────────────
function emptyDraft() {
  return {
    carUuid: '', carName: '', carModel: '', carType: '', engine: '',
    plateNumber: '', makeYear: '', buyingPrice: '',
    categoryUuid: '',
    catSelections: [''],
    catLevels: [],
    _specUuid: '',
  };
}

const draft       = ref(emptyDraft());
const draftErrors = ref({});
const editIdx     = ref(null); // null = adding new

// When catTree loads, seed the draft levels
function seedDraftCat(d) {
  d.catSelections = [''];
  d.catLevels     = catTree.value.length ? [catTree.value] : [];
  d.categoryUuid  = '';
}

// When a car is selected from the dropdown
function onCarSelect(val) {
  draft.value.carUuid = val;
  const found = allCars.value.find(c => c.carUuid === val);
  if (found) {
    draft.value.carName      = found.carName  || '';
    draft.value.carModel     = found.carModel || '';
    draft.value.carType      = found.carType  || '';
    draft.value.engine       = found.engine   || '';
    selectedCarSpecs.value   = found.priceSpecificationResponses || [];
  } else {
    selectedCarSpecs.value = [];
  }
  draft.value.makeYear     = '';
  draft.value.buyingPrice  = '';
  draft.value._specUuid    = '';
  draftErrors.value        = {};
  // Auto-select the first spec card
  if (selectedCarSpecs.value.length) {
    const first = selectedCarSpecs.value[0];
    selectedSpecUuid.value   = first.priceSpecificationUUid;
    draft.value._specUuid    = first.priceSpecificationUUid;
    draft.value.makeYear     = first.fromMakeYear || '';
  } else {
    selectedSpecUuid.value = '';
  }
}

// When a price-spec card is clicked → auto-set make year range, clear buyingPrice
function onSpecSelect(uuid) {
  selectedSpecUuid.value   = uuid;
  draft.value._specUuid    = uuid;
  const spec = selectedCarSpecs.value.find(s => s.priceSpecificationUUid === uuid);
  if (spec) {
    draft.value.makeYear    = spec.fromMakeYear || '';
    draft.value.buyingPrice = '';
  }
  draftErrors.value = { ...draftErrors.value, priceSpec: '', makeYear: '', buyingPrice: '' };
}

function onCatSelect(depth, uuid) {
  const d = draft.value;
  d.catSelections = [...d.catSelections.slice(0, depth), uuid];
  d.catLevels     = d.catLevels.slice(0, depth + 1);
  if (!uuid) { d.categoryUuid = ''; return; }
  const node = d.catLevels[depth]?.find(n => n.categoryUuid === uuid);
  if (node?.subCategories?.length) {
    d.catLevels     = [...d.catLevels, node.subCategories];
    d.catSelections = [...d.catSelections, ''];
    d.categoryUuid  = '';
  } else {
    d.categoryUuid = uuid;
  }
}

function catLevelLabel(depth) {
  if (depth === 0) return 'Vehicle Category';
  if (depth === 1) return 'Sub-category';
  return `Level ${depth + 1}`;
}

// ── Cart (added vehicles) ─────────────────────────────────────────────────────
const cart = ref([]);

function validateDraft() {
  const e = {};
  if (!draft.value.carUuid)             e.carSelect   = 'Select a car from the registry';
  if (!activeSpec.value)                e.priceSpec   = 'Select a price specification';
  if (!draft.value.plateNumber?.trim()) e.plateNumber = 'Required';
  const my = draft.value.makeYear;
  if (!my?.toString().trim()) {
    e.makeYear = 'Required';
  } else if (activeSpec.value) {
    const myNum   = Number(my);
    const fromNum = Number(activeSpec.value.fromMakeYear);
    const toNum   = Number(activeSpec.value.toMakeYear);
    const lo = Math.min(fromNum, toNum);
    const hi = Math.max(fromNum, toNum);
    if (isNaN(myNum) || myNum < lo || myNum > hi) {
      e.makeYear = `Must be between ${lo} and ${hi}`;
    }
  }
  const bp = draft.value.buyingPrice;
  if (bp === '' || bp === null || bp === undefined) {
    e.buyingPrice = 'Required';
  } else if (activeSpec.value) {
    const val = Number(bp);
    const min = activeSpec.value.minMarketValue;
    const max = activeSpec.value.maxMarketValue;
    if (isNaN(val) || val < min || val > max) {
      e.buyingPrice = `Must be between ETB ${fmtNum(min)} and ETB ${fmtNum(max)}`;
    }
  }
  if (!draft.value.categoryUuid) e.categoryUuid = 'Select a leaf category';
  return e;
}

function addToCart() {
  const e = validateDraft();
  draftErrors.value = e;
  if (Object.keys(e).length) return;
  const entry = { ...draft.value };
  if (editIdx.value !== null) {
    cart.value[editIdx.value] = entry;
    editIdx.value = null;
  } else {
    cart.value.push(entry);
  }
  draft.value           = emptyDraft();
  seedDraftCat(draft.value);
  selectedCarSpecs.value = [];
  selectedSpecUuid.value = '';
  draftErrors.value      = {};
}

function editCartItem(idx) {
  editIdx.value = idx;
  const item    = cart.value[idx];
  draft.value   = { ...item };
  const found   = allCars.value.find(c => c.carUuid === item.carUuid);
  selectedCarSpecs.value = found?.priceSpecificationResponses || [];
  selectedSpecUuid.value = item._specUuid || '';
  draftErrors.value = {};
}

function removeCartItem(idx) {
  cart.value.splice(idx, 1);
  if (editIdx.value === idx) {
    editIdx.value = null;
    draft.value   = emptyDraft();
    seedDraftCat(draft.value);
    selectedCarSpecs.value = [];
    selectedSpecUuid.value = '';
  }
}

function cancelEdit() {
  editIdx.value          = null;
  draft.value            = emptyDraft();
  seedDraftCat(draft.value);
  selectedCarSpecs.value = [];
  selectedSpecUuid.value = '';
  draftErrors.value      = {};
}

// seed when catTree is ready
onMounted(() => {
  const timer = setInterval(() => {
    if (catTree.value.length) { seedDraftCat(draft.value); clearInterval(timer); }
  }, 150);
});

// ── Final submit ──────────────────────────────────────────────────────────────
const saving      = ref(false);
const pageError   = ref('');
const pageSuccess = ref('');

async function submit() {
  const ce = validateClient();
  clientErrors.value = ce;
  if (Object.keys(ce).length) return;
  if (!cart.value.length) { pageError.value = 'Add at least one vehicle to the cart.'; return; }

  saving.value    = true;
  pageError.value = '';
  try {
    const payload = {
      insuredUuid:     client.value.insuredUuid     || undefined,
      firstName:       client.value.firstName,
      fatherName:      client.value.fatherName,
      mobilePhone:     client.value.mobilePhone,
      email:           client.value.email           || undefined,
      bankAccount:     client.value.bankAccount     || undefined,
      institutionUuid: client.value.institutionUuid || undefined,
      carRequests: cart.value.map(v => ({
        rateRequest: { categoryUuid: v.categoryUuid },
        carName:     v.carName,
        carModel:    v.carModel,
        carType:     v.carType,
        plateNumber: v.plateNumber,
        makeYear:    v.makeYear,
        buyingPrice: v.buyingPrice !== '' ? Number(v.buyingPrice) : 0,
      })),
    };
    await registerClientsCar(payload);
    pageSuccess.value = 'Quotation saved successfully!';
    setTimeout(() => router.push('/motor/quotation'), 1400);
  } catch (err) {
    pageError.value = err?.response?.data?.message || err.message || 'Failed to save quotation';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="nq-root">

    <!-- Top bar -->
    <div class="nq-topbar">
      <button class="nq-back" @click="router.push('/motor/quotation')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        Back to Quotations
      </button>
      <div class="nq-breadcrumb">
        <span class="nq-bc-dim">Quotations</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px;height:10px;color:#94a3b8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        <span class="nq-bc-cur">New Quotation</span>
      </div>
    </div>

    <!-- Page header -->
    <div class="nq-page-header">
      <div style="display:flex;align-items:center;gap:1rem">
        <div class="nq-header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:22px;height:22px"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        </div>
        <div>
          <h1 class="nq-page-title">New Quotation</h1>
          <p class="nq-page-sub">Fill client info, configure each vehicle, add to cart, then save</p>
        </div>
      </div>
      <div class="nq-cart-badge" v-if="cart.length">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        {{ cart.length }} vehicle{{ cart.length > 1 ? 's' : '' }} in cart
      </div>
    </div>

    <!-- Alerts -->
    <div v-if="pageError" class="nq-alert nq-alert-err">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v4m0 4h.01"/></svg>
      {{ pageError }}
      <button class="nq-alert-close" @click="pageError = ''">×</button>
    </div>
    <div v-if="pageSuccess" class="nq-alert nq-alert-ok">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
      {{ pageSuccess }}
    </div>

    <!-- Main layout -->
    <div class="nq-layout">

      <!-- ── LEFT: Client Info ── -->
      <div class="nq-left">
        <div class="nq-card">
          <div class="nq-card-head nq-head-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            Client Information
          </div>
          <div class="nq-card-body">

            <!-- Insured search/select -->
            <div class="nq-field">
              <label class="nq-label">Select Client <span class="nq-req">*</span></label>
              <div class="nq-insured-row">
                <div class="nq-combobox" style="flex:1;min-width:0">
                  <div class="nq-combobox-wrap" :class="{ 'nq-combobox-err': clientErrors.insuredUuid, 'nq-combobox-active': insuredOpen }">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="nq-combobox-icon"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35"/></svg>
                    <input
                      class="nq-combobox-input"
                      type="text"
                      :value="insuredQuery"
                      :placeholder="insuredsLoading ? 'Searching…' : 'Type to search client…'"
                      autocomplete="off"
                      @input="onInsuredQueryInput"
                      @focus="onInsuredFocus"
                      @blur="onInsuredBlur"
                    />
                    <button v-if="selectedInsured" type="button" class="nq-combobox-clear" @click="clearInsuredSelection" title="Clear">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:11px;height:11px"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                    <svg v-if="insuredsLoading" class="nq-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;color:#94a3b8;flex-shrink:0"><path stroke-linecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  </div>
                  <!-- Dropdown results -->
                  <div v-if="insuredOpen" class="nq-combobox-dropdown">
                    <div v-if="insuredsLoading" class="nq-combobox-state">
                      <svg class="nq-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path stroke-linecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                      Searching…
                    </div>
                    <div v-else-if="!insuredResults.length" class="nq-combobox-state">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      No clients found{{ insuredQuery ? ' for "' + insuredQuery + '"' : '' }}
                    </div>
                    <button
                      v-for="ins in insuredResults"
                      :key="ins.insuredUuid"
                      type="button"
                      class="nq-combobox-item"
                      :class="{ 'nq-combobox-item-active': selectedInsured?.insuredUuid === ins.insuredUuid }"
                      @mousedown.prevent="pickInsured(ins)"
                    >
                      <div class="nq-cbi-main">{{ ins.firstName }} {{ ins.fatherName }}</div>
                      <div class="nq-cbi-sub">
                        <span v-if="ins.insuranceId">{{ ins.insuranceId }}</span>
                        <span v-if="ins.phone">{{ ins.phone }}</span>
                        <span v-if="ins.email">{{ ins.email }}</span>
                      </div>
                    </button>
                  </div>
                </div>
                <button type="button" class="nq-add-insured-btn" @click="openAddModal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                  New Client
                </button>
              </div>
              <span v-if="clientErrors.insuredUuid" class="nq-err-msg">{{ clientErrors.insuredUuid }}</span>
            </div>

            <!-- Selected insured info chips -->
            <div v-if="selectedInsured" class="nq-insured-chips">
              <div class="nq-ichip">
                <span class="nq-ichip-lbl">Name</span>
                <span class="nq-ichip-val">{{ selectedInsured.firstName }} {{ selectedInsured.fatherName }}</span>
              </div>
              <div v-if="selectedInsured.insuranceId" class="nq-ichip">
                <span class="nq-ichip-lbl">Insurance ID</span>
                <span class="nq-ichip-val">{{ selectedInsured.insuranceId }}</span>
              </div>
              <div v-if="selectedInsured.phone" class="nq-ichip">
                <span class="nq-ichip-lbl">Phone</span>
                <span class="nq-ichip-val">{{ selectedInsured.phone }}</span>
              </div>
              <div v-if="selectedInsured.email" class="nq-ichip">
                <span class="nq-ichip-lbl">Email</span>
                <span class="nq-ichip-val">{{ selectedInsured.email }}</span>
              </div>
              <div v-if="selectedInsured.gender" class="nq-ichip">
                <span class="nq-ichip-lbl">Gender</span>
                <span class="nq-ichip-val">{{ selectedInsured.gender }}</span>
              </div>
              <div class="nq-ichip">
                <span class="nq-ichip-lbl">Type</span>
                <span class="nq-ichip-val nq-ichip-badge">{{ selectedInsured.type }}</span>
              </div>
            </div>

          </div>
        </div>

        <!-- Cart summary -->
        <div class="nq-cart-summary">
          <div class="nq-cart-summary-head">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;color:#6366f1"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            Vehicle Cart
            <span class="nq-cart-count">{{ cart.length }}</span>
          </div>

          <div v-if="!cart.length" class="nq-cart-empty">
            No vehicles added yet
          </div>

          <div v-else class="nq-cart-list">
            <div
              v-for="(item, idx) in cart"
              :key="idx"
              class="nq-cart-item"
              :class="{ 'nq-cart-item-editing': editIdx === idx }"
            >
              <div class="nq-cart-item-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM4 17H3v-4l3-5h10l3 5v4h-1M9 17h6"/></svg>
              </div>
              <div class="nq-cart-item-info">
                <div class="nq-cart-item-name">{{ item.carName }} — {{ item.carModel }}</div>
                <div class="nq-cart-item-sub">{{ item.plateNumber }} · {{ item.makeYear }} · {{ item.carType }}</div>
              </div>
              <div class="nq-cart-item-actions">
                <button class="nq-cart-edit" @click="editCartItem(idx)" title="Edit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button class="nq-cart-del" @click="removeCartItem(idx)" title="Remove">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Submit -->
        <div class="nq-submit-row">
          <Button type="secondary" size="sm" @click="router.push('/motor/quotation')" :disabled="saving">Cancel</Button>
          <Button type="primary" size="sm" @click="submit" :pending="saving">
            <svg v-if="!saving" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:13px;height:13px;margin-right:4px"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            Save Quotation
          </Button>
        </div>
      </div>

      <!-- ── RIGHT: Vehicle form ── -->
      <div class="nq-right">
        <div class="nq-card">
          <div class="nq-card-head nq-head-indigo">
            <div style="display:flex;align-items:center;gap:0.5rem;flex:1">
              <div class="nq-veh-num">{{ editIdx !== null ? editIdx + 1 : cart.length + 1 }}</div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM4 17H3v-4l3-5h10l3 5v4h-1M9 17h6"/></svg>
              {{ editIdx !== null ? 'Edit Vehicle' : 'Add Vehicle' }}
              <span v-if="draft.carName" class="nq-veh-name-tag">{{ draft.carName }}</span>
            </div>
            <button v-if="editIdx !== null" class="nq-remove-veh" @click="cancelEdit">Cancel Edit</button>
          </div>

          <div class="nq-card-body">

            <!-- ① Car Registry -->
            <div class="nq-step-block">
              <div class="nq-step-num">1</div>
              <div class="nq-step-inner">
                <div class="nq-step-title">Select Car from Registry <span class="nq-req">*</span></div>
                <Select
                  name="carSelect"
                  :obj="true"
                  :options="carOptions"
                  :pending="carsLoading"
                  :modelValue="draft.carUuid"
                  @update:modelValue="onCarSelect"
                  :attributes="{ placeholder: carsLoading ? 'Loading cars…' : 'Search and choose a registered car' }"
                />
                <span v-if="draftErrors.carSelect" class="nq-err-msg">{{ draftErrors.carSelect }}</span>

                <!-- Read-only info chips shown after car is chosen -->
                <div v-if="draft.carUuid" class="nq-car-chips">
                  <div class="nq-chip">
                    <span class="nq-chip-lbl">Name</span>
                    <span class="nq-chip-val">{{ draft.carName }}</span>
                  </div>
                  <div class="nq-chip">
                    <span class="nq-chip-lbl">Model</span>
                    <span class="nq-chip-val">{{ draft.carModel }}</span>
                  </div>
                  <div class="nq-chip">
                    <span class="nq-chip-lbl">Type</span>
                    <span class="nq-chip-val">{{ draft.carType }}</span>
                  </div>
                  <div class="nq-chip">
                    <span class="nq-chip-lbl">Engine</span>
                    <span class="nq-chip-val">{{ draft.engine || '—' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ② Price Specification (visible after car selected) -->
            <div v-if="draft.carUuid" class="nq-step-block">
              <div class="nq-step-num nq-step-num-amber">2</div>
              <div class="nq-step-inner">
                <div class="nq-step-title">Price Specification <span class="nq-req">*</span> <span class="nq-hint">— click to select make year &amp; price range</span></div>
                <div v-if="!selectedCarSpecs.length" class="nq-no-specs">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  No price specifications available for this car
                </div>
                <div v-else class="nq-spec-grid">
                  <button
                    v-for="spec in selectedCarSpecs"
                    :key="spec.priceSpecificationUUid"
                    type="button"
                    class="nq-spec-card"
                    :class="{ 'nq-spec-active': selectedSpecUuid === spec.priceSpecificationUUid }"
                    @click="onSpecSelect(spec.priceSpecificationUUid)"
                  >
                    <div class="nq-spec-top">
                      <div class="nq-spec-years">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px"><rect x="3" y="4" width="18" height="18" rx="2"/><path stroke-linecap="round" d="M16 2v4M8 2v4M3 10h18"/></svg>
                        {{ spec.fromMakeYear }} – {{ spec.toMakeYear }}
                      </div>
                      <div v-if="selectedSpecUuid === spec.priceSpecificationUUid" class="nq-spec-checkmark">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width:9px;height:9px"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </div>
                    </div>
                    <div class="nq-spec-prices">
                      <span class="nq-spec-min">ETB {{ fmtNum(spec.minMarketValue) }}</span>
                      <span class="nq-spec-arrow">→</span>
                      <span class="nq-spec-max">ETB {{ fmtNum(spec.maxMarketValue) }}</span>
                    </div>
                  </button>
                </div>
                <span v-if="draftErrors.priceSpec" class="nq-err-msg">{{ draftErrors.priceSpec }}</span>
              </div>
            </div>

            <!-- ③ Plate + Make Year (editable, range enforced) + Buying Price (range enforced) -->
            <div v-if="draft.carUuid" class="nq-step-block">
              <div class="nq-step-num nq-step-num-green">3</div>
              <div class="nq-step-inner">
                <div class="nq-step-title">Vehicle Details</div>
                <div class="nq-grid-3">
                  <div class="nq-field">
                    <label class="nq-label">Plate Number <span class="nq-req">*</span></label>
                    <Input v-model="draft.plateNumber" name="draftPlate" :attributes="{ placeholder: 'e.g. AA-12345' }" />
                    <span v-if="draftErrors.plateNumber" class="nq-err-msg">{{ draftErrors.plateNumber }}</span>
                  </div>
                  <div class="nq-field">
                    <label class="nq-label">
                      Make Year <span class="nq-req">*</span>
                      <span v-if="activeSpec" class="nq-price-range-badge">
                        {{ activeSpec.fromMakeYear }} – {{ activeSpec.toMakeYear }}
                      </span>
                    </label>
                    <div class="nq-price-wrap" :class="{ 'nq-price-wrap-err': draftErrors.makeYear, 'nq-price-wrap-disabled': !activeSpec }">
                      <span class="nq-price-pfx">YR</span>
                      <input
                        v-model="draft.makeYear"
                        type="number"
                        class="nq-price-input"
                        :placeholder="activeSpec ? `${activeSpec.fromMakeYear} – ${activeSpec.toMakeYear}` : 'Select spec first'"
                        :min="activeSpec ? Math.min(Number(activeSpec.fromMakeYear), Number(activeSpec.toMakeYear)) : undefined"
                        :max="activeSpec ? Math.max(Number(activeSpec.fromMakeYear), Number(activeSpec.toMakeYear)) : undefined"
                        :disabled="!activeSpec"
                      />
                    </div>
                    <span v-if="draftErrors.makeYear" class="nq-err-msg">{{ draftErrors.makeYear }}</span>
                  </div>
                  <div class="nq-field">
                    <label class="nq-label">
                      Buying Price <span class="nq-req">*</span>
                      <span v-if="activeSpec" class="nq-price-range-badge">
                        {{ fmtNum(activeSpec.minMarketValue) }} – {{ fmtNum(activeSpec.maxMarketValue) }} ETB
                      </span>
                    </label>
                    <div class="nq-price-wrap" :class="{ 'nq-price-wrap-err': draftErrors.buyingPrice, 'nq-price-wrap-disabled': !activeSpec }">
                      <span class="nq-price-pfx">ETB</span>
                      <input
                        v-model="draft.buyingPrice"
                        type="number"
                        class="nq-price-input"
                        :placeholder="activeSpec ? `${fmtNum(activeSpec.minMarketValue)} – ${fmtNum(activeSpec.maxMarketValue)}` : 'Select spec first'"
                        :min="activeSpec?.minMarketValue"
                        :max="activeSpec?.maxMarketValue"
                        :disabled="!activeSpec"
                      />
                    </div>
                    <span v-if="draftErrors.buyingPrice" class="nq-err-msg">{{ draftErrors.buyingPrice }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ④ Rate Category — horizontal cascade -->
            <div v-if="draft.carUuid" class="nq-step-block">
              <div class="nq-step-num nq-step-num-purple">4</div>
              <div class="nq-step-inner">
                <div class="nq-step-title">
                  Rate Category <span class="nq-req">*</span>
                </div>
                <div v-if="catLoading" class="nq-cat-loading">
                  <svg class="nq-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;color:#94a3b8"><path stroke-linecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Loading categories…
                </div>
                <div v-else class="nq-cat-row">
                  <div v-for="(levelOpts, depth) in draft.catLevels" :key="depth" class="nq-cat-col">
                    <label class="nq-label">{{ catLevelLabel(depth) }} <span class="nq-req">*</span></label>
                    <Select
                      :name="'cat-' + depth"
                      :obj="true"
                      :options="levelOpts.map(o => ({ value: o.categoryUuid, label: o.name }))"
                      :modelValue="draft.catSelections[depth]"
                      @update:modelValue="uuid => onCatSelect(depth, uuid)"
                      :attributes="{ placeholder: '— Choose —' }"
                    />
                  </div>
                  <div v-if="draft.categoryUuid" class="nq-cat-ok">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:10px;height:10px"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                    Category set
                  </div>
                </div>
                <span v-if="draftErrors.categoryUuid && !draft.categoryUuid" class="nq-err-msg" style="margin-top:0.3rem;display:block">{{ draftErrors.categoryUuid }}</span>
              </div>
            </div>

            <!-- Prompt when no car selected -->
            <div v-if="!draft.carUuid" class="nq-empty-prompt">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:32px;height:32px;color:#cbd5e1"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM4 17H3v-4l3-5h10l3 5v4h-1M9 17h6"/></svg>
              <p>Select a car from the registry above to continue</p>
            </div>

            <!-- Add to cart button -->
            <div v-if="draft.carUuid" class="nq-add-cart-row">
              <Button type="primary" size="sm" @click="addToCart">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:13px;height:13px;margin-right:4px">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                {{ editIdx !== null ? 'Update Vehicle' : 'Add to Cart' }}
              </Button>
            </div>

          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- ── Add New Insured Modal ── -->
  <Teleport to="body">
    <div v-if="showAddModal" class="nq-modal-backdrop" @click.self="closeAddModal">
      <div class="nq-modal">
        <div class="nq-modal-head">
          <div style="display:flex;align-items:center;gap:0.5rem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
            Add New Client
          </div>
          <button type="button" class="nq-modal-close" @click="closeAddModal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="nq-modal-body">
          <div v-if="modalError" class="nq-alert nq-alert-err" style="margin-bottom:1rem">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M12 8v4m0 4h.01"/></svg>
            {{ modalError }}
          </div>
          <div class="nq-grid-2">
            <div class="nq-field">
              <label class="nq-label">First Name <span class="nq-req">*</span></label>
              <Input v-model="newInsured.firstName" name="mi_firstName" :attributes="{ placeholder: 'e.g. Abraham' }" />
              <span v-if="newInsuredErr.firstName" class="nq-err-msg">{{ newInsuredErr.firstName }}</span>
            </div>
            <div class="nq-field">
              <label class="nq-label">Father Name <span class="nq-req">*</span></label>
              <Input v-model="newInsured.fatherName" name="mi_fatherName" :attributes="{ placeholder: 'e.g. Addisu' }" />
              <span v-if="newInsuredErr.fatherName" class="nq-err-msg">{{ newInsuredErr.fatherName }}</span>
            </div>
          </div>
          <div class="nq-grid-2">
            <div class="nq-field">
              <label class="nq-label">Grand Father Name</label>
              <Input v-model="newInsured.grandFatherName" name="mi_gfName" :attributes="{ placeholder: 'e.g. Teklu' }" />
            </div>
            <div class="nq-field">
              <label class="nq-label">Gender</label>
              <Select
                name="mi_gender"
                :obj="true"
                :options="[{value:'Male',label:'Male'},{value:'Female',label:'Female'}]"
                :modelValue="newInsured.gender"
                @update:modelValue="v => newInsured.gender = v"
                :attributes="{ placeholder: 'Select gender' }"
              />
            </div>
          </div>
          <div class="nq-grid-2">
            <div class="nq-field">
              <label class="nq-label">Phone</label>
              <Input v-model="newInsured.phone" name="mi_phone" :attributes="{ placeholder: '0963048258', type: 'tel' }" />
            </div>
            <div class="nq-field">
              <label class="nq-label">Email</label>
              <Input v-model="newInsured.email" name="mi_email" :attributes="{ placeholder: 'client@email.com', type: 'email' }" />
            </div>
          </div>
          <div class="nq-grid-2">
            <div class="nq-field">
              <label class="nq-label">Birth Date</label>
              <Input v-model="newInsured.birthDate" name="mi_birthDate" :attributes="{ type: 'date' }" />
            </div>
            <div class="nq-field">
              <label class="nq-label">Address</label>
              <Input v-model="newInsured.address1" name="mi_address" :attributes="{ placeholder: 'Addis Ababa' }" />
            </div>
          </div>
        </div>
        <div class="nq-modal-foot">
          <button type="button" class="nq-modal-cancel" @click="closeAddModal">Cancel</button>
          <Button type="primary" size="sm" @click="submitNewInsured" :loading="modalSaving">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:13px;height:13px;margin-right:4px"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
            {{ modalSaving ? 'Saving…' : 'Save Client' }}
          </Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.nq-root { padding: 1.5rem 2rem; min-height: 100%; background: #f8fafc; }

/* ── Topbar ──────────────────────────────────────────────────────────────── */
.nq-topbar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
.nq-back { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.42rem 0.9rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.5rem; font-size: 0.78rem; font-weight: 600; color: #374151; cursor: pointer; transition: background 0.15s; }
.nq-back:hover { background: #f1f5f9; }
.nq-breadcrumb { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; }
.nq-bc-dim { color: #94a3b8; }
.nq-bc-cur { color: #374151; font-weight: 600; }

/* ── Page header ──────────────────────────────────────────────────────────── */
.nq-page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; padding: 1.1rem 1.5rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.875rem; }
.nq-header-icon { width: 46px; height: 46px; border-radius: 11px; background: linear-gradient(135deg,#6366f1,#8b5cf6); display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0; }
.nq-page-title { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin: 0 0 0.15rem; }
.nq-page-sub   { font-size: 0.73rem; color: #64748b; margin: 0; }
.nq-cart-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.85rem; background: linear-gradient(135deg,#f5f3ff,#ede9fe); color: #6d28d9; border: 1px solid #ddd6fe; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; }

/* ── Alerts ───────────────────────────────────────────────────────────────── */
.nq-alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1rem; border-radius: 0.5rem; font-size: 0.8rem; font-weight: 500; margin-bottom: 1rem; }
.nq-alert-err { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.nq-alert-ok  { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; }
.nq-alert-close { margin-left: auto; background: none; border: none; cursor: pointer; color: inherit; font-size: 1.1rem; opacity: 0.7; }
.nq-alert-close:hover { opacity: 1; }

/* ── Layout ───────────────────────────────────────────────────────────────── */
.nq-layout { display: grid; grid-template-columns: 340px 1fr; gap: 1.5rem; align-items: start; }
@media (max-width: 900px) { .nq-layout { grid-template-columns: 1fr; } }
.nq-left  { display: flex; flex-direction: column; gap: 1rem; position: sticky; top: 0.75rem; z-index: 11; }
.nq-right { display: flex; flex-direction: column; gap: 1rem; }

/* ── Card ─────────────────────────────────────────────────────────────────── */
.nq-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 0.875rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.nq-card-head { display: flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1.2rem; font-size: 0.82rem; font-weight: 700; }
.nq-head-blue   { background: linear-gradient(135deg,#eff6ff,#dbeafe); color: #1e40af; border-bottom: 1px solid #bfdbfe; }
.nq-head-indigo { background: linear-gradient(135deg,#f5f3ff,#ede9fe); color: #4c1d95; border-bottom: 1px solid #ddd6fe; }
.nq-card-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0; overflow: visible; }

/* ── Field / label ────────────────────────────────────────────────────────── */
.nq-field { display: flex; flex-direction: column; gap: 0.2rem; }
.nq-label { display: flex; align-items: center; flex-wrap: wrap; gap: 0.3rem; font-size: 0.72rem; font-weight: 700; color: #374151; margin-bottom: 0.15rem; }
.nq-req  { color: #ef4444; }
.nq-hint { font-weight: 400; color: #94a3b8; font-size: 0.67rem; }
.nq-err-msg { font-size: 0.68rem; color: #ef4444; font-weight: 600; margin-top: 0.15rem; }

/* ── Grids ────────────────────────────────────────────────────────────────── */
.nq-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.nq-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.75rem; align-items: stretch; }
.nq-grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 0.75rem; align-items: stretch; }
@media (max-width: 640px) { .nq-grid-3 { grid-template-columns: 1fr 1fr; } .nq-grid-4 { grid-template-columns: 1fr 1fr; } }

/* ── Vehicle card header ──────────────────────────────────────────────────── */
.nq-veh-num { width: 20px; height: 20px; border-radius: 50%; background: rgba(99,102,241,0.15); color: #6366f1; font-size: 0.68rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink:0; }
.nq-veh-name-tag { font-size: 0.68rem; font-weight: 600; background: rgba(99,102,241,0.12); color: #6366f1; padding: 0.1rem 0.45rem; border-radius: 9999px; }
.nq-remove-veh { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.22rem 0.6rem; background: rgba(239,68,68,0.08); color: #dc2626; border: 1px solid rgba(239,68,68,0.2); border-radius: 0.4rem; font-size: 0.7rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.nq-remove-veh:hover { background: rgba(239,68,68,0.15); }

/* ── Step blocks ──────────────────────────────────────────────────────────── */
.nq-step-block { display: flex; gap: 0.85rem; padding: 1rem 0; border-bottom: 1px solid #f1f5f9; }
.nq-step-block:last-of-type { border-bottom: none; }
.nq-step-num {
  width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; margin-top: 0.05rem;
  background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff;
  font-size: 0.68rem; font-weight: 800; display: flex; align-items: center; justify-content: center;
}
.nq-step-num-amber  { background: linear-gradient(135deg,#f59e0b,#d97706); }
.nq-step-num-green  { background: linear-gradient(135deg,#10b981,#059669); }
.nq-step-num-purple { background: linear-gradient(135deg,#a855f7,#7c3aed); }
.nq-step-inner { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.65rem; }
.nq-step-title { font-size: 0.75rem; font-weight: 700; color: #1e293b; display: flex; align-items: center; flex-wrap: wrap; gap: 0.3rem; }

/* ── Car info chips (read-only) ───────────────────────────────────────────── */
.nq-car-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.25rem; }
.nq-chip { display: flex; align-items: center; gap: 0.35rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.3rem 0.6rem; }
.nq-chip-lbl { font-size: 0.62rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; }
.nq-chip-val { font-size: 0.73rem; font-weight: 700; color: #1e293b; }

/* ── Price spec cards ─────────────────────────────────────────────────────── */
.nq-no-specs { display: flex; align-items: center; gap: 0.45rem; font-size: 0.77rem; color: #94a3b8; background: #f8fafc; border: 1px dashed #e2e8f0; border-radius: 0.6rem; padding: 0.65rem 0.9rem; }
.nq-spec-grid { display: flex; flex-wrap: wrap; gap: 0.6rem; }
.nq-spec-card {
  flex: 1; min-width: 170px; cursor: pointer; text-align: left;
  background: #fff; border: 1.5px solid #e2e8f0; border-radius: 0.75rem;
  padding: 0.7rem 0.9rem; transition: all 0.18s; outline: none;
}
.nq-spec-card:hover { border-color: #a5b4fc; background: #fafafe; box-shadow: 0 2px 8px rgba(99,102,241,0.08); }
.nq-spec-active { border-color: #6366f1 !important; background: linear-gradient(135deg,#f5f3ff,#ede9fe) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important; }
.nq-spec-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem; }
.nq-spec-years { display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; font-weight: 700; color: #374151; }
.nq-spec-checkmark { width: 18px; height: 18px; border-radius: 50%; background: #6366f1; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nq-spec-prices { display: flex; align-items: center; gap: 0.4rem; }
.nq-spec-min { font-size: 0.7rem; font-weight: 600; color: #0f172a; }
.nq-spec-arrow { font-size: 0.65rem; color: #94a3b8; }
.nq-spec-max { font-size: 0.7rem; font-weight: 700; color: #6366f1; }

/* ── Locked (read-only) field ─────────────────────────────────────────────── */
.nq-locked-field {
  display: flex; align-items: center; gap: 0.45rem;
  padding: 0 0.75rem; background: #f8fafc;
  border: 1px solid #e2e8f0; border-radius: 0.5rem;
  height: 44px; box-sizing: border-box;
}
.nq-locked-val { font-size: 0.82rem; font-weight: 700; color: #1e293b; }
.nq-locked-ph  { font-size: 0.78rem; color: #94a3b8; }

/* ── Buying price input ───────────────────────────────────────────────────── */
.nq-price-range-badge { font-size: 0.62rem; font-weight: 600; color: #6366f1; background: #ede9fe; padding: 0.1rem 0.4rem; border-radius: 9999px; }
.nq-price-wrap { display: flex; align-items: center; border: 1.5px solid #e2e8f0; border-radius: 0.5rem; overflow: hidden; background: #fff; transition: border-color 0.15s; height: 44px; box-sizing: border-box; }
.nq-price-wrap:focus-within { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
.nq-price-wrap-err { border-color: #ef4444 !important; }
.nq-price-wrap-disabled { background: #f8fafc; opacity: 0.65; }
.nq-price-pfx { padding: 0 0.65rem; font-size: 0.72rem; font-weight: 700; color: #6366f1; background: #f5f3ff; border-right: 1px solid #e2e8f0; white-space: nowrap; align-self: stretch; display: flex; align-items: center; }
.nq-price-input { flex: 1; border: none; outline: none; padding: 0.48rem 0.65rem; font-size: 0.82rem; font-weight: 600; color: #1e293b; background: transparent; min-width: 0; }
.nq-price-input:disabled { cursor: not-allowed; color: #94a3b8; }
.nq-price-input::placeholder { font-weight: 400; color: #cbd5e1; }

/* ── Category cascade ─────────────────────────────────────────────────────── */
.nq-cat-loading { display: flex; align-items: center; gap: 0.5rem; font-size: 0.78rem; color: #94a3b8; padding: 0.4rem 0; }
.nq-cat-row { display: flex; align-items: flex-end; gap: 0.75rem; flex-wrap: wrap; }
.nq-cat-col { display: flex; flex-direction: column; gap: 0.2rem; min-width: 155px; flex: 1; }
.nq-cat-ok { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.7rem; font-weight: 700; color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 9999px; padding: 0.25rem 0.65rem; align-self: flex-end; margin-bottom: 0.15rem; white-space: nowrap; }

/* ── Empty prompt ─────────────────────────────────────────────────────────── */
.nq-empty-prompt { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 2rem 1rem; color: #94a3b8; }
.nq-empty-prompt p { font-size: 0.8rem; margin: 0; text-align: center; }

/* ── Cart summary ─────────────────────────────────────────────────────────── */
.nq-cart-summary { background: #fff; border: 1px solid #e2e8f0; border-radius: 0.875rem; overflow: visible; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.nq-cart-summary-head { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.1rem; font-size: 0.8rem; font-weight: 700; color: #374151; border-bottom: 1px solid #f1f5f9; }
.nq-cart-count { background: #e0e7ff; color: #4f46e5; font-size: 0.68rem; font-weight: 800; border-radius: 9999px; padding: 0.08rem 0.45rem; margin-left: auto; }
.nq-cart-empty { padding: 1.25rem 1.1rem; font-size: 0.78rem; color: #94a3b8; text-align: center; }
.nq-cart-list { display: flex; flex-direction: column; }
.nq-cart-item { display: flex; align-items: center; gap: 0.65rem; padding: 0.65rem 1rem; border-bottom: 1px solid #f8fafc; transition: background 0.1s; }
.nq-cart-item:last-child { border-bottom: none; }
.nq-cart-item:hover { background: #f8fafc; }
.nq-cart-item-editing { background: #f5f3ff !important; border-left: 3px solid #6366f1; }
.nq-cart-item-icon { width: 30px; height: 30px; border-radius: 8px; background: linear-gradient(135deg,#ede9fe,#ddd6fe); color: #6d28d9; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.nq-cart-item-info { flex: 1; min-width: 0; }
.nq-cart-item-name { font-size: 0.8rem; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nq-cart-item-sub  { font-size: 0.68rem; color: #94a3b8; margin-top: 0.1rem; }
.nq-cart-item-actions { display: flex; gap: 0.3rem; flex-shrink: 0; }
.nq-cart-edit { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 0.35rem; cursor: pointer; transition: all 0.15s; }
.nq-cart-edit:hover { background: #dbeafe; }
.nq-cart-del  { display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 0.35rem; cursor: pointer; transition: all 0.15s; }
.nq-cart-del:hover  { background: #fee2e2; }

/* ── Submit row ───────────────────────────────────────────────────────────── */
.nq-submit-row { display: flex; justify-content: flex-end; gap: 0.65rem; padding: 0.9rem 1.1rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 0.875rem; }

/* ── Add to cart row ──────────────────────────────────────────────────────── */
.nq-add-cart-row { display: flex; justify-content: flex-end; padding-top: 0.85rem; border-top: 1px solid #f1f5f9; margin-top: 0.25rem; }

/* ── Spinner ──────────────────────────────────────────────────────────────── */
@keyframes spin { to { transform: rotate(360deg); } }
.nq-spin { animation: spin 0.9s linear infinite; }

/* ── Insured select row ───────────────────────────────────────────────────── */
.nq-insured-row { display: flex; align-items: flex-start; gap: 0.6rem; }
.nq-add-insured-btn {
  display: inline-flex; align-items: center; gap: 0.35rem; white-space: nowrap;
  padding: 0 0.85rem; height: 44px; background: linear-gradient(135deg,#6366f1,#8b5cf6);
  color: #fff; border: none; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 700;
  cursor: pointer; transition: opacity 0.15s; flex-shrink: 0;
}
.nq-add-insured-btn:hover { opacity: 0.88; }

/* ── Combobox ─────────────────────────────────────────────────────────────── */
.nq-combobox { position: relative; }
.nq-combobox-wrap {
  display: flex; align-items: center; gap: 0.4rem;
  height: 44px; padding: 0 0.75rem;
  border: 1.5px solid #e2e8f0; border-radius: 0.5rem;
  background: #fff; transition: border-color 0.15s; box-sizing: border-box;
}
.nq-combobox-wrap:hover { border-color: #a5b4fc; }
.nq-combobox-active { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
.nq-combobox-err { border-color: #f87171 !important; }
.nq-combobox-icon { width: 13px; height: 13px; color: #94a3b8; flex-shrink: 0; }
.nq-combobox-input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 0.8rem; font-weight: 500; color: #1e293b; min-width: 0;
}
.nq-combobox-input::placeholder { color: #94a3b8; font-weight: 400; }
.nq-combobox-clear {
  display: flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 50%; border: none;
  background: #e2e8f0; color: #64748b; cursor: pointer; flex-shrink: 0;
  transition: background 0.15s;
}
.nq-combobox-clear:hover { background: #cbd5e1; color: #1e293b; }
.nq-combobox-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 200;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 0.65rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1); max-height: 260px; overflow-y: auto;
  padding: 0.3rem;
}
.nq-combobox-state {
  display: flex; align-items: center; gap: 0.45rem;
  padding: 0.65rem 0.75rem; font-size: 0.77rem; color: #94a3b8;
}
.nq-combobox-item {
  display: block; width: 100%; text-align: left; background: transparent;
  border: none; border-radius: 0.45rem; padding: 0.5rem 0.75rem;
  cursor: pointer; transition: background 0.12s;
}
.nq-combobox-item:hover { background: #f8fafc; }
.nq-combobox-item-active { background: #f5f3ff !important; }
.nq-cbi-main { font-size: 0.8rem; font-weight: 700; color: #1e293b; }
.nq-cbi-sub { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.15rem; }
.nq-cbi-sub span { font-size: 0.68rem; color: #64748b; font-weight: 500; }

/* ── Insured info chips ───────────────────────────────────────────────────── */
.nq-insured-chips { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.6rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.65rem; padding: 0.65rem 0.85rem; }
.nq-ichip { display: flex; align-items: center; gap: 0.5rem; }
.nq-ichip-lbl { font-size: 0.65rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; min-width: 80px; flex-shrink: 0; }
.nq-ichip-val { font-size: 0.78rem; font-weight: 600; color: #1e293b; }
.nq-ichip-badge { background: #dcfce7; color: #16a34a; border-radius: 9999px; padding: 0.05rem 0.5rem; font-size: 0.68rem; }

/* ── Modal ────────────────────────────────────────────────────────────────── */
.nq-modal-backdrop {
  position: fixed; inset: 0; background: rgba(15,23,42,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999; padding: 1rem;
}
.nq-modal {
  background: #fff; border-radius: 0.875rem; width: 100%; max-width: 520px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18); display: flex; flex-direction: column;
  max-height: 90vh; overflow: hidden;
}
.nq-modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem; font-size: 0.88rem; font-weight: 700; color: #1e293b;
  border-bottom: 1px solid #f1f5f9; background: linear-gradient(135deg,#f5f3ff,#ede9fe);
}
.nq-modal-close {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 0.4rem; border: 1px solid #e2e8f0;
  background: #fff; color: #64748b; cursor: pointer; transition: background 0.15s;
}
.nq-modal-close:hover { background: #f1f5f9; color: #1e293b; }
.nq-modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; overflow-y: auto; }
.nq-modal-foot { display: flex; justify-content: flex-end; align-items: center; gap: 0.6rem; padding: 0.9rem 1.25rem; border-top: 1px solid #f1f5f9; }
.nq-modal-cancel {
  padding: 0.45rem 1rem; background: #fff; border: 1px solid #e2e8f0;
  border-radius: 0.5rem; font-size: 0.78rem; font-weight: 600; color: #374151;
  cursor: pointer; transition: background 0.15s;
}
.nq-modal-cancel:hover { background: #f1f5f9; }
</style>
