<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toasted } from '@/utils/utils';
import { createProposal, getProposal, getPublishedVersion, getVersion, setProposalPerils, updateProposal } from '../api/productsApi';
import { blankAnswers, generalError, missingRequired, money, parseFormSchema, parseJson, typedAnswers, useProductContext } from '../productUtils';
import SchemaFields from '../components/SchemaFields.vue';
import '../products-ui.css';

const route = useRoute();
const router = useRouter();
const { productClass, productName, retired, basePath, can } = useProductContext();

const proposalUuid = computed(() => route.params.proposalUuid || null);
const isEdit = computed(() => Boolean(proposalUuid.value));
const version = ref(null);
const existing = ref(null);
const loading = ref(false);
const saving = ref(false);
const loadError = ref('');
const saveError = ref(null);
const invalidField = ref('');

const schema = computed(() => parseFormSchema(version.value?.schemaJson));
const itemTypes = computed(() => version.value?.itemTypes || []);
const basePerils = computed(() => (version.value?.perils || []).filter((p) => p.includedInBase));
const optionalPerils = computed(() => (version.value?.perils || []).filter((p) => !p.includedInBase));
const totalSumInsured = computed(() => items.value.reduce((sum, row) => sum + (Number(row.sumInsured) || 0), 0));

const today = new Date().toISOString().slice(0, 10);
const yearOn = new Date(Date.now() + 364 * 24 * 3600 * 1000).toISOString().slice(0, 10);
const proposer = reactive({ proposerName: '', proposerPhone: '', proposerAddress: '', periodFrom: today, periodTo: yearOn });
const answers = ref({});
const items = ref([]);
const perilCodes = ref([]);

const canSave = computed(() => (isEdit.value ? existing.value?.status === 'DRAFT' && can('proposal.update') : can('proposal.create') && !retired.value));

function seedItems() {
  const required = itemTypes.value.filter((t) => t.required);
  const seed = required.length ? required : itemTypes.value.slice(0, 1);
  items.value = seed.map((t) => ({ itemType: t.code, description: '', sumInsured: '' }));
}

async function load() {
  loading.value = true;
  loadError.value = '';
  saveError.value = null;
  try {
    if (isEdit.value) {
      existing.value = await getProposal(proposalUuid.value);
      // A proposal stays on the version it was created with
      version.value = existing.value.productUuid
        ? await getVersion(existing.value.productUuid).catch(() => getPublishedVersion(productClass.value))
        : await getPublishedVersion(productClass.value);
      Object.assign(proposer, {
        proposerName: existing.value.proposerName || '',
        proposerPhone: existing.value.proposerPhone || '',
        proposerAddress: existing.value.proposerAddress || '',
        periodFrom: String(existing.value.periodFrom || today).slice(0, 10),
        periodTo: String(existing.value.periodTo || yearOn).slice(0, 10),
      });
      answers.value = { ...blankAnswers(schema.value), ...parseJson(existing.value.answersJson, {}) };
      items.value = (existing.value.riskItems || []).map((row) => ({ itemType: row.itemType, description: row.description || '', sumInsured: row.sumInsured }));
      if (!items.value.length) seedItems();
      perilCodes.value = [...(existing.value.selectedPerils || existing.value.perilCodes || [])];
    } else {
      existing.value = null;
      version.value = await getPublishedVersion(productClass.value);
      answers.value = blankAnswers(schema.value);
      seedItems();
      perilCodes.value = [];
    }
  } catch (e) {
    loadError.value = e.status === 404 && !isEdit.value
      ? `${productName.value} has no published version yet. Publish a version before taking proposals.`
      : e.message;
  } finally {
    loading.value = false;
  }
}

