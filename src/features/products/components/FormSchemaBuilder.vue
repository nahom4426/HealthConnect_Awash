<script setup>
import { computed, ref } from 'vue';
import { FIELD_TYPES, IDENTIFIER } from '../productUtils';

// Edits a step form in place: { title, productClass, version, steps: [{ stepId, stepTitle, fields }] }.
// Field ids are what pricing formulas read (answers.<id>), so they are the first column.
const props = defineProps({
  schema: { type: Object, required: true },
  readonly: { type: Boolean, default: false },
});

const showJson = ref(false);
const jsonText = ref('');
const jsonError = ref('');

const allIds = computed(() => props.schema.steps.flatMap((s) => (s.fields || []).filter((f) => f.type !== 'header').map((f) => f.id)));

function idProblem(field) {
  if (field.type === 'header') return '';
  if (!field.id) return 'Required';
  if (!IDENTIFIER.test(field.id)) return 'Letters, digits and _ only; not starting with a digit';
  if (allIds.value.filter((id) => id === field.id).length > 1) return 'Used twice';
  return '';
}

function addStep() {
  const n = props.schema.steps.length + 1;
  props.schema.steps.push({ stepId: `step_${n}`, stepTitle: `${n}. New step`, fields: [] });
}

function removeStep(index) {
  props.schema.steps.splice(index, 1);
}

function moveStep(index, delta) {
  const steps = props.schema.steps;
  const target = index + delta;
  if (target < 0 || target >= steps.length) return;
  [steps[index], steps[target]] = [steps[target], steps[index]];
}

function addField(step) {
  if (!step.fields) step.fields = [];
  let n = step.fields.length + 1;
  while (allIds.value.includes(`field${n}`)) n += 1;
  step.fields.push({ id: `field${n}`, type: 'text', label: 'New question', required: false });
}

function removeField(step, index) {
  step.fields.splice(index, 1);
}

function moveField(step, index, delta) {
  const target = index + delta;
  if (target < 0 || target >= step.fields.length) return;
  [step.fields[index], step.fields[target]] = [step.fields[target], step.fields[index]];
}

function onTypeChange(field) {
  if (field.type === 'dropdown' && !Array.isArray(field.options)) {
    field.options = [{ value: 'A', label: 'Option A' }, { value: 'B', label: 'Option B' }];
  }
  if (field.type !== 'dropdown') delete field.options;
  if (field.type === 'header') field.required = false;
}

/** Dropdown options as "VALUE=Label" lines, so they can be typed quickly. */
function optionsText(field) {
  return (field.options || []).map((o) => (o.label && o.label !== o.value ? `${o.value}=${o.label}` : o.value)).join('\n');
}

function setOptions(field, text) {
  field.options = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, ...rest] = line.split('=');
      const label = rest.join('=').trim();
      return { value: value.trim(), label: label || value.trim() };
    });
}

function openJson() {
  jsonText.value = JSON.stringify(props.schema, null, 2);
  jsonError.value = '';
  showJson.value = true;
}

function applyJson() {
  try {
    const parsed = JSON.parse(jsonText.value);
    if (!Array.isArray(parsed.steps)) throw new Error('The form needs a "steps" array');
    Object.keys(props.schema).forEach((key) => delete props.schema[key]);
    Object.assign(props.schema, parsed);
    showJson.value = false;
  } catch (e) {
    jsonError.value = e.message;
  }
}
</script>

