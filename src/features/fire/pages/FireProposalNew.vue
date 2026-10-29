<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiError, createProposal, fetchProduct, fetchProposal, fetchPublishedProduct, updateProposal } from '../api/fireApi.js';
import { usePcModule } from '@/features/pc/pcModule.js';
import {
  defaultAnswers,
  fieldRequired,
  fieldVisible,
  hydrateAnswers,
  optionList,
  parseSchema,
  validateAnswers,
} from '../schemaForm.js';

const route = useRoute();
const router = useRouter();
const pc = usePcModule();
const product = ref(null);
const existing = ref(null);
const answers = ref({});
const loading = ref(false);
const saving = ref(false);
const error = ref('');

const proposalUuid = computed(() => route.params.proposalUuid);
const isEdit = computed(() => Boolean(proposalUuid.value));
const canSave = computed(() => !isEdit.value || existing.value?.status === 'DRAFT');
const schema = computed(() => parseSchema(product.value));
const steps = computed(() => schema.value.steps);

function isCheck(field) {
  return field.type === 'boolean' || field.type === 'toggle';
}

function addScheduleRow(field) {
  const types = product.value?.itemTypes || [];
  const next = types.find((type) => !type.required) || types[0];
  const rows = [...(answers.value[field.id] || [])];
  rows.push({ itemType: next?.code || 'OTHER', description: '', sumInsured: 0 });
  answers.value[field.id] = rows;
}

function removeScheduleRow(field, index) {
  const rows = [...(answers.value[field.id] || [])];
  if (rows.length === 1) return;
  rows.splice(index, 1);
  answers.value[field.id] = rows;
}

function proposalPayload() {
  const payload = answers.value;
  return {
    productClass: pc.value.productClass,
    proposerName: payload.proposerName,
    proposerPhone: payload.proposerPhone,
    proposerAddress: payload.proposerAddress,
    occupation: payload.occupation,
    riskAddress: payload.riskAddress,
    periodFrom: payload.periodFrom,
    periodTo: payload.periodTo,
    answersJson: JSON.stringify(payload),
    perilCodes: payload.selectedPerils || [],
    riskItems: payload.riskItems || [],
  };
}

