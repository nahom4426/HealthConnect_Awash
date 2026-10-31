<script setup>
import { computed, onMounted, ref } from 'vue';
import {
  apiError,
  createProduct,
  fetchProducts,
  fetchPublishedProduct,
  publishProduct,
} from '../api/fireApi.js';
import { usePcModule } from '@/features/pc/pcModule.js';

const pc = usePcModule();
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const notice = ref('');
const product = ref(null);
const draft = ref(emptyDraft());
const newOccupancy = ref('');
const newAxis = ref('');

const constructions = computed(() => draft.value.axes);
const occupancies = computed(() => draft.value.occupancies);
const nextVersion = computed(() => bumpVersion(product.value?.version || '1.0'));

function emptyDraft() {
  return {
    currency: 'ETB',
    minPremium: 150,
    schemaJson: '',
    axes: [],
    occupancies: [],
    rates: {},
    loadings: [],
    perils: [],
    itemTypes: [],
  };
}

function fromProduct(data) {
  const axes = [...new Set((data.rates || []).map((r) => r.constructionClass))];
  const occs = [...new Set((data.rates || []).map((r) => r.occupancyCode))];
  const rates = {};
  for (const cls of axes) {
    rates[cls] = {};
    for (const occ of occs) {
      const row = (data.rates || []).find((r) => r.constructionClass === cls && r.occupancyCode === occ);
      rates[cls][occ] = row ? Number(row.rate) : 0;
    }
  }
  return {
    currency: data.currency || 'ETB',
    minPremium: Number(data.minPremium || 0),
    schemaJson: data.schemaJson || '',
    axes,
    occupancies: occs,
    rates,
    loadings: (data.loadings || []).map((row) => ({
      code: row.code,
      label: row.label,
      percent: Number(row.percent) * 100,
      triggerField: row.triggerField,
      triggerValue: row.triggerValue,
    })),
    perils: (data.perils || []).map((row) => ({
      code: row.code,
      label: row.label,
      rate: Number(row.rate) * 100,
      includedInBase: Boolean(row.includedInBase),
      sortOrder: row.sortOrder || 0,
    })),
    itemTypes: (data.itemTypes || []).map((row) => ({
      code: row.code,
      label: row.label,
      required: Boolean(row.required),
      sortOrder: row.sortOrder || 0,
    })),
  };
}

function bumpVersion(version) {
  const match = String(version).match(/^(\d+)\.(\d+)$/);
  if (match) return `${match[1]}.${Number(match[2]) + 1}`;
  return `${version}.1`;
}

function slug(value, fallback) {
  const code = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return code || fallback;
}

function addOccupancy() {
  const occ = slug(newOccupancy.value, '');
  if (!occ || draft.value.occupancies.includes(occ)) return;
  draft.value.occupancies.push(occ);
  for (const cls of draft.value.axes) {
    draft.value.rates[cls][occ] = 0.003;
  }
  newOccupancy.value = '';
}

function addAxis() {
  const cls = slug(newAxis.value, '');
  if (!cls || draft.value.axes.includes(cls)) return;
  draft.value.axes.push(cls);
  draft.value.rates[cls] = {};
  for (const occ of draft.value.occupancies) {
    draft.value.rates[cls][occ] = 0.003;
  }
  newAxis.value = '';
}

function removeOccupancy(occ) {
  draft.value.occupancies = draft.value.occupancies.filter((value) => value !== occ);
  for (const cls of draft.value.axes) {
    delete draft.value.rates[cls][occ];
  }
}

function removeAxis(cls) {
  draft.value.axes = draft.value.axes.filter((value) => value !== cls);
  delete draft.value.rates[cls];
}

function addLoading() {
  draft.value.loadings.push({
    code: `LOADING_${draft.value.loadings.length + 1}`,
    label: '',
    percent: 10,
    triggerField: '',
    triggerValue: 'true',
  });
}

function addPeril() {
  draft.value.perils.push({
    code: `COVER_${draft.value.perils.length + 1}`,
    label: '',
    rate: 0.1,
    includedInBase: false,
    sortOrder: draft.value.perils.length + 1,
  });
}