<template>
  <div>
    <div class="pp-grid" style="margin-bottom: 1rem">
      <label class="pp-field span-2">
        Form title
        <input v-model="schema.title" :disabled="readonly" placeholder="e.g. Pet Care Proposal Form" />
      </label>
    </div>

    <p v-if="!schema.steps.length" class="pp-note">No steps yet. Add a step, then add its questions.</p>

    <section v-for="(step, si) in schema.steps" :key="si" class="pp-card" style="background: rgb(var(--surface-muted))">
      <div class="pp-actions" style="margin-bottom: .75rem">
        <label class="pp-field" style="flex: 1 1 18rem">
          Step title
          <input v-model="step.stepTitle" :disabled="readonly" />
        </label>
        <label class="pp-field" style="flex: 0 1 10rem">
          Step id
          <input v-model="step.stepId" class="mono" :disabled="readonly" />
        </label>
        <div v-if="!readonly" class="pp-actions" style="align-self: flex-end">
          <button type="button" class="pp-btn ghost sm" :disabled="si === 0" title="Move up" @click="moveStep(si, -1)">↑</button>
          <button type="button" class="pp-btn ghost sm" :disabled="si === schema.steps.length - 1" title="Move down" @click="moveStep(si, 1)">↓</button>
          <button type="button" class="pp-btn danger sm" @click="removeStep(si)">Remove step</button>
        </div>
      </div>

      <table style="background: rgb(var(--surface)); border-radius: .6rem">
        <thead>
          <tr>
            <th style="width: 22%">Field id (used in pricing)</th>
            <th style="width: 14%">Type</th>
            <th>Label</th>
            <th style="width: 8%">Required</th>
            <th v-if="!readonly" style="width: 1%"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!step.fields?.length">
            <td :colspan="readonly ? 4 : 5" class="muted">No questions in this step.</td>
          </tr>
          <template v-for="(field, fi) in step.fields || []" :key="fi">
            <tr>
              <td>
                <input v-if="field.type !== 'header'" v-model.trim="field.id" class="pp-input mono" :class="{ invalid: idProblem(field) }" :disabled="readonly" />
                <span v-else class="muted">—</span>
                <div v-if="idProblem(field)" class="field-error">{{ idProblem(field) }}</div>
              </td>
              <td>
                <select v-model="field.type" class="pp-input" :disabled="readonly" @change="onTypeChange(field)">
                  <option v-for="t in FIELD_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
                  <option v-if="!FIELD_TYPES.some((t) => t.value === field.type)" :value="field.type">{{ field.type }}</option>
                </select>
              </td>
              <td><input v-model="field.label" class="pp-input" :disabled="readonly" /></td>
              <td style="text-align: center">
                <input v-if="field.type !== 'header'" v-model="field.required" type="checkbox" :disabled="readonly" />
              </td>
              <td v-if="!readonly">
                <div class="row-actions">
                  <button type="button" class="pp-link" :disabled="fi === 0" @click="moveField(step, fi, -1)">↑</button>
                  <button type="button" class="pp-link" :disabled="fi === step.fields.length - 1" @click="moveField(step, fi, 1)">↓</button>
                  <button type="button" class="pp-link danger" @click="removeField(step, fi)">Remove</button>
                </div>
              </td>
            </tr>
            <tr v-if="field.type === 'dropdown'">
              <td></td>
              <td colspan="4">
                <label class="pp-field">
                  Options, one per line as <code>VALUE=Label</code>
                  <textarea rows="3" :value="optionsText(field)" :disabled="readonly" @change="setOptions(field, $event.target.value)"></textarea>
                </label>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <button v-if="!readonly" type="button" class="pp-btn ghost sm" style="margin-top: .6rem" @click="addField(step)">+ Add question</button>
    </section>

    <div class="pp-actions">
      <button v-if="!readonly" type="button" class="pp-btn ghost" @click="addStep">+ Add step</button>
      <button type="button" class="pp-btn ghost" @click="showJson ? (showJson = false) : openJson()">{{ showJson ? 'Hide JSON' : 'View JSON' }}</button>
    </div>

    <div v-if="showJson" class="pp-card" style="margin-top: 1rem">
      <label class="pp-field">
        schemaJson
        <textarea v-model="jsonText" rows="16" :readonly="readonly"></textarea>
      </label>
      <p v-if="jsonError" class="field-error">{{ jsonError }}</p>
      <button v-if="!readonly" type="button" class="pp-btn sm" style="margin-top: .5rem" @click="applyJson">Apply JSON</button>
    </div>
  </div>
</template>
