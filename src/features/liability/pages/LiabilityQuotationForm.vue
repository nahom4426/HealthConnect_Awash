<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  apiError,
  createQuotation,
  fetchProduct,
  fetchProducts,
  fetchQuotation,
  previewPremium,
  updateQuotation,
} from '../api/liabilityApi.js';
import { money } from '../constants.js';
import '../liability-ui.css';

const route = useRoute();
const router = useRouter();
const quotationUuid = computed(() => route.params.quotationUuid);
const isEdit = computed(() => Boolean(quotationUuid.value));
const products = ref([]);
const product = ref(null);
const premium = ref(null);
const loading = ref(false);
const saving = ref(false);
const error = ref('');

const form = reactive({
  productUuid: '',
  insured: {
    name: '',
    tin: '',
    businessType: '',
    phone: '',
    email: '',
    contactPerson: '',
    address: { region: '', city: '', subcity: '', woreda: '', kebele: '', houseNo: '' },
  },
  cover: {
    riskItems: [{ categoryCode: '', basisAmount: '', description: '' }],
    limitPerOccurrence: '',
    aggregateLimit: '',
    deductibleAmount: '',
    extensionCodes: [],
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    retroactiveDate: '',
  },
});

const activeProducts = computed(() => (products.value || []).filter((p) => p.status === 'ACTIVE'));
const rateOptions = computed(() => product.value?.rates || []);
const extensionOptions = computed(() => product.value?.extensions || []);
const deductibleOptions = computed(() => product.value?.deductibles || []);

function payload() {
  return {
    productUuid: form.productUuid,
    insured: {
      ...form.insured,
      address: { ...form.insured.address },
    },
    cover: {
      riskItems: form.cover.riskItems
        .filter((row) => row.categoryCode)
        .map((row) => ({
          categoryCode: row.categoryCode,
          description: row.description || '',
          basisAmount: row.basisAmount === '' || row.basisAmount == null ? null : Number(row.basisAmount),
        })),
      limitPerOccurrence: Number(form.cover.limitPerOccurrence),
      aggregateLimit: Number(form.cover.aggregateLimit),
      deductibleAmount: Number(form.cover.deductibleAmount),
      extensionCodes: [...form.cover.extensionCodes],
      startDate: form.cover.startDate || null,
      endDate: form.cover.endDate || null,
      retroactiveDate: form.cover.retroactiveDate || null,
    },
  };
}

async function loadProducts() {
  products.value = await fetchProducts({ status: 'ACTIVE' });
}

async function loadProduct(uuid) {
  if (!uuid) {
    product.value = null;
    return;
  }
  product.value = await fetchProduct(uuid);
  if (!form.cover.deductibleAmount && product.value.deductibles?.[0]) {
    form.cover.deductibleAmount = product.value.deductibles[0].amount;
  }
}

async function loadExisting() {
  const row = await fetchQuotation(quotationUuid.value);
  form.productUuid = row.productUuid;
  Object.assign(form.insured, row.insured || {});
  form.insured.address = { region: '', city: '', subcity: '', woreda: '', kebele: '', houseNo: '', ...(row.insured?.address || {}) };
  form.cover.riskItems = (row.cover?.riskItems || []).map((r) => ({
    categoryCode: r.categoryCode || '',
    basisAmount: r.basisAmount ?? '',
    description: r.description || '',
  }));
  if (!form.cover.riskItems.length) form.cover.riskItems = [{ categoryCode: '', basisAmount: '', description: '' }];
  form.cover.limitPerOccurrence = row.cover?.limitPerOccurrence ?? '';
  form.cover.aggregateLimit = row.cover?.aggregateLimit ?? '';
  form.cover.deductibleAmount = row.cover?.deductibleAmount ?? '';
  form.cover.extensionCodes = [...(row.cover?.extensionCodes || [])];
  form.cover.startDate = row.cover?.startDate || form.cover.startDate;
  form.cover.endDate = row.cover?.endDate || '';
  form.cover.retroactiveDate = row.cover?.retroactiveDate || '';
  premium.value = row.premium || null;
  await loadProduct(form.productUuid);
}

async function calcPremium() {
  error.value = '';
  try {
    premium.value = await previewPremium(form.productUuid, { cover: payload().cover });
  } catch (e) {
    error.value = apiError(e);
  }
}

async function save() {
  saving.value = true;
  error.value = '';
  try {
    const saved = isEdit.value
      ? await updateQuotation(quotationUuid.value, payload())
      : await createQuotation(payload());
    router.push(`/liability/quotations/${saved.quotationUuid}`);
  } catch (e) {
    error.value = apiError(e);
  } finally {
    saving.value = false;
  }
}

function addRiskRow() {
  form.cover.riskItems.push({ categoryCode: '', basisAmount: '', description: '' });
}

function removeRiskRow(index) {
  if (form.cover.riskItems.length === 1) return;
  form.cover.riskItems.splice(index, 1);
}

watch(() => form.productUuid, (uuid) => loadProduct(uuid));

