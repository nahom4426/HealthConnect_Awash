<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toasted } from '@/utils/utils';
import {
  createVersion,
  getVersion,
  publishVersion,
  testRating,
  updateLiveSchema,
  updateVersion,
} from '../api/productsApi';
import {
  COMPONENT_TYPES,
  IDENTIFIER,
  blankAnswers,
  formatDateTime,
  generalError,
  parseFormSchema,
  percent,
  schemaFields,
  statusTone,
  typedAnswers,
  useProductContext,
} from '../productUtils';
import FormSchemaBuilder from '../components/FormSchemaBuilder.vue';
import FormulaHelp from '../components/FormulaHelp.vue';
import PremiumBreakdown from '../components/PremiumBreakdown.vue';
import SchemaFields from '../components/SchemaFields.vue';
import '../products-ui.css';

const route = useRoute();
const router = useRouter();
const { productClass, productName, basePath, can } = useProductContext();

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'form', label: 'Proposal form' },
  { id: 'items', label: 'Items' },
  { id: 'covers', label: 'Covers' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'test', label: 'Test' },
  { id: 'publish', label: 'Publish' },
];

const FORMULA_TEMPLATE = [
  { code: 'BASE', label: 'Base premium', componentType: 'BASE_PREMIUM', expression: 'sumInsured * 0.025' },
  { code: 'AGE', label: 'Senior loading', componentType: 'LOADING', expression: 'answers.age > 8 ? fn:pct(BASE, 20) : null' },
  { code: 'INDOOR', label: 'Indoor discount', componentType: 'DISCOUNT', expression: 'answers.indoor ? -fn:pct(BASE, 10) : null' },
  { code: 'THEFT', label: 'Theft cover', componentType: 'ADDITIONAL_COVER', expression: "fn:has('THEFT') ? sumInsured * fn:perilRate('THEFT') : null" },
];

const productUuid = computed(() => (route.params.productUuid === 'new' ? null : route.params.productUuid || null));
const isNew = computed(() => !productUuid.value);
const tab = ref(TABS.some((t) => t.id === route.query.tab) ? route.query.tab : 'general');

const loading = ref(false);
const saving = ref(false);
const loadError = ref('');
const saveError = ref(null);
const saved = ref(null); // server copy of this version
const savedSnapshot = ref('');

const draft = reactive({
  version: '1.0',
  currency: 'ETB',
  minPremium: 0,
  schema: { title: '', steps: [] },
  itemTypes: [],
  perils: [],
  rates: [],
  loadings: [],
  formulas: [],
});
const pricingMode = ref('grid');

const status = computed(() => saved.value?.status || 'DRAFT');
const editable = computed(() => status.value === 'DRAFT' && (isNew.value ? can('product.create') : can('product.update')));
// Live-form mode: the published version's form can change (the backend publishes a new minor version)
const liveFormMode = computed(() => route.query.live === '1' && status.value === 'PUBLISHED' && can('product.schema.update'));
const formEditable = computed(() => editable.value || liveFormMode.value);

const fieldIds = computed(() => schemaFields(draft.schema).map((f) => f.id));
const formulaCodes = computed(() => sortedFormulas().map((f) => f.code).filter(Boolean));
const perilCodes = computed(() => draft.perils.map((p) => p.code).filter(Boolean));
const dirty = computed(() => JSON.stringify(buildBody()) !== savedSnapshot.value);

function nextVersion(version) {
  const parts = String(version || '1.0').split('.');
  const last = Number(parts[parts.length - 1]);
  if (Number.isFinite(last)) parts[parts.length - 1] = String(last + 1);
  else parts.push('1');
  return parts.join('.');
}

function sortedFormulas() {
  return [...draft.formulas].sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
}

function fill(source, { copy = false } = {}) {
  draft.version = copy ? nextVersion(source.version) : source.version || '1.0';
  draft.currency = source.currency || 'ETB';
  draft.minPremium = source.minPremium ?? 0;
  draft.schema = parseFormSchema(source.schemaJson);
  const clone = (list) => (Array.isArray(list) ? list.map((row) => ({ ...row })) : []);
  draft.itemTypes = clone(source.itemTypes);
  draft.perils = clone(source.perils);
  draft.rates = clone(source.rates);
  draft.loadings = clone(source.loadings);
  draft.formulas = clone(source.formulas);
  pricingMode.value = draft.formulas.length ? 'formulas' : 'grid';
}