async function loadProduct() {
  loading.value = true;
  error.value = '';
  existing.value = null;
  try {
    if (isEdit.value) {
      existing.value = await fetchProposal(proposalUuid.value);
      if (existing.value.productUuid) {
        try {
          product.value = await fetchProduct(existing.value.productUuid);
        } catch {
          product.value = await fetchPublishedProduct(pc.value.productClass);
        }
      } else {
        product.value = await fetchPublishedProduct(pc.value.productClass);
      }
      answers.value = hydrateAnswers(existing.value, parseSchema(product.value).steps, product.value);
      if (existing.value.status !== 'DRAFT') {
        error.value = 'Only draft proposals can be edited. Submit, quotation, and policy stay on the version already captured.';
      }
    } else {
      product.value = await fetchPublishedProduct(pc.value.productClass);
      answers.value = defaultAnswers(parseSchema(product.value).steps, product.value);
    }
  } catch (e) {
    error.value = apiError(e);
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (!canSave.value) return;
  error.value = validateAnswers(steps.value, answers.value);
  if (error.value) return;
  saving.value = true;
  try {
    const saved = isEdit.value
      ? await updateProposal(proposalUuid.value, proposalPayload())
      : await createProposal(proposalPayload());
    router.push(`${pc.value.basePath}/proposals/${saved.proposalUuid}`);
  } catch (e) {
    error.value = apiError(e);
  } finally {
    saving.value = false;
  }
}

function cancel() {
  if (isEdit.value) {
    router.push(`${pc.value.basePath}/proposals/${proposalUuid.value}`);
  } else {
    router.push(`${pc.value.basePath}/proposals`);
  }
}

watch(proposalUuid, loadProduct, { immediate: true });
</script>

<template>
  <div class="fire-page">
    <header class="fire-head">
      <div>
        <p class="fire-kicker">{{ pc.kicker }} proposal</p>
        <h1>{{ isEdit ? `Edit ${existing?.proposerName || pc.label + ' proposal'}` : (schema.title || `New ${pc.label} proposal`) }}</h1>
        <p class="fire-sub">
          {{ isEdit
            ? 'Change answers on this draft, then save. Submit for quotation is a separate step.'
            : `Questions come from the published ${pc.label} form. Add or remove them in Proposal Form Builder, then publish.` }}
        </p>
      </div>
      <router-link class="fire-btn ghost" :to="pc.formBuilderPath">Edit form</router-link>
    </header>

    <p v-if="loading" class="fire-note">{{ isEdit ? `Loading ${pc.label} draft…` : `Loading published ${pc.label} form…` }}</p>
    <p v-if="error" class="fire-error">{{ error }}</p>
    <p v-else-if="!loading && !steps.length" class="fire-note">No questions published for {{ pc.label }} yet. Open Proposal Form Builder to add them.</p>

    <form v-if="product && steps.length" class="fire-form" @submit.prevent="submit">
      <section v-for="step in steps" :key="step.stepId" class="fire-card">
        <h2>{{ step.stepTitle }}</h2>
        <div class="grid-2">
          <template v-for="field in step.fields" :key="field.id">
            <div v-if="field.type === 'header'" class="span-2 section-label">{{ field.label }}</div>

            <label v-else-if="field.type === 'schedule' && fieldVisible(field, answers)" class="span-2">
              {{ field.label }}
              <div v-for="(row, index) in answers[field.id] || []" :key="index" class="item-row">
                <select v-model="row.itemType">
                  <option v-for="type in product.itemTypes" :key="type.code" :value="type.code">{{ type.label }}</option>
                </select>
                <input v-model="row.description" placeholder="Description" />
                <input v-model.number="row.sumInsured" type="number" min="0.01" step="0.01" />
                <button type="button" class="link" @click="removeScheduleRow(field, index)">Remove</button>
              </div>
              <button type="button" class="fire-btn ghost" @click="addScheduleRow(field)">Add item</button>
            </label>

            <div v-else-if="field.type === 'multiselect' && fieldVisible(field, answers)" class="span-2">
              <span class="field-label">{{ field.label }}</span>
              <div class="checks">
                <label v-for="option in optionList(field, product)" :key="option.value" class="check">
                  <input v-model="answers[field.id]" type="checkbox" :value="option.value" />
                  {{ option.label }}
                </label>
              </div>
            </div>

            <label v-else-if="isCheck(field) && fieldVisible(field, answers)" class="check-field">
              <span>{{ field.label }}{{ fieldRequired(field, answers) ? ' *' : '' }}</span>
              <input v-model="answers[field.id]" type="checkbox" />
            </label>

            <label v-else-if="field.type === 'dropdown' && fieldVisible(field, answers)">
              {{ field.label }}{{ fieldRequired(field, answers) ? ' *' : '' }}
              <select v-model="answers[field.id]" :required="fieldRequired(field, answers)">
                <option disabled value="">Select</option>
                <option v-for="option in optionList(field, product)" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>

            <label v-else-if="fieldVisible(field, answers)">
              {{ field.label }}{{ fieldRequired(field, answers) ? ' *' : '' }}
              <input
                v-model="answers[field.id]"
                :type="field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'"
                :placeholder="field.placeholder || ''"
                :required="fieldRequired(field, answers)"
              />
              <small v-if="field.helpText">{{ field.helpText }}</small>
            </label>
          </template>
        </div>
      </section>

      <div class="fire-actions">
        <button type="button" class="fire-btn ghost" @click="cancel">Cancel</button>
        <button type="submit" class="fire-btn" :disabled="saving || !canSave">
          {{ saving ? 'Saving…' : isEdit ? 'Save draft' : 'Create proposal' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.fire-page { padding: 1.5rem 1.75rem 3rem; max-width: 980px; }
.fire-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
.fire-kicker { text-transform: uppercase; letter-spacing: .08em; font-size: .7rem; color: #c2410c; font-weight: 700; margin: 0 0 .35rem; }
h1 { margin: 0; font-size: 1.6rem; }
.fire-sub { margin: .4rem 0 1.2rem; color: #57534e; }
.fire-card { background: rgb(var(--surface)); border: 1px solid #e7e5e4; border-radius: 1rem; padding: 1.1rem 1.2rem; margin-bottom: 1rem; }
.fire-card h2 { margin: 0 0 .9rem; font-size: 1rem; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem 1rem; }
.span-2 { grid-column: span 2; }
label { display: flex; flex-direction: column; gap: .3rem; font-size: .8rem; font-weight: 600; color: #44403c; }
.field-label { display: block; font-size: .8rem; font-weight: 600; color: #44403c; margin-bottom: .4rem; }
input, select { border: 1px solid #d6d3d1; border-radius: .5rem; padding: .5rem .65rem; font-weight: 500; }
small { font-weight: 500; color: #78716c; }
.checks { display: flex; flex-wrap: wrap; gap: .6rem 1.1rem; }
.check, .check-field { flex-direction: row; align-items: center; font-weight: 500; }
.check-field input, .check input { width: auto; }
.item-row { display: grid; grid-template-columns: 1.4fr 1.4fr .8fr auto; gap: .5rem; margin-bottom: .5rem; align-items: center; }
.fire-btn { background: #ea580c; color: #fff; border: 0; border-radius: .6rem; padding: .6rem 1.1rem; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; }
.fire-btn.ghost { background: rgb(var(--surface)); color: #9a3412; border: 1px solid #fdba74; }
.fire-error, .fire-note { padding: .9rem 1rem; border-radius: .7rem; margin-bottom: 1rem; }
.fire-error { background: var(--tint-fef2f2, #fef2f2); color: #991b1b; }
.fire-note { background: var(--tint-fff7ed, #fff7ed); color: #9a3412; }
.link { background: none; border: 0; color: #c2410c; cursor: pointer; }
.fire-actions { display: flex; justify-content: flex-end; gap: .5rem; }
.section-label { font-size: .85rem; font-weight: 700; color: #9a3412; }
@media (max-width: 800px) {
  .grid-2, .item-row { grid-template-columns: 1fr; }
}
</style>