onMounted(async () => {
  loading.value = true;
  error.value = '';
  try {
    await loadProducts();
    if (isEdit.value) await loadExisting();
    else if (activeProducts.value[0]) form.productUuid = activeProducts.value[0].productUuid;
  } catch (e) {
    error.value = apiError(e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="lia-page">
    <header class="lia-head">
      <div>
        <button class="lia-link" @click="router.push(isEdit ? `/liability/quotations/${quotationUuid}` : '/liability/quotations')">← Quotations</button>
        <h1>{{ isEdit ? 'Edit quotation' : 'New quotation' }}</h1>
        <p class="lia-sub">Insured and cover go on the quotation. Underwriting stays on the quotation detail after submit.</p>
      </div>
    </header>

    <p v-if="loading" class="lia-note">Loading…</p>
    <p v-if="error" class="lia-error">{{ error }}</p>

    <form v-if="!loading" class="grid gap-4" @submit.prevent="save">
      <section class="lia-card">
        <h2>Product</h2>
        <div class="lia-form-grid">
          <label class="span-2">
            Liability product
            <select v-model="form.productUuid" required>
              <option disabled value="">Select product</option>
              <option v-for="p in activeProducts" :key="p.productUuid" :value="p.productUuid">{{ p.name }} ({{ p.code }})</option>
            </select>
          </label>
          <p v-if="product" class="span-2 lia-muted" style="padding:0">{{ product.description }} · {{ product.ratingBasis }} · {{ product.coverBasis }}</p>
        </div>
      </section>

      <section class="lia-card">
        <h2>Insured</h2>
        <div class="lia-form-grid">
          <label>Name *<input v-model="form.insured.name" required /></label>
          <label>TIN<input v-model="form.insured.tin" /></label>
          <label>Phone<input v-model="form.insured.phone" /></label>
          <label>Email<input v-model="form.insured.email" type="email" /></label>
          <label>Business type<input v-model="form.insured.businessType" /></label>
          <label>Contact person<input v-model="form.insured.contactPerson" /></label>
          <label>Region<input v-model="form.insured.address.region" /></label>
          <label>City<input v-model="form.insured.address.city" /></label>
          <label>Subcity<input v-model="form.insured.address.subcity" /></label>
          <label>Woreda<input v-model="form.insured.address.woreda" /></label>
        </div>
      </section>

      <section class="lia-card">
        <h2>Cover</h2>
        <div class="lia-form-grid">
          <label>Limit per occurrence *<input v-model="form.cover.limitPerOccurrence" type="number" min="1" step="0.01" required /></label>
          <label>Aggregate limit *<input v-model="form.cover.aggregateLimit" type="number" min="1" step="0.01" required /></label>
          <label>
            Deductible *
            <select v-model="form.cover.deductibleAmount" required>
              <option disabled value="">Select</option>
              <option v-for="d in deductibleOptions" :key="d.amount" :value="d.amount">{{ money(d.amount) }} ({{ d.discountPercent }}% discount)</option>
            </select>
          </label>
          <label>Start date *<input v-model="form.cover.startDate" type="date" required /></label>
          <label>End date<input v-model="form.cover.endDate" type="date" /></label>
          <label>Retroactive date<input v-model="form.cover.retroactiveDate" type="date" /></label>
          <div class="span-2">
            <p style="margin:0 0 .5rem;font-size:.82rem;font-weight:600;color:#44403c">Risk items</p>
            <div v-for="(row, index) in form.cover.riskItems" :key="index" style="display:grid;grid-template-columns:1.2fr .8fr 1.2fr auto;gap:.5rem;margin-bottom:.5rem">
              <select v-model="row.categoryCode" required>
                <option disabled value="">Category</option>
                <option v-for="r in rateOptions" :key="r.code" :value="r.code">{{ r.name }} ({{ r.code }})</option>
              </select>
              <input v-model="row.basisAmount" type="number" min="0" step="0.01" placeholder="Basis amount" />
              <input v-model="row.description" placeholder="Description" />
              <button type="button" class="lia-link" @click="removeRiskRow(index)">Remove</button>
            </div>
            <button type="button" class="lia-btn ghost" @click="addRiskRow">Add risk item</button>
          </div>
          <div class="span-2">
            <p style="margin:0 0 .5rem;font-size:.82rem;font-weight:600;color:#44403c">Extensions</p>
            <div style="display:flex;flex-wrap:wrap;gap:.75rem 1.25rem">
              <label v-for="ext in extensionOptions" :key="ext.code" style="flex-direction:row;align-items:center;font-weight:500">
                <input v-model="form.cover.extensionCodes" type="checkbox" :value="ext.code" />
                {{ ext.name }} (+{{ ext.loadingPercent }}%)
              </label>
            </div>
          </div>
        </div>
      </section>

      <section v-if="premium" class="lia-card">
        <h2>Premium preview</h2>
        <dl class="lia-answers">
          <div><dt>Base</dt><dd>{{ money(premium.basePremium) }}</dd></div>
          <div><dt>Policy fee</dt><dd>{{ money(premium.policyFee) }}</dd></div>
          <div><dt>Total payable</dt><dd>{{ money(premium.totalPayable) }}</dd></div>
        </dl>
      </section>

      <div class="lia-actions" style="justify-content:flex-end">
        <button type="button" class="lia-btn ghost" :disabled="!form.productUuid" @click="calcPremium">Preview premium</button>
        <button type="button" class="lia-btn ghost" @click="router.back()">Cancel</button>
        <button type="submit" class="lia-btn" :disabled="saving">{{ saving ? 'Saving…' : isEdit ? 'Save draft' : 'Create quotation' }}</button>
      </div>
    </form>
  </div>
</template>