function blankDraft() {
  fill({
    version: '1.0',
    currency: 'ETB',
    minPremium: 0,
    schemaJson: {
      title: `${productName.value} Proposal Form`,
      steps: [{ stepId: 'details', stepTitle: '1. Details', fields: [] }],
    },
    itemTypes: [],
    perils: [],
    rates: [{ constructionClass: '*', occupancyCode: '*', rate: 0.01 }],
    loadings: [],
    formulas: [],
  });
}

function buildBody() {
  const num = (v) => (v === '' || v == null ? null : Number(v));
  return {
    productClass: productClass.value,
    version: String(draft.version || '').trim(),
    currency: String(draft.currency || '').trim().toUpperCase(),
    minPremium: num(draft.minPremium) ?? 0,
    schemaJson: JSON.stringify({ ...draft.schema, productClass: productClass.value, version: String(draft.version || '').trim() }),
    itemTypes: draft.itemTypes.map((t, i) => ({ ...t, code: String(t.code || '').trim().toUpperCase(), required: Boolean(t.required), sortOrder: num(t.sortOrder) ?? i })),
    perils: draft.perils.map((p, i) => ({ ...p, code: String(p.code || '').trim().toUpperCase(), rate: num(p.rate) ?? 0, includedInBase: Boolean(p.includedInBase), sortOrder: num(p.sortOrder) ?? i })),
    rates: draft.rates.map((r) => ({ ...r, constructionClass: String(r.constructionClass || '*').trim(), occupancyCode: String(r.occupancyCode || '*').trim(), rate: num(r.rate) ?? 0 })),
    loadings: draft.loadings.map((l) => ({ ...l, percent: num(l.percent) ?? 0 })),
    // "If any formula exists, the version is priced by formulas", so the rate-grid mode sends none
    formulas: pricingMode.value === 'formulas'
      ? draft.formulas.map((f, i) => ({ ...f, code: String(f.code || '').trim(), sortOrder: num(f.sortOrder) ?? i + 1 }))
      : [],
  };
}

function remember(version) {
  saved.value = version;
  savedSnapshot.value = JSON.stringify(buildBody());
}

async function load() {
  loading.value = true;
  loadError.value = '';
  saveError.value = null;
  testResult.value = null;
  try {
    if (productUuid.value) {
      const version = await getVersion(productUuid.value);
      fill(version);
      remember(version);
    } else {
      saved.value = null;
      if (route.query.from) fill(await getVersion(route.query.from), { copy: true });
      else blankDraft();
      savedSnapshot.value = '';
    }
    resetTestInputs();
  } catch (e) {
    loadError.value = e.message;
  } finally {
    loading.value = false;
  }
}

/* ── Client checks before save ── */
const localProblems = computed(() => {
  const problems = [];
  if (!String(draft.version || '').trim()) problems.push({ tab: 'general', text: 'Version is required' });
  const ids = fieldIds.value;
  if (ids.some((id) => !IDENTIFIER.test(id || ''))) problems.push({ tab: 'form', text: 'A form field id is not a valid identifier' });
  if (new Set(ids).size !== ids.length) problems.push({ tab: 'form', text: 'Two form fields share an id' });
  if (draft.itemTypes.some((t) => !t.code)) problems.push({ tab: 'items', text: 'Every item type needs a code' });
  if (draft.perils.some((p) => !p.code)) problems.push({ tab: 'covers', text: 'Every cover needs a code' });
  if (pricingMode.value === 'formulas') {
    const codes = draft.formulas.map((f) => f.code);
    if (codes.some((c) => !IDENTIFIER.test(c || ''))) problems.push({ tab: 'pricing', text: 'Every formula needs a code made of letters, digits and _' });
    if (new Set(codes).size !== codes.length) problems.push({ tab: 'pricing', text: 'Two formulas share a code' });
    if (draft.formulas.some((f) => !String(f.expression || '').trim())) problems.push({ tab: 'pricing', text: 'Every formula needs an expression' });
  }
  return problems;
});

const tabProblems = computed(() => {
  const set = new Set(localProblems.value.map((p) => p.tab));
  if (badFormulaIndex.value >= 0) set.add('pricing');
  return set;
});