function validate() {
  invalidField.value = '';
  if (!proposer.proposerName.trim()) return fail('proposerName', 'Proposer name is required');
  if (!proposer.periodFrom || !proposer.periodTo) return fail('periodFrom', 'The policy period is required');
  if (proposer.periodTo < proposer.periodFrom) return fail('periodTo', 'The period must end after it starts');
  const missing = missingRequired(schema.value, answers.value);
  if (missing) return fail(missing.id, `${missing.label || missing.id} is required`);
  if (!items.value.length) return fail('riskItems', 'Add at least one insured item');
  if (items.value.some((row) => !row.itemType || !(Number(row.sumInsured) > 0))) return fail('riskItems', 'Every insured item needs a type and a sum insured above 0');
  const present = new Set(items.value.map((row) => row.itemType));
  const missingTypes = itemTypes.value.filter((t) => t.required && !present.has(t.code));
  if (missingTypes.length) return fail('riskItems', `Add the required items: ${missingTypes.map((t) => t.label || t.code).join(', ')}`);
  return true;
}

function fail(field, message) {
  invalidField.value = field;
  saveError.value = { message, for: (f) => (f === field ? message : '') };
  return false;
}

function body() {
  return {
    productClass: productClass.value,
    proposerName: proposer.proposerName.trim(),
    proposerPhone: proposer.proposerPhone.trim(),
    proposerAddress: proposer.proposerAddress.trim(),
    periodFrom: proposer.periodFrom,
    periodTo: proposer.periodTo,
    answersJson: JSON.stringify(typedAnswers(schema.value, answers.value)),
    perilCodes: [...perilCodes.value],
    riskItems: items.value.map((row) => ({ itemType: row.itemType, description: row.description, sumInsured: Number(row.sumInsured) })),
  };
}

async function save() {
  saveError.value = null;
  if (!canSave.value || !validate()) return;
  saving.value = true;
  try {
    let saved;
    if (isEdit.value) {
      saved = await updateProposal(proposalUuid.value, body());
      saved = (await setProposalPerils(proposalUuid.value, [...perilCodes.value])) || saved;
    } else {
      saved = await createProposal(body());
    }
    toasted(true, isEdit.value ? 'Proposal saved' : 'Proposal created');
    router.push(`${basePath.value}/proposals/${saved?.proposalUuid || proposalUuid.value}`);
  } catch (e) {
    saveError.value = e;
    invalidField.value = e.field || Object.keys(e.fieldErrors || {})[0] || '';
  } finally {
    saving.value = false;
  }
}

function addItem() {
  const next = itemTypes.value.find((t) => !t.required) || itemTypes.value[0];
  items.value.push({ itemType: next?.code || '', description: '', sumInsured: '' });
}

function cancel() {
  router.push(isEdit.value ? `${basePath.value}/proposals/${proposalUuid.value}` : `${basePath.value}/proposals`);
}

watch(() => [productClass.value, proposalUuid.value], load, { immediate: true });
</script>