function addItemType() {
  draft.value.itemTypes.push({
    code: `ITEM_${draft.value.itemTypes.length + 1}`,
    label: '',
    required: false,
    sortOrder: draft.value.itemTypes.length + 1,
  });
}

function toRequest(version) {
  const rates = [];
  for (const cls of draft.value.axes) {
    for (const occ of draft.value.occupancies) {
      rates.push({
        constructionClass: cls,
        occupancyCode: occ,
        rate: Number(draft.value.rates[cls][occ] || 0),
      });
    }
  }
  return {
    productClass: pc.value.productClass,
    version,
    currency: draft.value.currency || 'ETB',
    minPremium: Number(draft.value.minPremium),
    schemaJson: draft.value.schemaJson || product.value?.schemaJson || '{}',
    itemTypes: draft.value.itemTypes.map((item, index) => ({
      code: slug(item.code, `ITEM_${index + 1}`),
      label: item.label || item.code,
      required: Boolean(item.required),
      sortOrder: index + 1,
    })),
    perils: draft.value.perils.map((peril, index) => ({
      code: slug(peril.code, `COVER_${index + 1}`),
      label: peril.label || peril.code,
      rate: Number(peril.rate || 0) / 100,
      includedInBase: Boolean(peril.includedInBase),
      sortOrder: index + 1,
    })),
    rates,
    loadings: draft.value.loadings.map((row, index) => ({
      code: slug(row.code, `LOADING_${index + 1}`),
      label: row.label || row.code,
      percent: Number(row.percent || 0) / 100,
      triggerField: row.triggerField,
      triggerValue: String(row.triggerValue ?? 'true'),
    })),
  };
}

function validate() {
  if (!(Number(draft.value.minPremium) > 0)) return 'Min premium must be greater than 0';
  if (!draft.value.axes.length || !draft.value.occupancies.length) return 'Add at least one rate row and occupancy';
  if (!draft.value.itemTypes.length) return 'Add at least one schedule item type';
  if (draft.value.loadings.some((row) => !row.code || !row.label || !row.triggerField || row.triggerValue === '')) {
    return 'Each loading needs a code, label, trigger field, and trigger value';
  }
  if (draft.value.perils.some((row) => !row.code || !row.label)) return 'Each additional cover needs a code and label';
  if (draft.value.itemTypes.some((row) => !row.code || !row.label)) return 'Each schedule item needs a code and label';
  return '';
}

async function unusedVersion(start) {
  const listed = await fetchProducts({
    productClass: pc.value.productClass,
    limit: 100,
    sortBy: 'createdAt',
  });
  const used = new Set((listed.content || []).map((row) => row.version));
  let version = start;
  while (used.has(version)) version = bumpVersion(version);
  return version;
}

async function load() {
  loading.value = true;
  error.value = '';
  notice.value = '';
  try {
    product.value = await fetchPublishedProduct(pc.value.productClass);
    draft.value = fromProduct(product.value);
  } catch (e) {
    error.value = apiError(e);
  } finally {
    loading.value = false;
  }
}