/** Row of the formula the backend rejected: from fieldErrors (formulas[2].expression) or the code in the message. */
const badFormulaIndex = computed(() => {
  const err = saveError.value;
  if (!err) return -1;
  for (const key of Object.keys(err.fieldErrors || {})) {
    const m = /^formulas\[(\d+)\]/.exec(key);
    if (m) return sortedIndexToDraft(Number(m[1]));
  }
  const fieldMatch = /^formulas\[(\d+)\]/.exec(err.field || '');
  if (fieldMatch) return sortedIndexToDraft(Number(fieldMatch[1]));
  if (err.type === 'product.formula.invalid' || /formula/i.test(err.message)) {
    // Longest code first, so AGE_2 isn't mistaken for AGE
    const codes = draft.formulas.map((f, i) => ({ code: f.code, i })).filter((f) => f.code).sort((a, b) => b.code.length - a.code.length);
    const hit = codes.find(({ code }) => new RegExp(`(^|[^A-Za-z0-9_])${code}([^A-Za-z0-9_]|$)`).test(err.message));
    if (hit) return hit.i;
  }
  return -1;
});

function sortedIndexToDraft(sentIndex) {
  // The body sends formulas in draft order, so the index maps straight back
  return sentIndex < draft.formulas.length ? sentIndex : -1;
}

async function save() {
  saveError.value = null;
  if (localProblems.value.length) {
    tab.value = localProblems.value[0].tab;
    return;
  }
  saving.value = true;
  try {
    const body = buildBody();
    const version = isNew.value ? await createVersion(body) : await updateVersion(productUuid.value, body);
    toasted(true, `Version ${version.version} saved`);
    if (isNew.value) {
      await router.replace({ path: `${basePath.value}/versions/${version.productUuid}`, query: { tab: tab.value } });
      return; // the route change reloads
    }
    fill(version);
    remember(version);
  } catch (e) {
    saveError.value = e;
    if (badFormulaIndex.value >= 0) tab.value = 'pricing';
  } finally {
    saving.value = false;
  }
}

async function saveLiveForm() {
  saveError.value = null;
  if (localProblems.value.some((p) => p.tab === 'form')) return;
  saving.value = true;
  try {
    const schemaJson = JSON.stringify({ ...draft.schema, productClass: productClass.value });
    const next = await updateLiveSchema(productClass.value, schemaJson);
    toasted(true, `Form updated. Version ${next.version} is now published.`);
    await router.replace({ path: `${basePath.value}/versions/${next.productUuid}`, query: { tab: 'form' } });
  } catch (e) {
    saveError.value = e;
  } finally {
    saving.value = false;
  }
}

/* ── Row helpers ── */
function addItemType() {
  draft.itemTypes.push({ code: '', label: '', required: draft.itemTypes.length === 0, sortOrder: draft.itemTypes.length });
}
function addPeril() {
  draft.perils.push({ code: '', label: '', rate: 0.01, includedInBase: false, sortOrder: draft.perils.length });
}
function addRate() {
  draft.rates.push({ constructionClass: '*', occupancyCode: '*', rate: 0 });
}
function addLoading() {
  draft.loadings.push({ code: '', label: '', percent: 0.1, triggerField: fieldIds.value[0] || '', triggerValue: '' });
}
function addFormula() {
  const maxOrder = draft.formulas.reduce((m, f) => Math.max(m, Number(f.sortOrder) || 0), 0);
  draft.formulas.push({ code: '', label: '', expression: '', componentType: draft.formulas.length ? 'LOADING' : 'BASE_PREMIUM', sortOrder: maxOrder + 1 });
}
function insertTemplate() {
  // Replace untouched blank rows (the one added when switching to formulas) rather than keep them
  draft.formulas = draft.formulas.filter((f) => f.code || String(f.expression || '').trim());
  const existing = new Set(draft.formulas.map((f) => f.code));
  let order = draft.formulas.reduce((m, f) => Math.max(m, Number(f.sortOrder) || 0), 0);
  for (const f of FORMULA_TEMPLATE) {
    if (existing.has(f.code)) continue;
    order += 1;
    draft.formulas.push({ ...f, sortOrder: order });
  }
}
function removeRow(list, index) {
  list.splice(index, 1);
}

watch(pricingMode, (mode) => {
  if (mode === 'formulas' && !draft.formulas.length && editable.value) addFormula();
});

/* ── Test tab ── */
const testAnswers = ref({});
const testItems = ref([]);
const testPerils = ref([]);
const testExpression = ref('');
const testResult = ref(null);
const testError = ref('');
const testing = ref(false);
const optionalPerils = computed(() => draft.perils.filter((p) => !p.includedInBase && p.code));

function resetTestInputs() {
  testAnswers.value = blankAnswers(draft.schema);
  const types = draft.itemTypes.filter((t) => t.code);
  const seed = types.filter((t) => t.required);
  testItems.value = (seed.length ? seed : types.slice(0, 1)).map((t) => ({ itemType: t.code, description: t.label || '', sumInsured: 20000 }));
  if (!testItems.value.length) testItems.value = [{ itemType: '', description: '', sumInsured: 20000 }];
  testPerils.value = [];
  testResult.value = null;
  testError.value = '';
}

