<script setup>
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue';
import { getValidators } from './util/validators';
import { validationKeys } from './util/validationUtils';

let validators = getValidators();

defineExpose({
  changeValue,
});

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  modelValue: {
    type: [String, Number, Object, Array],
  },
  value: {
    type: [String, Number, Object, Array],
  },
  autoValidate: {
    type: Boolean,
    default: false,
  },
  validation: {
    type: [String, Object],
  },
  asyncValidation: {
    type: [String, Object],
  },
  attributes: {
    type: Object,
  },
  groupIndentifier: {
    type: String,
  },
  skip: {
    type: Boolean,
    default: false,
  }, // set to true if you dont want the value in the submited value
});

function cloneValue(value) {
  return Array.isArray(value) ? [...value] : 
         typeof value === 'object' ? { ...value } : 
         value;
}

const initialValue = ref(props.modelValue ? cloneValue(props.modelValue) : props.value);
const initialAttrs = ref({ type: 'text', ...(props.attributes || {}) });

const emit = defineEmits(['update:modelValue']);

if (props.modelValue && props.value) {
  throw new Error(
    'Must not use [v-model] and [value] at the same time. you need to choose one.'
  );
}

const validateAll = inject('validateAll', false);
const id = inject('id', Math.random() * 10000);
const reset = inject('reset', false);

const error = ref('');
const dirty = ref(props.autoValidate);
const asyncValidating = ref(false);
const inputEl = ref();

const buildInInputNames = ['INPUT', 'SELECT', 'TEXTAREA'];
const booleaninputTypes = ['checkbox', 'radio'];

const thisValidation = computed(() => props.validation);
const thisAsyncValidation = computed(() => props.asyncValidation);

const thisValue = ref('');

watch(
  () => props.attributes,
  () => {
    const newKeys = Object.keys(props.attributes || {});
    const oldKeys = Object.keys(initialAttrs.value || {});

    const keysToRemove = oldKeys.filter((el) => !newKeys.includes(el));
    initialAttrs.value = {
      type: 'text',
      ...(initialAttrs.value || {}),
      ...props.attributes,
    };

    removeAttibutes(keysToRemove);
    setAttributes();
  }
);

onMounted(() => {
  if (!booleaninputTypes.includes(initialAttrs.value?.type)) {
    thisValue.value = props.modelValue || props.value || '';
  }
});

function getValidation(validation) {
  return validation.toString().includes('[object Object]')
    ? { ...validation }
    : validationKeys(validation);
}

function validate(setError = true) {
  if (!thisValidation.value) return true;

  let validation = getValidation(thisValidation.value);

  if (!validation.required && !thisValue.value) return true;

  let keys = Object.keys(validation);
  let validator =
    validators[initialAttrs.value?.type || inputEl.value?.type || 'text'];

  error.value = '';
  for (let key of keys) {
    if (
      ![undefined, null].includes(validation[key]?.args) &&
      ![undefined, null].includes(validation[key]?.message)
    ) {
      validation[key] = {
        args: validation[key],
        message: null,
      };
    }

    if (!validator?.[key]) {
      console.error(
        'no validation function with the name %c[' + key + ']',
        'color: yellow'
      );
      continue;
    }

    const [res, msg] = validator[key](
      thisValue.value,
      validation[key]?.args,
      id,
      validation[key]?.message
    );

    if (!res) {
      setError && (error.value = msg);
      return false;
    }
  }
  return true;
}

const needToEmit = computed(() => {
  return props.modelValue !== undefined;
});

const builtInInput = computed(() => {
  return inputEl.value && buildInInputNames.includes(inputEl.value.nodeName);
});

function setRef(el) {
  inputEl.value = el;
}

function blurHandler() {
  dirty.value = true;
  validate();
}