<template>
  <div class="pp-page">
    <header class="pp-head">
      <div>
        <button class="pp-link" @click="cancel">← {{ isEdit ? 'Proposal' : 'Proposals' }}</button>
        <p class="pp-kicker" style="margin-top: .5rem">{{ productName }} · proposal</p>
        <h1>{{ isEdit ? `Edit ${existing?.proposerName || 'proposal'}` : schema.title || `New ${productName} proposal` }}</h1>
        <p v-if="version" class="pp-sub">Form version {{ version.version }}<template v-if="isEdit"> (the version this proposal was created on)</template></p>
      </div>
    </header>

    <p v-if="loading" class="pp-note">Loading the {{ productName }} form…</p>
    <p v-if="loadError" class="pp-error">{{ loadError }}</p>
    <p v-if="!isEdit && retired" class="pp-error">{{ productName }} is retired, so new proposals are not accepted.</p>
    <p v-else-if="!isEdit && !can('proposal.create')" class="pp-note">You don't have permission to create {{ productName }} proposals.</p>
    <p v-if="isEdit && existing && existing.status !== 'DRAFT'" class="pp-note">Only draft proposals can be edited. This one is {{ existing.status }}.</p>
    <p v-if="generalError(saveError, ['proposerName', 'proposerPhone', 'proposerAddress', 'periodFrom', 'periodTo'])" class="pp-error">
      {{ saveError.message }}
    </p>

    <form v-if="version && !loading && !loadError && (isEdit || !retired)" @submit.prevent="save">
      <section class="pp-card">
        <h2>Proposer &amp; period</h2>
        <div class="pp-grid">
          <label class="pp-field span-2" :class="{ invalid: invalidField === 'proposerName' }">
            Proposer name *
            <input v-model="proposer.proposerName" :disabled="!canSave" />
            <span v-if="saveError?.for?.('proposerName')" class="field-error">{{ saveError.for('proposerName') }}</span>
          </label>
          <label class="pp-field" :class="{ invalid: invalidField === 'proposerPhone' }">
            Phone
            <input v-model="proposer.proposerPhone" :disabled="!canSave" placeholder="0911000000" />
            <span v-if="saveError?.for?.('proposerPhone')" class="field-error">{{ saveError.for('proposerPhone') }}</span>
          </label>
          <label class="pp-field" :class="{ invalid: invalidField === 'proposerAddress' }">
            Address
            <input v-model="proposer.proposerAddress" :disabled="!canSave" />
            <span v-if="saveError?.for?.('proposerAddress')" class="field-error">{{ saveError.for('proposerAddress') }}</span>
          </label>
          <label class="pp-field" :class="{ invalid: invalidField === 'periodFrom' }">
            Period from *
            <input v-model="proposer.periodFrom" type="date" :disabled="!canSave" />
            <span v-if="saveError?.for?.('periodFrom')" class="field-error">{{ saveError.for('periodFrom') }}</span>
          </label>
          <label class="pp-field" :class="{ invalid: invalidField === 'periodTo' }">
            Period to *
            <input v-model="proposer.periodTo" type="date" :disabled="!canSave" />
            <span v-if="saveError?.for?.('periodTo')" class="field-error">{{ saveError.for('periodTo') }}</span>
          </label>
        </div>
      </section>

      <SchemaFields :schema="schema" :answers="answers" :disabled="!canSave" :invalid-field="invalidField" />

      <section class="pp-card flush" :style="invalidField === 'riskItems' ? 'border-color: rgb(var(--error))' : ''">
        <h2>Insured items</h2>
        <table>
          <thead><tr><th>Type</th><th>Description</th><th class="num">Sum insured</th><th></th></tr></thead>
          <tbody>
            <tr v-for="(row, i) in items" :key="i">
              <td>
                <select v-model="row.itemType" class="pp-input" :disabled="!canSave">
                  <option v-for="t in itemTypes" :key="t.code" :value="t.code">{{ t.label || t.code }}{{ t.required ? ' (required)' : '' }}</option>
                </select>
              </td>
              <td><input v-model="row.description" class="pp-input" :disabled="!canSave" /></td>
              <td style="width: 12rem"><input v-model.number="row.sumInsured" type="number" min="0" step="any" class="pp-input" :disabled="!canSave" /></td>
              <td><button type="button" class="pp-link danger" :disabled="!canSave || items.length === 1" @click="items.splice(i, 1)">Remove</button></td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td colspan="2"><strong>Total sum insured</strong></td><td class="num"><strong>{{ money(totalSumInsured, version.currency) }}</strong></td><td></td></tr>
          </tfoot>
        </table>
        <div style="padding: .8rem 1.2rem">
          <button type="button" class="pp-btn ghost sm" :disabled="!canSave" @click="addItem">+ Add item</button>
          <span v-if="saveError?.for?.('riskItems')" class="field-error" style="margin-left: .8rem">{{ saveError.for('riskItems') }}</span>
        </div>
      </section>

      <section v-if="version.perils?.length" class="pp-card">
        <h2>Covers</h2>
        <div class="pp-checks">
          <label v-for="p in basePerils" :key="p.code" class="pp-check" title="Included in the base cover">
            <input type="checkbox" checked disabled /> {{ p.label || p.code }} <span class="pp-pill green">Included</span>
          </label>
          <label v-for="p in optionalPerils" :key="p.code" class="pp-check">
            <input v-model="perilCodes" type="checkbox" :value="p.code" :disabled="!canSave" /> {{ p.label || p.code }}
          </label>
        </div>
      </section>

      <div class="pp-actions" style="justify-content: flex-end">
        <button type="button" class="pp-btn ghost" @click="cancel">Cancel</button>
        <button type="submit" class="pp-btn" :disabled="saving || !canSave">{{ saving ? 'Saving…' : isEdit ? 'Save draft' : 'Create proposal' }}</button>
      </div>
    </form>
  </div>
</template>