async function runTest() {
  testing.value = true;
  testError.value = '';
  try {
    const body = {
      answers: typedAnswers(draft.schema, testAnswers.value),
      riskItems: testItems.value.map((row) => ({ itemType: row.itemType, description: row.description, sumInsured: Number(row.sumInsured) || 0 })),
      perils: [...testPerils.value],
    };
    if (testExpression.value.trim()) body.expression = testExpression.value.trim();
    testResult.value = await testRating(productUuid.value, body);
  } catch (e) {
    testResult.value = null;
    testError.value = e.message;
  } finally {
    testing.value = false;
  }
}

/* ── Publish tab ── */
const publishing = ref(false);
const publishError = ref('');
const checklist = computed(() => {
  const s = saved.value || {};
  return [
    { ok: !isNew.value && !dirty.value, text: 'All changes are saved' },
    { ok: (s.itemTypes || []).length > 0, text: 'At least one item type' },
    { ok: (s.rates || []).length > 0 || (s.formulas || []).length > 0, text: 'At least one rate row or formula' },
    { ok: schemaFields(parseFormSchema(s.schemaJson)).length > 0, text: 'The proposal form has at least one question (recommended)', optional: true },
  ];
});
const canPublishNow = computed(() => status.value === 'DRAFT' && checklist.value.every((c) => c.ok || c.optional));

async function publish() {
  publishing.value = true;
  publishError.value = '';
  try {
    const version = await publishVersion(productUuid.value);
    fill(version);
    remember(version);
    toasted(true, `Version ${version.version} published. The previous published version is archived.`);
  } catch (e) {
    publishError.value = e.message;
  } finally {
    publishing.value = false;
  }
}

function copyToNewVersion() {
  router.push({ path: `${basePath.value}/versions/new`, query: { from: productUuid.value } });
}

// The tab stays out of the URL: MainLayout keys pages by fullPath, so a query change would
// remount the editor and drop unsaved edits. ?tab= is only read when the page opens.
watch(() => [route.params.productUuid, route.query.from], load, { immediate: true });
</script>