onMounted(() => {
  if (!props.skip) {
    inputEl.value.className += props.groupIndentifier
      ? ` ${props.groupIndentifier} custom-input`
      : ' custom-input';
  } else {
    inputEl.value.className += props.groupIndentifier
      ? ` skip_${props.groupIndentifier} skip_custom-input`
      : ' skip_custom-input';
  }
  inputEl.value.addEventListener('blur', blurHandler);

  if (booleaninputTypes.includes(initialAttrs.value?.type)) {
    inputEl.value.addEventListener('change', () => {
      if (inputEl.value.checked) {
        thisValue.value = props.value || props.modelValue;
      } else {
        thisValue.value = '';
      }
    });
  } else if (
    builtInInput.value &&
    ['INPUT', 'TEXTAREA'].includes(inputEl.value.nodeName)
  ) {
    inputEl.value.addEventListener('input', () => {
      if (inputEl.value.type == 'file') {
        if (initialAttrs.value?.multiple) {
          thisValue.value = Array.from(inputEl.value.files);
        } else {
          thisValue.value = inputEl.value.files[0];
        }
      } else {
        thisValue.value = inputEl.value.value;
      }
    });
  } else if (builtInInput.value && 'SELECT' == inputEl.value.nodeName) {
    inputEl.value.addEventListener('change', () => {
      thisValue.value = inputEl.value.value;
    });
  }
});

onMounted(() => {
  if (!builtInInput.value) {
    inputEl.value.setAttribute('tabIndex', '0');
    inputEl.value.addEventListener('blur', blurHandler);
  }
});

function changeInputValue() {
  if (
    inputEl.value.type != 'file' &&
    buildInInputNames.includes(inputEl.value.nodeName)
  ) {
    inputEl.value.value = thisValue.value;
  }
}

function removeAttibutes(attrs = {}) {
  attrs.forEach((key) => {
    if (key != 'value') {
      nextTick(() => {
        inputEl.value.removeAttribute(key);
      })
    }
  });
}

function setAttributes() {
  Object.keys(initialAttrs.value || {}).forEach((key) => {
    if (key != 'value') {
      inputEl.value.setAttribute(key, initialAttrs.value[key]);
    }

    if (booleaninputTypes.includes(initialAttrs.value?.type)) {
      inputEl.value.checked = initialAttrs.value?.checked || '';
      if (inputEl.value.checked) {
        thisValue.value = props.value || props.modelValue;
      } else {
        thisValue.value = '';
      }
    }
  });
  inputEl.value.setAttribute('name', props.name);
}

watch(() => initialAttrs.value, setAttributes);
onMounted(setAttributes);

onMounted(changeInputValue);
watch(thisValue, changeInputValue);

watch(thisValue, () => {
  if (needToEmit.value) {
    emit('update:modelValue', thisValue.value);
  }
});

watch(
  () => props.modelValue,
  () => {
    thisValue.value = props.modelValue;
  },
  { deep: true }
);

watch(
  () => props.value,
  () => {
    if (!booleaninputTypes.includes(initialAttrs.value?.type)) {
      thisValue.value = props.value;
    }
  }
);

function changeValue(value) {
  thisValue.value = value;
}

watch(thisValue, () => {
  if (dirty.value || !builtInInput.value) {
    validate();
  }
});

watch(thisValue, () => {
  if (dirty.value || !builtInInput.value) {
    validate();
  }
});

function updateEl(setError = true) {
  if (initialAttrs.value?.type == 'file') {
    inputEl.value.val = thisValue.value;
  } else if (booleaninputTypes.includes(initialAttrs.value?.type)) {
    if (inputEl.value.checked) {
      thisValue.value = props.value || props.modelValue;
    } else {
      thisValue.value = '';
    }
    inputEl.value.dataset['val'] = JSON.stringify({ value: thisValue.value });
  } else {
    inputEl.value.dataset['val'] = JSON.stringify({ value: thisValue.value });
  }
  inputEl.value.dataset['valid'] = validate(setError);
}

onMounted(() => {
  updateEl(false);
});

watch(thisValue, () => updateEl(dirty.value || !builtInInput.value), {
  deep: true,
});

watch(validateAll, () => {
  if (validateAll.value && inputEl.value.dataset['valid'] != 'true') {
    validate();
  }
});

watch(reset, () => {
  if (reset.value) {
    thisValue.value = initialValue.value || '';

    if (booleaninputTypes.includes(initialAttrs.value?.type)) {
      if (inputEl.value.checked) {
        thisValue.value = props.value || props.modelValue;
      } else {
        thisValue.value = '';
      }
    }
    dirty.value = props.autoValidate;
  }
});

</script>

<template>
  <slot
    :setRef="setRef"
    :attributes="attributes"
    :value="thisValue"
    :error="error"
    :dirty="dirty"
    :asyncValidating="asyncValidating"
    :changeValue="changeValue"
  />
</template>