async function publish() {
  error.value = validate();
  if (error.value) return;
  saving.value = true;
  notice.value = '';
  try {
    const version = await unusedVersion(nextVersion.value);
    const created = await createProduct(toRequest(version));
    product.value = await publishProduct(created.productUuid);
    draft.value = fromProduct(product.value);
    notice.value = `Published ${pc.value.label} ${product.value.version}. New proposals and quotes use these rates. Existing ones keep the old snapshot.`;
  } catch (e) {
    error.value = apiError(e);
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="fire-page">
    <header class="fire-head">
      <div>
        <p class="fire-kicker">Property-casualty · published catalog</p>
        <h1>{{ pc.rateTitle }}</h1>
        <p class="fire-sub">
          Edit rates, loadings, covers, and schedule types, then publish a new version.
          Questions stay in Form Builder. Existing proposals keep the version they were quoted on.
        </p>
      </div>
      <div class="fire-actions">
        <router-link class="fire-btn ghost" :to="pc.formBuilderPath">Edit questions</router-link>
        <button class="fire-btn ghost" :disabled="loading || saving" @click="load">Discard</button>
        <button class="fire-btn" :disabled="loading || saving" @click="publish">
          {{ saving ? 'Publishing…' : `Publish ${nextVersion}` }}
        </button>
      </div>
    </header>

    <p v-if="loading" class="fire-note">Loading published {{ pc.label }} product…</p>
    <p v-if="error" class="fire-error">{{ error }}</p>
    <p v-if="notice" class="fire-note">{{ notice }}</p>

    <template v-if="product && !loading">
      <section class="fire-meta">
        <div><span>Live version</span><strong>{{ product.version }}</strong></div>
        <div><span>Status</span><strong>{{ product.status }}</strong></div>
        <label>
          <span>Currency</span>
          <input v-model="draft.currency" maxlength="8" />
        </label>
        <label>
          <span>Min premium</span>
          <input v-model.number="draft.minPremium" type="number" min="0.01" step="0.01" />
        </label>
      </section>

      <section class="fire-card">
        <div class="card-head">
          <h2>Base rates</h2>
          <p>Stored as a decimal of sum insured (0.0035 = 0.35%). {{ pc.axis1 }} × {{ pc.axis2 }}.</p>
        </div>
        <div class="fire-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ pc.axis1 }}</th>
                <th v-for="occ in occupancies" :key="occ">
                  <div class="col-head">
                    <span>{{ occ }}</span>
                    <button type="button" class="link" @click="removeOccupancy(occ)">Remove</button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cls in constructions" :key="cls">
                <th>
                  <div class="col-head">
                    <span>{{ cls }}</span>
                    <button type="button" class="link" @click="removeAxis(cls)">Remove</button>
                  </div>
                </th>
                <td v-for="occ in occupancies" :key="occ">
                  <input v-model.number="draft.rates[cls][occ]" type="number" min="0" step="0.0001" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="add-row">
          <input v-model="newAxis" :placeholder="`Add ${pc.axis1.toLowerCase()}`" @keyup.enter="addAxis" />
          <button type="button" class="fire-btn ghost" @click="addAxis">Add row</button>
          <input v-model="newOccupancy" :placeholder="`Add ${pc.axis2.toLowerCase()}`" @keyup.enter="addOccupancy" />
          <button type="button" class="fire-btn ghost" @click="addOccupancy">Add column</button>
        </div>
      </section>

      <div class="fire-grid">
        <section class="fire-card">
          <div class="card-head">
            <h2>Loadings</h2>
            <button type="button" class="fire-btn ghost" @click="addLoading">Add</button>
          </div>
          <p class="hint">Percent of base premium. Trigger field must match a proposal question id.</p>
          <div v-for="(row, index) in draft.loadings" :key="index" class="edit-block">
            <input v-model="row.code" placeholder="Code" />
            <input v-model="row.label" placeholder="Label" class="span-2" />
            <input v-model.number="row.percent" type="number" step="0.01" placeholder="%" />
            <input v-model="row.triggerField" placeholder="Trigger field" />
            <input v-model="row.triggerValue" placeholder="Trigger value" />
            <button type="button" class="link" @click="draft.loadings.splice(index, 1)">Remove</button>
          </div>
        </section>
        <section class="fire-card">
          <div class="card-head">
            <h2>Additional covers</h2>
            <button type="button" class="fire-btn ghost" @click="addPeril">Add</button>
          </div>
          <p class="hint">Percent of sum insured. Codes should also appear as form options if proposers select them.</p>
          <div v-for="(row, index) in draft.perils" :key="index" class="edit-block">
            <input v-model="row.code" placeholder="Code" />
            <input v-model="row.label" placeholder="Label" class="span-2" />
            <input v-model.number="row.rate" type="number" min="0" step="0.01" placeholder="% of SI" />
            <label class="check"><input v-model="row.includedInBase" type="checkbox" /> In base</label>
            <button type="button" class="link" @click="draft.perils.splice(index, 1)">Remove</button>
          </div>
        </section>
        <section class="fire-card">
          <div class="card-head">
            <h2>Schedule item types</h2>
            <button type="button" class="fire-btn ghost" @click="addItemType">Add</button>
          </div>
          <p class="hint">Required items must be on every proposal before quotation.</p>
          <div v-for="(row, index) in draft.itemTypes" :key="index" class="edit-block">
            <input v-model="row.code" placeholder="Code" />
            <input v-model="row.label" placeholder="Label" class="span-2" />
            <label class="check"><input v-model="row.required" type="checkbox" /> Required</label>
            <button type="button" class="link" @click="draft.itemTypes.splice(index, 1)">Remove</button>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.fire-page { padding: 1.5rem 1.75rem 3rem; max-width: 1200px; }
.fire-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; margin-bottom: 1.5rem; }
.fire-kicker { text-transform: uppercase; letter-spacing: .08em; font-size: .7rem; color: #c2410c; font-weight: 700; margin: 0 0 .35rem; }
.fire-head h1 { margin: 0; font-size: 1.6rem; }
.fire-sub { margin: .4rem 0 0; color: #57534e; max-width: 42rem; }
.fire-actions { display: flex; gap: .5rem; flex-wrap: wrap; }
.fire-btn { background: #ea580c; color: #fff; border: 0; border-radius: .6rem; padding: .55rem 1rem; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
.fire-btn.ghost { background: rgb(var(--surface)); color: #9a3412; border: 1px solid #fdba74; }
.fire-btn:disabled { opacity: .6; }
.fire-note, .fire-error { padding: .9rem 1rem; border-radius: .7rem; margin-bottom: 1rem; }
.fire-error { background: var(--tint-fef2f2, #fef2f2); color: #991b1b; }
.fire-note { background: var(--tint-fff7ed, #fff7ed); color: #9a3412; }
.fire-meta { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: .75rem; margin-bottom: 1rem; }
.fire-meta div, .fire-meta label { background: rgb(var(--surface)); border: 1px solid var(--tint-fed7aa, #fed7aa); border-radius: .8rem; padding: .85rem 1rem; display: flex; flex-direction: column; gap: .35rem; }
.fire-meta span { display: block; font-size: .72rem; color: #78716c; text-transform: uppercase; letter-spacing: .06em; }
.fire-card { background: rgb(var(--surface)); border: 1px solid #e7e5e4; border-radius: 1rem; padding: 1.1rem 1.2rem; margin-bottom: 1rem; }
.card-head { display: flex; justify-content: space-between; gap: .75rem; align-items: flex-start; margin-bottom: .5rem; }
.fire-card h2 { margin: 0; font-size: 1rem; }
.fire-card p { margin: 0 0 .8rem; color: #78716c; font-size: .82rem; }
.hint { margin: 0 0 .8rem !important; }
.fire-table-wrap { overflow: auto; }
table { width: 100%; border-collapse: collapse; font-size: .85rem; }
th, td { border-bottom: 1px solid #f5f5f4; padding: .4rem .45rem; text-align: right; white-space: nowrap; }
thead th, tbody th { text-align: left; background: var(--tint-fff7ed, #fff7ed); }
.col-head { display: flex; gap: .4rem; align-items: center; justify-content: space-between; }
input { border: 1px solid #d6d3d1; border-radius: .45rem; padding: .4rem .5rem; font-weight: 500; width: 100%; box-sizing: border-box; }
td input { min-width: 5.5rem; text-align: right; }
.fire-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 1rem; }
.edit-block { display: grid; grid-template-columns: 1fr 1fr auto; gap: .4rem; margin-bottom: .65rem; align-items: center; }
.span-2 { grid-column: span 2; }
.check { display: flex; gap: .35rem; align-items: center; font-size: .8rem; color: #57534e; }
.check input { width: auto; }
.add-row { display: flex; gap: .5rem; flex-wrap: wrap; margin-top: .9rem; }
.add-row input { max-width: 16rem; }
.link { background: none; border: 0; color: #c2410c; cursor: pointer; font-size: .75rem; padding: 0; }
@media (max-width: 900px) {
  .fire-meta, .fire-grid, .edit-block { grid-template-columns: 1fr; }
  .span-2 { grid-column: auto; }
}
</style>
