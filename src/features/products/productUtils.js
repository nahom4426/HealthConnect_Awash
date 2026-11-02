import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useModuleStore } from '@/stores/moduleStore';
import { getDefinition } from './api/productsApi';

export const FAMILIES = [
  { value: 'PROPERTY', label: 'Property' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'PERSONAL_ACCIDENT', label: 'Personal accident' },
];

export const COMPONENT_TYPES = ['BASE_PREMIUM', 'LOADING', 'DISCOUNT', 'ADDITIONAL_COVER', 'INFO'];

/** The form-builder field types the generic proposal renderer understands. */
export const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'date', label: 'Date' },
  { value: 'header', label: 'Section header' },
];

/** "Pet Care" → "PET_CARE", the way the backend normalises a product key. */
export function normalizeKey(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^A-Z0-9_]/g, '')
    .slice(0, 40);
}

export function keyProblem(key) {
  if (!key) return 'Enter a key';
  if (!/^[A-Z]/.test(key)) return 'The key must start with a letter';
  return '';
}

export const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** A product filing ({ categoryKey, subcategoryKey }) needs a class of business once a category is chosen. */
export function filingProblem(filing) {
  return filing?.categoryKey && !filing.subcategoryKey ? 'Choose a class of business, or set the category to Unfiled' : '';
}

/** The error's message, unless it is already shown under one of these inputs. */
export function generalError(err, fields = []) {
  if (!err) return '';
  return fields.some((f) => err.for?.(f)) ? '' : err.message;
}

export function money(value, currency = 'ETB') {
  if (value == null || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return `${currency} ${amount.toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function percent(fraction) {
  const n = Number(fraction);
  if (!Number.isFinite(n)) return '—';
  return `${+(n * 100).toFixed(4)}%`;
}

export function statusTone(status) {
  switch (status) {
    case 'PUBLISHED':
    case 'ACTIVE':
    case 'ACCEPTED':
    case 'CONVERTED':
    case 'ISSUED':
      return 'green';
    case 'DRAFT':
    case 'SUBMITTED':
      return 'amber';
    case 'QUOTED':
      return 'blue';
    case 'RETIRED':
    case 'DECLINED':
    case 'WITHDRAWN':
    case 'INACTIVE':
      return 'red';
    default:
      return '';
  }
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export function parseJson(raw, fallback) {
  if (raw == null || raw === '') return fallback;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** The step form stored in schemaJson, always with a steps array. */
export function parseFormSchema(raw) {
  const schema = parseJson(raw, null);
  if (!schema || typeof schema !== 'object') return { title: '', steps: [] };
  return { ...schema, steps: Array.isArray(schema.steps) ? schema.steps : [] };
}

export function schemaFields(schema) {
  return (schema?.steps || []).flatMap((step) => (step.fields || []).filter((f) => f.type !== 'header'));
}

export function fieldVisible(field, answers) {
  const when = field?.visibleWhen;
  if (!when?.field) return true;
  return answers?.[when.field] === when.equals;
}

/** Blank answers for a form: false for yes/no fields, '' otherwise. */
export function blankAnswers(schema) {
  const answers = {};
  for (const field of schemaFields(schema)) {
    answers[field.id] = field.type === 'boolean' || field.type === 'toggle' ? false : '';
  }
  return answers;
}

/** Numbers as numbers, so formulas compare `answers.age > 8` numerically. */
export function typedAnswers(schema, answers) {
  const out = {};
  for (const field of schemaFields(schema)) {
    const value = answers?.[field.id];
    if (field.type === 'number') {
      out[field.id] = value === '' || value == null ? null : Number(value);
    } else if (field.type === 'boolean' || field.type === 'toggle') {
      out[field.id] = Boolean(value);
    } else {
      out[field.id] = value ?? '';
    }
  }
  return out;
}

export function missingRequired(schema, answers) {
  for (const field of schemaFields(schema)) {
    if (!field.required || !fieldVisible(field, answers)) continue;
    if (field.type === 'boolean' || field.type === 'toggle') continue;
    const value = answers?.[field.id];
    if (value === '' || value == null) return field;
  }
  return null;
}

export function optionList(field) {
  return (field?.options || []).map((option) =>
    option && typeof option === 'object'
      ? { label: option.label ?? option.value, value: option.value ?? option.label }
      : { label: String(option), value: option },
  );
}

/**
 * Route context shared by every product page: the product key from the URL, its definition
 * (when the user may read it), its privilege module, and a `can('proposal.create')` check.
 */
export function useProductContext() {
  const route = useRoute();
  const moduleStore = useModuleStore();
  const productClass = computed(() => String(route.params.productClass || '').toUpperCase());
  const definition = ref(null);

  const privilegeModule = computed(() => definition.value?.privilegeModule || moduleStore.privilegeModuleFor(productClass.value));
  const productName = computed(() => definition.value?.name || moduleStore.registryByKey[privilegeModule.value]?.name || productClass.value);
  const retired = computed(() => definition.value?.status === 'RETIRED');
  const basePath = computed(() => `/products/${productClass.value}`);

  function can(action) {
    return moduleStore.can(privilegeModule.value, action);
  }

  async function loadDefinition() {
    definition.value = moduleStore.definitionFor(productClass.value);
    try {
      definition.value = await getDefinition(productClass.value);
    } catch {
      // Without product.read the cached catalogue entry (or the key itself) is all we have
    }
  }

  moduleStore.loadRegistry();
  watch(productClass, loadDefinition, { immediate: true });

  return { productClass, definition, privilegeModule, productName, retired, basePath, can, reloadDefinition: loadDefinition };
}