<template>
  <div class="pp-page">
    <header class="pp-head">
      <div>
        <button class="pp-link" @click="router.push(`${basePath}/versions`)">← Versions</button>
        <p class="pp-kicker" style="margin-top: .5rem">{{ productName }} · {{ isNew ? 'new version' : 'version' }}</p>
        <h1>
          {{ productClass }} {{ draft.version }}
          <span class="pp-pill" :class="statusTone(status)" style="vertical-align: middle">{{ isNew ? 'Unsaved' : status }}</span>
        </h1>
        <p v-if="saved?.publishedAt" class="pp-sub">Published {{ formatDateTime(saved.publishedAt) }}</p>
      </div>
      <div class="pp-actions">
        <span v-if="editable && dirty" class="muted">Unsaved changes</span>
        <button v-if="!isNew && can('product.create')" class="pp-btn ghost" @click="copyToNewVersion">Copy to new version</button>
        <button v-if="editable" class="pp-btn" :disabled="saving || loading" @click="save">{{ saving ? 'Saving…' : isNew ? 'Create draft' : 'Save draft' }}</button>
      </div>
    </header>

    <p v-if="loadError" class="pp-error">{{ loadError }}</p>
    <p v-if="loading" class="pp-note">Loading version…</p>

    <template v-if="!loading && !loadError">
      <p v-if="status !== 'DRAFT' && !liveFormMode" class="pp-note">
        {{ status === 'PUBLISHED' ? 'Published' : 'Archived' }} versions can't change. To change pricing, copy it to a new draft version, edit, test and publish.
        <template v-if="status === 'PUBLISHED' && can('product.schema.update')">
          To change only the questions,
          <button class="pp-link" @click="router.replace({ query: { tab: 'form', live: '1' } })">edit the live form</button>.
        </template>
      </p>
      <p v-else-if="status === 'DRAFT' && !editable" class="pp-note">You can view this draft but not change it.</p>
      <p v-if="route.query.from && isNew" class="pp-note">Copied from an existing version. Change what you need, then create the draft.</p>

      <p v-if="generalError(saveError, [])" class="pp-error">
        {{ saveError.message }}
        <template v-if="badFormulaIndex >= 0"> · see formula <strong>{{ draft.formulas[badFormulaIndex]?.code }}</strong> on the Pricing tab</template>
      </p>
      <p v-if="localProblems.length && editable" class="pp-warn">
        Fix before saving: {{ localProblems.map((p) => p.text).join(' · ') }}
      </p>

      <nav class="pp-tabs">
        <button v-for="t in TABS" :key="t.id" :class="{ active: tab === t.id }" @click="tab = t.id">
          {{ t.label }}<span v-if="tabProblems.has(t.id)" class="dot"></span>
        </button>
      </nav>

      <!-- General -->
      <section v-if="tab === 'general'" class="pp-card">
        <div class="pp-grid">
          <label class="pp-field">
            Product
            <input :value="productClass" class="mono" disabled />
          </label>
          <label class="pp-field" :class="{ invalid: saveError?.for?.('version') }">
            Version *
            <input v-model.trim="draft.version" :disabled="!editable" placeholder="1.0" />
            <span v-if="saveError?.for?.('version')" class="field-error">{{ saveError.for('version') }}</span>
          </label>
          <label class="pp-field" :class="{ invalid: saveError?.for?.('currency') }">
            Currency
            <input v-model.trim="draft.currency" :disabled="!editable" maxlength="3" />
            <span v-if="saveError?.for?.('currency')" class="field-error">{{ saveError.for('currency') }}</span>
          </label>
          <label class="pp-field" :class="{ invalid: saveError?.for?.('minPremium') }">
            Minimum premium
            <input v-model.number="draft.minPremium" type="number" min="0" step="any" :disabled="!editable" />
            <small>The total premium is never below this.</small>
            <span v-if="saveError?.for?.('minPremium')" class="field-error">{{ saveError.for('minPremium') }}</span>
          </label>
        </div>
      </section>

      <!-- Proposal form -->
      <section v-if="tab === 'form'">
        <p v-if="liveFormMode" class="pp-warn">
          You are editing the live form. Saving creates and publishes the next minor version with these questions; pricing stays the same.
        </p>
        <p class="pp-note">
          Field ids are the names pricing uses: a field <code>age</code> is <code>answers.age</code> in a formula.
          Proposer name, phone, address and the policy period are asked on every proposal, so don't add them here.
        </p>
        <div class="pp-card">
          <FormSchemaBuilder :schema="draft.schema" :readonly="!formEditable" />
        </div>
        <div v-if="liveFormMode" class="pp-actions" style="justify-content: flex-end">
          <button class="pp-btn ghost" @click="router.replace({ query: { tab: 'form' } }); load()">Discard</button>
          <button class="pp-btn" :disabled="saving" @click="saveLiveForm">{{ saving ? 'Publishing…' : 'Save & publish form' }}</button>
        </div>
      </section>

      <!-- Items -->
      <section v-if="tab === 'items'" class="pp-card flush">
        <h2>Insured item types</h2>
        <p class="muted" style="padding: 0 1.2rem .6rem; margin: 0">What can be insured. Each risk item on a proposal has one type and a sum insured.</p>
        <table>
          <thead>
            <tr><th>Code *</th><th>Label</th><th>Required on every proposal</th><th>Order</th><th v-if="editable"></th></tr>
          </thead>
          <tbody>
            <tr v-if="!draft.itemTypes.length"><td colspan="5" class="muted">No item types yet. Publishing needs at least one.</td></tr>
            <tr v-for="(row, i) in draft.itemTypes" :key="i">
              <td><input v-model.trim="row.code" class="pp-input mono" :disabled="!editable" placeholder="PET" @blur="row.code = String(row.code || '').toUpperCase()" /></td>
              <td><input v-model="row.label" class="pp-input" :disabled="!editable" placeholder="Pet" /></td>
              <td><input v-model="row.required" type="checkbox" :disabled="!editable" /></td>
              <td style="width: 6rem"><input v-model.number="row.sortOrder" type="number" class="pp-input" :disabled="!editable" /></td>
              <td v-if="editable"><button class="pp-link danger" @click="removeRow(draft.itemTypes, i)">Remove</button></td>
            </tr>
          </tbody>
        </table>
        <div v-if="editable" style="padding: .8rem 1.2rem"><button class="pp-btn ghost sm" @click="addItemType">+ Add item type</button></div>
      </section>

      <!-- Covers -->
      <section v-if="tab === 'covers'" class="pp-card flush">
        <h2>Covers</h2>
        <p class="muted" style="padding: 0 1.2rem .6rem; margin: 0">
          The rate is a fraction of the sum insured (0.01 = 1%). A cover included in the base is always on at no extra cost; the others are optional add-ons.
        </p>
        <table>
          <thead>
            <tr><th>Code *</th><th>Label</th><th>Rate</th><th>Included in base</th><th>Order</th><th v-if="editable"></th></tr>
          </thead>
          <tbody>
            <tr v-if="!draft.perils.length"><td colspan="6" class="muted">No covers yet.</td></tr>
            <tr v-for="(row, i) in draft.perils" :key="i">
              <td><input v-model.trim="row.code" class="pp-input mono" :disabled="!editable" placeholder="THEFT" @blur="row.code = String(row.code || '').toUpperCase()" /></td>
              <td><input v-model="row.label" class="pp-input" :disabled="!editable" placeholder="Theft" /></td>
              <td style="width: 9rem">
                <input v-model.number="row.rate" type="number" step="any" min="0" class="pp-input" :disabled="!editable" />
                <div class="muted">{{ percent(row.rate) }}</div>
              </td>
              <td><input v-model="row.includedInBase" type="checkbox" :disabled="!editable" /> <span class="muted">{{ row.includedInBase ? 'Always on' : 'Optional' }}</span></td>
              <td style="width: 6rem"><input v-model.number="row.sortOrder" type="number" class="pp-input" :disabled="!editable" /></td>
              <td v-if="editable"><button class="pp-link danger" @click="removeRow(draft.perils, i)">Remove</button></td>
            </tr>
          </tbody>
        </table>
        <div v-if="editable" style="padding: .8rem 1.2rem"><button class="pp-btn ghost sm" @click="addPeril">+ Add cover</button></div>
      </section>

      <!-- Pricing -->
      <section v-if="tab === 'pricing'">
        <div class="pp-card pp-actions">
          <strong style="margin-right: .5rem">Pricing mode</strong>
          <label class="pp-check"><input v-model="pricingMode" type="radio" value="grid" :disabled="!editable" /> Rate grid</label>
          <label class="pp-check"><input v-model="pricingMode" type="radio" value="formulas" :disabled="!editable" /> Formulas (advanced)</label>
          <span v-if="pricingMode === 'grid' && draft.formulas.length && editable" class="pp-pill amber">Saving removes the {{ draft.formulas.length }} formulas</span>
        </div>

        <div :class="pricingMode === 'formulas' ? 'pp-split' : ''">
          <div>
            <template v-if="pricingMode === 'formulas'">
              <section class="pp-card flush">
                <h2>Formulas</h2>
                <p class="muted" style="padding: 0 1.2rem .6rem; margin: 0">
                  Run in order. A later formula can use an earlier one by its code. Expressions are checked when you save.
                </p>
                <table>
                  <thead>
                    <tr><th style="width: 5rem">Order</th><th style="width: 9rem">Code *</th><th style="width: 12rem">Label / type</th><th>Expression *</th><th v-if="editable"></th></tr>
                  </thead>
                  <tbody>
                    <tr v-if="!draft.formulas.length"><td colspan="5" class="muted">No formulas yet.</td></tr>
                    <template v-for="(row, i) in draft.formulas" :key="i">
                      <tr :class="{ 'row-error': badFormulaIndex === i }">
                        <td><input v-model.number="row.sortOrder" type="number" class="pp-input" :disabled="!editable" /></td>
                        <td><input v-model.trim="row.code" class="pp-input mono" :disabled="!editable" placeholder="BASE" /></td>
                        <td>
                          <input v-model="row.label" class="pp-input" :disabled="!editable" placeholder="Base premium" style="margin-bottom: .35rem" />
                          <select v-model="row.componentType" class="pp-input" :disabled="!editable">
                            <option v-for="t in COMPONENT_TYPES" :key="t" :value="t">{{ t }}</option>
                          </select>
                        </td>
                        <td><textarea v-model="row.expression" rows="2" class="pp-input" :class="{ invalid: badFormulaIndex === i }" :disabled="!editable" placeholder="sumInsured * 0.025"></textarea></td>
                        <td v-if="editable"><button class="pp-link danger" @click="removeRow(draft.formulas, i)">Remove</button></td>
                      </tr>
                      <tr v-if="badFormulaIndex === i" class="row-error">
                        <td></td>
                        <td colspan="4"><span class="field-error">{{ saveError?.message }}</span></td>
                      </tr>
                    </template>
                  </tbody>
                </table>
                <div v-if="editable" class="pp-actions" style="padding: .8rem 1.2rem">
                  <button class="pp-btn ghost sm" @click="addFormula">+ Add formula</button>
                  <button class="pp-btn ghost sm" @click="insertTemplate">Insert example set</button>
                </div>
              </section>
              <p class="pp-note">The rate grid below stays available to formulas through <code>fn:rate(class, occupancy)</code>.</p>
            </template>

            <section class="pp-card flush">
              <h2>Rate grid</h2>
              <p class="muted" style="padding: 0 1.2rem .6rem; margin: 0">
                Rate as a fraction of the sum insured. <code>*</code> matches anything. Lookup tries exact, then class + <code>*</code>, then
                <code>*</code> + occupancy, then <code>*</code> + <code>*</code>. Proposal answers <code>ratingClass</code> (or <code>constructionClass</code>)
                and <code>occupancyCode</code> pick the row.
              </p>
              <table>
                <thead><tr><th>Construction / rating class</th><th>Occupancy</th><th>Rate</th><th v-if="editable"></th></tr></thead>
                <tbody>
                  <tr v-if="!draft.rates.length"><td colspan="4" class="muted">No rate rows.</td></tr>
                  <tr v-for="(row, i) in draft.rates" :key="i">
                    <td><input v-model.trim="row.constructionClass" class="pp-input mono" :disabled="!editable" /></td>
                    <td><input v-model.trim="row.occupancyCode" class="pp-input mono" :disabled="!editable" /></td>
                    <td style="width: 10rem">
                      <input v-model.number="row.rate" type="number" step="any" min="0" class="pp-input" :disabled="!editable" />
                      <div class="muted">{{ percent(row.rate) }}</div>
                    </td>
                    <td v-if="editable"><button class="pp-link danger" @click="removeRow(draft.rates, i)">Remove</button></td>
                  </tr>
                </tbody>
              </table>
              <div v-if="editable" style="padding: .8rem 1.2rem"><button class="pp-btn ghost sm" @click="addRate">+ Add rate row</button></div>
            </section>

            <section v-if="pricingMode === 'grid'" class="pp-card flush">
              <h2>Loadings &amp; discounts</h2>
              <p class="muted" style="padding: 0 1.2rem .6rem; margin: 0">
                Percent is a fraction of the base (0.10 = +10%, negative = discount), applied when the answer to the trigger field equals the trigger value.
                Premium = base + loadings + selected covers, at least the minimum premium.
              </p>
              <table>
                <thead><tr><th>Code</th><th>Label</th><th>Percent</th><th>When field</th><th>equals</th><th v-if="editable"></th></tr></thead>
                <tbody>
                  <tr v-if="!draft.loadings.length"><td colspan="6" class="muted">No loadings.</td></tr>
                  <tr v-for="(row, i) in draft.loadings" :key="i">
                    <td><input v-model.trim="row.code" class="pp-input mono" :disabled="!editable" /></td>
                    <td><input v-model="row.label" class="pp-input" :disabled="!editable" /></td>
                    <td style="width: 8rem">
                      <input v-model.number="row.percent" type="number" step="any" class="pp-input" :disabled="!editable" />
                      <div class="muted">{{ percent(row.percent) }}</div>
                    </td>
                    <td>
                      <select v-model="row.triggerField" class="pp-input mono" :disabled="!editable">
                        <option value="">—</option>
                        <option v-for="id in fieldIds" :key="id" :value="id">{{ id }}</option>
                        <option v-if="row.triggerField && !fieldIds.includes(row.triggerField)" :value="row.triggerField">{{ row.triggerField }}</option>
                      </select>
                    </td>
                    <td><input v-model="row.triggerValue" class="pp-input" :disabled="!editable" /></td>
                    <td v-if="editable"><button class="pp-link danger" @click="removeRow(draft.loadings, i)">Remove</button></td>
                  </tr>
                </tbody>
              </table>
              <div v-if="editable" style="padding: .8rem 1.2rem"><button class="pp-btn ghost sm" @click="addLoading">+ Add loading</button></div>
            </section>
          </div>

          <FormulaHelp v-if="pricingMode === 'formulas'" :field-ids="fieldIds" :formula-codes="formulaCodes" :peril-codes="perilCodes" />
        </div>
      </section>

      <!-- Test -->
      <section v-if="tab === 'test'">
        <p v-if="isNew" class="pp-note">Create the draft first. The test prices the saved version.</p>
        <template v-else>
          <p v-if="dirty" class="pp-warn">You have unsaved changes. The test uses the saved version, so save first to test them.</p>
          <p v-if="!saved?.formulas?.length" class="pp-note">
            The test runs the formulas only. For a rate-grid version, check pricing with a proposal and its quote preview.
          </p>
          <div class="pp-split">
            <div>
              <section class="pp-card">
                <h2>Sample answers</h2>
                <SchemaFields :schema="draft.schema" :answers="testAnswers" compact show-ids />
                <p v-if="!fieldIds.length" class="muted">This form has no questions.</p>
              </section>

              <section class="pp-card flush">
                <h2>Risk items</h2>
                <table>
                  <thead><tr><th>Type</th><th>Description</th><th class="num">Sum insured</th><th></th></tr></thead>
                  <tbody>
                    <tr v-for="(row, i) in testItems" :key="i">
                      <td>
                        <select v-model="row.itemType" class="pp-input">
                          <option v-for="t in draft.itemTypes" :key="t.code" :value="t.code">{{ t.label || t.code }}</option>
                        </select>
                      </td>
                      <td><input v-model="row.description" class="pp-input" /></td>
                      <td style="width: 10rem"><input v-model.number="row.sumInsured" type="number" min="0" step="any" class="pp-input" /></td>
                      <td><button class="pp-link danger" :disabled="testItems.length === 1" @click="removeRow(testItems, i)">Remove</button></td>
                    </tr>
                  </tbody>
                </table>
                <div style="padding: .8rem 1.2rem">
                  <button class="pp-btn ghost sm" @click="testItems.push({ itemType: draft.itemTypes[0]?.code || '', description: '', sumInsured: 0 })">+ Add item</button>
                </div>
              </section>

              <section v-if="optionalPerils.length" class="pp-card">
                <h2>Optional covers</h2>
                <div class="pp-checks">
                  <label v-for="p in optionalPerils" :key="p.code" class="pp-check">
                    <input v-model="testPerils" type="checkbox" :value="p.code" /> {{ p.label || p.code }} <code>{{ p.code }}</code>
                  </label>
                </div>
              </section>

              <section class="pp-card">
                <label class="pp-field">
                  Scratch expression (optional)
                  <input v-model="testExpression" class="mono" placeholder="BASE + AGE" />
                  <small>Evaluated after the formulas, with the same variables. Not saved.</small>
                </label>
              </section>

              <div class="pp-actions" style="justify-content: flex-end">
                <button class="pp-btn ghost" @click="resetTestInputs">Reset</button>
                <button class="pp-btn" :disabled="testing" @click="runTest">{{ testing ? 'Pricing…' : 'Run test' }}</button>
              </div>
            </div>

            <div>
              <p v-if="testError" class="pp-error">{{ testError }}</p>
              <template v-if="testResult">
                <PremiumBreakdown :result="testResult" title="Test result" />
                <section v-if="testResult.expressionResult !== undefined && testExpression" class="pp-card">
                  <h3>Scratch result</h3>
                  <p class="mono" style="margin: 0; font-size: 1.1rem">{{ testResult.expressionResult ?? 'null' }}</p>
                </section>
              </template>
              <p v-else-if="!testError" class="pp-note">Enter sample data and run the test. Nothing is saved.</p>
            </div>
          </div>
        </template>
      </section>

      <!-- Publish -->
      <section v-if="tab === 'publish'" class="pp-card">
        <h2>Publish</h2>
        <template v-if="status === 'DRAFT'">
          <ul style="list-style: none; padding: 0; margin: 0 0 1rem">
            <li v-for="item in checklist" :key="item.text" style="padding: .3rem 0">
              <span :style="{ color: item.ok ? 'rgb(var(--success))' : item.optional ? 'rgb(var(--warning))' : 'rgb(var(--error))', fontWeight: 700 }">
                {{ item.ok ? '✓' : item.optional ? '!' : '✗' }}
              </span>
              {{ item.text }}
            </li>
          </ul>
          <p class="pp-note">
            Publishing makes this version the one new proposals use and archives the version published now.
            Published versions can't be edited; existing proposals stay on the version they were created with.
          </p>
          <p v-if="publishError" class="pp-error">{{ publishError }}</p>
          <button v-if="can('product.publish')" class="pp-btn" :disabled="!canPublishNow || publishing" @click="publish">
            {{ publishing ? 'Publishing…' : `Publish version ${saved?.version || draft.version}` }}
          </button>
          <p v-else class="muted">You don't have permission to publish versions of this product.</p>
        </template>
        <template v-else>
          <p class="pp-ok" v-if="status === 'PUBLISHED'">This version is live. New proposals use it.</p>
          <p class="pp-note" v-else>This version is archived. Proposals created on it still open.</p>
          <div class="pp-actions">
            <button class="pp-btn ghost" @click="router.push(`${basePath}/proposals`)">Go to proposals</button>
            <button v-if="can('product.create')" class="pp-btn" @click="copyToNewVersion">Copy to new version</button>
          </div>
        </template>
      </section>
    </template>
  </div>
</template>
