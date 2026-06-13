<script setup>
import { computed, ref, watch, onMounted, nextTick } from 'vue';

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  // For v-model support
  modelValue: {
    type: [Boolean, String, Number],
    default: false
  },
  // Legacy prop support
  value: {
    type: [Boolean, String, Number],
    default: undefined
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const isChecked = ref(false);
const inputEl = ref(null);

// Helper function to convert various input types to boolean
const convertToBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const lowerVal = value.toLowerCase().trim();
    if (lowerVal === 'true' || lowerVal === '1' || lowerVal === 'on' || lowerVal === 'yes') return true;
    if (lowerVal === 'false' || lowerVal === '0' || lowerVal === 'off' || lowerVal === 'no') return false;
  }
  return Boolean(value);
};

// Get the active value (prefer modelValue, fall back to value)
const getActiveValue = () => {
  return props.modelValue !== undefined ? props.modelValue : props.value;
};

// Initialize checked state
const initializeState = () => {
  const activeValue = getActiveValue();
  const booleanValue = convertToBoolean(activeValue);
  isChecked.value = booleanValue;
  
  if (inputEl.value) {
    inputEl.value.checked = booleanValue;
    inputEl.value.dataset['valid'] = 'true';
    inputEl.value.dataset['val'] = JSON.stringify({ value: booleanValue });
  }
};

onMounted(() => {
  nextTick(() => {
    initializeState();
  });
});

// Immediate watch to catch initial value changes
watch(() => getActiveValue(), () => {
  initializeState();
}, { immediate: true });

// Computed class for toggle background
const toggleBgClass = computed(() => {
  if (props.disabled) {
    return isChecked.value ? 'bg-primary/50' : 'bg-gray-200';
  }
  return isChecked.value ? 'bg-primary' : 'bg-gray-300';
});

// Computed class for cursor
const cursorClass = computed(() => {
  return props.disabled ? 'cursor-not-allowed' : 'cursor-pointer';
});

// Handle input change event
const handleInputChange = (e) => {
  const newValue = e.target.checked;
  isChecked.value = newValue;
  
  if (inputEl.value) {
    inputEl.value.dataset['valid'] = 'true';
    inputEl.value.dataset['val'] = JSON.stringify({ value: newValue });
  }
  
  emit('update:modelValue', newValue);
  emit('change', newValue);
};

// Handle toggle click
const handleToggle = () => {
  if (props.disabled) return;
  
  const newValue = !isChecked.value;
  isChecked.value = newValue;
  
  if (inputEl.value) {
    inputEl.value.checked = newValue;
    inputEl.value.dataset['valid'] = 'true';
    inputEl.value.dataset['val'] = JSON.stringify({ value: newValue });
  }
  
  emit('update:modelValue', newValue);
  emit('change', newValue);
  
  if (inputEl.value) {
    const event = new Event('change', { bubbles: true });
    inputEl.value.dispatchEvent(event);
  }
};

// Set ref
const setRef = (el) => {
  inputEl.value = el;
  if (el) {
    initializeState();
  }
};
</script>

<template>
  <div class="inline-flex items-center gap-2.5">
    <!-- Hidden checkbox for form submission -->
    <input
      :ref="setRef"
      type="checkbox"
      :id="name"
      :name="name"
      :disabled="disabled"
      :checked="isChecked"
      :value="isChecked ? 'true' : 'false'"
      class="sr-only custom-input"
      @change="handleInputChange"
    />

    <!-- Toggle track -->
    <button
      type="button"
      :id="`toggle-${name}`"
      role="switch"
      :aria-checked="isChecked"
      :aria-label="label || 'Toggle switch'"
      :aria-describedby="description ? `desc-${name}` : undefined"
      :tabindex="disabled ? -1 : 0"
      :class="[
        'relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent',
        'transition-colors duration-200 ease-in-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
        toggleBgClass,
        cursorClass,
        { 'opacity-50': disabled }
      ]"
      @click="handleToggle"
      @keydown.space.prevent="handleToggle"
      @keydown.enter.prevent="handleToggle"
    >
      <!-- Knob -->
      <span
        :class="[
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm',
          'transition-transform duration-200 ease-in-out',
          isChecked ? 'translate-x-4' : 'translate-x-0'
        ]"
      />
    </button>

    <!-- Label + description -->
    <div v-if="label || description" class="flex flex-col gap-0.5">
      <label
        :for="name"
        :class="[
          'text-sm font-medium leading-none select-none',
          disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 cursor-pointer'
        ]"
      >
        {{ label }}
      </label>
      <span
        v-if="description"
        :id="`desc-${name}`"
        class="text-xs text-gray-400 select-none"
      >
        {{ description }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>