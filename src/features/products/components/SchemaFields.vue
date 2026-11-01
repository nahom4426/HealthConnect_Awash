<script setup>
import { fieldVisible, optionList } from '../productUtils';

// Renders a product's step form (schemaJson) into `answers`. Used by the proposal form and by
// the Test tab, so sample answers are entered on exactly the questions proposers will see.
const props = defineProps({
  schema: { type: Object, required: true },
  answers: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
  showIds: { type: Boolean, default: false },
  invalidField: { type: String, default: '' },
  compact: { type: Boolean, default: false },
});

function isCheck(field) {
  return field.type === 'boolean' || field.type === 'toggle';
}

function visibleSteps() {
  return (props.schema.steps || []).filter((step) => fieldVisible(step, props.answers));
}
</script>

<template>
  <component :is="compact ? 'div' : 'section'" v-for="step in visibleSteps()" :key="step.stepId" :class="compact ? '' : 'pp-card'">
    <component :is="compact ? 'h3' : 'h2'">{{ step.stepTitle || step.stepId }}</component>
    <div class="pp-grid" :style="compact ? 'margin-bottom: 1rem' : ''">
      <template v-for="field in step.fields || []" :key="field.id">
        <div v-if="field.type === 'header'" class="span-2" style="font-weight: 700; font-size: .85rem; color: rgb(var(--primary-fg)); margin-top: .4rem">
          {{ field.label }}
        </div>

        <template v-else-if="fieldVisible(field, answers)">
          <label v-if="isCheck(field)" class="pp-check" :class="{ invalid: invalidField === field.id }">
            <input v-model="answers[field.id]" type="checkbox" :disabled="disabled" />
            <span>{{ field.label }}{{ field.required ? ' *' : '' }}</span>
            <code v-if="showIds">{{ field.id }}</code>
          </label>

          <label v-else class="pp-field" :class="{ invalid: invalidField === field.id }">
            <span>
              {{ field.label }}{{ field.required ? ' *' : '' }}
              <code v-if="showIds">{{ field.id }}</code>
            </span>
            <select v-if="field.type === 'dropdown'" v-model="answers[field.id]" :disabled="disabled">
              <option value="">Select…</option>
              <option v-for="option in optionList(field)" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
            <input
              v-else
              v-model="answers[field.id]"
              :type="field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'"
              :step="field.type === 'number' ? 'any' : undefined"
              :placeholder="field.placeholder || ''"
              :disabled="disabled"
            />
            <small v-if="field.helpText">{{ field.helpText }}</small>
          </label>
        </template>
      </template>
    </div>
  </component>
</template>
